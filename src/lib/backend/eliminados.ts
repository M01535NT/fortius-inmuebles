import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { eliminarAsunto } from "./asuntos";
import { cambiarGuia } from "./biblioteca";
import type { StaffUser } from "./contracts";
import { AVISO_ASUNTO_ELIMINADO, CLASES_ELIMINADO, type ClaseEliminado, type Eliminado, type ListaEliminados } from "./eliminados-contrato";
import { fallo } from "./fallo";
import { ApiError } from "./http";
import { eliminarInmueble } from "./inmuebles";

/**
 * Eliminados: lo que se mandó a Eliminados en el panel, por clase, y «Recuperar». Todo con la sesión de quien mira: la
 * base decide qué ve cada quien (RLS) y quién recupera (sus guardas: asuntos, personas e inmuebles solo el director).
 */

const T = {
  asuntos: "fortius_inmuebles_asuntos", personas: "fortius_inmuebles_personas", inmuebles: "fortius_inmuebles_inmuebles",
  biblioteca: "fortius_inmuebles_biblioteca", trabajos: "fortius_inmuebles_trabajos",
} as const;
const LIMITE = 200;
const NOMBRE_GUIA: Record<string, string> = { que_pedir: "Qué pedir", que_hacer: "Qué hacer", apartado_propio: "Apartado propio" };
const humanizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "");

export const recuperarSchema = z.object({
  clase: z.enum(CLASES_ELIMINADO), id: z.uuid(), version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
}).strict();

type Leido = { data: unknown; error: { code?: string; message?: string } | null };
/**
 * Una tabla que la base todavía no tiene no tumba la lista: sale vacía. Una columna que falta (42703) sí es un error:
 * esconderlo dejaría la lista vacía sin decir por qué.
 */
function filas<F>(r: Leido): F[] {
  if (r.error) {
    if (["42P01", "PGRST205"].includes(r.error.code ?? "")) return [];
    fallo(r.error);
  }
  return (Array.isArray(r.data) ? r.data : []) as F[];
}

export async function listarEliminados(client: SupabaseClient, user: StaffUser): Promise<ListaEliminados> {
  const director = user.role === "admin";
  // Se pide uno más que el tope para saber si hay más de los que se muestran.
  const borrados = (tabla: string, campos: string) =>
    client.from(tabla).select(campos).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(LIMITE + 1);
  const [as, pe, inm, gu, tr] = await Promise.all([
    borrados(T.asuntos, "id,folio,nombre,deleted_at,version"),
    borrados(T.personas, "id,nombre,deleted_at,version"),
    borrados(T.inmuebles, "id,folio,nombre,deleted_at,version"),
    borrados(T.biblioteca, "id,nombre,clase,creado_por,deleted_at,version"),
    borrados(T.trabajos, "id,clase,tipo,nombre,resultado,asunto_id,deleted_at,version,asunto:fortius_inmuebles_asuntos(folio,nombre,deleted_at)"),
  ]);
  type Base = { id: string; deleted_at: string; version: number };
  const hayMas: ClaseEliminado[] = [];
  const hasta = <F>(clase: ClaseEliminado, r: Leido): F[] => {
    const xs = filas<F>(r);
    if (xs.length > LIMITE) hayMas.push(clase);
    return xs.slice(0, LIMITE);
  };
  const lista: Eliminado[] = [
    ...hasta<Base & { folio: string; nombre: string }>("asunto", as).map((a): Eliminado => ({
      clase: "asunto", id: a.id, nombre: a.nombre, detalle: a.folio, eliminado_el: a.deleted_at, version: a.version, recuperable: director, aviso: null,
    })),
    ...hasta<Base & { nombre: string }>("persona", pe).map((p): Eliminado => ({
      clase: "persona", id: p.id, nombre: p.nombre, detalle: null, eliminado_el: p.deleted_at, version: p.version, recuperable: director, aviso: null,
    })),
    ...hasta<Base & { folio: string | null; nombre: string }>("inmueble", inm).map((i): Eliminado => ({
      clase: "inmueble", id: i.id, nombre: i.nombre, detalle: i.folio, eliminado_el: i.deleted_at, version: i.version, recuperable: director, aviso: null,
    })),
    ...hasta<Base & { nombre: string; clase: string; creado_por: string | null }>("guia", gu).map((g): Eliminado => ({
      clase: "guia", id: g.id, nombre: g.nombre, detalle: NOMBRE_GUIA[g.clase] ?? null, eliminado_el: g.deleted_at, version: g.version,
      recuperable: director || g.creado_por === user.id, aviso: null,
    })),
    ...hasta<Base & {
      clase: string; tipo: string; nombre: string | null; resultado: string | null; asunto_id: string | null;
      asunto: { folio: string; nombre: string; deleted_at: string | null } | null;
    }>("trabajo", tr).map((t): Eliminado => {
      // Si su asunto sigue en Eliminados (o quien mira ya no lo ve por eso), primero se recupera el asunto.
      const asuntoFuera = Boolean(t.asunto_id) && (!t.asunto || Boolean(t.asunto.deleted_at));
      return {
        clase: "trabajo", id: t.id,
        nombre: t.nombre?.trim() || t.resultado?.trim() || (t.clase === "formato" ? `Formato ${t.tipo}` : humanizar(t.tipo)),
        detalle: t.asunto ? `${t.asunto.folio} · ${t.asunto.nombre}` : t.asunto_id ? "De un asunto que está en Eliminados" : "Suelto, sin asunto",
        eliminado_el: t.deleted_at, version: t.version, recuperable: !asuntoFuera, aviso: asuntoFuera ? AVISO_ASUNTO_ELIMINADO : null,
      };
    }),
  ];
  return { eliminados: lista.sort((a, b) => b.eliminado_el.localeCompare(a.eliminado_el)), hayMas };
}

