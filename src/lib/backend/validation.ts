import { HOME_TEXT_KEYS } from "@/data/home-copy";
import { z } from "zod";
import { leadProfileSchema } from "@/lib/lead-profile";
import { taskSchema } from "@/lib/tasks";
import { COLLECTIONS, type CollectionName } from "./contracts";
import { ApiError } from "./http";

const text = z.string().max(20000);
const short = z.string().max(500);
const name = z.string().trim().min(1).max(160);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const reference = id.or(z.literal("")).optional();
const email = z.email().max(254).or(z.literal("")).optional();
const phone = z.string().max(40).refine((value) => value.replace(/\D/g, "").length >= 7, "Teléfono inválido");
const date = z.string().max(40).refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida");
const amount = z.number().finite().nonnegative().max(1e13);
export const safeUrl = z.string().max(2048).refine((value) => {
  if (/[\u0000-\u0020\\]/.test(value) || value.startsWith("//")) return false;
  if (value.startsWith("/")) return true;
  try { const parsed = new URL(value); return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch { return false; }
}, "URL inválida");
const optionalUrl = safeUrl.or(z.literal("")).optional();
const image = z.object({ src: safeUrl, alt: short }).passthrough();
const document = z.object({ codigo: short, nombre: name, descripcion: text, url: safeUrl }).passthrough();
const ficha = z.object({ terrenoM2: amount.optional(), construccionM2: amount.optional(), recamaras: amount.optional(), banos: amount.optional(), estacionamientos: amount.optional(), antiguedad: short.optional() }).passthrough();
const informacionPublica = z.object({
  fuenteTerreno: z.enum(["escritura", "catastro", "plano", "medicion", "declaracion"]).optional(),
  fuenteConstruccion: z.enum(["escritura", "catastro", "plano", "medicion", "declaracion"]).optional(),
  disponibilidadRevisadaEl: z.iso.date().optional(),
  ocupacionEntrega: short.optional(),
}).passthrough();
const price = z.discriminatedUnion("modalidad", [z.object({ modalidad: z.literal("consulta") }).passthrough(), z.object({ modalidad: z.literal("publico"), monto: amount, moneda: z.enum(["MXN", "USD"]), periodo: z.literal("mensual").optional() }).passthrough()]);
const point = z.object({ lugar: short, minutos: amount }).passthrough();
const propertySchema = z.object({
  slug: id, codigo: name, titulo: name, tipo: z.enum(["casa", "departamento", "terreno", "local", "oficina", "nave-industrial"]), operacion: z.enum(["venta", "renta"]), precio: price,
  zona: short, direccionAproximada: short, descripcion: z.array(text).max(100), ficha, informacionPublica: informacionPublica.optional(), amenidades: z.array(short).max(100), galeria: z.array(image).max(100), videoUrl: optionalUrl, tour360Url: optionalUrl,
  documentos: z.array(document).max(100).optional(), asesorId: id.or(z.literal("")), creditoDisponible: z.boolean(), puntosDeInteres: z.array(point).max(100), destacada: z.boolean(), estado: z.enum(["disponible", "apartada", "vendida"]), publicadaEl: date,
  demo: z.boolean(), publicada: z.boolean().default(false),
}).passthrough();
const adviserSchema = z.object({ id, nombre: name, cargo: short, iniciales: z.string().max(10), telefono: short.optional(), whatsapp: short.optional(), email, activo: z.boolean() }).passthrough();
const origins = ["evaluar", "contacto", "interes-propiedad", "checklist", "documentos", "manual"] as const;
const leadFields = { nombre: name, telefono: phone, email, propiedadSlug: reference, zona: short.optional(), tipoPropiedad: short.optional(), mensaje: text.optional() };
const homeTextsSchema = z.object(Object.fromEntries(HOME_TEXT_KEYS.map((key) => [key, z.string().max(4000).optional()]))).strip();
const contentSchema = z.object({ heroTitulo: text, heroSubtitulo: text, manifiestoTitulo: text, manifiestoTexto: text, seoTitle: short, seoDescription: short, homeTexts: homeTextsSchema.optional() }).passthrough();
const settingsSchema = z.object({ nombreComercial: short, telefono: short, whatsapp: short, email: z.email().max(254).or(z.literal("")), horario: short, facebook: safeUrl.or(z.literal("")), instagram: safeUrl.or(z.literal("")), videoInstitucionalUrl: safeUrl.or(z.literal("")) }).passthrough();
const postSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const postSchema = z.object({
  id, slug: postSlug, titulo: name, resumen: text, contenido: z.string().max(150000),
  estado: z.enum(["borrador", "publicado"]), actualizadoEl: date, publicadoEl: date.optional(),
  categoria: z.enum(["comprar", "vender", "rentar", "mercado", "tramites"]).optional(),
  formato: z.enum(["guia", "actualidad"]).optional(), destacado: z.boolean().optional(),
  autor: short.optional(), ambito: short.optional(), fuenteNombre: short.optional(), fuenteUrl: optionalUrl,
}).passthrough();

export const recordSchemas = {
  tareas: taskSchema,
  propiedades: propertySchema,
  asesores: adviserSchema,
  leads: z.object({ id, ...leadFields, perfil: leadProfileSchema.optional(), origen: z.enum(origins), estado: z.enum(["nuevo", "contactado", "en-evaluacion", "activo", "cerrado", "descartado"]), asesorId: reference, creadoEl: date, notas: z.array(z.object({ id, texto: text, fecha: date }).passthrough()).max(500) }).passthrough(),
  clientes: z.object({ id, nombre: name, telefono: phone, email, tipo: z.enum(["propietario", "comprador", "arrendador", "arrendatario", "otro"]), asesorId: reference, notas: text, creadoEl: date, actualizadoEl: date }).passthrough(),
  eventos: z.object({ id, titulo: name, fecha: date, hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).optional(), tipo: z.enum(["visita", "llamada", "firma", "reunion", "otro"]), leadId: reference, propiedadSlug: reference, clienteId: reference, notas: text.optional() }).passthrough(),
  notas: z.object({ id, titulo: name, texto: text, actualizadoEl: date }).passthrough(),
  posts: postSchema,
  archivos: z.object({ id, nombre: name, url: safeUrl, tipo: z.enum(["imagen", "pdf", "video", "otro"]), notas: text.optional(), bucket: z.enum(["mnt-private", "mnt-public"]).optional(), path: z.string().max(300).optional(), visibility: z.enum(["private", "public"]).optional() }).passthrough(),
  contenido: contentSchema,
  config: settingsSchema,
};

