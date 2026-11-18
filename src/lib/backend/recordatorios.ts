import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fallo } from "./fallo";
import { leerParaTi } from "./inicio";
import { loadPreferences } from "./preferences";

/**
 * Recordatorios (SPEC.md, sección 15): lo poco que el panel revisa cada pocos minutos para poner el número en «Inicio»
 * y avisar en el navegador. Solo lo de quien entró: sus tareas de hoy o vencidas, las solicitudes que le tocan,
 * lo nuevo de «Para ti» y cuántos documentos ya vencieron o están por vencer.
 */
export type TareaRecordatorio = { id: string; asunto_id: string | null; titulo: string; fecha: string; hora: string | null };
export type Recordatorios = {
  hoy: string;
  tareas: TareaRecordatorio[];
  solicitudes: { id: string; nombre: string; recibida_el: string }[];
  paraTi: { id: string; texto: string; cuando: string; clase: "mencion" | "asignada" }[];
  /** Lo de «Para ti» posterior a lo que ya viste. */
  paraTiNuevos: number;
  documentos: number;
};

const hoyTexto = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export async function leerRecordatorios(client: SupabaseClient, yo: string, director: boolean): Promise<Recordatorios> {
  const hoy = hoyTexto();
  const mas = (fecha: string, n: number) => { const d = new Date(`${fecha}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const en90 = mas(hoy, 90);
  let sol = client.from("fortius_inmuebles_solicitudes").select("id,nombre,recibida_el").eq("estado", "por_atender").order("recibida_el").limit(50);
  sol = director ? sol.or(`asignada_a.is.null,asignada_a.eq.${yo}`) : sol.eq("asignada_a", yo);
  const [ta, so, doc, paraTi, prefs] = await Promise.all([
    client.from("fortius_inmuebles_tareas").select("id,asunto_id,titulo,fecha,hora,asunto:fortius_inmuebles_asuntos(deleted_at,en_que_va)")
      .eq("responsable_id", yo).eq("estado", "pendiente").eq("quien", "fortius").is("deleted_at", null).lte("fecha", hoy)
      .order("fecha").limit(100),
    sol,
    // Solo los documentos de los asuntos que llevas, con el aviso de cada uno (15 días si no se dijo otro), como «Por vencer».
    client.from("fortius_inmuebles_asunto_documentos").select("id,vence_el,avisar_dias,asunto:fortius_inmuebles_asuntos!inner(responsable_id,deleted_at)")
      .eq("asunto.responsable_id", yo).is("asunto.deleted_at", null)
      .not("vence_el", "is", null).lte("vence_el", en90).neq("estado", "no_aplica").is("deleted_at", null).limit(500),
    leerParaTi(client, yo),
    loadPreferences(client, yo),
  ]);
  for (const r of [ta, so, doc]) if (r.error) fallo(r.error);
  type Fila = TareaRecordatorio & { asunto: { deleted_at: string | null; en_que_va: string } | null };
  const tareas = ((ta.data ?? []) as unknown as Fila[])
    .filter((t) => !t.asunto || (!t.asunto.deleted_at && t.asunto.en_que_va !== "cerrado"))
    .map((t) => ({ id: t.id, asunto_id: t.asunto_id, titulo: t.titulo, fecha: t.fecha, hora: t.hora?.slice(0, 5) ?? null }));
  const visto = prefs.data.panel?.paraTiVisto;
  const desde = visto ? Date.parse(visto) : 0;
  // Una tarea de hoy que te dejaron ya cuenta en «tareas»: no se cuenta dos veces.
  const yaContadas = new Set(tareas.map((t) => `t${t.id}`));
  const documentos = ((doc.data ?? []) as { vence_el: string; avisar_dias: number | null }[])
    .filter((d) => mas(d.vence_el, -(d.avisar_dias ?? 15)) <= hoy).length;
  return {
    hoy, tareas,
    solicitudes: (so.data ?? []) as Recordatorios["solicitudes"],
    paraTi: paraTi.slice(0, 20).map((x) => ({ id: x.id, texto: x.texto, cuando: x.cuando, clase: x.clase })),
    paraTiNuevos: paraTi.filter((x) => Date.parse(x.cuando) > desde && !yaContadas.has(x.id)).length,
    documentos,
  };
}
