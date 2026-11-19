import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Encargo } from "./asuntos-contrato";
import { apartadosPara } from "./asuntos";
import { claveCatalogo, mapaCatalogos } from "./catalogos";
import { etiquetaDe, ofrecidos } from "./catalogos-contrato";
import { fallo } from "./fallo";
import { FIRMAS } from "./firmas";
import {
  DEBE, DE_QUIEN, OCUPA, QUIERE, SI_NO,
  encargosSegun, inmuebleSegun, nombreDelAsunto, papelDeQuienLlama, primerPlan,
  type Carga, type Consulta, type ConsultaAbierta, type DatosConsulta,
} from "./consultas-contrato";
import type { StaffUser } from "./contracts";
import { BUCKET_EXPEDIENTES } from "./expediente-archivos";
import { ApiError } from "./http";

/**
 * La consulta (SPEC.md, sección 4). Se lee y se escribe con la sesión de quien atiende: la base decide qué ve cada quien.
 * «Abrir asunto» y «Guardar como contacto» son funciones de la base de una sola transacción.
 */

const T = { consultas: "fortius_inmuebles_consultas", cargas: "fortius_inmuebles_cargas_por_acomodar" } as const;
const CAMPOS = "id,version,estado,quien_nombre,quien_telefonos,quien_correo,canal,persona_id,que_pasa,datos,otras_personas,documentos_pedir,asunto_id,motivo,es_ejemplo,created_at,updated_at";
const CAMPOS_CARGA_ANTES = "id,nombre_original,mime,byte_length,created_at";
const CAMPOS_CARGA = `${CAMPOS_CARGA_ANTES},documento`;

const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const telefono = z.object({ pais: z.string().trim().regex(/^\+?\d{1,4}$/), numero: z.string().trim().max(30) }).strict();
const datos = z.object({
  que_quiere: z.enum(QUIERE).optional(), de_quien: z.enum(DE_QUIEN).optional(), tipo: claveCatalogo.optional(),
  colonia: z.string().trim().max(120).optional(), ocupa: z.enum(OCUPA).optional(), escritura: z.enum(SI_NO).optional(),
  debe: z.array(z.enum(DEBE)).max(DEBE.length).optional(),
}).strict();
const otra = z.object({
  nombre: z.string().trim().min(1).max(160), papel: claveCatalogo,
  pais: z.string().trim().regex(/^\+?\d{1,4}$/).optional(), numero: z.string().trim().max(30).optional(), fallecida: z.boolean().optional(),
}).strict();
const docPedir = z.object({
  nombre: z.string().trim().min(1).max(200), grupo: z.enum(["persona", "inmueble", "credito", "otro"]).optional(),
  entrega_papel: z.string().trim().max(40).optional(), quitado: z.boolean().optional(), propio: z.boolean().optional(),
  recibido: z.boolean().optional(),
}).strict();
/** El documento de la lista al que pertenece un archivo (su nombre exacto); vacío o null: archivo suelto. */
export const documentoDeCarga = z.string().trim().max(200).nullable().optional().transform((x) => x || null);
export const cambioCargaSchema = z.object({ documento: documentoDeCarga }).strict();

export const nuevaConsultaSchema = z.object({
  quien_nombre: z.string().trim().max(160).optional(),
  canal: claveCatalogo.optional(),
  persona_id: z.uuid().optional(),
}).strict();

export const cambioConsultaSchema = z.object({
  version,
  quien_nombre: z.string().max(160).optional(),
  quien_telefonos: z.array(telefono).max(5).optional(),
  quien_correo: z.string().trim().max(200).nullable().optional(),
  canal: claveCatalogo.optional(),
  que_pasa: z.string().max(20000).optional(),
  datos: datos.optional(),
  otras_personas: z.array(otra).max(30).optional(),
  documentos_pedir: z.array(docPedir).max(80).optional(),
}).strict();

