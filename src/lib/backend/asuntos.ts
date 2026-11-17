import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { COLUMNAS_INICIALES } from "./apartados-contrato";
import { cambioColumnas, datosFila, leerApartados } from "./apartados";
import {
  APARTADOS_DE_SIEMPRE, CLASES_PERSONA, CLASES_TAREA, CLAVES_APARTADO, ENCARGOS, EN_QUE_VA, ESTADOS_TAREA, PAPELES, QUIEN, VISTAS,
  type Apartado, type Asunto, type ClaveApartado, type InmuebleDelAsunto, type Encargo, type EntradaHistorial, type Etapa, type FilaAsunto,
  type PersonaDelAsunto, type PersonaDuplicada, type Siguiente, type Tarea,
} from "./asuntos-contrato";
import type { StaffUser } from "./contracts";
import { ApiError, databaseError } from "./http";

/**
 * Asuntos del panel (SPEC.md, sección 5). Todo se lee y se escribe con la sesión de quien entró:
 * la base decide qué ve cada quien (RLS) y guarda el historial sola. Aquí se valida la entrada y se arma la respuesta.
 */

const T = {
  asuntos: "fortius_inmuebles_asuntos",
  apartados: "fortius_inmuebles_apartados",
  filas: "fortius_inmuebles_apartado_filas",
  personas: "fortius_inmuebles_personas",
  papeles: "fortius_inmuebles_asunto_personas",
  etapas: "fortius_inmuebles_plan_etapas",
  tareas: "fortius_inmuebles_tareas",
  siguiente: "fortius_inmuebles_asunto_siguiente",
  historial: "fortius_inmuebles_historial",
  ligasInmueble: "fortius_inmuebles_asunto_inmuebles",
  documentos: "fortius_inmuebles_asunto_documentos",
  consultas: "fortius_inmuebles_consultas",
} as const;

type Fallo = { code?: string; message?: string };
/** Errores de la base con mensaje propio (los escriben las migraciones del panel) o tablas que aún no existen. */
export function fallo(error: Fallo): never {
  if (["42P01", "PGRST205", "PGRST200"].includes(error.code ?? "")) {
    throw new ApiError(503, "Esta parte se activa cuando se integren los cambios de la base. Mientras tanto no hay nada que mostrar.");
  }
  if (error.code === "22023" && error.message && error.message.length <= 200) throw new ApiError(400, error.message);
  if (error.code === "PT409") throw new ApiError(409, "Alguien más cambió esto. Vuelve a cargar y repite el cambio.");
  if (error.code === "PT403" && error.message && error.message.length <= 200) throw new ApiError(403, error.message);
  return databaseError(error);
}

// ── Validación ───────────────────────────────────────────────────────────────────────────────────────
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const texto = (max: number) => z.string().trim().min(1).max(max);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const idSchema = z.uuid();

/** Lo que se enciende según lo encargado (SPEC.md, sección 5: «aparecen según lo que encargaron»). Se ajusta aquí, sin migración. */
export const APARTADOS_POR_ENCARGO: Record<Encargo, readonly ClaveApartado[]> = {
  revisar: ["situacion", "documentos", "opinion"],
  comercializar: ["inmueble", "interesados", "documentos"],
  tramitar: ["inmueble", "documentos"],
  asesorar: ["situacion", "documentos"],
};
const ORDEN_APARTADO: Record<ClaveApartado, number> = {
  personas: 10, inmueble: 20, interesados: 30, situacion: 40, documentos: 50, opinion: 60, honorarios: 70, plan: 80, historial: 90,
};
export function apartadosPara(encargos: readonly Encargo[]): ClaveApartado[] {
  const claves = new Set<ClaveApartado>(encargos.flatMap((e) => APARTADOS_POR_ENCARGO[e]));
  claves.add("honorarios"); // Va en todos salvo que se quite.
  return [...claves].filter((c) => !APARTADOS_DE_SIEMPRE.includes(c));
}

export const nuevoAsuntoSchema = z.object({
  nombre: texto(160),
  encargos: z.array(z.enum(ENCARGOS)).max(4).default([]),
  responsable_id: idSchema.optional(),
  es_ejemplo: z.boolean().optional(),
}).strict();

