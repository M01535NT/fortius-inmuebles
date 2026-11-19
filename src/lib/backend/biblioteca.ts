import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { cambioColumnas } from "./apartados";
import { VISTAS, type Quien } from "./asuntos-contrato";
import { claveCatalogo } from "./catalogos";
import { fallo } from "./fallo";
import {
  CLASES_BIBLIOTECA, type ClaseBiblioteca, type EtapaGuia, type Guia, type ResultadoCopia,
} from "./biblioteca-contrato";
import type { StaffUser } from "./contracts";
import { ApiError } from "./http";

/**
 * Biblioteca (etapa 7 de PLAN.md; SPEC.md, sección 10). Todos la leen; la cambia quien hizo la guía o el director;
 * solo el director marca «Revisado por el abogado» (lo cuida la base). Copiar a un asunto copia el contenido:
 * lo que se cambie en el asunto no toca la guía, y lo que se cambie en la guía no toca los asuntos donde ya se usó.
 */

const T = {
  biblioteca: "fortius_inmuebles_biblioteca",
  documentos: "fortius_inmuebles_asunto_documentos",
  etapas: "fortius_inmuebles_plan_etapas",
  tareas: "fortius_inmuebles_tareas",
  apartados: "fortius_inmuebles_apartados",
} as const;