export const cierreSchema = z.discriminatedUnion("como", [
  z.object({ como: z.literal("contacto"), version, volver: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(),
  z.object({ como: z.literal("no_procede"), version, motivo: z.string().trim().max(1000).optional() }).strict(),
  z.object({ como: z.literal("reabrir"), version }).strict(),
]);

type FilaConsulta = Omit<Consulta, "cargas">;

/** Teléfonos solo con dígitos; los vacíos no se guardan. */
function limpiarTelefonos(lista: { pais: string; numero: string }[]) {
  return lista
    .map((t) => ({ pais: `+${t.pais.replace(/\D/g, "") || "52"}`, numero: t.numero.replace(/\D/g, "") }))
    .filter((t) => t.numero.length > 0);
}

export async function listarAbiertas(client: SupabaseClient, user: StaffUser): Promise<ConsultaAbierta[]> {
  const r = await client.from(T.consultas).select("id,quien_nombre,que_pasa,updated_at")
    .eq("estado", "abierta").eq("responsable_id", user.id).is("deleted_at", null)
    .order("updated_at", { ascending: false }).limit(10);
  if (r.error) fallo(r.error);
  return (r.data ?? []) as ConsultaAbierta[];
}

export async function crearConsulta(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof nuevaConsultaSchema>) {
  // Desde el Directorio: la consulta llega con el nombre, el teléfono y el correo que ya tiene la ficha.
  type Ficha = { nombre: string; telefonos: { pais: string; numero: string }[] | null; correo: string | null };
  let ficha: Ficha | null = null;
  if (entrada.persona_id) {
    const p = await client.from("fortius_inmuebles_personas").select("nombre,telefonos,correo").eq("id", entrada.persona_id).is("deleted_at", null).maybeSingle();
    if (p.error) fallo(p.error);
    if (!p.data) throw new ApiError(404, "Esa persona ya no está en el Directorio.");
    ficha = p.data as Ficha;
  }
  const r = await client.from(T.consultas).insert({
    quien_nombre: entrada.quien_nombre ?? ficha?.nombre ?? "", canal: entrada.canal ?? "llamada", persona_id: entrada.persona_id ?? null,
    ...(ficha ? { quien_telefonos: Array.isArray(ficha.telefonos) ? ficha.telefonos.slice(0, 5) : [], quien_correo: ficha.correo } : {}),
    responsable_id: user.id, creado_por: user.id,
  }).select("id,version").single();
  if (r.error) fallo(r.error);
  return r.data as { id: string; version: number };
}

type FilaCarga = Omit<Carga, "documento"> & { documento?: string | null };
const aCarga = ({ documento, ...resto }: FilaCarga): Carga => (documento ? { ...resto, documento } : resto);

/** Lee los archivos de la consulta; si la base todavía no tiene a qué documento pertenecen, todos salen sueltos. */
async function leerCargas(client: SupabaseClient, id: string): Promise<Carga[]> {
  const pedir = (campos: string) => client.from(T.cargas).select(campos).eq("consulta_id", id).neq("estado", "descartado").order("created_at");
  let r = await pedir(CAMPOS_CARGA);
  if (r.error?.code === "42703") r = await pedir(CAMPOS_CARGA_ANTES);
  if (r.error) fallo(r.error);
  return ((r.data ?? []) as unknown as FilaCarga[]).map(aCarga);
}

export async function leerConsulta(client: SupabaseClient, id: string): Promise<Consulta> {
  const [c, cargas] = await Promise.all([
    client.from(T.consultas).select(CAMPOS).eq("id", id).maybeSingle(),
    leerCargas(client, id),
  ]);
  if (c.error) fallo(c.error);
  if (!c.data) throw new ApiError(404, "No se encontró la consulta");
  const fila = c.data as FilaConsulta;
  // Un documento con un archivo ligado está recibido, aunque no se haya marcado.
  const conArchivo = new Set(cargas.map((x) => x.documento).filter(Boolean));
  const documentos_pedir = (fila.documentos_pedir ?? []).map((x) => (conArchivo.has(x.nombre) && !x.recibido ? { ...x, recibido: true } : x));
  return { ...fila, documentos_pedir, cargas };
}

/** Se guarda sola mientras se escribe. Responde la versión nueva para el siguiente guardado. */
export async function cambiarConsulta(client: SupabaseClient, id: string, entrada: z.infer<typeof cambioConsultaSchema>): Promise<{ version: number }> {
  const { version: v, quien_telefonos, ...resto } = entrada;
  const cambios: Record<string, unknown> = { ...resto };
  if (quien_telefonos) cambios.quien_telefonos = limpiarTelefonos(quien_telefonos);
  if (resto.otras_personas) {
    cambios.otras_personas = resto.otras_personas.map((p) => ({
      ...p, pais: p.pais ? `+${p.pais.replace(/\D/g, "")}` : undefined, numero: p.numero?.replace(/\D/g, "") || undefined,
    }));
  }
  if (!Object.keys(cambios).length) return { version: v };
  const r = await client.from(T.consultas).update(cambios).eq("id", id).eq("version", v).eq("estado", "abierta").select("version");
  if (r.error) fallo(r.error);
  if (!r.data?.length) {
    const actual = await client.from(T.consultas).select("estado").eq("id", id).maybeSingle();
    if (actual.data && actual.data.estado !== "abierta") throw new ApiError(409, "Esta consulta ya se cerró.");
    throw new ApiError(409, "La consulta cambió en otra ventana. Vuelve a cargarla.");
  }
  return { version: (r.data[0] as { version: number }).version };
}

/** «Abrir asunto»: lo que se decide se arma aquí con las reglas; la base lo crea todo junto. */
export async function abrirAsunto(client: SupabaseClient, id: string, v: number): Promise<{ id: string; folio: string }> {
  const c = await leerConsulta(client, id);
  if (c.estado === "asunto" && c.asunto_id) throw new ApiError(409, "Esta consulta ya abrió su asunto.");
  const d: DatosConsulta = c.datos ?? {};
  const encargos: Encargo[] = encargosSegun(d);
  // «Recibir los documentos» solo si queda alguno por recibir (leerConsulta ya marca recibido lo que tiene archivo).
  const hayDocumentos = c.documentos_pedir.some((x) => !x.quitado && !x.recibido);
  const catalogos = await mapaCatalogos(client);
  const nombreTipo = (t: string) => etiquetaDe(catalogos.tipo_inmueble, t);
  const inmueble = inmuebleSegun(c.quien_nombre, d, nombreTipo);
  // Si se describió el inmueble, su apartado aparece aunque lo encargado no lo pida (una revisión también es de una casa).
  const apartados = [...new Set([...apartadosPara(encargos), ...(inmueble ? (["inmueble"] as const) : [])])];
  const r = await client.rpc("fortius_inmuebles_abrir_asunto_desde_consulta", {
    p_consulta: id, p_version: v,
    p_nombre: nombreDelAsunto(c.quien_nombre, d, nombreTipo),
    p_encargos: encargos,
    p_apartados: apartados,
    p_papel: papelDeQuienLlama(d, (p) => ofrecidos(catalogos.papel).some((x) => x.clave === p)),
    p_inmueble: inmueble,
    p_plan: primerPlan(encargos, hayDocumentos),
  });
  if (r.error) fallo(r.error);
  const res = r.data as { id: string; folio: string };
  return { id: res.id, folio: res.folio };
}

export async function cerrarConsulta(client: SupabaseClient, id: string, entrada: z.infer<typeof cierreSchema>): Promise<{ persona_id?: string }> {
  if (entrada.como === "contacto") {
    const r = await client.rpc("fortius_inmuebles_consulta_a_contacto", { p_consulta: id, p_version: entrada.version, p_volver: entrada.volver });
    if (r.error) fallo(r.error);
    return { persona_id: r.data as string };
  }
  const cambios = entrada.como === "no_procede"
    ? { estado: "no_procede", motivo: entrada.motivo || null }
    : { estado: "abierta" };
  const r = await client.from(T.consultas).update(cambios).eq("id", id).eq("version", entrada.version).neq("estado", "asunto").select("id");
  if (r.error) fallo(r.error);
  if (!r.data?.length) throw new ApiError(409, "La consulta cambió en otra ventana. Vuelve a cargarla.");
  return {};
}

// ── Lo que ya mandó ──────────────────────────────────────────────────────────────────────────────────
export const TAMANO_MAXIMO = 20 * 1024 * 1024;
export { FIRMAS } from "./firmas";

/**
 * Sube un archivo de la consulta al bucket privado y lo deja esperando su renglón (se acomoda al abrir el asunto).
 * `documento`: el documento de la lista al que pertenece (su nombre exacto); sin él, es un archivo suelto.
 */
export async function subirArchivo(client: SupabaseClient, privileged: SupabaseClient, user: StaffUser, consultaId: string, file: File, documento: string | null = null): Promise<Carga> {
  const c = await client.from(T.consultas).select("id,estado").eq("id", consultaId).maybeSingle();
  if (c.error) fallo(c.error);
  if (!c.data) throw new ApiError(404, "No se encontró la consulta");
  if (c.data.estado !== "abierta") throw new ApiError(409, "Esta consulta ya se cerró.");
  if (file.size < 1 || file.size > TAMANO_MAXIMO) throw new ApiError(413, "Cada archivo puede pesar hasta 20 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const tipo = FIRMAS.find((f) => f.es(bytes));
  if (!tipo) throw new ApiError(415, "Solo PDF o fotos (JPG, PNG o WebP)");
  const nombre = (file.name || `archivo.${tipo.ext}`).replace(/[\u0000-\u001f]/g, "").slice(0, 240) || `archivo.${tipo.ext}`;
  const path = `consultas/${consultaId}/${randomUUID()}.${tipo.ext}`;
  const subido = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, bytes, { contentType: tipo.mime, upsert: false });
  if (subido.error) throw new ApiError(502, "No se pudo subir el archivo. Vuelve a intentarlo.");
  const r = await privileged.from(T.cargas).insert({
    usuario_id: user.id, consulta_id: consultaId, path, nombre_original: nombre, mime: tipo.mime,
    byte_length: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"),
    ...(documento ? { documento } : {}),
  }).select(documento ? CAMPOS_CARGA : CAMPOS_CARGA_ANTES).single();
  if (r.error) {
    await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]);
    fallo(r.error);
  }
  return aCarga(r.data as unknown as FilaCarga);
}

