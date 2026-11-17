import type { Inicio } from "@/lib/backend/inicio-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/inicio-contrato";

const base = "/api/admin/inicio";
export const leerInicio = () => pedir<{ inicio: Inicio }>(base).then((r) => r.inicio);
const solicitud = (id: string, version: number, cuerpo: Record<string, unknown>) =>
  pedir<{ consulta_id?: string }>(`${base}/solicitudes/${id}`, "PATCH", { version, ...cuerpo });
export const atenderSolicitud = (s: { id: string; version: number }) => solicitud(s.id, s.version, { accion: "atender" });
export const solicitudNoProcede = (s: { id: string; version: number }) => solicitud(s.id, s.version, { accion: "no_procede" });
export const pasarSolicitud = (s: { id: string; version: number }, a: string) => solicitud(s.id, s.version, { accion: "pasar", a });
