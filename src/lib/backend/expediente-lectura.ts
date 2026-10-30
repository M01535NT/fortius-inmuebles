import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aPropuestas, costoAproximado, respuestaLectura, type RespuestaLectura, type ValorDistinto } from "@/lib/ia/lectura";
import { descargarArchivo, exigirExpediente } from "./expediente-archivos";
import { guardarDatos, leerDatos } from "./expediente-datos";
import { ApiError, databaseError } from "./http";

/*
  Lectura con IA de un documento del cliente (IA-01). El servidor descarga el archivo comprobado,
  lo envía al proveedor, valida la respuesta y guarda lo leído como propuestas del expediente.
  Cada lectura queda anotada con su costo; al llegar al tope del mes, se pausa y avisa (IA-02).
  Sin clave de API la lectura no está disponible y el resto del sistema funciona igual.
*/

export type EntradaLectura = { bytes: Buffer; mime: string; titulo: string };
export type ResultadoExtractor = { respuesta: unknown; uso: { input_tokens: number; output_tokens: number }; modelo: string };
/** El proveedor de lectura; las pruebas lo simulan. */
export type Extractor = (entrada: EntradaLectura) => Promise<ResultadoExtractor>;

/** Tope de gasto mensual en dólares (variable del servidor; 20 si no se configuró). */
export function topeMensualUsd(): number {
  const valor = Number(process.env.IA_TOPE_MENSUAL_USD);
  return Number.isFinite(valor) && valor >= 0 ? valor : 20;
}

export async function gastoDelMes(privileged: SupabaseClient, ahora = new Date()): Promise<number> {
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
  const result = await privileged.from("fortius_inmuebles_ia_lecturas").select("costo_usd").gte("created_at", inicio);
  if (result.error) databaseError(result.error);
  return (result.data ?? []).reduce((total, row) => total + Number(row.costo_usd ?? 0), 0);
}

async function marcar(privileged: SupabaseClient, id: string, patch: Record<string, unknown>) {
  const saved = await privileged.from("fortius_inmuebles_expediente_archivos").update(patch).eq("id", id);
  if (saved.error) databaseError(saved.error);
}

export type Lectura = { tipoDocumento: RespuestaLectura["tipoDocumento"]; propuestos: string[]; distintos: ValorDistinto[]; costoUsd: number };

export async function leerArchivoConIa(client: SupabaseClient, privileged: SupabaseClient, userId: string, archivoId: string, extraer: Extractor): Promise<Lectura> {
  const { archivo, bytes } = await descargarArchivo(client, privileged, archivoId);
  if (archivo.deleted_at) throw new ApiError(409, "Restaura el documento antes de leerlo");
  await exigirExpediente(client, archivo.expediente_id);
  const tope = topeMensualUsd();
  if (await gastoDelMes(privileged) >= tope) throw new ApiError(429, `Se alcanzó el tope de lecturas de este mes (${tope} USD); la lectura se reanuda el próximo mes o al subir el tope`);

  await marcar(privileged, archivo.id, { lectura_estado: "leyendo", lectura_error: null });
  const anotar = (estado: "leido" | "error", resultado?: ResultadoExtractor, propuestos = 0) => privileged.from("fortius_inmuebles_ia_lecturas").insert({
    archivo_id: archivo.id, expediente_id: archivo.expediente_id, requested_by: userId, modelo: resultado?.modelo ?? "sin respuesta", estado,
    input_tokens: resultado?.uso.input_tokens ?? 0, output_tokens: resultado?.uso.output_tokens ?? 0, costo_usd: resultado ? costoAproximado(resultado.uso) : 0, datos_propuestos: propuestos,
  });
  const fallar = async (mensaje: string, resultado?: ResultadoExtractor): Promise<never> => {
    await marcar(privileged, archivo.id, { lectura_estado: "error", lectura_error: mensaje });
    await anotar("error", resultado);
    throw new ApiError(502, mensaje);
  };

  let resultado: ResultadoExtractor;
  try { resultado = await extraer({ bytes, mime: archivo.mime, titulo: archivo.titulo }); }
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
      lectura = { tipoDocumento: parsed.data.tipoDocumento, propuestos, distintos, costoUsd: costoAproximado(resultado.uso) };
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
