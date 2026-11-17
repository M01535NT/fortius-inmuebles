import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Encargo, EnQueVa } from "./asuntos-contrato";
import { fallo } from "./asuntos";
import type { StaffUser } from "./contracts";
import type { AsuntoDePersona, PersonaDirectorio } from "./directorio-contrato";
import { ApiError } from "./http";

/**
 * Directorio (etapa 7 de PLAN.md; SPEC.md, sección 6). Cada persona aparece una vez con todos los asuntos donde
 * tiene un papel; quien no tiene asunto es un contacto (con su «volver a llamar»). La base decide a quién ve cada uno
 * (RLS): el director, a todos; el asesor, a los suyos y a los de sus asuntos. Unir dos fichas es solo del director.
 */

const T = { personas: "fortius_inmuebles_personas", papeles: "fortius_inmuebles_asunto_personas" } as const;
const COLUMNAS = "id,clase,nombre,fallecida,telefonos,correo,no_contactar,volver_a_llamar,nota,es_ejemplo,version";

export const cambioPersonaSchema = z.object({
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
  volver_a_llamar: z.iso.date().nullable().optional(),
  no_contactar: z.boolean().optional(),
  nota: z.string().trim().max(2000).optional(),
}).strict();
export const unirSchema = z.object({ con: z.uuid() }).strict();

type FilaPapel = {
  persona_id: string; papel: string;
  asunto: { id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa | null; deleted_at: string | null } | null;
};

export async function listarDirectorio(client: SupabaseClient): Promise<PersonaDirectorio[]> {
  const [p, a] = await Promise.all([
    client.from(T.personas).select(COLUMNAS).is("deleted_at", null).order("nombre").limit(5000),
    client.from(T.papeles).select("persona_id,papel,asunto:fortius_inmuebles_asuntos(id,folio,nombre,encargos,en_que_va,deleted_at)").is("retirado_el", null).limit(20000),
  ]);
  if (p.error) fallo(p.error);
  if (a.error) fallo(a.error);
  const porPersona = new Map<string, AsuntoDePersona[]>();
  for (const x of (a.data ?? []) as unknown as FilaPapel[]) {
    if (!x.asunto || x.asunto.deleted_at) continue;
    const lista = porPersona.get(x.persona_id) ?? [];
    const ya = lista.find((y) => y.id === x.asunto!.id);
    if (ya) { if (!ya.papeles.includes(x.papel)) ya.papeles.push(x.papel); }
    else lista.push({
      id: x.asunto.id, folio: x.asunto.folio, nombre: x.asunto.nombre, encargos: x.asunto.encargos ?? [],
      en_que_va: x.asunto.en_que_va, cerrado: x.asunto.en_que_va === "cerrado", papeles: [x.papel],
    });
    porPersona.set(x.persona_id, lista);
  }
  return ((p.data ?? []) as Omit<PersonaDirectorio, "asuntos">[]).map((x) => ({
    ...x, telefonos: Array.isArray(x.telefonos) ? x.telefonos : [], nota: x.nota ?? "",
    // Primero lo abierto; lo cerrado al final.
    asuntos: (porPersona.get(x.id) ?? []).sort((m, n) => Number(m.cerrado) - Number(n.cerrado)),
  }));
}

export async function cambiarPersona(client: SupabaseClient, id: string, e: z.infer<typeof cambioPersonaSchema>): Promise<{ version: number }> {
  const { version, ...cambios } = e;
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const { data, error } = await client.from(T.personas).update(cambios).eq("id", id).eq("version", version).is("deleted_at", null).select("version").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió esta ficha. Vuelve a cargar y repite el cambio.");
  return data as { version: number };
}

/** La ficha `origen` se une a `destino`: todo pasa a la que se queda y la otra va a Eliminados. */
export async function unirPersonas(client: SupabaseClient, user: StaffUser, origen: string, destino: string): Promise<void> {
  if (user.role !== "admin") throw new ApiError(403, "Solo el director une fichas.");
  const { error } = await client.rpc("fortius_inmuebles_unir_personas", { p_origen: origen, p_destino: destino });
  if (error) fallo(error);
}
