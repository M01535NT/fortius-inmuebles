import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fallo } from "./fallo";

/**
 * Lo que el buscador del panel (Ctrl K) necesita para encontrar y actuar: asuntos, personas e inmuebles que ve quien
 * entró (la base decide qué ve). Solo nombres, folios y lo que sirve para buscar; nada de datos de identificación.
 */
export type AsuntoBuscado = { id: string; folio: string; nombre: string; cerrado: boolean; updated_at: string };
export type PersonaBuscada = { id: string; nombre: string; telefono: string | null; correo: string | null; asuntos: string[] };
export type InmuebleBuscado = { id: string; folio: string; nombre: string; colonia: string | null };
export type IndiceBuscar = { asuntos: AsuntoBuscado[]; personas: PersonaBuscada[]; inmuebles: InmuebleBuscado[] };

type Tel = { pais?: string; numero?: string };

export async function leerIndiceBuscar(client: SupabaseClient): Promise<IndiceBuscar> {
  const [as, pe, pa, inm] = await Promise.all([
    client.from("fortius_inmuebles_asuntos").select("id,folio,nombre,en_que_va,updated_at").is("deleted_at", null).order("updated_at", { ascending: false }).limit(2000),
    client.from("fortius_inmuebles_personas").select("id,nombre,telefonos,correo").is("deleted_at", null).order("nombre").limit(4000),
    client.from("fortius_inmuebles_asunto_personas").select("asunto_id,persona_id").is("retirado_el", null).limit(8000),
    client.from("fortius_inmuebles_inmuebles").select("id,folio,nombre,colonia").is("deleted_at", null).order("created_at", { ascending: false }).limit(2000),
  ]);
  for (const r of [as, pe, pa, inm]) if (r.error) fallo(r.error);
  const asuntos = ((as.data ?? []) as { id: string; folio: string; nombre: string; en_que_va: string; updated_at: string }[])
    .map((a) => ({ id: a.id, folio: a.folio, nombre: a.nombre, cerrado: a.en_que_va === "cerrado", updated_at: a.updated_at }));
  const vivos = new Set(asuntos.map((a) => a.id));
  const de = new Map<string, string[]>();
  for (const p of (pa.data ?? []) as { asunto_id: string; persona_id: string }[]) {
    if (vivos.has(p.asunto_id)) de.set(p.persona_id, [...new Set([...(de.get(p.persona_id) ?? []), p.asunto_id])]);
  }
  const personas = ((pe.data ?? []) as { id: string; nombre: string; telefonos: unknown; correo: string | null }[]).map((p) => {
    const t = Array.isArray(p.telefonos) ? (p.telefonos[0] as Tel | undefined) : undefined;
    return { id: p.id, nombre: p.nombre, telefono: t?.numero ? `${t.pais ?? ""} ${t.numero}`.trim() : null, correo: p.correo, asuntos: de.get(p.id) ?? [] };
  });
  return { asuntos, personas, inmuebles: (inm.data ?? []) as InmuebleBuscado[] };
}
