import { pedir } from "@/lib/panel/datos/colecciones";

/**
 * Entradas del blog que se mandaron a Eliminados, con la ruta del historial que ya existe (solo el director la usa):
 * `GET /api/admin/historial?deleted=1&collection=posts` y «Recuperar» con `POST /api/admin/historial`. La base la
 * regresa como borrador.
 */
export type EntradaEliminada = { id: string; record_id: string; titulo: string | null; created_at: string; actor_id: string | null };

export async function leerEntradasEliminadas(senal?: AbortSignal): Promise<EntradaEliminada[]> {
  const r: EntradaEliminada[] = [];
  // El historial llega de 50 en 50; se juntan hasta 500 (de sobra para un blog).
  for (let offset = 0; offset < 500; offset += 50) {
    const q = new URLSearchParams({ deleted: "1", collection: "posts", offset: String(offset) });
    const pagina = await pedir<EntradaEliminada[]>(`/api/admin/historial?${q}`, { method: "GET", signal: senal }, "entries");
    r.push(...pagina);
    if (pagina.length < 50) break;
  }
  return quitarRepetidas(r);
}

/** Si una entrada se borró dos veces, solo cuenta la vez más reciente (es la que se recupera). */
export function quitarRepetidas(lista: readonly EntradaEliminada[]): EntradaEliminada[] {
  const vistas = new Set<string>();
  return [...lista].sort((a, b) => b.created_at.localeCompare(a.created_at)).filter((e) => (vistas.has(e.record_id) ? false : (vistas.add(e.record_id), true)));
}

export function recuperarEntrada(historialId: string): Promise<unknown> {
  return pedir<unknown>("/api/admin/historial", { method: "POST", body: JSON.stringify({ historyId: historialId }) }, "record");
}

/** «Deshacer» justo después de mandar a Eliminados: busca su registro en el historial y la recupera. */
export async function deshacerBorrado(recordId: string): Promise<void> {
  const q = new URLSearchParams({ deleted: "1", collection: "posts", record: recordId });
  const [ultima] = quitarRepetidas(await pedir<EntradaEliminada[]>(`/api/admin/historial?${q}`, { method: "GET" }, "entries"));
  if (!ultima) throw new Error("No se encontró en Eliminados. Búscala en «Eliminadas».");
  await recuperarEntrada(ultima.id);
}
