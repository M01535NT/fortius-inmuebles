import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { VIGENCIA_CARGA_MS, type Carga, type DestinoCola, type EstadoCola, type FilaBandeja } from "@/lib/panel/datos/bandeja";

/**
 * Llamadas de la Bandeja a rutas que ya existen (no hay rutas nuevas):
 * - `POST /api/admin/files/upload` (privado) + `PUT` a la carga temporal: el archivo queda «Por confirmar».
 * - `POST /api/admin/expedientes/{id}/archivos/completar`: el servidor comprueba esa carga y la guarda entre los documentos del asunto.
 * - `PATCH /api/admin/archivos-cliente/{id}` con `papelera`: Deshacer (eliminación recuperable).
 * Las fotos de un inmueble usan el puente `uploadFile` (público, sin EXIF ni GPS) y la colección de inmuebles.
 * La cola de la Bandeja en el servidor (DEC-54): `GET/POST /api/admin/bandeja`, `POST /api/admin/bandeja/{id}/permiso`
 * y `PATCH /api/admin/bandeja/{id}`. Mientras su migración no esté aplicada responden 503 y la cola vive solo en la página.
 */

export type ArchivoDelAsunto = { id: string; expediente_id: string; titulo: string; deleted_at: string | null };

async function pedirJson<T>(url: string, metodo: string, cuerpo?: unknown, senal?: AbortSignal): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      method: metodo, credentials: "same-origin", cache: "no-store", signal: senal,
      ...(cuerpo === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) }),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
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

/** El servidor todavía no tiene la cola de la Bandeja (migración sin aplicar): se sigue con la cola en la página. */
export const sinColaEnServidor = (e: unknown) => e instanceof ErrorDeLectura && e.estado === 503;
/** El archivo ya no está en la carga temporal del servidor. */
export const yaNoEsta = (e: unknown) => e instanceof ErrorDeLectura && e.estado === 410;

/** Los archivos por confirmar de quien está en sesión (no vencidos). */
export async function leerCola(senal?: AbortSignal): Promise<FilaBandeja[]> {
  const r = await pedirJson<{ archivos?: FilaBandeja[] }>("/api/admin/bandeja", "GET", undefined, senal);
  return r.archivos ?? [];
}

/** Anota en la cola una carga temporal recién subida (idempotente: repetirlo no la duplica). */
export async function anotarEnCola(ticket: string): Promise<FilaBandeja> {
  return (await pedirJson<{ archivo: FilaBandeja }>("/api/admin/bandeja", "POST", { ticket })).archivo;
}

/** Ticket nuevo de 10 minutos para la misma carga y URL firmada para verla o descargarla. 410 si ya no está. */
export async function permisoDeCola(id: string, ahora = Date.now()): Promise<{ carga: Carga; url: string }> {
  const r = await pedirJson<{ ticket: string; url: string; expira: unknown }>(`/api/admin/bandeja/${encodeURIComponent(id)}/permiso`, "POST", {});
  return { carga: { ticket: r.ticket, expira: ahora + VIGENCIA_CARGA_MS }, url: r.url };
}

/** Cambia el estado de la fila con control de versión; 409 si alguien la cambió antes. */
export async function cambiarEnCola(id: string, version: number, estado: EstadoCola, destino?: DestinoCola): Promise<FilaBandeja> {
  const cuerpo = destino ? { version, estado, destino } : { version, estado };
  return (await pedirJson<{ archivo: FilaBandeja }>(`/api/admin/bandeja/${encodeURIComponent(id)}`, "PATCH", cuerpo)).archivo;
}

/** Trae los bytes de un archivo recuperado con su URL firmada, con el nombre y tipo de su fila. */
export async function descargarDeCola(url: string, nombre: string, tipo: string): Promise<File> {
  let r: Response;
  try {
    r = await fetch(url, { credentials: "omit", cache: "no-store" });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se pudo traer el archivo.", 0);
  }
  if (!r.ok) throw new ErrorDeLectura(r.status === 404 ? "Este archivo ya no está en la Bandeja del servidor." : "No se pudo traer el archivo. Vuelve a intentarlo.", r.status === 404 ? 410 : r.status);
  return new File([await r.blob()], nombre, { type: tipo });
}
