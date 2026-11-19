import type { Eliminado } from "@/lib/backend/eliminados-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/eliminados-contrato";

/** Eliminados del panel: lo que se mandó a Eliminados y «Recuperar». */
const base = "/api/admin/eliminados";
export const leerEliminados = () => pedir<{ eliminados: Eliminado[] }>(base).then((r) => r.eliminados);
export const recuperarEliminado = (e: Pick<Eliminado, "clase" | "id" | "version">) =>
  pedir<{ ok: true }>(base, "PATCH", { clase: e.clase, id: e.id, version: e.version });
