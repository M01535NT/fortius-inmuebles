import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aPropuestas, costoAproximado, respuestaLectura, type RespuestaLectura, type ValorDistinto } from "@/lib/ia/lectura";
import { descargarArchivo, exigirExpediente } from "./expediente-archivos";
import { guardarDatos, leerDatos } from "./expediente-datos";
import { ApiError, databaseError } from "./http";
import { TOPE_IA_POR_OMISION, topeIaValido, type UsoIa } from "./ia-tope";

/*
  Lectura con IA de un documento del cliente (IA-01). El servidor descarga el archivo comprobado,
  lo envía al proveedor, valida la respuesta y guarda lo leído como propuestas del expediente.
  Cada lectura queda anotada con su costo; al llegar al tope del mes, se pausa y avisa (IA-02).
  Sin clave de API la lectura no está disponible y el resto del sistema funciona igual.
*/

/** `paginas`: el PDF ya dibujado como imágenes por el navegador, para los servicios que no reciben PDF. */
export type EntradaLectura = { bytes: Buffer; mime: string; titulo: string; paginas?: Array<{ bytes: Buffer; mime: string }> };
export type ResultadoExtractor = { respuesta: unknown; uso: { input_tokens: number; output_tokens: number }; modelo: string };
/** El proveedor de lectura; las pruebas lo simulan. */
export type Extractor = (entrada: EntradaLectura) => Promise<ResultadoExtractor>;

/** El tope vigente: el que guardó el director en Configuración, si existe; si no, el del servidor. */
export async function topeVigente(privileged: SupabaseClient): Promise<Pick<UsoIa, "topeUsd" | "origenTope">> {
  const config = await privileged.from("fortius_inmuebles_records").select("data").eq("collection", "config").eq("id", "singleton").maybeSingle();
  if (config.error) databaseError(config.error);
  const guardado = topeIaValido((config.data?.data as { topeIaMensualUsd?: unknown } | undefined)?.topeIaMensualUsd);
  if (guardado !== undefined) return { topeUsd: guardado, origenTope: "configuracion" };
  const variable = process.env.IA_TOPE_MENSUAL_USD?.trim();
  const servidor = variable ? topeIaValido(Number(variable)) : undefined;
  return servidor !== undefined ? { topeUsd: servidor, origenTope: "servidor" } : { topeUsd: TOPE_IA_POR_OMISION, origenTope: "omision" };
}

const inicioDelMes = (ahora: Date) => new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));

async function lecturasDelMes(privileged: SupabaseClient, ahora: Date) {
  const result = await privileged.from("fortius_inmuebles_ia_lecturas").select("costo_usd").gte("created_at", inicioDelMes(ahora).toISOString());
  if (result.error) databaseError(result.error);
  return result.data ?? [];
}

export async function gastoDelMes(privileged: SupabaseClient, ahora = new Date()): Promise<number> {
  return (await lecturasDelMes(privileged, ahora)).reduce((total, row) => total + Number(row.costo_usd ?? 0), 0);
}

/** Lo que muestra Configuración: gasto y lecturas del mes, tope vigente y si hay servicio (IA-02). */
export async function usoDelMes(privileged: SupabaseClient, disponible: boolean, ahora = new Date()): Promise<UsoIa> {
  const [filas, tope] = await Promise.all([lecturasDelMes(privileged, ahora), topeVigente(privileged)]);
  const gasto = filas.reduce((total, row) => total + Number(row.costo_usd ?? 0), 0);
  return { gastoUsd: Math.round(gasto * 10_000) / 10_000, ...tope, lecturas: filas.length, desde: inicioDelMes(ahora).toISOString().slice(0, 10), disponible };
}

async function marcar(privileged: SupabaseClient, id: string, patch: Record<string, unknown>) {
  const saved = await privileged.from("fortius_inmuebles_expediente_archivos").update(patch).eq("id", id);
  if (saved.error) databaseError(saved.error);
}

export type Lectura = { tipoDocumento: RespuestaLectura["tipoDocumento"]; propuestos: string[]; distintos: ValorDistinto[]; costoUsd: number };

export async function leerArchivoConIa(client: SupabaseClient, privileged: SupabaseClient, userId: string, archivoId: string, extraer: Extractor, paginas?: EntradaLectura["paginas"]): Promise<Lectura> {
  const { archivo, bytes } = await descargarArchivo(client, privileged, archivoId);
  if (archivo.deleted_at) throw new ApiError(409, "Restaura el documento antes de leerlo");
  await exigirExpediente(client, archivo.expediente_id);
  const [{ topeUsd: tope }, gasto] = await Promise.all([topeVigente(privileged), gastoDelMes(privileged)]);
  if (gasto >= tope) throw new ApiError(429, "Se terminaron las lecturas de este mes. Captura los datos a mano o pide al director que amplíe el límite en Configuración.");

  await marcar(privileged, archivo.id, { lectura_estado: "leyendo", lectura_error: null });
  const anotar = (estado: "leido" | "error", resultado?: ResultadoExtractor, propuestos = 0) => privileged.from("fortius_inmuebles_ia_lecturas").insert({
    archivo_id: archivo.id, expediente_id: archivo.expediente_id, requested_by: userId, modelo: resultado?.modelo ?? "sin respuesta", estado,
    input_tokens: resultado?.uso.input_tokens ?? 0, output_tokens: resultado?.uso.output_tokens ?? 0, costo_usd: resultado ? costoAproximado(resultado.uso, resultado.modelo) : 0, datos_propuestos: propuestos,
  });
  const fallar = async (mensaje: string, resultado?: ResultadoExtractor): Promise<never> => {
    await marcar(privileged, archivo.id, { lectura_estado: "error", lectura_error: mensaje });
    await anotar("error", resultado);
    throw new ApiError(502, mensaje);
  };

  let resultado: ResultadoExtractor;
  try { resultado = await extraer({ bytes, mime: archivo.mime, titulo: archivo.titulo, ...(paginas?.length ? { paginas } : {}) }); }
  catch (error) { return fallar(error instanceof ApiError ? error.message : "No se pudo leer el documento; inténtalo más tarde"); }
  const parsed = respuestaLectura.safeParse(resultado.respuesta);
  if (!parsed.success) return fallar("La lectura no devolvió datos válidos; inténtalo otra vez", resultado);

  // Las propuestas se unen a los datos vigentes; si otra persona guardó en ese momento, se reintenta una vez.
  let lectura: Lectura | undefined;
  try { for (let intento = 0; intento < 2 && !lectura; intento++) {
    const actuales = await leerDatos(client, archivo.expediente_id);
    const { datos, propuestos, distintos } = aPropuestas(parsed.data, archivo, actuales.datos, new Date().toISOString());
    try {
      if (propuestos.length) await guardarDatos(privileged, userId, archivo.expediente_id, { version: actuales.version, datos });
      lectura = { tipoDocumento: parsed.data.tipoDocumento, propuestos, distintos, costoUsd: costoAproximado(resultado.uso, resultado.modelo) };
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409) || intento === 1) throw error;
    }
  } } catch (error) {
    await marcar(privileged, archivo.id, { lectura_estado: "error", lectura_error: "Se leyó el documento, pero no se pudieron guardar los datos; inténtalo otra vez" });
    await anotar("error", resultado);
    throw error;
  }
  await marcar(privileged, archivo.id, { lectura_estado: "leido", lectura_error: null, leido_el: new Date().toISOString(), tipo_documento: lectura!.tipoDocumento });
  const anotado = await anotar("leido", resultado, lectura!.propuestos.length);
  if (anotado.error) databaseError(anotado.error);
  return lectura!;
}
