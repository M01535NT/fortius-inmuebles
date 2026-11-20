import type { Guia, ResultadoCopia } from "@/lib/backend/biblioteca-contrato";
import type {
  CambioPersonaDirectorio, ContactoPersona, LeadADirectorio, NuevoContacto, PersonaDirectorio, VistaDirectorio,
} from "@/lib/backend/directorio-contrato";

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
/** «Qué ver»: activas (por omisión), archivadas, sin seguimiento o todas; y, si se da, solo las que lleva ese asesor. */
export const leerDirectorio = (filtro: { ver?: VistaDirectorio; asesor?: string } = {}) => {
  const q = new URLSearchParams();
  if (filtro.ver) q.set("ver", filtro.ver);
  if (filtro.asesor) q.set("asesor", filtro.asesor);
  const s = q.toString();
  return pedir<{ personas: PersonaDirectorio[] }>(s ? `${dir}?${s}` : dir).then((r) => r.personas);
};
export const cambiarPersonaDirectorio = (p: Pick<PersonaDirectorio, "id" | "version">, cambio: CambioPersonaDirectorio) =>
  pedir<{ version: number }>(`${dir}/${p.id}`, "PATCH", { version: p.version, ...cambio });
/** Archivar no es mandar a Eliminados: la persona sale de la lista diaria y se recupera igual. */
export const archivarPersona = (p: Pick<PersonaDirectorio, "id" | "version">, archivada: boolean) => cambiarPersonaDirectorio(p, { archivada });
/** Anota una llamada o un mensaje con «¿cómo te fue?»; devuelve el contacto y la versión nueva de la persona. */
export const anotarContactoPersona = (personaId: string, contacto: NuevoContacto) =>
  pedir<{ contacto: ContactoPersona; version: number }>(`/api/admin/personas/${personaId}/contactos`, "POST", contacto);
/** «Crear persona» desde una consulta del sitio: la liga o la crea en el Directorio (no en «clientes»). */
export const leadADirectorio = (leadId: string, version: number) =>
  pedir<LeadADirectorio>(`/api/admin/leads/${encodeURIComponent(leadId)}/a-directorio`, "POST", { version });
export const unirFichas = (origen: string, destino: string) => pedir<{ ok: true }>(`${dir}/${origen}/unir`, "POST", { con: destino });
