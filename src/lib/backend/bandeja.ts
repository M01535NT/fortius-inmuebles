import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { firmarTicketDeCarga, leerTicketDeCarga } from "./files";
import { ApiError, databaseError } from "./http";

/**
  PN-06 · Cola de la Bandeja en el servidor (DEC-54). Cada archivo «Por confirmar» queda anotado en
  `fortius_inmuebles_bandeja` y su contenido sigue en la carga temporal privada hasta que se guarda o se descarta.
  Las lecturas y escrituras van con el cliente de la sesión (RLS); solo Storage usa el cliente privilegiado.
*/
const TABLA = "fortius_inmuebles_bandeja";
const STAGING = "fortius-inmuebles-staging";
const COLUMNAS = "id,creado_por,staging_path,nombre,tipo,bytes,estado,destino_clase,destino_ref,version,created_at,vence_el";
const TIPOS_BANDEJA = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
export const SIN_COLA_DE_BANDEJA = "La cola de la Bandeja todavía no está en el servidor";

export type EstadoBandeja = "por_confirmar" | "guardado" | "descartado";
export type DestinoBandeja = { clase: "asunto" | "inmueble"; ref: string };
export type FilaBandeja = {
  id: string; nombre: string; tipo: string; bytes: number; estado: EstadoBandeja;
  destino: DestinoBandeja | null; version: number; creadoEl: string; venceEl: string;
};
type RegistroBandeja = {
  id: string; creado_por: string; staging_path: string; nombre: string; tipo: string; bytes: number; estado: EstadoBandeja;
  destino_clase: "asunto" | "inmueble" | null; destino_ref: string | null; version: number; created_at: string; vence_el: string;
};
type Cliente = Pick<SupabaseClient, "from">;
type ClienteStorage = Pick<SupabaseClient, "storage">;
type ErrorBase = { code?: string; message?: string };

// Mensajes que el disparador de la tabla lanza a propósito; se muestran tal cual.
const MENSAJES_DEL_DISPARADOR = new Set([
  "Alguien más cambió este archivo de la Bandeja. Vuelve a abrirla.",
  "Esos datos del archivo no se cambian",
  "Solo dirección reasigna un archivo de la Bandeja",
  "Este archivo ya se descartó",
]);

const sinTabla = (error: ErrorBase) =>
  error.code === "PGRST205" || error.code === "42P01" || /could not find the table|relation .* does not exist/i.test(error.message ?? "");

/** Mientras la migración no esté aplicada la tabla no existe: 503 para que la pantalla siga con su cola local. */
export function errorDeBandeja(error: ErrorBase): never {
  if (sinTabla(error)) throw new ApiError(503, SIN_COLA_DE_BANDEJA);
  if ((error.code === "PT409" || error.code === "PT403") && MENSAJES_DEL_DISPARADOR.has(error.message ?? "")) {
    throw new ApiError(Number(error.code.slice(2)), error.message!);
  }
  return databaseError(error);
}

function aFila(registro: RegistroBandeja): FilaBandeja {
  return {
    id: registro.id, nombre: registro.nombre, tipo: registro.tipo, bytes: Number(registro.bytes), estado: registro.estado,
    destino: registro.destino_clase && registro.destino_ref ? { clase: registro.destino_clase, ref: registro.destino_ref } : null,
    version: Number(registro.version), creadoEl: registro.created_at, venceEl: registro.vence_el,
  };
}

/** Los archivos por confirmar que subió quien está en sesión, más recientes primero y sin vencer. */
export async function listarBandeja(client: Cliente, userId: string): Promise<FilaBandeja[]> {
  const { data, error } = await client.from(TABLA).select(COLUMNAS)
    .eq("creado_por", userId).eq("estado", "por_confirmar").gt("vence_el", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(500);
  if (error) errorDeBandeja(error);
  return ((data ?? []) as RegistroBandeja[]).map(aFila);
}

const altaInput = z.object({ ticket: z.string().min(1).max(4096) }).strict();

/** Anota en la cola una carga temporal recién subida. No toma ni borra la carga; repetir el mismo ticket devuelve la misma fila. */
export async function anotarEnBandeja(client: Cliente, userId: string, input: unknown): Promise<FilaBandeja> {
  const { ticket } = altaInput.parse(input);
  const claims = leerTicketDeCarga(ticket, userId);
  if (claims.visibility !== "private") throw new ApiError(400, "La Bandeja solo guarda archivos privados");
  if (!TIPOS_BANDEJA.includes(claims.contentType)) throw new ApiError(400, "La Bandeja recibe PDF o imágenes (JPG, PNG, WEBP o GIF); el video se sube directo al inmueble");
  const nombre = claims.name.trim() || "Archivo";
  const alta = await client.from(TABLA)
    .insert({ staging_path: claims.path, nombre, tipo: claims.contentType, bytes: claims.size })
    .select(COLUMNAS).single();
  if (!alta.error) return aFila(alta.data as RegistroBandeja);
  if (alta.error.code !== "23505") errorDeBandeja(alta.error);
  const previa = await client.from(TABLA).select(COLUMNAS).eq("staging_path", claims.path).maybeSingle();
  if (previa.error) errorDeBandeja(previa.error);
  if (!previa.data) throw new ApiError(409, "Ese archivo ya está anotado en la Bandeja; recárgala");
  return aFila(previa.data as RegistroBandeja);
}

async function leerRegistro(client: Cliente, id: string): Promise<RegistroBandeja> {
  const { data, error } = await client.from(TABLA).select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) errorDeBandeja(error);
  if (!data) throw new ApiError(404, "Ese archivo no está en la Bandeja");
  return data as RegistroBandeja;
}