export const cambioAsuntoSchema = z.object({
  version,
  nombre: texto(160).optional(),
  encargos: z.array(z.enum(ENCARGOS)).max(4).optional(),
  en_que_va: z.enum(EN_QUE_VA).optional(),
  en_espera: z.boolean().optional(),
  espera_motivo: z.string().trim().max(500).nullable().optional(),
  espera_hasta: fecha.nullable().optional(),
  resultado: z.enum(["se_logro", "no_se_dio"]).nullable().optional(),
  motivo_cierre: z.string().trim().max(1000).nullable().optional(),
  responsable_id: idSchema.optional(),
  capto_id: idSchema.nullable().optional(),
  vendio_id: idSchema.nullable().optional(),
  situacion: z.string().max(20000).optional(),
}).strict();

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
const COLUMNAS_FILA = "id,folio,nombre,encargos,en_que_va,en_espera,espera_hasta,resultado,responsable_id,es_ejemplo,version,updated_at";
const COLUMNAS_ASUNTO = `${COLUMNAS_FILA},espera_motivo,motivo_cierre,cerrado_el,capto_id,vendio_id,viene_de,situacion,created_at`;

type FilaBase = Omit<FilaAsunto, "siguiente" | "busqueda">;
type PapelConNombre = { asunto_id: string; persona: { nombre: string } | null };

async function siguientesDe(client: SupabaseClient, ids: string[]): Promise<Map<string, Siguiente>> {
  const mapa = new Map<string, Siguiente>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await client.from(T.siguiente).select("asunto_id,tarea_id,titulo,quien,fecha,hora,version").in("asunto_id", ids.slice(i, i + 200));
    if (error) fallo(error);
    for (const s of (data ?? []) as (Siguiente & { asunto_id: string })[]) {
      const { asunto_id, ...resto } = s;
      mapa.set(asunto_id, { ...resto, hora: resto.hora ? resto.hora.slice(0, 5) : null });
    }
  }
  return mapa;
}

/** Todos los asuntos que ve quien entró, con lo que sigue. Los mandados a Eliminados no salen. */
export async function listarAsuntos(client: SupabaseClient): Promise<FilaAsunto[]> {
  const { data, error } = await client.from(T.asuntos).select(COLUMNAS_FILA).is("deleted_at", null).order("updated_at", { ascending: false }).limit(2000);
  if (error) fallo(error);
  const filas = (data ?? []) as FilaBase[];
  const ids = filas.map((f) => f.id);
  const nombres = new Map<string, string[]>();
  for (let i = 0; i < ids.length; i += 200) {
    const r = await client.from(T.papeles).select("asunto_id,persona:fortius_inmuebles_personas(nombre)").in("asunto_id", ids.slice(i, i + 200)).is("retirado_el", null);
    if (r.error) fallo(r.error);
    for (const p of (r.data ?? []) as unknown as PapelConNombre[]) {
      if (p.persona?.nombre) nombres.set(p.asunto_id, [...(nombres.get(p.asunto_id) ?? []), p.persona.nombre]);
    }
  }
  const siguientes = await siguientesDe(client, ids);
  return filas.map((f) => ({ ...f, siguiente: siguientes.get(f.id) ?? null, busqueda: [f.folio, ...(nombres.get(f.id) ?? [])].join(" ") }));
}

type PapelLeido = {
  id: string; persona_id: string; papel: PersonaDelAsunto["papel"]; principal: boolean; nota: string; version: number;
  persona: { nombre: string; clase: PersonaDelAsunto["clase"]; fallecida: boolean; telefonos: { pais: string; numero: string }[]; correo: string | null; no_contactar: boolean } | null;
};

