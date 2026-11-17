import type { Guia, ResultadoCopia } from "@/lib/backend/biblioteca-contrato";
import type { CambioPersonaDirectorio, PersonaDirectorio } from "@/lib/backend/directorio-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/biblioteca-contrato";
export * from "@/lib/backend/directorio-contrato";

// ── Biblioteca ──
const bib = "/api/admin/biblioteca";
export const leerBiblioteca = () => pedir<{ guias: Guia[] }>(bib).then((r) => r.guias);
export const crearGuia = (cuerpo: Pick<Guia, "clase" | "nombre" | "contenido"> & { descripcion?: string }) =>
  pedir<{ guia: Guia }>(bib, "POST", cuerpo).then((r) => r.guia);
export const guardarPlanEnBiblioteca = (asuntoId: string, nombre: string) =>
  pedir<{ guia: Guia }>(bib, "POST", { desde_asunto: asuntoId, plan: true, nombre }).then((r) => r.guia);
export const guardarApartadoEnBiblioteca = (asuntoId: string, apartadoId: string, nombre?: string) =>
  pedir<{ guia: Guia }>(bib, "POST", { desde_asunto: asuntoId, apartado_id: apartadoId, ...(nombre ? { nombre } : {}) }).then((r) => r.guia);
export const cambiarGuia = (
  g: Pick<Guia, "id" | "version">,
  cambio: Partial<Pick<Guia, "nombre" | "descripcion" | "contenido" | "revisado_abogado">> & { quitar?: true; restaurar?: true },
) => pedir<{ guia: Guia | null }>(`${bib}/${g.id}`, "PATCH", { version: g.version, ...cambio }).then((r) => r.guia);
export const copiarGuia = (id: string, asuntoId: string) =>
  pedir<{ resultado: ResultadoCopia }>(`${bib}/${id}/copiar`, "POST", { asunto_id: asuntoId }).then((r) => r.resultado);

// ── Directorio ──
const dir = "/api/admin/directorio";
export const leerDirectorio = () => pedir<{ personas: PersonaDirectorio[] }>(dir).then((r) => r.personas);
export const cambiarPersonaDirectorio = (p: Pick<PersonaDirectorio, "id" | "version">, cambio: CambioPersonaDirectorio) =>
  pedir<{ version: number }>(`${dir}/${p.id}`, "PATCH", { version: p.version, ...cambio });
export const unirFichas = (origen: string, destino: string) => pedir<{ ok: true }>(`${dir}/${origen}/unir`, "POST", { con: destino });
