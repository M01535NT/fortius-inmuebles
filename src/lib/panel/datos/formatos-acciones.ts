import { ErrorDeLectura, pedir } from "@/lib/panel/datos/colecciones";
import type { DocumentoLista } from "@/lib/panel/datos/formatos";

/**
 * Llamadas de Formatos a las rutas que ya existen (no hay rutas nuevas):
 * lista `GET /api/admin/documentos`, crear `POST /api/admin/expedientes/{id}/formatos` (la base pone folio y datos del asunto),
 * leer y guardar `GET/PUT /api/admin/formatos/{id}` (con versión; 409 si cambió), emitir `POST /api/admin/formatos/{id}/emitir`
 * y descargar `GET /api/admin/emisiones/{id}/descargar`.
 */

export type DocumentoFormato = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; created_at: string; updated_at: string };
export type EmisionFormato = { id: string; draft_id: string; draft_version: number; created_at: string };

/** Lee la respuesta completa (varias claves); mismo trato de errores que el resto del panel. */
async function leerJson<T>(url: string, senal?: AbortSignal): Promise<T> {
  let r: Response;
  try { r = await fetch(url, { credentials: "same-origin", cache: "no-store", signal: senal }); }
  catch (e) { if (e instanceof DOMException && e.name === "AbortError") throw e; throw new ErrorDeLectura("Sin conexión. Vuelve a intentarlo.", 0); }
  const cuerpo = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new ErrorDeLectura(r.status === 401 || r.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : cuerpo.error || "No se pudo leer. Vuelve a intentarlo.", r.status);
  return cuerpo;
}

export async function leerDocumentos(senal?: AbortSignal): Promise<DocumentoLista[]> {
  const todos: DocumentoLista[] = [];
  let offset: number | null = 0;
  // Hasta 300 documentos, los más recientes primero.
  while (offset !== null && todos.length < 300) {
    const r: { documentos: DocumentoLista[]; nextOffset: number | null } = await leerJson(`/api/admin/documentos?limit=100&offset=${offset}`, senal);
    todos.push(...r.documentos);
    offset = r.nextOffset;
  }
  return todos;
}

export function crearDocumento(expedienteId: string, formatoId: string): Promise<DocumentoFormato> {
  return pedir<DocumentoFormato>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/formatos`, { method: "POST", body: JSON.stringify({ formatoId, data: {} }) }, "documento");
}

export function leerDocumento(id: string, senal?: AbortSignal): Promise<{ documento: DocumentoFormato; emisiones: EmisionFormato[] }> {
  return leerJson(`/api/admin/formatos/${encodeURIComponent(id)}`, senal);
}

export function guardarDocumento(id: string, version: number, data: Record<string, unknown>): Promise<DocumentoFormato> {
  return pedir<DocumentoFormato>(`/api/admin/formatos/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ version, data }) }, "documento");
}

export function emitirDocumento(id: string, version: number, incompleto: boolean): Promise<EmisionFormato> {
  return pedir<EmisionFormato>(`/api/admin/formatos/${encodeURIComponent(id)}/emitir`, { method: "POST", body: JSON.stringify(incompleto ? { version, incompleto: true } : { version }) }, "emision");
}

/** Descarga el PDF emitido con su nombre; comprueba que de verdad sea un PDF. */
export async function descargarEmision(id: string, nombre: string): Promise<void> {
  const r = await fetch(`/api/admin/emisiones/${encodeURIComponent(id)}/descargar`, { credentials: "same-origin", cache: "no-store" });
  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => ({}))) as { error?: string };
    throw new ErrorDeLectura(cuerpo.error || "No se pudo descargar el PDF. Vuelve a intentarlo.", r.status);
  }
  const blob = await r.blob();
  if ((await blob.slice(0, 5).text()) !== "%PDF-") throw new ErrorDeLectura("El archivo recibido no es un PDF.", 502);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