/** El asunto completo, con sus apartados, personas, plan y filas de los apartados propios. */
export async function leerAsunto(client: SupabaseClient, id: string): Promise<Asunto> {
  const a = await client.from(T.asuntos).select(COLUMNAS_ASUNTO).eq("id", id).is("deleted_at", null).maybeSingle();
  if (a.error) fallo(a.error);
  if (!a.data) throw new ApiError(404, "Ese asunto no existe o no te toca verlo.");
  const [ap, pe, et, ta, inm, con, extra] = await Promise.all([
    client.from(T.apartados).select("id,clave,visible,orden,nombre,vista,texto,columnas,version").eq("asunto_id", id).is("deleted_at", null).order("orden"),
    client.from(T.papeles).select("id,persona_id,papel,principal,nota,version,persona:fortius_inmuebles_personas(nombre,clase,fallecida,telefonos,correo,no_contactar)")
      .eq("asunto_id", id).is("retirado_el", null).order("orden").order("created_at"),
    client.from(T.etapas).select("id,nombre,orden,version").eq("asunto_id", id).is("deleted_at", null).order("orden"),
    client.from(T.tareas).select("id,titulo,clase,quien,fecha,hora,estado,motivo,etapa_id,responsable_id,volver_a_preguntar,recordada_el,pospuesta,interesado_id,inmueble_id,documento_id,origen,orden,version")
      .eq("asunto_id", id).is("deleted_at", null).order("orden").order("created_at").limit(2000),
    client.from(T.ligasInmueble).select("inmueble:fortius_inmuebles_inmuebles(id,folio,nombre,tipo,operacion,colonia,precio,moneda,estado,publicado,slug)")
      .eq("asunto_id", id).is("retirado_el", null).order("orden"),
    client.from(T.consultas).select("datos").eq("asunto_id", id).limit(1).maybeSingle(),
    leerApartados(client, id),
  ]);
  for (const r of [ap, pe, et, ta, inm, con]) if (r.error) fallo(r.error);
  const inmuebles = ((inm.data ?? []) as unknown as { inmueble: InmuebleDelAsunto | null }[])
    .map((x) => x.inmueble).filter((x): x is InmuebleDelAsunto => x !== null);
  const personas = ((pe.data ?? []) as unknown as PapelLeido[]).filter((p) => p.persona).map((p): PersonaDelAsunto => {
    const tel = p.persona!.telefonos?.[0];
    return {
      id: p.id, persona_id: p.persona_id, papel: p.papel, principal: p.principal, nota: p.nota, version: p.version,
      nombre: p.persona!.nombre, clase: p.persona!.clase, fallecida: p.persona!.fallecida, no_contactar: p.persona!.no_contactar,
      telefono: tel ? `${tel.pais} ${tel.numero}` : null, correo: p.persona!.correo,
    };
  });
  const tareas = ((ta.data ?? []) as Tarea[]).map((t) => ({ ...t, hora: t.hora ? t.hora.slice(0, 5) : null }));
  const base = a.data as Omit<Asunto, "siguiente" | "busqueda" | "apartados" | "personas" | "etapas" | "tareas" | "inmuebles" | "datos_consulta" | keyof typeof extra>;
  const siguientes = await siguientesDe(client, [id]);
  return {
    ...base, siguiente: siguientes.get(id) ?? null, busqueda: [base.folio, ...personas.map((p) => p.nombre)].join(" "),
    ...extra, apartados: ((ap.data ?? []) as Apartado[]).map((x) => ({ ...x, columnas: Array.isArray(x.columnas) ? x.columnas : [] })),
    personas, etapas: (et.data ?? []) as Etapa[], tareas, inmuebles, datos_consulta: (con.data as { datos: Record<string, unknown> } | null)?.datos ?? null,
  };
}

export async function leerHistorial(client: SupabaseClient, asuntoId: string, antesDe?: number): Promise<EntradaHistorial[]> {
  let q = client.from(T.historial).select("id,entidad,entidad_id,clase,resumen,detalle,actor_id,actor_tipo,created_at")
    .eq("asunto_id", asuntoId).order("id", { ascending: false }).limit(100);
  if (antesDe) q = q.lt("id", antesDe);
  const { data, error } = await q;
  if (error) fallo(error);
  return (data ?? []) as EntradaHistorial[];
}

