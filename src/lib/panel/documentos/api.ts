import type { FilaTrabajo, ResultadoGuardar, Trabajo, TrabajoAbierto } from "@/lib/backend/trabajos-contrato";
import { pedir } from "@/lib/panel/asuntos/api";

export * from "@/lib/backend/trabajos-contrato";

const base = "/api/admin/trabajos";

export const leerSueltos = () => pedir<{ trabajos: FilaTrabajo[] }>(base).then((r) => r.trabajos);
export const leerTrabajosDelAsunto = (asuntoId: string) => pedir<{ trabajos: FilaTrabajo[] }>(`${base}?asunto=${encodeURIComponent(asuntoId)}`).then((r) => r.trabajos);
export const abrirTrabajo = (id: string) => pedir<TrabajoAbierto>(`${base}/${id}`);

/** Empieza un formato (en un asunto o suelto) o guarda una cuenta de Herramientas. */
export const empezarTrabajo = (e: { clase: "formato" | "herramienta"; tipo: string; asunto_id?: string | null; datos?: Record<string, unknown>; resultado?: string }) =>
  pedir<{ id: string }>(base, "POST", e).then((r) => r.id);

export const guardarTrabajo = (t: Pick<Trabajo, "id" | "version">, datos: Record<string, unknown>) =>
  pedir<ResultadoGuardar>(`${base}/${t.id}`, "PATCH", { version: t.version, datos });
export const pasarAUnAsunto = (t: Pick<Trabajo, "id" | "version">, asuntoId: string) =>
  pedir<ResultadoGuardar>(`${base}/${t.id}`, "PATCH", { version: t.version, asunto_id: asuntoId });
export const quitarTrabajo = (t: Pick<Trabajo, "id" | "version">) => pedir<ResultadoGuardar>(`${base}/${t.id}`, "PATCH", { version: t.version, quitar: true });

/** Arma el PDF y lo descarga. Devuelve el trabajo al día (si quedó en Documentos, su versión cambió). */
export async function descargarPdf(id: string): Promise<{ trabajo: Trabajo; guardado: boolean; url: string; nombre: string }> {
  const r = await pedir<{ trabajo: Trabajo; nombre: string; pdf: string; guardado: boolean }>(`${base}/${id}/pdf`, "POST", {});
  const bytes = Uint8Array.from(atob(r.pdf), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = r.nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { trabajo: r.trabajo, guardado: r.guardado, url, nombre: r.nombre };
}
