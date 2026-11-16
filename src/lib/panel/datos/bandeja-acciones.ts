import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { VIGENCIA_CARGA_MS, type Carga } from "@/lib/panel/datos/bandeja";

/**
 * Llamadas de la Bandeja a rutas que ya existen (no hay rutas nuevas):
 * - `POST /api/admin/files/upload` (privado) + `PUT` a la carga temporal: el archivo queda «Por confirmar».
 * - `POST /api/admin/expedientes/{id}/archivos/completar`: el servidor comprueba esa carga y la guarda entre los documentos del asunto.
 * - `PATCH /api/admin/archivos-cliente/{id}` con `papelera`: Deshacer (eliminación recuperable).
 * Las fotos de un inmueble usan el puente `uploadFile` (público, sin EXIF ni GPS) y la colección de inmuebles.
 */

export type ArchivoDelAsunto = { id: string; expediente_id: string; titulo: string; deleted_at: string | null };

async function pedirJson<T>(url: string, metodo: string, cuerpo: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { method: metodo, credentials: "same-origin", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  } catch {
    throw new ErrorDeLectura("Sin conexión. Vuelve a intentarlo.", 0);
  }
  const datos = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) {
    throw new ErrorDeLectura(
      r.status === 401 ? "Tu sesión terminó. Vuelve a entrar." : r.status === 403 ? (datos.error || "No tienes permiso para esto.") : (datos.error || "No se pudo completar. Vuelve a intentarlo."),
      r.status,
    );
  }
  return datos;
}

/** Sube el archivo a la carga temporal privada. Nada queda en un destino hasta que se elige. */
export async function subirATemporal(f: File, ahora = Date.now()): Promise<Carga> {
  const p = await pedirJson<{ signedUrl: string; ticket: string }>("/api/admin/files/upload", "POST", { name: f.name.slice(0, 160), size: f.size, contentType: f.type, visibility: "private" });
  let envio: Response;
  try {
    envio = await fetch(p.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": f.type }, body: f });
  } catch {
    throw new ErrorDeLectura("Sin conexión: el archivo no se subió.", 0);
  }
  if (!envio.ok) throw new ErrorDeLectura("No se pudo subir el archivo. Vuelve a intentarlo.", envio.status);
  return { ticket: p.ticket, expira: ahora + VIGENCIA_CARGA_MS };
}

/** Guarda la carga temporal entre los documentos del asunto. */
export async function guardarEnAsunto(expedienteId: string, carga: Carga, titulo: string): Promise<ArchivoDelAsunto> {
  const r = await pedirJson<{ archivo: ArchivoDelAsunto }>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/archivos/completar`, "POST", { ticket: carga.ticket, titulo });
  return r.archivo;
}

/** Deshacer: manda el documento a la papelera del asunto (se puede restaurar desde ahí). */
export async function quitarDelAsunto(archivoId: string, titulo: string): Promise<void> {
  await pedirJson(`/api/admin/archivos-cliente/${encodeURIComponent(archivoId)}`, "PATCH", { papelera: true, esperado: { titulo, eliminado: false } });
}