// ── Escritura del asunto ─────────────────────────────────────────────────────────────────────────────
async function agregarApartados(client: SupabaseClient, asuntoId: string, claves: readonly ClaveApartado[], userId: string) {
  if (!claves.length) return;
  // Sin «upsert»: el índice único es parcial (los propios se repiten) y no sirve para resolver choques.
  const r = await client.from(T.apartados).select("clave").eq("asunto_id", asuntoId).in("clave", [...claves]);
  if (r.error) fallo(r.error);
  const ya = new Set(((r.data ?? []) as { clave: string }[]).map((x) => x.clave));
  const faltan = claves.filter((c) => !ya.has(c));
  if (!faltan.length) return;
  const { error } = await client.from(T.apartados).insert(faltan.map((clave) => ({ asunto_id: asuntoId, clave, orden: ORDEN_APARTADO[clave], creado_por: userId })));
  if (error) fallo(error);
}

export async function crearAsunto(client: SupabaseClient, user: StaffUser, entrada: z.infer<typeof nuevoAsuntoSchema>): Promise<{ id: string; folio: string }> {
  const responsable = entrada.responsable_id ?? user.id;
  if (responsable !== user.id && user.role !== "admin") throw new ApiError(403, "Solo el director abre un asunto a nombre de otra persona.");
  const { data, error } = await client.from(T.asuntos).insert({
    nombre: entrada.nombre, encargos: entrada.encargos, responsable_id: responsable, creado_por: user.id, es_ejemplo: entrada.es_ejemplo ?? false,
  }).select("id,folio").single();
  if (error) fallo(error);
  const nuevo = data as { id: string; folio: string };
  await agregarApartados(client, nuevo.id, apartadosPara(entrada.encargos), user.id);
  return nuevo;
}

export async function cambiarAsunto(client: SupabaseClient, user: StaffUser, id: string, entrada: z.infer<typeof cambioAsuntoSchema>): Promise<void> {
  const { version: v, ...cambios } = entrada;
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  if (cambios.responsable_id && user.role !== "admin") throw new ApiError(403, "Solo el director cambia quién lleva el asunto.");
  if (cambios.resultado && cambios.en_que_va !== "cerrado") throw new ApiError(400, "Para anotar el resultado, el asunto se cierra.");
  const { data, error } = await client.from(T.asuntos).update(cambios).eq("id", id).eq("version", v).is("deleted_at", null).select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió este asunto. Vuelve a cargar y repite el cambio.");
  // Lo que se encarga después enciende sus apartados (los que estaban ocultos se quedan ocultos).
  if (cambios.encargos?.length) await agregarApartados(client, id, apartadosPara(cambios.encargos), user.id);
}

export async function eliminarAsunto(client: SupabaseClient, id: string, v: number, restaurar: boolean): Promise<void> {
  let q = client.from(T.asuntos).update({ deleted_at: restaurar ? null : new Date().toISOString() }).eq("id", id).eq("version", v);
  q = restaurar ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió este asunto. Vuelve a cargar y repite el cambio.");
}

// ── Partes del asunto ────────────────────────────────────────────────────────────────────────────────
export const PARTES = ["apartados", "filas", "personas", "tareas", "etapas", "historial"] as const;
export type Parte = (typeof PARTES)[number];

const nuevoApartado = z.union([
  z.object({ clave: z.enum(CLAVES_APARTADO) }).strict(),
  z.object({ propio: z.object({ nombre: texto(80), vista: z.enum(VISTAS) }).strict() }).strict(),
]);
const cambioApartado = z.object({
  id: idSchema, version, visible: z.boolean().optional(), nombre: texto(80).optional(), vista: z.enum(VISTAS).optional(),
  texto: z.string().max(50000).optional(), orden: z.number().finite().optional(), columnas: cambioColumnas.optional(),
}).strict();

const nuevaFila = z.object({ apartado_id: idSchema, texto: z.string().trim().max(500).default(""), datos: datosFila.optional() }).strict();
const cambioFila = z.object({
  id: idSchema, version, texto: texto(500).optional(), datos: datosFila.optional(), hecho: z.boolean().optional(), quitar: z.literal(true).optional(),
}).strict();