/** Lo regresa a su lugar tal como estaba. Con la versión que vio quien recupera: si alguien lo cambió antes, 409. */
export async function recuperar(client: SupabaseClient, user: StaffUser, e: z.infer<typeof recuperarSchema>): Promise<void> {
  const soloDirector = () => { if (user.role !== "admin") throw new ApiError(403, "Solo el director recupera asuntos, personas e inmuebles."); };
  const clase: ClaseEliminado = e.clase;
  switch (clase) {
    case "asunto": soloDirector(); return eliminarAsunto(client, e.id, e.version, true);
    case "inmueble": soloDirector(); return eliminarInmueble(client, e.id, e.version, true);
    case "guia": { await cambiarGuia(client, user, e.id, { version: e.version, restaurar: true }); return; }
    case "persona": {
      soloDirector();
      const r = await client.from(T.personas).update({ deleted_at: null, version: e.version })
        .eq("id", e.id).eq("version", e.version).not("deleted_at", "is", null).select("id").maybeSingle();
      if (r.error) fallo(r.error);
      if (!r.data) throw new ApiError(409, "Alguien más cambió a esta persona. Vuelve a cargar y repite el cambio.");
      return;
    }
    case "trabajo": {
      const actual = await client.from(T.trabajos).select("asunto_id,asunto:fortius_inmuebles_asuntos(deleted_at)").eq("id", e.id).maybeSingle();
      if (actual.error) fallo(actual.error);
      const t = actual.data as { asunto_id: string | null; asunto: { deleted_at: string | null } | null } | null;
      if (t?.asunto_id && (!t.asunto || t.asunto.deleted_at)) throw new ApiError(409, AVISO_ASUNTO_ELIMINADO);
      const r = await client.from(T.trabajos).update({ deleted_at: null, deleted_by: null })
        .eq("id", e.id).eq("version", e.version).not("deleted_at", "is", null).select("id").maybeSingle();
      if (r.error) fallo(r.error);
      if (!r.data) throw new ApiError(409, "Alguien más cambió este documento. Vuelve a cargar y repite el cambio.");
      return;
    }
  }
}
