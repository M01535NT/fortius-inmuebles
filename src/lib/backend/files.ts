import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp, { type Sharp } from "sharp";
import { z } from "zod";
import { ApiError, databaseError } from "./http";
import { MAX_FILE_BYTES, validateFile } from "./validation";
import { propiedadVisible } from "./repository";

const uploadInput = z.object({
  name: z.string().min(1).max(160), size: z.number().int().positive().max(MAX_FILE_BYTES),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/webm"]),
  visibility: z.enum(["private", "public"]).default("private"),
  // B5: a dónde va lo público. «inmueble»: fotos, video y PDF de una ficha; «sitio»: biblioteca de Archivos.
  destino: z.enum(["inmueble", "sitio"]).optional(),
  inmueble: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/).optional(),
}).strict();
const ticketSchema = uploadInput.extend({ v: z.literal(1), uid: z.uuid(), path: z.string().regex(/^[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp|gif|pdf|mp4|webm)$/), expires: z.number().int() }).strict();
type StorageClient = Pick<SupabaseClient, "storage">;
type UploadClient = Pick<SupabaseClient, "storage" | "from">;

export async function registerUpload(client: UploadClient, userId: string, bucket: string, path: string) {
  const receipt = await client.from("fortius_inmuebles_file_uploads").insert({ bucket, path, uploaded_by: userId });
  if (receipt.error) {
    await client.storage.from(bucket).remove([path]);
    databaseError(receipt.error);
  }
}

function sign(payload: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new ApiError(503, "La carga de archivos no está configurada");
  return createHmac("sha256", secret).update(`fortius-inmuebles-upload-v1:${payload}`).digest();
}
function parseTicket(ticket: unknown, userId: string) {
  if (typeof ticket !== "string" || ticket.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)) throw new ApiError(403, "Permiso de carga inválido");
  const [payload, signature] = ticket.split(".");
  const expected = sign(payload);
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new ApiError(403, "Permiso de carga inválido");
  let data: z.infer<typeof ticketSchema>;
  try { data = ticketSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))); }
  catch { throw new ApiError(403, "Permiso de carga inválido"); }
  if (data.uid !== userId || !data.path.startsWith(`${userId}/`) || data.expires <= Date.now()) throw new ApiError(403, "Permiso de carga vencido o ajeno");
  return data;
}

/**
  B5 (auditoría de seguridad, 13/11/2026): lo público lo decide el servidor según el destino, no la
  pantalla. Una ficha de inmueble: su asesor o el director (un inmueble nuevo, todavía sin guardar,
  lo sube quien lo captura). La biblioteca pública de Archivos: solo el director. Sin destino, nada
  sale al bucket público. Lo privado no cambia.
*/
export async function autorizarDestino(client: Pick<SupabaseClient, "from" | "rpc">, role: string, input: unknown) {
  const data = uploadInput.parse(input);
  if (data.visibility !== "public") return;
  if (!data.destino) throw new ApiError(403, "Indica a dónde va el archivo público");
  if (role === "admin") return;
  if (data.destino === "sitio") throw new ApiError(403, "Solo el director publica archivos en la biblioteca del sitio. Súbelo como privado.");
  if (!data.inmueble) return;
  const propiedad = await propiedadVisible(client, data.inmueble);
  if (!propiedad) return;
  const { data: mine, error } = await client.rpc("fortius_inmuebles_current_asesor_id");
  if (error) databaseError(error);
  if (!mine || propiedad.asesorId !== mine) throw new ApiError(403, "Solo el asesor del inmueble o el director suben sus fotos y documentos públicos");
}

export async function prepareUpload(client: StorageClient, userId: string, input: unknown) {
  const data = uploadInput.parse(input);
  if (data.visibility === "public" && !data.destino) throw new ApiError(403, "Indica a dónde va el archivo público");
  z.uuid().parse(userId);
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf", "video/mp4": "mp4", "video/webm": "webm" }[data.contentType];
  const path = `${userId}/${randomUUID()}.${extension}`;
  const payload = Buffer.from(JSON.stringify({ ...data, v: 1, uid: userId, path, expires: Date.now() + 10 * 60000 })).toString("base64url");
  const ticket = `${payload}.${sign(payload).toString("base64url")}`;
  const signed = await client.storage.from("fortius-inmuebles-staging").createSignedUploadUrl(path, { upsert: false });
  if (signed.error) databaseError(signed.error);
  return { signedUrl: signed.data.signedUrl, path, ticket };
}

