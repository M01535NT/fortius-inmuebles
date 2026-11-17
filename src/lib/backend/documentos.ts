import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { BUCKET_EXPEDIENTES, TIPOS_ARCHIVO_CLIENTE, exigirExpediente, preparacion, tituloDe } from "./expediente-archivos";
import { dropStagedUpload, prepareUpload, takeStagedUpload } from "./files";
import { ApiError, databaseError } from "./http";
import { propiedadVisible } from "./repository";

/*
  FLX-01 · Bandeja y documentos sin operación (titular, 14/11/2026; RP-101 y RP-102).
  Un archivo se guarda sin llenar ningún dato: queda en la Bandeja de quien lo subió. Después se
  liga a una persona, a un inmueble (aunque no tenga propietario), a una operación o a nada. Sigue
  el camino de los documentos del cliente: carga temporal con permiso de un solo uso, comprobación
  en el servidor, bucket privado y SHA-256. La tabla es nueva; los documentos de las operaciones
  no cambian.
*/

const TABLA = "fortius_inmuebles_documentos";
const COLUMNAS = "id,titulo,nombre_original,mime,byte_length,sha256,tipo_documento,asesor_id,cliente_id,propiedad_slug,expediente_id,archivado_el,uploaded_by,created_at,deleted_at";
export type Documento = {
  id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; sha256: string; tipo_documento: string | null;
  asesor_id: string | null; cliente_id: string | null; propiedad_slug: string | null; expediente_id: string | null;
  archivado_el: string | null; uploaded_by: string; created_at: string; deleted_at: string | null;
};

export const TIPOS_DOCUMENTO = ["levantamiento", "avaluo", "escritura", "identificacion", "predial", "libertad_gravamen", "contrato", "foto", "otro"] as const;
const referencia = z.string().trim().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
export const finalizacion = z.object({ ticket: z.string().max(4096), titulo: z.string().trim().min(1).max(240).optional() }).strict();
/** Lo que quien cambia vio del documento; si otra persona lo cambió antes, responde 409. */
const esperado = z.object({ titulo: z.string().max(240), eliminado: z.boolean(), archivado: z.boolean() }).strict();
/** A dónde va: cualquiera de las tres ligas, o ninguna para devolverlo a la Bandeja. */
const destino = z.object({ clienteId: referencia.nullable().optional(), propiedadSlug: referencia.nullable().optional(), expedienteId: z.uuid().nullable().optional() }).strict();
export const cambio = z.union([
  z.object({ titulo: z.string().trim().min(1).max(240), esperado }).strict(),
  z.object({ papelera: z.boolean(), esperado }).strict(),
  z.object({ tipo: z.enum(TIPOS_DOCUMENTO).nullable(), esperado }).strict(),
  z.object({ destino, esperado }).strict(),
]);
const CAMBIADO = "Otra persona cambió este documento; recarga antes de continuar";

/** El asesor de quien llama; el director sin ficha de asesor no tiene (y ve todo). */
async function asesorActual(client: Pick<SupabaseClient, "rpc">): Promise<string | null> {
  const { data, error } = await client.rpc("fortius_inmuebles_current_asesor_id");
  if (error) databaseError(error);
  return typeof data === "string" && data ? data : null;
}

/** Lo que está sin archivar y lo que está en la papelera, de lo que quien llama puede ver (RLS). */
export async function listarBandeja(client: SupabaseClient): Promise<{ documentos: Documento[]; papelera: Documento[] }> {
  const result = await client.from(TABLA).select(COLUMNAS).is("archivado_el", null).order("created_at", { ascending: false }).limit(300);
  if (result.error) databaseError(result.error);
  const rows = (result.data ?? []) as Documento[];
  return { documentos: rows.filter(row => !row.deleted_at), papelera: rows.filter(row => row.deleted_at) };
}

/** Los documentos ya ligados a una persona o a un inmueble. */
export async function listarLigados(client: SupabaseClient, liga: { clienteId: string } | { propiedadSlug: string }): Promise<Documento[]> {
  const query = client.from(TABLA).select(COLUMNAS).is("deleted_at", null);
  const result = await ("clienteId" in liga ? query.eq("cliente_id", referencia.parse(liga.clienteId)) : query.eq("propiedad_slug", referencia.parse(liga.propiedadSlug))).order("created_at", { ascending: false }).limit(300);
  if (result.error) databaseError(result.error);
  return (result.data ?? []) as Documento[];
}

/** Permiso de un solo uso para subir a la carga temporal privada. No pide ningún dato del documento. */
export async function prepararDocumento(privileged: SupabaseClient, userId: string, input: unknown) {
  return prepareUpload(privileged, userId, { ...preparacion.parse(input), visibility: "private" });
}

