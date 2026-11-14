import { AdminApiError } from "@/lib/admin/store";

/*
  Acciones masivas (RP-12, UX-03): un mismo cambio sobre varios registros, uno por uno, con el
  resultado de cada uno. Un registro que ya tenía el valor cuenta como «sin cambio», no se vuelve a
  guardar. Reintentar recibe solo los que fallaron, así que nunca repite los ya aplicados.
*/
export type BulkTarget = { id: string; label: string };
export type BulkStatus = "aplicado" | "sin-cambio" | "fallo";
export type BulkResult = BulkTarget & { status: BulkStatus; reason?: string };

/** Por qué no se aplicó, dicho para el asesor. */
export function bulkReason(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.status === 409) return "Alguien la cambió mientras tanto. Ya se cargó su versión nueva; revísala y vuelve a aplicar.";
    if (error.status === 403) return "No tienes permiso para cambiarla.";
    if (error.status === 404) return "Ya no existe; puede que la hayan eliminado.";
    if (error.status === 401) return "Tu sesión venció. Entra de nuevo y vuelve a aplicar.";
  }
  return error instanceof Error && error.message ? error.message : "No se pudo guardar. Vuelve a intentarlo.";
}

/** Aplica `apply` a cada registro, en orden; un fallo no detiene a los demás. */
export async function runBulk(targets: BulkTarget[], apply: (id: string) => Promise<"aplicado" | "sin-cambio">, onProgress?: (done: number) => void): Promise<BulkResult[]> {
  const results: BulkResult[] = [];
  for (const target of targets) {
    try { results.push({ ...target, status: await apply(target.id) }); }
    catch (error) { results.push({ ...target, status: "fallo", reason: bulkReason(error) }); }
    onProgress?.(results.length);
  }
  return results;
}

/** Junta el resultado de un reintento con el anterior: los reintentados reemplazan su fila. */
export function mergeRetry(before: BulkResult[], retried: BulkResult[]): BulkResult[] {
  const byId = new Map(retried.map(r => [r.id, r]));
  return before.map(r => byId.get(r.id) ?? r);
}

export const failedOf = (results: BulkResult[]) => results.filter(r => r.status === "fallo");

/** «Se reasignaron 2 de 3», con los que ya estaban así aparte. */
export function bulkSummary(results: BulkResult[], verb: string): string {
  const applied = results.filter(r => r.status === "aplicado").length, same = results.filter(r => r.status === "sin-cambio").length;
  const total = results.length, failed = total - applied - same;
  if (!failed) return applied ? `${verb} ${applied} de ${total}${same ? `; ${same} ya ${same === 1 ? "estaba" : "estaban"} así` : ""}.` : `${same === 1 ? "Ya estaba así" : "Ya estaban así"}; no hubo nada que cambiar.`;
  return `${verb} ${applied} de ${total}${same ? `; ${same} ya ${same === 1 ? "estaba" : "estaban"} así` : ""}. ${failed === 1 ? "Una no se aplicó" : `${failed} no se aplicaron`}.`;
}

/** Archivo CSV (con BOM para que Excel lea los acentos). Los valores se escapan y se neutralizan fórmulas. */
export function toCsv(header: string[], rows: string[][]): string {
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [header, ...rows].map(row => row.map(cell).join(",")).join("\r\n");
}
