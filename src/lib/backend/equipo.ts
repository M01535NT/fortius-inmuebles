import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fallo } from "./fallo";
import { leerEquipo } from "./asuntos-equipo";
import type { StaffUser } from "./contracts";
import type { ResumenEquipo, ResumenMiembro } from "./equipo-contrato";
import { ApiError } from "./http";
import { porCobrar } from "./inicio";

/**
 * Equipo (etapa 9 de PLAN.md; SPEC.md, sección 12): por cada persona, sus asuntos abiertos, lo vencido, lo de hoy,
 * lo de la semana, los asuntos sin siguiente paso, las solicitudes sin atender y lo que falta cobrar. Solo el director.
 * Se lee con su sesión: la base le deja ver todo, y a nadie más le responde.
 */
const hoyTexto = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const masDias = (base: string, n: number) => { const d = new Date(`${base}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function leerResumenEquipo(client: SupabaseClient, user: StaffUser): Promise<ResumenEquipo> {
  if (user.role !== "admin") throw new ApiError(403, "Solo el director ve el Equipo.");
  const hoy = hoyTexto(), semana = masDias(hoy, 7);
  const [equipo, as, ta, so] = await Promise.all([
    leerEquipo(client, user),
    client.from("fortius_inmuebles_asuntos").select("id,responsable_id,en_espera").is("deleted_at", null).neq("en_que_va", "cerrado").limit(5000),
    client.from("fortius_inmuebles_tareas").select("asunto_id,responsable_id,quien,fecha").eq("estado", "pendiente").is("deleted_at", null).not("asunto_id", "is", null).limit(20000),
    client.from("fortius_inmuebles_solicitudes").select("asignada_a").eq("estado", "por_atender").limit(5000),
  ]);
  for (const r of [as, ta, so]) if (r.error) fallo(r.error);
  const asuntos = (as.data ?? []) as { id: string; responsable_id: string; en_espera: boolean }[];
  const abiertos = new Set(asuntos.map((a) => a.id));
  const tareas = ((ta.data ?? []) as { asunto_id: string; responsable_id: string; quien: string; fecha: string | null }[]).filter((t) => abiertos.has(t.asunto_id));
  const conPaso = new Set(tareas.map((t) => t.asunto_id));
  const solicitudes = (so.data ?? []) as { asignada_a: string | null }[];
  const lleva = new Map(asuntos.map((a) => [a.id, a.responsable_id]));
  const cobrar = await porCobrar(client);

  const miembros = equipo.map((m): ResumenMiembro => {
    const suyas = tareas.filter((t) => t.responsable_id === m.id && t.quien === "fortius" && t.fecha);
    const suyos = asuntos.filter((a) => a.responsable_id === m.id);
    const dinero: ResumenMiembro["cobrar"] = {};
    for (const c of cobrar.filter((x) => lleva.get(x.asunto_id) === m.id)) {
      for (const [mon, n] of Object.entries(c.falta) as [keyof typeof dinero, number][]) dinero[mon] = (dinero[mon] ?? 0) + n;
    }
    return {
      id: m.id, nombre: m.nombre, director: m.director, asuntos: suyos.length,
      vencidas: suyas.filter((t) => t.fecha! < hoy).length, hoy: suyas.filter((t) => t.fecha === hoy).length,
      semana: suyas.filter((t) => t.fecha! > hoy && t.fecha! <= semana).length,
      sin_paso: suyos.filter((a) => !a.en_espera && !conPaso.has(a.id)).length,
      solicitudes: solicitudes.filter((s) => s.asignada_a === m.id).length, cobrar: dinero,
    };
  });
  return { hoy, miembros, sin_asignar: solicitudes.filter((s) => !s.asignada_a).length };
}