/**
  Guarda en la Bandeja el archivo que el ticket autorizó. El documento toma su identificador del
  ticket: un reintento o un doble envío devuelve el documento ya guardado en vez de duplicarlo.
*/
export async function finalizarDocumento(client: Pick<SupabaseClient, "rpc">, privileged: SupabaseClient, userId: string, input: unknown): Promise<Documento> {
  const { ticket, titulo } = finalizacion.parse(input);
  const { claims, file, type, extension } = await takeStagedUpload(privileged, userId, ticket);
  if (!(TIPOS_ARCHIVO_CLIENTE as readonly string[]).includes(type)) throw new ApiError(400, "Sube un PDF o una imagen JPEG, PNG o WEBP");
  const bytes = Buffer.from(await file.arrayBuffer());
  const id = claims.path.slice(claims.path.indexOf("/") + 1, claims.path.lastIndexOf("."));
  const path = `bandeja/${id}.${extension}`;
  const previo = await privileged.from(TABLA).select(COLUMNAS).eq("id", id).maybeSingle();
  if (previo.error) databaseError(previo.error);
  if (previo.data) {
    if (previo.data.uploaded_by !== userId) throw new ApiError(409, "Esta carga ya la guardó otra persona");
    await dropStagedUpload(privileged, claims.path);
    return previo.data as Documento;
  }
  const asesorId = await asesorActual(client);
  const uploaded = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, bytes, { contentType: type, upsert: true });
  if (uploaded.error) databaseError(uploaded.error);
  const saved = await privileged.from(TABLA).insert({
    id, titulo: titulo ?? tituloDe(claims.name), nombre_original: claims.name.slice(0, 255), mime: type, byte_length: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"), path, asesor_id: asesorId, uploaded_by: userId,
  }).select(COLUMNAS).single();
  if (saved.error) {
    if (saved.error.code === "23505") {
      const ganador = await privileged.from(TABLA).select(COLUMNAS).eq("id", id).eq("uploaded_by", userId).maybeSingle();
      if (ganador.data) return ganador.data as Documento;
    } else await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]);
    databaseError(saved.error);
  }
  await dropStagedUpload(privileged, claims.path);
  return saved.data as Documento;
}

/** El documento, visible para quien llama (RLS); si no lo ve, no existe para él. */
export async function documentoVisible(client: SupabaseClient, id: string) {
  const result = await client.from(TABLA).select(`${COLUMNAS},path`).eq("id", id).maybeSingle();
  if (result.error) databaseError(result.error);
  if (!result.data) throw new ApiError(404, "Documento no encontrado");
  return result.data as Documento & { path: string };
}

/**
  Comprueba que quien llama puede ligar a ese destino: ve al cliente, lleva el inmueble (o es el
  director) y tiene acceso a la operación. Un inmueble sin propietario es un destino válido (RP-102).
*/
async function ligas(client: SupabaseClient, role: string, data: z.infer<typeof destino>) {
  const clienteId = data.clienteId ?? null, propiedadSlug = data.propiedadSlug ?? null, expedienteId = data.expedienteId ?? null;
  if (clienteId) {
    const cliente = await client.from("fortius_inmuebles_records").select("id").eq("collection", "clientes").eq("id", clienteId).maybeSingle();
    if (cliente.error) databaseError(cliente.error);
    if (!cliente.data) throw new ApiError(404, "Persona no encontrada");
  }
  if (propiedadSlug) {
    const propiedad = await propiedadVisible(client, propiedadSlug);
    if (!propiedad) throw new ApiError(404, "Inmueble no encontrado");
    if (role !== "admin" && propiedad.asesorId !== await asesorActual(client)) throw new ApiError(403, "Solo el asesor del inmueble o el director guardan documentos en él");
  }
  if (expedienteId) await exigirExpediente(client, expedienteId);
  return { cliente_id: clienteId, propiedad_slug: propiedadSlug, expediente_id: expedienteId, archivado_el: clienteId || propiedadSlug || expedienteId ? new Date().toISOString() : null };
}

/** Renombra, cambia el tipo, manda a la papelera o restaura, y archiva o devuelve a la Bandeja. */
export async function cambiarDocumento(client: SupabaseClient, privileged: SupabaseClient, user: { id: string; role: string }, id: string, input: unknown): Promise<Documento> {
  const data = cambio.parse(input);
  const actual = await documentoVisible(client, id);
  if (actual.titulo !== data.esperado.titulo || Boolean(actual.deleted_at) !== data.esperado.eliminado || Boolean(actual.archivado_el) !== data.esperado.archivado) throw new ApiError(409, CAMBIADO);
  const patch = "titulo" in data ? { titulo: data.titulo }
    : "tipo" in data ? { tipo_documento: data.tipo }
    : "papelera" in data ? (data.papelera ? { deleted_at: new Date().toISOString(), deleted_by: user.id } : { deleted_at: null, deleted_by: null })
    : await ligas(client, user.role, data.destino);
  // Cambia solo si sigue como lo vio quien pide el cambio (la tabla no lleva versión).
  let query = privileged.from(TABLA).update(patch).eq("id", id).eq("titulo", data.esperado.titulo);
  query = data.esperado.eliminado ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  query = data.esperado.archivado ? query.not("archivado_el", "is", null) : query.is("archivado_el", null);
  const saved = await query.select(COLUMNAS).maybeSingle();
  if (saved.error) databaseError(saved.error);
  if (!saved.data) throw new ApiError(409, CAMBIADO);
  return saved.data as Documento;
}

/** Bytes comprobados contra su SHA-256 antes de entregarlos. */
export async function descargarDocumento(client: SupabaseClient, privileged: SupabaseClient, id: string) {
  const documento = await documentoVisible(client, id);
  const file = await privileged.storage.from(BUCKET_EXPEDIENTES).download(documento.path);
  if (file.error || !file.data) throw new ApiError(503, "El documento no está disponible");
  const bytes = Buffer.from(await file.data.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== documento.sha256) throw new ApiError(503, "El documento no superó la verificación de integridad");
  return { documento, bytes };
}