/** Cambia a qué documento de la lista pertenece un archivo ya cargado (null: queda suelto). */
export async function cambiarArchivo(client: SupabaseClient, consultaId: string, cargaId: string, documento: string | null): Promise<Carga> {
  const r = await client.from(T.cargas).update({ documento, updated_at: new Date().toISOString() })
    .eq("id", cargaId).eq("consulta_id", consultaId).eq("estado", "por_acomodar").select(CAMPOS_CARGA);
  if (r.error) fallo(r.error);
  const fila = (r.data ?? [])[0] as unknown as FilaCarga | undefined;
  if (!fila) throw new ApiError(404, "Ese archivo ya no está en la consulta");
  return aCarga(fila);
}

/** Quitar un archivo adjunto: se marca descartado (recuperable); el archivo se queda en el bucket privado. */
export async function descartarArchivo(client: SupabaseClient, consultaId: string, cargaId: string): Promise<void> {
  const r = await client.from(T.cargas).update({ estado: "descartado", updated_at: new Date().toISOString() })
    .eq("id", cargaId).eq("consulta_id", consultaId).eq("estado", "por_acomodar").select("id");
  if (r.error) fallo(r.error);
  if (!r.data?.length) throw new ApiError(404, "Ese archivo ya no está en la consulta");
}