/**
  Permiso nuevo para seguir con un archivo de la Bandeja después de recargar: un ticket de carga para la misma ruta
  temporal (sirve para guardarlo en su destino) y una URL firmada para verlo. Solo para quien lo subió.
*/
export async function permisoDeBandeja(client: Cliente, storage: ClienteStorage, userId: string, id: string) {
  const registro = await leerRegistro(client, id);
  if (registro.creado_por !== userId) throw new ApiError(403, "Solo quien subió el archivo puede abrirlo desde la Bandeja");
  if (registro.estado !== "por_confirmar") throw new ApiError(409, "Este archivo ya no está por confirmar en la Bandeja");
  if (Date.parse(registro.vence_el) <= Date.now()) throw new ApiError(410, "El archivo ya no está en la Bandeja; vuelve a subirlo");
  const firmada = await storage.storage.from(STAGING).createSignedUrl(registro.staging_path, 600);
  if (firmada.error || !firmada.data?.signedUrl) {
    const estado = firmada.error && "statusCode" in firmada.error ? String(firmada.error.statusCode) : "";
    if (!firmada.error || estado === "400" || estado === "404" || /not.?found/i.test(firmada.error.message)) {
      throw new ApiError(410, "El archivo ya no está en la Bandeja; vuelve a subirlo");
    }
    databaseError(firmada.error);
  }
  const { ticket, expires } = firmarTicketDeCarga(userId, registro.staging_path, { name: registro.nombre, size: Number(registro.bytes), contentType: registro.tipo });
  return { ticket, url: firmada.data.signedUrl, expira: expires };
}

const cambioInput = z.object({
  version: z.number().int().positive(),
  estado: z.enum(["guardado", "descartado", "por_confirmar"]),
  destino: z.object({ clase: z.enum(["asunto", "inmueble"]), ref: z.string().trim().min(1).max(160) }).strict().optional(),
}).strict().refine((cambio) => cambio.estado !== "guardado" || cambio.destino !== undefined, { message: "Elige a dónde va el archivo", path: ["destino"] });

/** Guarda, descarta o regresa a «por confirmar» un archivo; la versión leída evita pisar un cambio ajeno (PT409). */
export async function cambiarBandeja(client: Cliente, storage: ClienteStorage, id: string, input: unknown): Promise<FilaBandeja> {
  const cambio = cambioInput.parse(input);
  const destino = cambio.estado === "guardado" ? cambio.destino! : null;
  const { data, error } = await client.from(TABLA)
    .update({ estado: cambio.estado, destino_clase: destino?.clase ?? null, destino_ref: destino?.ref ?? null, version: cambio.version })
    .eq("id", id).select(COLUMNAS).maybeSingle();
  if (error) errorDeBandeja(error);
  if (!data) throw new ApiError(404, "Ese archivo no está en la Bandeja");
  const registro = data as RegistroBandeja;
  if (registro.estado === "descartado") {
    // Si el borrado falla, la carga temporal sigue privada y el descarte ya quedó anotado.
    try { await storage.storage.from(STAGING).remove([registro.staging_path]); } catch { /* sin efecto en el resultado */ }
  }
  return aFila(registro);
}

/**
  Limpieza diaria (tarea de Vercel, `/api/cron/limpieza-archivos`): lo que lleva 30 días «por confirmar» se descarta
  y su archivo sale de la carga temporal (registro de tratamiento, DEC-54). Hasta 100 por vuelta; sin tabla, no hace nada.
  Usa el cliente de servicio: no hay sesión. Devuelve cuántos descartó.
*/
export async function limpiarBandejaVencida(service: Pick<SupabaseClient, "from" | "storage">, ahora = new Date()): Promise<number> {
  const { data, error } = await service.from(TABLA).select("id,staging_path,version")
    .eq("estado", "por_confirmar").lt("vence_el", ahora.toISOString()).order("vence_el").limit(100);
  if (error) { if (sinTabla(error)) return 0; databaseError(error); }
  const vencidos = (data ?? []) as { id: string; staging_path: string; version: number }[];
  if (!vencidos.length) return 0;
  const borrado = await service.storage.from(STAGING).remove(vencidos.map((v) => v.staging_path));
  if (borrado.error) databaseError(borrado.error);
  let descartados = 0;
  for (const v of vencidos) {
    // La versión leída: si alguien lo guardó en este momento, el disparador lo rechaza y queda como estaba.
    const cambio = await service.from(TABLA).update({ estado: "descartado", version: v.version }).eq("id", v.id).eq("estado", "por_confirmar");
    if (!cambio.error) descartados++;
  }
  return descartados;
}
