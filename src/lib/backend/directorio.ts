import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Encargo, EnQueVa } from "./asuntos-contrato";
import { fallo } from "./fallo";
import type { StaffUser } from "./contracts";
import {
  AVISOS_PRIVACIDAD, MEDIOS_CONTACTO, MONEDAS, RESULTADOS_CONTACTO, VISTAS_DIRECTORIO,
  type AsuntoDePersona, type AvisoPrivacidad, type ContactoPersona, type Interes, type Moneda, type PersonaDirectorio, type VistaDirectorio,
} from "./directorio-contrato";
import { ApiError } from "./http";

/**
 * Directorio (SPEC.md, sección 6): la única pantalla de gente del panel. Cada persona aparece una vez con todos los
 * asuntos donde tiene un papel; quien no tiene asunto es un contacto (con su «volver a llamar» y «lo que sigue»).
 * La base decide a quién ve cada uno (RLS): el director, a todos; el asesor, a los suyos y a los de sus asuntos.
 * Archivar saca a la persona de la lista diaria sin mandarla a Eliminados. Unir dos fichas es solo del director.
 */

const T = {
  personas: "fortius_inmuebles_personas", papeles: "fortius_inmuebles_asunto_personas", contactos: "fortius_inmuebles_persona_contactos",
  uniones: "fortius_inmuebles_persona_uniones",
} as const;
export const COLUMNAS_PERSONA = [
  "id", "clase", "nombre", "fallecida", "telefonos", "correo", "no_contactar", "volver_a_llamar", "nota", "es_ejemplo", "version",
  "lo_que_sigue", "archivada_el", "responsable_id", "canal", "aviso_privacidad", "que_busca", "que_ofrece", "presupuesto",
  "presupuesto_moneda", "zona",
].join(",");
/**
 * Las de antes del Directorio (20261119100000_panel_17_directorio.sql). Al integrar en `main`, el sitio y la base se
 * publican por separado: unos minutos el código puede llegar antes que las columnas nuevas. Mientras, se lee con estas y
 * lo nuevo sale vacío. Solo para leer; guardar algo nuevo falla claro hasta que la base lo tenga.
 */
export const COLUMNAS_PERSONA_ANTES = [
  "id", "clase", "nombre", "fallecida", "telefonos", "correo", "no_contactar", "volver_a_llamar", "nota", "es_ejemplo", "version",
  "responsable_id", "canal",
].join(",");
type ErrorDeBase = { code?: string } | null;
/** La base todavía no tiene una columna nueva. */
export const faltaColumna = (e: ErrorDeBase) => e?.code === "42703";
/** La base todavía no tiene una tabla nueva. */
export const faltaTabla = (e: ErrorDeBase) => e?.code === "42P01" || e?.code === "PGRST205";

const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
export const loQueSigue = z.string().trim().max(300, "Lo que sigue es muy largo: déjalo en una línea.");

export const cambioPersonaSchema = z.object({
  version,
  volver_a_llamar: z.iso.date().nullable().optional(),
  no_contactar: z.boolean().optional(),
  nota: z.string().trim().max(2000).optional(),
  lo_que_sigue: loQueSigue.optional(),
  archivada: z.boolean().optional(),
}).strict();
export const unirSchema = z.object({ con: z.uuid() }).strict();
export const filtroSchema = z.object({
  ver: z.enum(VISTAS_DIRECTORIO).default("activas"),
  asesor: z.uuid().optional(),
}).strict();

/** Qué busca y qué ofrece, por partes: solo cambia lo que venga. */
export const interesSchema = z.object({
  que_busca: z.string().trim().max(500).optional(),
  que_ofrece: z.string().trim().max(500).optional(),
  presupuesto: z.number().nonnegative().max(1e12).nullable().optional(),
  moneda: z.enum(MONEDAS).optional(),
  zona: z.string().trim().max(160).optional(),
}).strict();
export const avisoSchema = z.enum(AVISOS_PRIVACIDAD);
export const canalSchema = z.string().trim().max(60).transform((v) => v || null).nullable();

export const nuevoContactoSchema = z.object({
  version,
  medio: z.enum(MEDIOS_CONTACTO),
  resultado: z.enum(RESULTADOS_CONTACTO),
  nota: z.string().trim().max(1000).optional(),
  cuando: z.iso.datetime({ offset: true }).optional(),
  volver_a_llamar: z.iso.date().nullable().optional(),
  lo_que_sigue: loQueSigue.optional(),
}).strict();

