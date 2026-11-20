import type { Eliminado, ListaEliminados } from "@/lib/backend/eliminados-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/eliminados-contrato";

/** Eliminados del panel: lo que se mandó a Eliminados (y qué clases tienen más de las que se muestran) y «Recuperar». */
const base = "/api/admin/eliminados";
export const leerEliminados = () => pedir<Partial<ListaEliminados>>(base)
  .then((r): ListaEliminados => ({ eliminados: r.eliminados ?? [], hayMas: r.hayMas ?? [] }));
export const recuperarEliminado = (e: Pick<Eliminado, "clase" | "id" | "version">) =>
  pedir<{ ok: true }>(base, "PATCH", { clase: e.clase, id: e.id, version: e.version });
