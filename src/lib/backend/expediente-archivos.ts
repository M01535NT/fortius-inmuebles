import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { dropStagedUpload, prepareUpload, takeStagedUpload } from "./files";
import { ApiError, databaseError } from "./http";
import { MAX_FILE_BYTES } from "./validation";

/*
  Documentos del cliente (titular, 29/10/2026): un repositorio por expediente sin categorías.
  El navegador sube el archivo directo a la carga temporal privada con un permiso de un solo uso
  (así no pesa el límite de tamaño de la plataforma) y el servidor lo comprueba, lo guarda en el
  bucket privado del expediente y registra su SHA-256. Toda operación exige acceso al expediente.
*/

export const BUCKET_EXPEDIENTES = "fortius-inmuebles-expedientes";
export const TIPOS_ARCHIVO_CLIENTE = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
const COLUMNAS = "id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,uploaded_by,created_at,deleted_at,lectura_estado,lectura_error,leido_el,tipo_documento";
export type EstadoLectura = "pendiente" | "leyendo" | "leido" | "error";
export type ArchivoCliente = { id: string; expediente_id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; sha256: string; uploaded_by: string; created_at: string; deleted_at: string | null;
  lectura_estado?: EstadoLectura; lectura_error?: string | null; leido_el?: string | null; tipo_documento?: string | null };

export const preparacion = z.object({
  name: z.string().trim().min(1).max(160),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
  contentType: z.enum(TIPOS_ARCHIVO_CLIENTE),
}).strict();
export const finalizacion = z.object({ ticket: z.string().max(4096), titulo: z.string().trim().min(1).max(240).optional() }).strict();
export const cambio = z.union([
  z.object({ titulo: z.string().trim().min(1).max(240) }).strict(),
  z.object({ papelera: z.boolean() }).strict(),
]);

/** El expediente existe, está activo y quien llama tiene acceso a él (RLS del expediente). */
export async function exigirExpediente(client: SupabaseClient, id: string) {
  const result = await client.from("fortius_inmuebles_expedientes").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
  if (result.error) databaseError(result.error);
  if (!result.data) throw new ApiError(404, "Expediente no encontrado");
}

export async function listarArchivos(client: SupabaseClient, expedienteId: string): Promise<{ archivos: ArchivoCliente[]; papelera: ArchivoCliente[] }> {
  const result = await client.from("fortius_inmuebles_expediente_archivos").select(COLUMNAS).eq("expediente_id", expedienteId).order("created_at", { ascending: false });
  if (result.error) databaseError(result.error);
  const rows = (result.data ?? []) as ArchivoCliente[];
  return { archivos: rows.filter(row => !row.deleted_at), papelera: rows.filter(row => row.deleted_at) };
}

export async function prepararArchivo(privileged: SupabaseClient, userId: string, input: unknown) {
  const data = preparacion.parse(input);
  return prepareUpload(privileged, userId, { ...data, visibility: "private" });
}

/** Guarda en el expediente el archivo que el ticket autorizó; si el registro falla, el archivo no queda huérfano. */
export async function finalizarArchivo(privileged: SupabaseClient, userId: string, expedienteId: string, input: unknown): Promise<ArchivoCliente> {
  const { ticket, titulo } = finalizacion.parse(input);
  const { claims, file, type, extension } = await takeStagedUpload(privileged, userId, ticket);
  if (!(TIPOS_ARCHIVO_CLIENTE as readonly string[]).includes(type)) throw new ApiError(400, "Sube un PDF o una imagen JPEG, PNG o WEBP");
  const bytes = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  const path = `${expedienteId}/cliente/${id}.${extension}`;
  const uploaded = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, bytes, { contentType: type, upsert: false });
  if (uploaded.error) databaseError(uploaded.error);
  const saved = await privileged.from("fortius_inmuebles_expediente_archivos").insert({
    id, expediente_id: expedienteId, titulo: titulo ?? tituloDe(claims.name), nombre_original: claims.name.slice(0, 255),
    mime: type, byte_length: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), path, uploaded_by: userId,
  }).select(COLUMNAS).single();
  if (saved.error) {
    await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]);
    databaseError(saved.error);
  }
  await dropStagedUpload(privileged, claims.path);
  return saved.data as ArchivoCliente;
}

/** Título inicial: el nombre del archivo sin extensión ni guiones bajos. */
export function tituloDe(nombre: string): string {
  const base = nombre.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Documento").slice(0, 240);
}

/** El archivo, visible para quien llama (RLS); si no lo ve, no existe para él. */
export async function archivoVisible(client: SupabaseClient, id: string) {
  const result = await client.from("fortius_inmuebles_expediente_archivos").select(`${COLUMNAS},path`).eq("id", id).maybeSingle();
  if (result.error) databaseError(result.error);
  if (!result.data) throw new ApiError(404, "Documento no encontrado");
  return result.data as ArchivoCliente & { path: string };
}

export async function cambiarArchivo(client: SupabaseClient, privileged: SupabaseClient, userId: string, id: string, input: unknown): Promise<ArchivoCliente> {
  const data = cambio.parse(input);
  const archivo = await archivoVisible(client, id);
  await exigirExpediente(client, archivo.expediente_id);
  const patch = "titulo" in data ? { titulo: data.titulo }
    : data.papelera ? { deleted_at: new Date().toISOString(), deleted_by: userId } : { deleted_at: null, deleted_by: null };
  const saved = await privileged.from("fortius_inmuebles_expediente_archivos").update(patch).eq("id", id).select(COLUMNAS).single();
  if (saved.error) databaseError(saved.error);
  return saved.data as ArchivoCliente;
}

/** Bytes comprobados contra su SHA-256 antes de entregarlos. */
export async function descargarArchivo(client: SupabaseClient, privileged: SupabaseClient, id: string) {
  const archivo = await archivoVisible(client, id);
  const file = await privileged.storage.from(BUCKET_EXPEDIENTES).download(archivo.path);
  if (file.error || !file.data) throw new ApiError(503, "El documento no está disponible");
  const bytes = Buffer.from(await file.data.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== archivo.sha256) throw new ApiError(503, "El documento no superó la verificación de integridad");
  return { archivo, bytes };
}