/** Fila de la base con las columnas de COLUMNAS_PERSONA. */
export type FilaPersona = {
  id: string; clase: PersonaDirectorio["clase"]; nombre: string; fallecida: boolean; telefonos: unknown; correo: string | null;
  no_contactar: boolean; volver_a_llamar: string | null; nota: string | null; es_ejemplo: boolean; version: number;
  lo_que_sigue: string | null; archivada_el: string | null; responsable_id: string; canal: string | null;
  aviso_privacidad: AvisoPrivacidad | null; que_busca: string | null; que_ofrece: string | null;
  presupuesto: number | string | null; presupuesto_moneda: Moneda | null; zona: string | null;
};

/** Hoy en Tijuana, AAAA-MM-DD (la fecha que usa la base para «volver a llamar»). */
export const hoyTijuana = (ahora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);

export function interesDe(f: Pick<FilaPersona, "que_busca" | "que_ofrece" | "presupuesto" | "presupuesto_moneda" | "zona">): Interes {
  const n = f.presupuesto === null || f.presupuesto === "" ? null : Number(f.presupuesto);
  return {
    que_busca: f.que_busca ?? "", que_ofrece: f.que_ofrece ?? "",
    presupuesto: n !== null && Number.isFinite(n) ? n : null, moneda: f.presupuesto_moneda ?? "MXN", zona: f.zona ?? "",
  };
}

/** Las columnas que cambia un `interes` parcial. */
export function columnasDeInteres(i: z.infer<typeof interesSchema>): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  if (i.que_busca !== undefined) c.que_busca = i.que_busca;
  if (i.que_ofrece !== undefined) c.que_ofrece = i.que_ofrece;
  if (i.presupuesto !== undefined) c.presupuesto = i.presupuesto;
  if (i.moneda !== undefined) c.presupuesto_moneda = i.moneda;
  if (i.zona !== undefined) c.zona = i.zona;
  return c;
}

/** Archivar o recuperar: la fecha la pone el servidor; quién archivó, la base. */
export const columnaArchivada = (archivada: boolean, ahora = new Date()) => ({ archivada_el: archivada ? ahora.toISOString() : null });

/** Activa, sin asunto abierto, sin «lo que sigue» y sin fecha de volver a llamar (o ya pasó). */
export function sinSeguimiento(p: Pick<PersonaDirectorio, "archivada_el" | "asuntos" | "lo_que_sigue" | "volver_a_llamar">, hoy: string): boolean {
  if (p.archivada_el) return false;
  if (p.asuntos.some((a) => !a.cerrado)) return false;
  if (p.lo_que_sigue.trim()) return false;
  return !p.volver_a_llamar || p.volver_a_llamar < hoy;
}

export function filtrarDirectorio(personas: PersonaDirectorio[], f: { ver: VistaDirectorio; asesor?: string }): PersonaDirectorio[] {
  return personas.filter((p) => {
    if (f.asesor && p.responsable_id !== f.asesor) return false;
    switch (f.ver) {
      case "activas": return !p.archivada_el;
      case "archivadas": return Boolean(p.archivada_el);
      case "sin_seguimiento": return p.sin_seguimiento;
      case "todas": return true;
    }
  });
}

type FilaPapel = {
  persona_id: string; papel: string;
  asunto: { id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa | null; deleted_at: string | null } | null;
};
type FilaContacto = { persona_id: string; cuando: string; medio: ContactoPersona["medio"]; resultado: ContactoPersona["resultado"] };