export function parseCollection(value: unknown): CollectionName { return z.enum(COLLECTIONS).parse(value); }
export function parseRecord(collection: CollectionName, recordId: string, value: unknown): Record<string, unknown> {
  id.parse(recordId);
  const data: Record<string, unknown> = recordSchemas[collection].parse(value);
  if ((collection === "contenido" || collection === "config") ? recordId !== "singleton" : data[collection === "propiedades" ? "slug" : "id"] !== recordId) throw new ApiError(400, "Identificador incongruente");
  if (new TextEncoder().encode(JSON.stringify(data)).byteLength > 250000) throw new ApiError(413, "Registro demasiado grande");
  if (collection === "propiedades" && data.publicada === true && !(data.galeria as unknown[]).length) throw new ApiError(400, "Publicar requiere al menos una imagen");
  return data;
}
export function parseWrite(value: unknown) { return z.object({ data: z.record(z.string(), z.unknown()), version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable() }).strict().parse(value); }
export function parseDelete(value: unknown) { return z.object({ version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).strict().parse(value); }
export function parseLead(value: unknown) {
  return z.object({ ...leadFields, origen: z.enum([...origins, "interes_propiedad"]), website: z.literal("").optional() }).strict().parse(value);
}

function isPublicUrl(value: string) { return safeUrl.safeParse(value).success && !/((?:cota|mnt)-(?:private|staging)|\/api\/admin\/|\/storage\/v1\/object\/sign\/)/i.test(value); }
// Keep the settings/contact shape even when a stored link is private or invalid.
// This projection never rewrites the staff-owned source record.
const publicSettingsUrl = z.string().transform((value) => isPublicUrl(value) ? value : "");
const publicWhatsapp = z.string().transform((value) => isPublicUrl(value) || /^[+]?[0-9 ()-]{7,40}$/.test(value) ? value : "");
const publicSettings = settingsSchema.strip().extend({ facebook: publicSettingsUrl, instagram: publicSettingsUrl, videoInstitucionalUrl: publicSettingsUrl, whatsapp: publicWhatsapp });
// This second allowlist also protects server components against malformed DB data.
const publicProperty = propertySchema.strip().extend({ ficha: ficha.strip(), informacionPublica: informacionPublica.strip().optional(), precio: z.discriminatedUnion("modalidad", [z.object({ modalidad: z.literal("consulta") }), z.object({ modalidad: z.literal("publico"), monto: amount, moneda: z.enum(["MXN", "USD"]), periodo: z.literal("mensual").optional() })]), galeria: z.array(image.strip()), documentos: z.array(document.strip()).optional(), puntosDeInteres: z.array(point.strip()) });
export function projectPublic(collection: string, values: unknown[]): Record<string, unknown>[] {
  const schema = collection === "propiedades" ? publicProperty : collection === "asesores" ? adviserSchema.pick({ id: true, nombre: true, cargo: true, iniciales: true, activo: true }).strip()
    : collection === "contenido" ? contentSchema.strip() : collection === "config" ? publicSettings : collection === "posts" ? postSchema.strip() : null;
  if (!schema) return [];
  const result: Record<string, unknown>[] = [];
  for (const value of values) {
    const parsed = schema.safeParse(value);
    if (!parsed.success) continue;
    const data = parsed.data as Record<string, unknown>;
    if (collection === "propiedades") {
      if (data.publicada !== true) continue;
      data.galeria = (data.galeria as { src: string }[]).filter((item) => isPublicUrl(item.src));
      if (!(data.galeria as unknown[]).length) continue;
      if (data.documentos) data.documentos = (data.documentos as { url: string }[]).filter((item) => isPublicUrl(item.url));
      for (const key of ["videoUrl", "tour360Url"]) if (data[key] && !isPublicUrl(data[key] as string)) delete data[key];
    }
    if (collection === "asesores" && data.activo !== true) continue;
    if (collection === "posts") {
      if (data.estado !== "publicado") continue;
      if (data.fuenteUrl && !isPublicUrl(data.fuenteUrl as string)) delete data.fuenteUrl;
    }
    result.push(data);
  }
  return result;
}

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export async function validateFile(file: File): Promise<{ extension: string; type: string }> {
  if (file.size === 0 || file.size > MAX_FILE_BYTES) throw new ApiError(400, "Archivo vacío o superior a 20 MB");
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const ascii = new TextDecoder("latin1").decode(bytes);
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const formats: [string, string, boolean][] = [
    ["image/jpeg", "jpg", starts(0xff, 0xd8, 0xff)], ["image/png", "png", starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
    ["image/webp", "webp", ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP"], ["image/gif", "gif", ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")],
    ["application/pdf", "pdf", ascii.startsWith("%PDF-")], ["video/mp4", "mp4", ascii.slice(4, 8) === "ftyp"], ["video/webm", "webm", starts(0x1a, 0x45, 0xdf, 0xa3)],
  ];
  const format = formats.find(([mime, , signature]) => mime === file.type && signature);
  if (!format) throw new ApiError(400, "Formato de archivo no permitido o contenido incongruente");
  return { type: format[0], extension: format[1] };
}
