import type { Catalogo, ClaveCatalogo, ValorCatalogo } from "@/lib/backend/catalogos-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/catalogos-contrato";

/** Los catálogos del panel (SPEC.md, sección 3). Solo el director los cambia; la base lo hace cumplir. */
const base = "/api/admin/catalogos";
export const leerCatalogos = () => pedir<{ catalogos: Catalogo[] }>(base).then((r) => r.catalogos);
export const agregarValor = (catalogo: ClaveCatalogo, etiqueta: string, extra?: { significado?: string | null; padre?: string | null }) =>
  pedir<{ valor: ValorCatalogo }>(base, "POST", { catalogo, etiqueta, ...extra }).then((r) => r.valor);
export type CambioValor = Partial<Pick<ValorCatalogo, "etiqueta" | "activo" | "significado" | "padre">>;
export const cambiarValor = (v: Pick<ValorCatalogo, "id" | "version">, cambio: CambioValor) =>
  pedir<{ valor: ValorCatalogo }>(base, "PATCH", { id: v.id, version: v.version, ...cambio }).then((r) => r.valor);
export const ordenarCatalogo = (catalogo: ClaveCatalogo, ids: string[]) => pedir<{ valor: null }>(base, "PATCH", { catalogo, orden: ids });
