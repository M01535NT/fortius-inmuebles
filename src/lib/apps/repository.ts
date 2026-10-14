import "server-only";
import { isDeepStrictEqual } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ApiError, databaseError } from "@/lib/backend/http";
import { appRunSchema } from "./contracts";
import type { AppRun } from "./types";
import { FINANCIAL_APPS, COMMERCIAL_APPS } from "./catalog";
import { calculateFinancial } from "./financial";
import { calculateCommercial } from "./commercial";
export const RUNS = "fortius_inmuebles_app_runs";
export function mapRun(row: Record<string, unknown>): AppRun {
  return { id: String(row.id), slug: String(row.slug), title: String(row.title), input: row.input as AppRun["input"], result: row.result as AppRun["result"], context: row.context as AppRun["context"], version: Number(row.version), updatedAt: String(row.updated_at) };
}
export async function findRun(client: SupabaseClient, id: string) {
  z.uuid().parse(id);
  const { data, error } = await client.from(RUNS).select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) databaseError(error);
  if (!data) throw new ApiError(404, "Trabajo no disponible");
  return mapRun(data);
}
export async function saveRun(client: SupabaseClient, userId: string, body: unknown) {
  const input = appRunSchema.parse(body);
  if (input.result) {
    try {
      if (FINANCIAL_APPS.has(input.slug)) input.result = calculateFinancial(input.slug, input.input);
      if (COMMERCIAL_APPS.has(input.slug)) input.result = calculateCommercial(input.slug, input.input);
    } catch (error) { throw new ApiError(400, error instanceof Error ? error.message : "Revisa la captura"); }
  }
  if (input.slug === "ficha-comercial" && input.context.inmuebleId && input.input.propertySlug && input.context.inmuebleId !== input.input.propertySlug) throw new ApiError(400, "La ficha debe corresponder al inmueble del expediente");
  const value = { title: input.title, input: input.input, result: input.result };
  const sameValue = (run: AppRun) => run.slug === input.slug && run.title === input.title && isDeepStrictEqual(run.input, input.input) && isDeepStrictEqual(run.result, input.result) && isDeepStrictEqual(run.context, input.context);
  if (input.id && input.version) {
    const existing = await findRun(client, input.id);
    if (existing.slug !== input.slug || JSON.stringify(existing.context) !== JSON.stringify(input.context)) {
      // Compare objects by keys: JSONB does not retain insertion order.
      if (existing.slug !== input.slug || ["expedienteId", "inmuebleId", "clienteId"].some(k => existing.context[k as keyof typeof existing.context] !== input.context[k as keyof typeof input.context])) throw new ApiError(400, "Crea una copia para cambiar el contexto");
    }
    const { data, error } = await client.from(RUNS).update({ ...value, version: input.version + 1 }).eq("id", input.id).eq("version", input.version).is("deleted_at", null).select("*").maybeSingle();
    if (error) databaseError(error);
    if (!data) {
      const current = await findRun(client, input.id);
      if (current.version === input.version + 1 && sameValue(current)) return current;
      throw new ApiError(409, "El trabajo cambió. Conserva tu captura y vuelve a cargar.");
    }
    return mapRun(data);
  }
  const { data, error } = await client.from(RUNS).insert({ ...value, ...(input.id ? { id: input.id } : {}), slug: input.slug, context: input.context, expediente_id: input.context.expedienteId ?? null, owner_id: userId }).select("*").single();
  if (error?.code === "23505" && input.id) {
    const existing = await findRun(client, input.id);
    if (existing.version === 1 && sameValue(existing)) return existing;
    throw new ApiError(409, "El intento anterior guardó datos distintos. Abre el trabajo antes de continuar.");
  }
  if (error) databaseError(error);
  return mapRun(data);
}