const COLUMNAS = "id,clase,nombre,descripcion,contenido,revisado_abogado,es_ejemplo,version,creado_por,updated_at";
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const masDias = (dias: number) => { const d = new Date(`${hoy()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); };
const entreDias = (de: string, a: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);

// ── Validación ───────────────────────────────────────────────────────────────────────────────────────
const texto = (max: number) => z.string().trim().min(1).max(max);
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const documentos = z.object({
  documentos: z.array(z.object({ nombre: texto(200), grupo: texto(80).optional(), entrega_papel: texto(40).optional() }).strict()).min(1).max(80),
}).strict();
const etapas = z.object({
  etapas: z.array(z.object({
    nombre: texto(120),
    tareas: z.array(z.object({ titulo: texto(300), quien: claveCatalogo, dias: z.number().int().min(0).max(3650).nullable().optional() }).strict()).max(80),
  }).strict()).min(1).max(20),
}).strict();
const apartado = z.object({ vista: z.enum(VISTAS), columnas: cambioColumnas }).strict();
const CONTENIDO: Record<ClaseBiblioteca, z.ZodType> = { que_pedir: documentos, que_hacer: etapas, apartado_propio: apartado };

export const nuevaGuiaSchema = z.union([
  z.object({ clase: z.enum(CLASES_BIBLIOTECA), nombre: texto(160), descripcion: z.string().trim().max(2000).optional(), contenido: z.record(z.string(), z.unknown()) }).strict(),
  /** Guardar el plan de un asunto, o uno de sus apartados propios, para volver a usarlo. */
  z.object({ desde_asunto: z.uuid(), plan: z.literal(true), nombre: texto(160) }).strict(),
  z.object({ desde_asunto: z.uuid(), apartado_id: z.uuid(), nombre: texto(160).optional() }).strict(),
]);
export const cambioGuiaSchema = z.object({
  version,
  nombre: texto(160).optional(), descripcion: z.string().trim().max(2000).optional(),
  contenido: z.record(z.string(), z.unknown()).optional(), revisado_abogado: z.boolean().optional(),
  quitar: z.literal(true).optional(), restaurar: z.literal(true).optional(),
}).strict();
export const copiarSchema = z.object({ asunto_id: z.uuid() }).strict();

function contenidoValido(clase: ClaseBiblioteca, contenido: unknown) {
  const r = CONTENIDO[clase].safeParse(contenido);
  if (!r.success) throw new ApiError(400, clase === "que_pedir" ? "Falta al menos un documento con nombre." : clase === "que_hacer" ? "Falta al menos una etapa con nombre." : "Faltan las columnas.");
  return r.data as Record<string, unknown>;
}

const conPermiso = (user: StaffUser) => (g: Omit<Guia, "editable">): Guia => ({ ...g, editable: user.role === "admin" || g.creado_por === user.id });

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
export async function listarGuias(client: SupabaseClient, user: StaffUser): Promise<Guia[]> {
  const { data, error } = await client.from(T.biblioteca).select(COLUMNAS).is("deleted_at", null).order("nombre");
  if (error) fallo(error);
  return ((data ?? []) as Omit<Guia, "editable">[]).map(conPermiso(user));
}

async function leerGuia(client: SupabaseClient, id: string): Promise<Omit<Guia, "editable">> {
  const { data, error } = await client.from(T.biblioteca).select(COLUMNAS).eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(404, "Esa guía ya no está en la Biblioteca.");
  return data as Omit<Guia, "editable">;
}

// ── Crear y cambiar ──────────────────────────────────────────────────────────────────────────────────
async function insertar(client: SupabaseClient, user: StaffUser, clase: ClaseBiblioteca, nombre: string, contenido: Record<string, unknown>, descripcion = ""): Promise<Guia> {
  const { data, error } = await client.from(T.biblioteca).insert({ clase, nombre, descripcion, contenido, creado_por: user.id }).select(COLUMNAS).single();
  if (error) fallo(error);
  return conPermiso(user)(data as Omit<Guia, "editable">);
}

export async function crearGuia(client: SupabaseClient, user: StaffUser, e: z.infer<typeof nuevaGuiaSchema>): Promise<Guia> {
  if ("clase" in e) return insertar(client, user, e.clase, e.nombre, contenidoValido(e.clase, e.contenido), e.descripcion ?? "");
  if ("plan" in e) return insertar(client, user, "que_hacer", e.nombre, contenidoValido("que_hacer", await planDelAsunto(client, e.desde_asunto, e.nombre)));
  const r = await client.from(T.apartados).select("nombre,vista,columnas").eq("id", e.apartado_id).eq("asunto_id", e.desde_asunto).eq("clave", "propio").is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  const a = r.data as { nombre: string | null; vista: string | null; columnas: unknown } | null;
  if (!a) throw new ApiError(404, "Ese apartado ya no está en el asunto.");
  return insertar(client, user, "apartado_propio", e.nombre ?? a.nombre ?? "Apartado", contenidoValido("apartado_propio", { vista: a.vista ?? "lista", columnas: a.columnas }));
}

/** El plan del asunto como guía: sus etapas con sus tareas; las fechas pasan a días contados desde la primera. */
async function planDelAsunto(client: SupabaseClient, asuntoId: string, nombre: string): Promise<{ etapas: EtapaGuia[] }> {
  const [et, ta] = await Promise.all([
    client.from(T.etapas).select("id,nombre").eq("asunto_id", asuntoId).is("deleted_at", null).order("orden"),
    client.from(T.tareas).select("etapa_id,titulo,quien,fecha,estado").eq("asunto_id", asuntoId).is("deleted_at", null).neq("estado", "no_aplica").order("orden"),
  ]);
  if (et.error) fallo(et.error);
  if (ta.error) fallo(ta.error);
  const tareas = (ta.data ?? []) as { etapa_id: string | null; titulo: string; quien: Quien; fecha: string | null }[];
  if (!tareas.length) throw new ApiError(400, "Este asunto todavía no tiene tareas en su plan.");
  const primera = tareas.map((t) => t.fecha).filter((f): f is string => !!f).sort()[0];
  const guia = (t: (typeof tareas)[number]) => ({ titulo: t.titulo, quien: t.quien, dias: primera && t.fecha ? Math.max(0, entreDias(primera, t.fecha)) : null });
  const lista = (et.data ?? []) as { id: string; nombre: string }[];
  const etapas: EtapaGuia[] = lista.map((e) => ({ nombre: e.nombre, tareas: tareas.filter((t) => t.etapa_id === e.id).map(guia) })).filter((e) => e.tareas.length);
  const sueltas = tareas.filter((t) => !t.etapa_id || !lista.some((e) => e.id === t.etapa_id));
  if (sueltas.length) etapas.push({ nombre: etapas.length ? "Otras tareas" : nombre.slice(0, 120), tareas: sueltas.map(guia) });
  return { etapas };
}

export async function cambiarGuia(client: SupabaseClient, user: StaffUser, id: string, e: z.infer<typeof cambioGuiaSchema>): Promise<Guia | null> {
  const { version: v, quitar, restaurar, contenido, ...resto } = e;
  const cambios: Record<string, unknown> = { ...resto };
  if (quitar) Object.assign(cambios, { deleted_at: new Date().toISOString(), deleted_by: user.id });
  if (restaurar) Object.assign(cambios, { deleted_at: null, deleted_by: null });
  if (contenido) {
    const r = await client.from(T.biblioteca).select("clase").eq("id", id).maybeSingle();
    if (r.error) fallo(r.error);
    if (!r.data) throw new ApiError(404, "Esa guía ya no está en la Biblioteca.");
    cambios.contenido = contenidoValido((r.data as { clase: ClaseBiblioteca }).clase, contenido);
  }
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const { data, error } = await client.from(T.biblioteca).update(cambios).eq("id", id).eq("version", v).select(COLUMNAS).maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "No se pudo cambiar: alguien más la cambió, o la hizo otra persona y solo el director puede cambiarla.");
  return quitar ? null : conPermiso(user)(data as Omit<Guia, "editable">);
}

// ── Copiar a un asunto ───────────────────────────────────────────────────────────────────────────────
async function siguienteOrden(client: SupabaseClient, tabla: string, filtro: Record<string, string>): Promise<number> {
  let q = client.from(tabla).select("orden").is("deleted_at", null).order("orden", { ascending: false }).limit(1);
  for (const [k, val] of Object.entries(filtro)) q = q.eq(k, val);
  const { data, error } = await q;
  if (error) fallo(error);
  return Number((data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
}

export async function copiarAlAsunto(client: SupabaseClient, user: StaffUser, id: string, asuntoId: string): Promise<ResultadoCopia> {
  const g = await leerGuia(client, id);
  let agregados = 0, repetidos = 0;
  if (g.clase === "que_pedir") {
    const c = documentos.parse(g.contenido);
    const r = await client.from(T.documentos).select("nombre").eq("asunto_id", asuntoId).is("deleted_at", null);
    if (r.error) fallo(r.error);
    const ya = new Set(((r.data ?? []) as { nombre: string }[]).map((d) => d.nombre.trim().toLowerCase()));
    const nuevos = c.documentos.filter((d) => !ya.has(d.nombre.trim().toLowerCase()));
    repetidos = c.documentos.length - nuevos.length;
    if (nuevos.length) {
      const orden = await siguienteOrden(client, T.documentos, { asunto_id: asuntoId });
      const { error } = await client.from(T.documentos).insert(nuevos.map((d, i) => ({
        asunto_id: asuntoId, nombre: d.nombre, grupo: d.grupo ?? null, entrega_papel: d.entrega_papel ?? "cliente",
        estado: "falta", origen: "biblioteca", orden: orden + i * 10, creado_por: user.id,
      })));
      if (error) fallo(error);
    }
    agregados = nuevos.length;
  } else if (g.clase === "que_hacer") {
    const c = etapas.parse(g.contenido);
    let ordenEtapa = await siguienteOrden(client, T.etapas, { asunto_id: asuntoId });
    let ordenTarea = await siguienteOrden(client, T.tareas, { asunto_id: asuntoId });
    for (const e of c.etapas) {
      const r = await client.from(T.etapas).insert({
        asunto_id: asuntoId, nombre: e.nombre, orden: ordenEtapa, biblioteca_id: g.id, biblioteca_version: g.version, creado_por: user.id,
      }).select("id").single();
      if (r.error) fallo(r.error);
      ordenEtapa += 10;
      if (!e.tareas.length) continue;
      const etapaId = (r.data as { id: string }).id;
      const { error } = await client.from(T.tareas).insert(e.tareas.map((t) => {
        const fila = {
          asunto_id: asuntoId, etapa_id: etapaId, titulo: t.titulo, quien: t.quien, fecha: t.dias === null || t.dias === undefined ? null : masDias(t.dias),
          responsable_id: user.id, orden: ordenTarea, creado_por: user.id,
        };
        ordenTarea += 10;
        return fila;
      }));
      if (error) fallo(error);
      agregados += e.tareas.length;
    }
  } else {
    const c = apartado.parse(g.contenido);
    const orden = 75 + (await siguienteOrden(client, T.apartados, { asunto_id: asuntoId, clave: "propio" })) / 1000;
    const { error } = await client.from(T.apartados).insert({
      asunto_id: asuntoId, clave: "propio", nombre: g.nombre.slice(0, 80), vista: c.vista, columnas: c.columnas, orden, biblioteca_id: g.id, creado_por: user.id,
    });
    if (error) fallo(error);
    agregados = 1;
  }
  if (agregados) {
    const { error } = await client.rpc("fortius_inmuebles_anotar_historial", {
      p_entidad: "asunto", p_entidad_id: asuntoId, p_asunto: asuntoId, p_clase: "nota", p_resumen: `De la Biblioteca: ${g.nombre}`,
    });
    if (error) fallo(error);
  }
  return { agregados, repetidos, nombre: g.nombre };
}
