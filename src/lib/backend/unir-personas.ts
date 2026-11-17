import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ApiError, databaseError } from "./http";
import { parseRecord } from "./validation";

/**
 * PN-03 · «Unir con un duplicado». Todo pasa en una sola función de la base (`fortius_inmuebles_unir_personas`,
 * migración 20261116150000) con el cliente de la sesión: la base comprueba quién une, las versiones de las dos fichas
 * y pasa asuntos, pendientes, consultas, tareas, citas y trámites. Mientras la migración no esté aplicada responde 503.
 */
export const SIN_UNIR_PERSONAS = "Unir personas todavía no está en el servidor";

const entrada = z.object({
  queda: z.string().trim().min(1).max(160),
  seVa: z.string().trim().min(1).max(160),
  versionQueda: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  versionSeVa: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  datosQueda: z.record(z.string(), z.unknown()),
  motivo: z.string().trim().max(500).optional(),
}).strict().refine((v) => v.queda !== v.seVa, { message: "Elige dos personas distintas" });

export type ResultadoUnion = {
  queda: string; seVa: string; asuntos: number; papeles: number; pendientes: number;
  consultas: number; tareas: number; citas: number; tramites: number;
};

// Mensajes que la función lanza a propósito; se muestran tal cual.
const MENSAJES = new Set([
  "Por ahora solo el director une fichas de personas",
  "Alguien cambió una de las fichas; vuelve a abrirlas antes de unir",
  "Una de las fichas ya está unida a otra",
  "Una de las dos personas ya no existe",
  "Elige dos personas distintas",
  "Los datos que se conservan no corresponden a la ficha que se queda",
]);

const sinFuncion = (e: { code?: string; message?: string }) =>
  e.code === "PGRST202" || e.code === "42883" || e.code === "PGRST205" || e.code === "42P01"
  || /could not find the function|function .* does not exist|relation .* does not exist/i.test(e.message ?? "");

export async function unirPersonas(client: Pick<SupabaseClient, "rpc">, input: unknown): Promise<ResultadoUnion> {
  const d = entrada.parse(input);
  // La misma validación que al guardar una persona desde el panel; la base vuelve a validar.
  const datos = parseRecord("clientes", d.queda, d.datosQueda);
  const { data, error } = await client.rpc("fortius_inmuebles_unir_personas", {
    p_queda: d.queda, p_se_va: d.seVa, p_version_queda: d.versionQueda, p_version_se_va: d.versionSeVa,
    p_datos_queda: datos, p_motivo: d.motivo ?? "",
  });
  if (error) {
    if (sinFuncion(error)) throw new ApiError(503, SIN_UNIR_PERSONAS);
    if (/^PT(403|404|409|400)$/.test(error.code ?? "") && MENSAJES.has(error.message ?? "")) {
      throw new ApiError(error.code === "PT404" ? 409 : Number(error.code!.slice(2)), error.message!);
    }
    return databaseError(error);
  }
  return data as ResultadoUnion;
}