const telefono = z.object({ pais: z.string().trim().regex(/^\+?\d{1,4}$/).default("+52"), numero: z.string().trim().min(4).max(30) }).strict();
const nuevaPersona = z.object({
  papel: z.enum(PAPELES),
  persona_id: idSchema.optional(),
  nueva: z.object({
    nombre: texto(160), clase: z.enum(CLASES_PERSONA).default("persona"), fallecida: z.boolean().default(false),
    telefono: telefono.optional(), correo: z.email().max(200).optional(), es_ejemplo: z.boolean().optional(),
  }).strict().optional(),
  /** Ya se avisó que el teléfono o el correo existen y se eligió crear otra ficha de todos modos. */
  aunque_exista: z.boolean().optional(),
  nota: z.string().trim().max(500).optional(),
}).strict().refine((x) => Boolean(x.persona_id) !== Boolean(x.nueva), "Elige una persona o escribe una nueva.");
const cambioPersona = z.object({ id: idSchema, version, papel: z.enum(PAPELES).optional(), principal: z.boolean().optional(), nota: z.string().trim().max(500).optional(), quitar: z.literal(true).optional() }).strict();

const nuevaTarea = z.object({
  titulo: texto(300), quien: z.enum(QUIEN).default("fortius"), fecha: fecha.nullable().optional(), hora: hora.nullable().optional(),
  etapa_id: idSchema.nullable().optional(), responsable_id: idSchema.optional(), clase: z.enum(CLASES_TAREA).default("tarea"),
  documento_id: idSchema.nullable().optional(), inmueble_id: idSchema.nullable().optional(),
}).strict().refine((t) => !t.hora || t.fecha, "La hora necesita día.");
const cambioTarea = z.object({
  id: idSchema, version, titulo: texto(300).optional(), quien: z.enum(QUIEN).optional(), fecha: fecha.nullable().optional(), hora: hora.nullable().optional(),
  estado: z.enum(ESTADOS_TAREA).optional(), motivo: z.string().trim().max(1000).nullable().optional(), etapa_id: idSchema.nullable().optional(),
  responsable_id: idSchema.optional(), quitar: z.literal(true).optional(),
  /** «Recordarle»: se anota que se le escribió y la siguiente vez que toca preguntar (en tres días). */
  recordar: z.literal(true).optional(),
}).strict();

const nuevaEtapa = z.object({ nombre: texto(120) }).strict();
const cambioEtapa = z.object({ id: idSchema, version, nombre: texto(120).optional(), quitar: z.literal(true).optional(), todo_hecho: z.literal(true).optional() }).strict();

const nuevaNota = z.object({ clase: z.enum(["nota", "decision"]), texto: texto(2000) }).strict();

