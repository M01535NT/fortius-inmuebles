import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { leerCobro, type BorradorFormato, type Cobro, type UltimoRecibo } from "@/lib/panel/datos/dinero";

/**
 * Lectura de recibos 18 con rutas que ya existen (solo lectura, la base decide qué ve cada quien por RLS):
 * 1. `GET /api/admin/documentos?formato=18` dice qué asuntos tienen recibos y si cada uno ya está emitido.
 * 2. `GET /api/admin/expedientes/{id}/formatos` trae el contenido de los recibos de esos asuntos.
 */

type FilaDocumento = { id: string; expedienteId: string; formatoId: string; version: number; emitido: boolean; ultimoRecibo?: UltimoRecibo | null };

async function leerJson<T>(url: string, senal?: AbortSignal): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { credentials: "same-origin", cache: "no-store", signal: senal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión: no se pudo cargar. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new ErrorDeLectura(r.status === 401 || r.status === 403 ? "Tu sesión terminó o no tienes acceso a esto." : "No se pudieron cargar los cobros. Vuelve a intentarlo.", r.status);
  return cuerpo;
}

/** Todos los recibos 18 visibles, con su estado de emisión. Pide de 100 en 100 (máximo 20 páginas). */
export async function leerCobros(senal?: AbortSignal): Promise<Cobro[]> {
  const filas: FilaDocumento[] = [];
  let offset: number | null = 0;
  for (let pagina = 0; offset !== null && pagina < 20; pagina += 1) {
    const r: { documentos?: FilaDocumento[]; nextOffset?: number | null } = await leerJson(`/api/admin/documentos?formato=18&limit=100&offset=${offset}`, senal);
    filas.push(...(r.documentos ?? []));
    offset = r.nextOffset ?? null;
  }
  const emitido = new Map(filas.map((f) => [f.id, f.emitido]));
  const ultimo = new Map(filas.map((f) => [f.id, f.ultimoRecibo ?? null]));
  const asuntos = [...new Set(filas.map((f) => f.expedienteId))];
  const borradores = await Promise.all(asuntos.map((id) =>
    leerJson<{ documentos?: BorradorFormato[] }>(`/api/admin/expedientes/${encodeURIComponent(id)}/formatos`, senal).then((r) => r.documentos ?? [])));
  return borradores.flat().map((b) => leerCobro(b, emitido.get(b.id) === true, ultimo.get(b.id) ?? null)).filter((c): c is Cobro => c !== null);
}
