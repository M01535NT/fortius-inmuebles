import { imageInfo, type ImagenDocumento } from "@/lib/formatos/documento/imagen";
import type { DatosGuardados } from "@/lib/formatos/datos-expediente";
import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";

/**
 * Lo que acompaña a la captura de un formato (PN-06), con las rutas que ya existen:
 * imágenes del borrador (`/api/admin/formatos/{id}/adjuntos`, `/api/admin/adjuntos/{id}/descargar`),
 * datos y documentos del asunto (`/api/admin/expedientes/{id}/datos` y `/archivos`)
 * y la copia firmada de un PDF emitido (`/api/admin/emisiones/{id}/firmado`, `/api/admin/copias-firmadas/{id}/descargar`).
 */

export type Adjunto = { id: string; kind: "foto" | "croquis" | "soporte"; caption: string; source: string; observed_on: string | null };
export type ArchivoDelCliente = { id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; created_at: string };
export type CopiaFirmada = { id: string; emission_id: string; created_at: string };

/** Formatos que llevan foto principal, croquis o fotografías (levantamientos 04 y opinión 07). */
export const CON_IMAGENES = new Set(["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"]);

/** Espacios de imagen de la hoja: qué tipo de adjunto aceptan y en qué campo de fecha se anota la toma. */
export const RANURAS_IMAGEN = {
  fotoPrincipalId: { tipo: "foto", nombre: "Fotografía principal", fecha: "fotoFecha" },
  croquisId: { tipo: "croquis", nombre: "Croquis o plano", fecha: "croquisFecha" },
} as const satisfies Record<string, { tipo: Adjunto["kind"]; nombre: string; fecha: string }>;
export type RanuraImagen = keyof typeof RANURAS_IMAGEN;
/** Cómo nombra la validación del formato a una imagen que falta (para llevar a su espacio desde «Lo que falta»). */
export const FALTA_IMAGEN: Record<string, RanuraImagen> = {
  "Selecciona la fotografía principal adjunta": "fotoPrincipalId",
  "Selecciona el croquis adjunto": "croquisId",
};
export const esRanuraImagen = (clave: string): clave is RanuraImagen => clave in RANURAS_IMAGEN;

export const TIPOS_ADJUNTO: { valor: Adjunto["kind"]; etiqueta: string }[] = [
  { valor: "foto", etiqueta: "Fotografía" },
  { valor: "croquis", etiqueta: "Croquis o plano" },
  { valor: "soporte", etiqueta: "Soporte gráfico" },
];

/** Los adjuntos que el documento usa: foto principal, croquis y las fotografías del 07 (una por renglón). */
export function idsElegidos(datos: Record<string, unknown>): string[] {
  const fotos = Array.isArray(datos.fotografias) ? datos.fotografias.map((f) => (f && typeof f === "object" ? (f as Record<string, unknown>).assetId : undefined)) : [];
  return [...new Set([datos.fotoPrincipalId, datos.croquisId, ...fotos].filter((x): x is string => typeof x === "string" && x.length > 0))];
}

/** Para el PDF la imagen elegida debe ser del tipo de su espacio (una foto no va en el croquis). */
export const opcionesDe = (adjuntos: readonly Adjunto[], tipo: Adjunto["kind"]) =>
  adjuntos.filter((a) => a.kind === tipo).map((a) => ({ valor: a.id, etiqueta: a.observed_on ? `${a.caption} · ${a.observed_on}` : a.caption }));

/** Qué se anota sola al elegir una imagen: la fecha de toma, si el formato la imprime y sigue vacía. */
export function fechaAlElegir(ranura: RanuraImagen, adjunto: Adjunto | undefined, borrador: Record<string, unknown>, guardado: Record<string, unknown>, claves: ReadonlySet<string>): Record<string, unknown> {
  const fecha = RANURAS_IMAGEN[ranura].fecha;
  if (!adjunto?.observed_on || !claves.has(fecha)) return {};
  const actual = borrador[fecha] ?? guardado[fecha];
  return actual ? {} : { [fecha]: adjunto.observed_on };
}

/** Qué falta para subir una imagen. Se pide lo que exige el servidor: tipo, descripción, fuente y archivo JPEG o PNG de hasta 10 MB. */
export function faltaParaSubir(d: { descripcion: string; fuente: string; archivo: File | null }): string | null {
  if (!d.archivo) return "Elige la imagen o toma la foto.";
  if (!/^image\/(jpeg|png)$/.test(d.archivo.type) && !/\.(jpe?g|png)$/i.test(d.archivo.name)) return "La imagen debe ser JPEG o PNG.";
  if (d.archivo.size > 10 * 1024 * 1024) return "La imagen pesa más de 10 MB.";
  if (!d.descripcion.trim()) return "Escribe qué muestra la imagen.";
  if (!d.fuente.trim()) return "Escribe quién la tomó o de dónde salió.";
  return null;
}

