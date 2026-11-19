import type { Coincidencia } from "@/lib/backend/asuntos-contrato";
import type { Carga, Consulta, ConsultaAbierta } from "@/lib/backend/consultas-contrato";

export type { Coincidencia } from "@/lib/backend/asuntos-contrato";
import { FalloPanel } from "@/lib/panel/asuntos/api";

export * from "@/lib/backend/consultas-contrato";

async function pedir<T>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  let r: Response;
  try {
    const esForm = cuerpo instanceof FormData;
    r = await fetch(ruta, {
      method: metodo, credentials: "same-origin", cache: "no-store",
      headers: cuerpo === undefined || esForm ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    });
  } catch {
    throw new FalloPanel(0, "Sin conexión. Lo capturado sigue en este equipo y se guarda al volver la conexión.");
  }
  const datos = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new FalloPanel(r.status, datos.error ?? "No se pudo terminar. Vuelve a intentarlo.");
  return datos as T;
}

const base = "/api/admin/consultas";
export type CambioConsulta = Partial<Pick<Consulta,
  "quien_nombre" | "quien_telefonos" | "canal" | "que_pasa" | "datos" | "otras_personas" | "documentos_pedir">>;

export const leerAbiertas = () => pedir<{ consultas: ConsultaAbierta[] }>(base).then((r) => r.consultas);
export const empezarConsulta = (cuerpo: { quien_nombre?: string; persona_id?: string } = {}) =>
  pedir<{ consulta: { id: string; version: number } }>(base, "POST", cuerpo).then((r) => r.consulta);
export const leerConsulta = (id: string) => pedir<{ consulta: Consulta }>(`${base}/${id}`).then((r) => r.consulta);
export const guardarConsulta = (id: string, version: number, cambio: CambioConsulta) =>
  pedir<{ version: number }>(`${base}/${id}`, "PATCH", { version, ...cambio });
/**
 * `personaId`: la ficha del Directorio que es quien llama (elegida en el aviso de persona repetida), para no crear otra;
 * null, una ficha nueva; sin él, como esté la consulta.
 */
export const abrirAsuntoDe = (id: string, version: number, personaId?: string | null) =>
  pedir<{ asunto: { id: string; folio: string } }>(`${base}/${id}/abrir`, "POST", personaId === undefined ? { version } : { version, persona_id: personaId })
    .then((r) => r.asunto);
/** Las fichas del Directorio que se parecen a quien llama (con lo último guardado de la consulta) y sus asuntos. */
export const coincidenciasDe = (id: string) =>
  pedir<{ coincidencias: Coincidencia[] }>(`${base}/${id}/coincidencias`).then((r) => r.coincidencias);
export const cerrarComoContacto = (id: string, version: number, volver: string) =>
  pedir<{ persona_id: string }>(`${base}/${id}/cerrar`, "POST", { como: "contacto", version, volver });
export const cerrarNoProcede = (id: string, version: number, motivo: string) =>
  pedir<object>(`${base}/${id}/cerrar`, "POST", { como: "no_procede", version, motivo: motivo || undefined });
/** `documento`: el nombre exacto del documento pedido al que pertenece el archivo; sin él, es un archivo suelto. */
export function adjuntar(id: string, archivo: File, documento?: string) {
  const f = new FormData();
  f.append("archivo", archivo);
  if (documento) f.append("documento", documento);
  return pedir<{ carga: Carga }>(`${base}/${id}/archivos`, "POST", f).then((r) => r.carga);
}
/** Cambia a qué documento pedido va un archivo ya cargado; null lo deja suelto. */
export const cambiarDocumentoDeArchivo = (id: string, carga: string, documento: string | null) =>
  pedir<{ carga: Carga }>(`${base}/${id}/archivos?carga=${carga}`, "PATCH", { documento }).then((r) => r.carga);
export const quitarAdjunto =(id: string, carga: string) => pedir<object>(`${base}/${id}/archivos?carga=${carga}`, "DELETE");