/**
  Toma la carga temporal autorizada por el ticket, comprueba tamaño y contenido y devuelve el
  archivo listo para guardarse. La usan los archivos del sitio y los documentos del cliente.
*/
export async function takeStagedUpload(client: StorageClient, userId: string, ticket: unknown) {
  const claims = parseTicket(ticket, userId);
  const staged = await client.storage.from("fortius-inmuebles-staging").download(claims.path);
  if (staged.error) throw new ApiError(409, "La carga temporal no está disponible; vuelve a seleccionar el archivo");
  if (staged.data.size !== claims.size || staged.data.size > MAX_FILE_BYTES) throw new ApiError(400, "El tamaño del archivo no coincide con el autorizado");
  const file = new File([staged.data], claims.name, { type: claims.contentType });
  const { type, extension } = await validateFile(file);
  if (!claims.path.endsWith(`.${extension}`)) throw new ApiError(400, "Tipo de archivo incongruente");
  return { claims, file, type, extension };
}
/** Retira la carga temporal; si falla, el objeto temporal sigue privado y no afecta el resultado. */
export async function dropStagedUpload(client: StorageClient, path: string) {
  await client.storage.from("fortius-inmuebles-staging").remove([path]);
}

/**
  M4 (auditoría de seguridad, 13/11/2026): una foto pública no debe llevar EXIF, GPS ni datos de la
  cámara; una foto del celular da la ubicación exacta de la casa. Se recodifica en el mismo formato,
  girada según su orientación, y sharp descarta todos los metadatos. GIF, PDF y video no se tocan.
*/
const SIN_METADATOS: Partial<Record<string, (image: Sharp) => Sharp>> = {
  "image/jpeg": image => image.jpeg({ quality: 90, mozjpeg: true }),
  "image/png": image => image.png(),
  "image/webp": image => image.webp({ quality: 90 }),
};
export async function sinMetadatos(file: File, type: string): Promise<File> {
  const encode = SIN_METADATOS[type];
  if (!encode) return file;
  try {
    const bytes = await encode(sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" }).rotate()).toBuffer();
    return new File([new Uint8Array(bytes)], file.name, { type });
  } catch { throw new ApiError(400, "No se pudo preparar la imagen para publicarla; prueba con otra foto"); }
}

export async function completeUpload(client: UploadClient, userId: string, ticket: unknown) {
  const { claims, file: validated, type } = await takeStagedUpload(client, userId, ticket);
  const bucket = claims.visibility === "public" ? "fortius-inmuebles-public" : "fortius-inmuebles-private";
  const file = bucket === "fortius-inmuebles-public" ? await sinMetadatos(validated, type) : validated;
  // Copy the exact bytes just validated, not a mutable remote object. Immutable
  // final names make concurrent completion/replayed tickets unable to overwrite.
  const saved = await client.storage.from(bucket).upload(claims.path, file, { contentType: type, upsert: false });
  if (saved.error) {
    if ("statusCode" in saved.error && String(saved.error.statusCode) === "409") throw new ApiError(409, "Esta carga ya fue finalizada");
    databaseError(saved.error);
  }
  await registerUpload(client, userId, bucket, claims.path);
  // Only this ticket's temporary object is removed. A cleanup outage must not
  // misreport a successfully persisted final file; abandoned staging is private.
  await dropStagedUpload(client, claims.path);
  const url = bucket === "fortius-inmuebles-public" ? client.storage.from(bucket).getPublicUrl(claims.path).data.publicUrl
    : `/api/admin/files?bucket=${bucket}&path=${encodeURIComponent(claims.path)}`;
  return { bucket, path: claims.path, url, name: claims.name, type };
}