async function siguienteOrden(client: SupabaseClient, tabla: string, filtro: Record<string, string>): Promise<number> {
  let q = client.from(tabla).select("orden").is("deleted_at", null).order("orden", { ascending: false }).limit(1);
  for (const [k, v] of Object.entries(filtro)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) fallo(error);
  return Number((data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
}

/** Actualiza una fila con su versión. Ninguna fila = alguien más la cambió. */
async function actualizar(client: SupabaseClient, tabla: string, asuntoId: string, id: string, v: number, cambios: Record<string, unknown>) {
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const { data, error } = await client.from(tabla).update(cambios).eq("id", id).eq("asunto_id", asuntoId).eq("version", v).select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió esto. Vuelve a cargar y repite el cambio.");
}

async function buscarDuplicada(client: SupabaseClient, tel: { pais: string; numero: string } | undefined, correo: string | undefined): Promise<PersonaDuplicada | null> {
  const digitos = tel ? `${tel.pais.replace(/\D/g, "") || "52"}${tel.numero.replace(/\D/g, "")}` : "";
  if (digitos.length >= 6) {
    const r = await client.from(T.personas).select("id,nombre").contains("telefonos_normales", [digitos]).is("deleted_at", null).limit(1);
    if (r.error) fallo(r.error);
    if (r.data?.[0]) return r.data[0] as PersonaDuplicada;
  }
  if (correo) {
    const r = await client.from(T.personas).select("id,nombre").eq("correo", correo.toLowerCase()).is("deleted_at", null).limit(1);
    if (r.error) fallo(r.error);
    if (r.data?.[0]) return r.data[0] as PersonaDuplicada;
  }
  return null;
}

export async function crearEnParte(client: SupabaseClient, user: StaffUser, asuntoId: string, parte: Parte, cuerpo: unknown): Promise<unknown> {
  switch (parte) {
    case "apartados": {
      const e = nuevoApartado.parse(cuerpo);
      if ("clave" in e) {
        // Si estaba quitado, vuelve a verse con lo que tenía.
        const r = await client.from(T.apartados).select("id,version,visible").eq("asunto_id", asuntoId).eq("clave", e.clave).is("deleted_at", null).maybeSingle();
        if (r.error) fallo(r.error);
        const previo = r.data as { id: string; version: number; visible: boolean } | null;
        if (previo) {
          if (!previo.visible) await actualizar(client, T.apartados, asuntoId, previo.id, previo.version, { visible: true });
          return { id: previo.id };
        }
        await agregarApartados(client, asuntoId, [e.clave], user.id);
        return {};
      }
      const orden = 75 + (await siguienteOrden(client, T.apartados, { asunto_id: asuntoId, clave: "propio" })) / 1000;
      const { data, error } = await client.from(T.apartados).insert({
        asunto_id: asuntoId, clave: "propio", nombre: e.propio.nombre, vista: e.propio.vista, columnas: COLUMNAS_INICIALES[e.propio.vista], orden, creado_por: user.id,
      }).select("id").single();
      if (error) fallo(error);
      return data;
    }
    case "filas": {
      const e = nuevaFila.parse(cuerpo);
      const orden = await siguienteOrden(client, T.filas, { apartado_id: e.apartado_id });
      const { data, error } = await client.from(T.filas).insert({
        apartado_id: e.apartado_id, asunto_id: asuntoId, datos: { ...(e.datos ?? {}), texto: e.texto || (typeof e.datos?.texto === "string" ? e.datos.texto : "") },
        orden, creado_por: user.id,
      }).select("id").single();
      if (error) fallo(error);
      return data;
    }
    case "personas": {
      const e = nuevaPersona.parse(cuerpo);
      let personaId = e.persona_id;
      if (e.nueva) {
        if (!e.aunque_exista) {
          const dup = await buscarDuplicada(client, e.nueva.telefono, e.nueva.correo);
          if (dup) return { duplicada: dup };
        }
        const { data, error } = await client.from(T.personas).insert({
          nombre: e.nueva.nombre, clase: e.nueva.clase, fallecida: e.nueva.fallecida, correo: e.nueva.correo ?? null,
          telefonos: e.nueva.telefono && !e.nueva.fallecida ? [e.nueva.telefono] : [], es_ejemplo: e.nueva.es_ejemplo ?? false,
          responsable_id: user.id, creado_por: user.id,
        }).select("id").single();
        if (error) fallo(error);
        personaId = (data as { id: string }).id;
      }
      // La misma persona con el mismo papel: si se había quitado, vuelve.
      const previa = await client.from(T.papeles).select("id,version,retirado_el").eq("asunto_id", asuntoId).eq("persona_id", personaId!).eq("papel", e.papel).is("inmueble_id", null).maybeSingle();
      if (previa.error) fallo(previa.error);
      const p = previa.data as { id: string; version: number; retirado_el: string | null } | null;
      if (p) {
        if (p.retirado_el) await actualizar(client, T.papeles, asuntoId, p.id, p.version, { retirado_el: null });
        return { id: p.id };
      }
      const orden = await siguientePapel(client, asuntoId);
      const { data, error } = await client.from(T.papeles).insert({
        asunto_id: asuntoId, persona_id: personaId, papel: e.papel, nota: e.nota ?? "", orden, principal: orden === 10, creado_por: user.id,
      }).select("id").single();
      if (error) fallo(error);
      return data;
    }
    case "tareas": {
      const e = nuevaTarea.parse(cuerpo);
      const orden = await siguienteOrden(client, T.tareas, { asunto_id: asuntoId });
      const { data, error } = await client.from(T.tareas).insert({
        asunto_id: asuntoId, titulo: e.titulo, quien: e.quien, fecha: e.fecha ?? null, hora: e.hora ?? null, etapa_id: e.etapa_id ?? null,
        clase: e.clase, documento_id: e.documento_id ?? null, inmueble_id: e.inmueble_id ?? null,
        responsable_id: e.responsable_id ?? user.id, orden, creado_por: user.id,
      }).select("id").single();
      if (error) fallo(error);
      return data;
    }
    case "etapas": {
      const e = nuevaEtapa.parse(cuerpo);
      const orden = await siguienteOrden(client, T.etapas, { asunto_id: asuntoId });
      const { data, error } = await client.from(T.etapas).insert({ asunto_id: asuntoId, nombre: e.nombre, orden, creado_por: user.id }).select("id").single();
      if (error) fallo(error);
      return data;
    }
    case "historial": {
      const e = nuevaNota.parse(cuerpo);
      const { data, error } = await client.rpc("fortius_inmuebles_anotar_historial", {
        p_entidad: "asunto", p_entidad_id: asuntoId, p_asunto: asuntoId, p_clase: e.clase, p_resumen: e.texto,
      });
      if (error) fallo(error);
      return { id: data };
    }
  }
}

async function siguientePapel(client: SupabaseClient, asuntoId: string): Promise<number> {
  const { data, error } = await client.from(T.papeles).select("orden").eq("asunto_id", asuntoId).order("orden", { ascending: false }).limit(1);
  if (error) fallo(error);
  return Number((data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
}

export async function cambiarEnParte(client: SupabaseClient, user: StaffUser, asuntoId: string, parte: Parte, cuerpo: unknown): Promise<void> {
  switch (parte) {
    case "apartados": {
      const { id, version: v, ...c } = cambioApartado.parse(cuerpo);
      return actualizar(client, T.apartados, asuntoId, id, v, c);
    }
    case "filas": {
      const { id, version: v, quitar, texto: t, datos, hecho } = cambioFila.parse(cuerpo);
      let nuevos: Record<string, unknown> | undefined;
      if (t !== undefined || datos) {
        // Las celdas se mezclan con las que ya tenía: cambiar una columna no borra las demás.
        const r = await client.from(T.filas).select("datos").eq("id", id).eq("asunto_id", asuntoId).maybeSingle();
        if (r.error) fallo(r.error);
        nuevos = { ...((r.data as { datos?: Record<string, unknown> } | null)?.datos ?? {}), ...(datos ?? {}), ...(t !== undefined ? { texto: t } : {}) };
      }
      return actualizar(client, T.filas, asuntoId, id, v, {
        ...(nuevos ? { datos: nuevos } : {}), ...(hecho !== undefined ? { hecho } : {}), ...(quitar ? { deleted_at: new Date().toISOString() } : {}),
      });
    }
    case "personas": {
      const { id, version: v, quitar, ...c } = cambioPersona.parse(cuerpo);
      return actualizar(client, T.papeles, asuntoId, id, v, { ...c, ...(quitar ? { retirado_el: new Date().toISOString() } : {}) });
    }
    case "tareas": {
      const { id, version: v, quitar, recordar, ...c } = cambioTarea.parse(cuerpo);
      if (c.responsable_id && c.responsable_id !== user.id && user.role !== "admin") {
        const r = await client.from(T.asuntos).select("responsable_id").eq("id", asuntoId).maybeSingle();
        if (r.error) fallo(r.error);
        if ((r.data as { responsable_id?: string } | null)?.responsable_id !== user.id) throw new ApiError(403, "Solo quien lleva el asunto o el director asignan tareas a otra persona.");
      }
      const enTres = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
      return actualizar(client, T.tareas, asuntoId, id, v, {
        ...c, ...(quitar ? { deleted_at: new Date().toISOString() } : {}),
        ...(recordar ? { recordada_el: new Date().toISOString(), volver_a_preguntar: enTres } : {}),
      });
    }
    case "etapas": {
      const { id, version: v, quitar, todo_hecho, ...c } = cambioEtapa.parse(cuerpo);
      if (todo_hecho) {
        const { error } = await client.from(T.tareas).update({ estado: "hecha" }).eq("asunto_id", asuntoId).eq("etapa_id", id).eq("estado", "pendiente").is("deleted_at", null);
        if (error) fallo(error);
        if (!Object.keys(c).length && !quitar) return;
      }
      return actualizar(client, T.etapas, asuntoId, id, v, { ...c, ...(quitar ? { deleted_at: new Date().toISOString() } : {}) });
    }
    case "historial":
      throw new ApiError(405, "El historial solo se agrega: no se cambia ni se borra.");
  }
}