async function leer<T>(url: string, init: RequestInit = {}, senal?: AbortSignal): Promise<T> {
  let r: Response;
  try { r = await fetch(url, { credentials: "same-origin", cache: "no-store", signal: senal, ...init }); }
  catch (e) { if (e instanceof DOMException && e.name === "AbortError") throw e; throw new ErrorDeLectura("Sin conexión. Vuelve a intentarlo.", 0); }
  const cuerpo = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new ErrorDeLectura(r.status === 401 || r.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : cuerpo.error || "No se pudo completar. Vuelve a intentarlo.", r.status);
  return cuerpo;
}

export async function leerAdjuntos(documentoId: string, senal?: AbortSignal): Promise<Adjunto[]> {
  return (await leer<{ adjuntos?: Adjunto[] }>(`/api/admin/formatos/${encodeURIComponent(documentoId)}/adjuntos`, {}, senal)).adjuntos ?? [];
}

export async function subirAdjunto(documentoId: string, d: { tipo: Adjunto["kind"]; descripcion: string; fuente: string; fecha: string; archivo: File }): Promise<Adjunto> {
  const form = new FormData();
  form.set("tipo", d.tipo); form.set("descripcion", d.descripcion.trim()); form.set("fuente", d.fuente.trim());
  if (d.fecha) form.set("fechaObservacion", d.fecha);
  form.set("archivo", d.archivo);
  return (await leer<{ adjunto: Adjunto }>(`/api/admin/formatos/${encodeURIComponent(documentoId)}/adjuntos`, { method: "POST", body: form })).adjunto;
}

export const rutaAdjunto = (id: string) => `/api/admin/adjuntos/${encodeURIComponent(id)}/descargar`;

/** Baja la imagen para dibujarla en la hoja: medidas ya orientadas y dirección local (se libera al cerrar). */
export async function imagenDe(a: Adjunto): Promise<ImagenDocumento | undefined> {
  const r = await fetch(rutaAdjunto(a.id), { credentials: "same-origin" }).catch(() => null);
  if (!r?.ok) return undefined;
  const blob = await r.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const info = imageInfo(bytes);
  if (!info) return undefined;
  const mapa = typeof createImageBitmap === "function" ? await createImageBitmap(blob).catch(() => null) : null;
  const medidas = mapa ? { width: mapa.width, height: mapa.height } : { width: info.width, height: info.height };
  mapa?.close();
  return { bytes, tipo: info.tipo, ...medidas, caption: a.caption, source: a.source, date: a.observed_on, href: URL.createObjectURL(blob) };
}

export async function leerDatosAsunto(expedienteId: string, senal?: AbortSignal): Promise<DatosGuardados> {
  return (await leer<{ datos?: DatosGuardados }>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/datos`, {}, senal)).datos ?? {};
}

export async function leerArchivosDelCliente(expedienteId: string, senal?: AbortSignal): Promise<ArchivoDelCliente[]> {
  return (await leer<{ archivos?: ArchivoDelCliente[] }>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/archivos`, {}, senal)).archivos ?? [];
}
export const rutaArchivoDelCliente = (id: string) => `/api/admin/archivos-cliente/${encodeURIComponent(id)}/descargar`;

export async function leerCopiasFirmadas(emisionId: string, senal?: AbortSignal): Promise<CopiaFirmada[]> {
  return (await leer<{ copias?: CopiaFirmada[] }>(`/api/admin/emisiones/${encodeURIComponent(emisionId)}/firmado`, {}, senal)).copias ?? [];
}

/** Qué falta para subir la copia firmada: un PDF de hasta 20 MB. */
export function faltaParaFirmado(archivo: File | null): string | null {
  if (!archivo) return "Elige el PDF firmado.";
  if (archivo.type !== "application/pdf" && !/\.pdf$/i.test(archivo.name)) return "Debe ser un PDF.";
  if (archivo.size === 0 || archivo.size > 20 * 1024 * 1024) return "El PDF debe pesar menos de 20 MB.";
  return null;
}

export async function subirFirmado(emisionId: string, archivo: File): Promise<CopiaFirmada> {
  const form = new FormData();
  form.set("archivo", archivo);
  return (await leer<{ copia: CopiaFirmada }>(`/api/admin/emisiones/${encodeURIComponent(emisionId)}/firmado`, { method: "POST", body: form })).copia;
}
export const rutaCopiaFirmada = (id: string) => `/api/admin/copias-firmadas/${encodeURIComponent(id)}/descargar`;

/** El PDF de la versión actual del borrador (el que se firma); si no hay, el más reciente. */
export function emisionActual<T extends { draft_version: number; created_at: string }>(emisiones: readonly T[], version: number): T | null {
  const orden = [...emisiones].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return orden.find((e) => e.draft_version === version) ?? orden[0] ?? null;
}
