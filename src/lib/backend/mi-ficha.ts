import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { StaffUser } from "./contracts";
import { ApiError, databaseError } from "./http";

/**
 * La ficha del equipo de quien entró, para «Tu perfil» del panel. A diferencia de la ruta que usa el panel provisional
 * (que solo responde para asesores), aquí también responde para el director: así su cuenta y su ficha del equipo son
 * la misma persona, con un nombre que se puede cambiar. El panel provisional no cambia: sigue tratando al director
 * como director, con o sin ficha.
 */

const CUENTAS = "fortius_inmuebles_adviser_accounts";
const FICHAS = "fortius_inmuebles_records";

export const miFichaSchema = z.object({ asesorId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/) }).strict();

type Ficha = { id: string; data: { nombre?: unknown; activo?: unknown } | null };

export async function leerMiFicha(client: SupabaseClient, user: StaffUser): Promise<{ asesorId: string | null; libres: { id: string; nombre: string }[] }> {
  const propia = await client.from(CUENTAS).select("asesor_id").eq("user_id", user.id).maybeSingle();
  if (propia.error) databaseError(propia.error);
  const asesorId = (propia.data as { asesor_id: string } | null)?.asesor_id ?? null;
  if (asesorId || user.role !== "admin") return { asesorId, libres: [] };
  // El director sin ficha: las fichas activas que ninguna cuenta usa, para elegir la suya.
  const [cuentas, fichas] = await Promise.all([
    client.from(CUENTAS).select("asesor_id"),
    client.from(FICHAS).select("id,data").eq("collection", "asesores"),
  ]);
  if (cuentas.error) databaseError(cuentas.error);
  if (fichas.error) databaseError(fichas.error);
  const usadas = new Set(((cuentas.data ?? []) as { asesor_id: string }[]).map((c) => c.asesor_id));
  const libres = ((fichas.data ?? []) as Ficha[])
    .filter((f) => f.data?.activo === true && !usadas.has(f.id))
    .map((f) => ({ id: f.id, nombre: typeof f.data?.nombre === "string" && f.data.nombre.trim() ? f.data.nombre.trim() : "Sin nombre" }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX"));
  return { asesorId: null, libres };
}

/** El director dice cuál ficha del equipo es la suya. Solo una ficha activa que ninguna otra cuenta use. */
export async function elegirMiFicha(client: SupabaseClient, user: StaffUser, asesorId: string): Promise<{ asesorId: string }> {
  if (user.role !== "admin") throw new ApiError(403, "La ficha de un asesor la liga el director desde Equipo.");
  const [ficha, otra] = await Promise.all([
    client.from(FICHAS).select("id,data").eq("collection", "asesores").eq("id", asesorId).maybeSingle(),
    client.from(CUENTAS).select("user_id").eq("asesor_id", asesorId).neq("user_id", user.id).limit(1),
  ]);
  if (ficha.error) databaseError(ficha.error);
  if (otra.error) databaseError(otra.error);
  if ((ficha.data as Ficha | null)?.data?.activo !== true) throw new ApiError(400, "Elige una ficha activa del equipo.");
  if (otra.data?.length) throw new ApiError(409, "Esa ficha ya es de otra cuenta. Elige la tuya.");
  const r = await client.from(CUENTAS).upsert({ user_id: user.id, asesor_id: asesorId }, { onConflict: "user_id" }).select("asesor_id").single();
  if (r.error) databaseError(r.error);
  return { asesorId: (r.data as { asesor_id: string }).asesor_id };
}