export async function listarDirectorio(
  client: SupabaseClient, filtro: z.infer<typeof filtroSchema> = { ver: "activas" }, ahora = new Date(),
): Promise<PersonaDirectorio[]> {
  const pedirPersonas = (columnas: string) => client.from(T.personas).select(columnas).is("deleted_at", null).order("nombre").limit(5000);
  const [pAhora, a, cAhora, u] = await Promise.all([
    pedirPersonas(COLUMNAS_PERSONA),
    client.from(T.papeles).select("persona_id,papel,asunto:fortius_inmuebles_asuntos(id,folio,nombre,encargos,en_que_va,deleted_at)").is("retirado_el", null).limit(20000),
    client.from(T.contactos).select("persona_id,cuando,medio,resultado").order("cuando", { ascending: false }).limit(20000),
    client.from(T.uniones).select("origen_id,destino_id").limit(20000),
  ]);
  // Mientras la base no tenga lo del Directorio: las columnas de antes y ningún contacto anotado.
  const p = faltaColumna(pAhora.error) ? await pedirPersonas(COLUMNAS_PERSONA_ANTES) : pAhora;
  const c = faltaTabla(cAhora.error) ? { data: [] as FilaContacto[], error: null } : cAhora;
  for (const r of [p, a, c, u]) if (r.error) fallo(r.error);
  // Una ficha unida a otra cuenta sus contactos en la que se quedó.
  const destinoDe = new Map(((u.data ?? []) as { origen_id: string; destino_id: string }[]).map((x) => [x.origen_id, x.destino_id]));
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
  // Llegan del más nuevo al más viejo: el primero de cada persona es el último contacto.
  const ultimo = new Map<string, PersonaDirectorio["ultimo_contacto"]>();
  for (const x of (c.data ?? []) as FilaContacto[]) {
    const de = destinoDe.get(x.persona_id) ?? x.persona_id;
    if (!ultimo.has(de)) ultimo.set(de, { cuando: x.cuando, medio: x.medio, resultado: x.resultado });
  }
  const hoy = hoyTijuana(ahora);
  const personas = ((p.data ?? []) as unknown as FilaPersona[]).map((x): PersonaDirectorio => {
    const base = {
      id: x.id, clase: x.clase, nombre: x.nombre, fallecida: x.fallecida,
      telefonos: Array.isArray(x.telefonos) ? (x.telefonos as PersonaDirectorio["telefonos"]) : [],
      correo: x.correo, no_contactar: x.no_contactar, volver_a_llamar: x.volver_a_llamar, nota: x.nota ?? "",
      es_ejemplo: x.es_ejemplo, version: x.version, lo_que_sigue: x.lo_que_sigue ?? "", archivada_el: x.archivada_el ?? null,
      responsable_id: x.responsable_id, canal: x.canal ?? null, aviso_privacidad: x.aviso_privacidad ?? "pendiente", interes: interesDe(x),
      ultimo_contacto: ultimo.get(x.id) ?? null,
      // Primero lo abierto; lo cerrado al final.
      asuntos: (porPersona.get(x.id) ?? []).sort((m, n) => Number(m.cerrado) - Number(n.cerrado)),
    };
    return { ...base, sin_seguimiento: sinSeguimiento(base, hoy) };
  });
  return filtrarDirectorio(personas, filtro);
}

export async function cambiarPersona(client: SupabaseClient, id: string, e: z.infer<typeof cambioPersonaSchema>, ahora = new Date()): Promise<{ version: number }> {
  const { version: v, archivada, ...resto } = e;
  const cambios: Record<string, unknown> = { ...resto, ...(archivada === undefined ? {} : columnaArchivada(archivada, ahora)) };
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const { data, error } = await client.from(T.personas).update(cambios).eq("id", id).eq("version", v).is("deleted_at", null).select("version").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió esta ficha. Vuelve a cargar y repite el cambio.");
  return data as { version: number };
}

/** La ficha `origen` se une a `destino`: todo pasa a la que se queda y la otra va a Eliminados. */
export async function unirPersonas(client: SupabaseClient, user: StaffUser, origen: string, destino: string): Promise<void> {
  if (user.role !== "admin") throw new ApiError(403, "Solo el director une fichas.");
  // Los papeles de la ficha que se va pasan tal cual, aunque alguno ya no se ofrezca.
  const { error } = await client.rpc("fortius_inmuebles_unir_personas_conservando", { p_origen: origen, p_destino: destino });
  if (error) fallo(error);
}

/**
 * «Crear persona» desde una consulta del sitio en el panel nuevo: la base la liga a una ficha que quien está en sesión
 * ve, o crea una nueva a su cargo, y marca la consulta. No toca «clientes» ni la conversión del panel provisional.
 */
export const leadIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
export const leadADirectorioSchema = z.object({ version: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER) }).strict();

export async function leadADirectorio(client: Pick<SupabaseClient, "rpc">, leadId: string, e: z.infer<typeof leadADirectorioSchema>) {
  const { data, error } = await client.rpc("fortius_inmuebles_lead_a_persona", { p_lead_id: leadIdSchema.parse(leadId), p_version: e.version });
  if (error?.code === "PT404") throw new ApiError(404, "Esa consulta no existe.");
  if (error?.code === "PT403") throw new ApiError(403, "Esa consulta la lleva otro asesor.");
  // Ya ligada a una ficha que lleva otro asesor: el enlace se conserva y no se dice de qué ficha se trata.
  if (error?.code === "PT409" && error.hint === "ligada") {
    throw new ApiError(409, "Esta consulta ya está ligada a una ficha que lleva otro asesor. Pídele a dirección que la revise.");
  }
  if (error?.code === "PT409") throw new ApiError(409, "Alguien más cambió esta consulta. Vuelve a cargar y repite el cambio.");
  if (error) fallo(error);
  const r = data as { persona_id: string; creada: boolean; lead_version: number | string };
  return { persona_id: r.persona_id, creada: Boolean(r.creada), lead_version: Number(r.lead_version) };
}
