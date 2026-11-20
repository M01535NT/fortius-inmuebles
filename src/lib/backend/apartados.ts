import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  DIAS_LIGA, ESTADOS_DOCUMENTO, ESTADOS_INTERESADO, ESTADOS_PRESUPUESTO, FORMAS_PAGO, MONEDAS, PASOS_DOCUMENTO,
  RESPUESTAS_OFERTA, RESULTADOS_OPINION, TIPOS_COLUMNA,
  type ArchivoDelDocumento, type Cobro, type Concepto, type Destino, type DocumentoDelAsunto, type Interesado,
  type LigaCliente, type Oferta, type Opinion, type Presupuesto, type PuntoOpinion, type PuntoSituacion, type ResultadoSubida, type ValorCelda,
} from "./apartados-contrato";
import type { Asunto, FilaPropia } from "./asuntos-contrato";
import { claveCatalogo } from "./catalogos";
import { fallo } from "./fallo";
import { createServerClient } from "./auth";
import { FIRMAS } from "./firmas";
import type { StaffUser } from "./contracts";
import { BUCKET_EXPEDIENTES } from "./expediente-archivos";
import { sinMetadatos } from "./files";
import { ApiError } from "./http";

/**
 * Los apartados a fondo del asunto (etapa 5 de PLAN.md; SPEC.md, secciones 5, 8 y 11).
 * Todo con la sesión de quien entró: la base decide qué ve (RLS), guarda el historial y revisa que cada cosa sea
 * del mismo asunto. Los archivos los sube el servidor con la llave privilegiada después de comprobar el acceso.
 */

const T = {
  asuntos: "fortius_inmuebles_asuntos",
  apartados: "fortius_inmuebles_apartados",
  filas: "fortius_inmuebles_apartado_filas",
  personas: "fortius_inmuebles_personas",
  papeles: "fortius_inmuebles_asunto_personas",
  tareas: "fortius_inmuebles_tareas",
  etapas: "fortius_inmuebles_plan_etapas",
  documentos: "fortius_inmuebles_asunto_documentos",
  archivos: "fortius_inmuebles_documento_archivos",
  situacion: "fortius_inmuebles_situacion_puntos",
  opiniones: "fortius_inmuebles_opiniones",
  opinionPuntos: "fortius_inmuebles_opinion_puntos",
  presupuestos: "fortius_inmuebles_presupuestos",
  conceptos: "fortius_inmuebles_presupuesto_conceptos",
  cobros: "fortius_inmuebles_cobros",
  interesados: "fortius_inmuebles_interesados",
  interesadoInmuebles: "fortius_inmuebles_interesado_inmuebles",
  ofertas: "fortius_inmuebles_ofertas",
  ligas: "fortius_inmuebles_ligas_cliente",
  historial: "fortius_inmuebles_historial",
} as const;

export const TAMANO_MAXIMO_ARCHIVO = 20 * 1024 * 1024;
const ahora = () => new Date().toISOString();
/** Quita caracteres de control de un nombre de archivo (sin expresiones con caracteres de control). */
export const limpiarNombre = (nombre: string, otro: string) =>
  [...nombre].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join("").trim().slice(0, 240) || otro;

// ── Validación ───────────────────────────────────────────────────────────────────────────────────────
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
const id = z.uuid();
const texto = (max: number) => z.string().trim().min(1).max(max);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monto = z.number().finite().positive().max(999_999_999_999);
const quitar = z.literal(true).optional();

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
type Extra = Pick<Asunto, "situacion_puntos" | "opinion" | "presupuestos" | "cobros" | "interesados" | "ligas" | "documentos" | "filas">;
type FilaLeida = { id: string; apartado_id: string; datos: Record<string, ValorCelda>; hecho: boolean; foto_path: string | null; orden: number; version: number };
type DocLeido = Omit<DocumentoDelAsunto, "archivos"> & { archivos: (ArchivoDelDocumento & { nombre_original: string; deleted_at: string | null })[] };
type InteresadoLeido = Omit<Interesado, "nombre" | "telefono" | "inmuebles" | "ofertas"> & {
  persona: { nombre: string; telefonos: { pais: string; numero: string }[] } | null;
  inmuebles: { inmueble_id: string }[];
};

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Lo de los apartados a fondo, para sumarlo al asunto. Si una tabla todavía no existe, esa parte llega vacía. */
export async function leerApartados(client: SupabaseClient, asuntoId: string): Promise<Extra> {
  const [docs, fi, si, op, pr, co, it, of, li] = await Promise.all([
    client.from(T.documentos).select("id,nombre,grupo,estado,entrega_papel,entrega_persona_id,inmueble_id,vence_el,avisar_dias,paso,origen,es_contrato,es_recibo,nota,version,trabajo_id,archivos:fortius_inmuebles_documento_archivos(id,nombre_original,mime,por_cliente,created_at,deleted_at)")
      .eq("asunto_id", asuntoId).is("deleted_at", null).order("orden").order("created_at").limit(500),
    client.from(T.filas).select("id,apartado_id,datos,hecho,foto_path,orden,version").eq("asunto_id", asuntoId).is("deleted_at", null).order("orden").limit(2000),
    client.from(T.situacion).select("id,clase,clave,valor,texto,tarea_id,resuelto_el,version").eq("asunto_id", asuntoId).is("deleted_at", null).order("orden").order("created_at"),
    client.from(T.opiniones).select("id,resultado,analisis,emitida_el,documento_id,version,puntos:fortius_inmuebles_opinion_puntos(id,texto,quien,tarea_id,version,orden,deleted_at)")
      .eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle(),
    client.from(T.presupuestos).select("id,numero,estado,enviado_el,vigente_hasta,paga_persona_id,documento_id,version,conceptos:fortius_inmuebles_presupuesto_conceptos(id,clase,concepto,monto,moneda,porcentaje,base_inmueble_id,inmueble_id,tercero,version,orden,deleted_at)")
      .eq("asunto_id", asuntoId).is("deleted_at", null).order("numero", { ascending: false }),
    client.from(T.cobros).select("id,concepto_id,paga_persona_id,inmueble_id,monto,moneda,forma,fecha,recibo_documento_id,nota,version").eq("asunto_id", asuntoId).is("deleted_at", null).order("fecha").order("created_at"),
    client.from(T.interesados).select("id,persona_id,estado,nota,version,persona:fortius_inmuebles_personas(nombre,telefonos),inmuebles:fortius_inmuebles_interesado_inmuebles(inmueble_id)")
      .eq("asunto_id", asuntoId).is("deleted_at", null).order("orden").order("created_at"),
    client.from(T.ofertas).select("id,interesado_id,inmueble_id,monto,moneda,fecha,respuesta,contraoferta_monto,version").eq("asunto_id", asuntoId).is("deleted_at", null).order("fecha").order("created_at"),
    client.from(T.ligas).select("id,expira_el,revocada,subidos,created_at,version").eq("asunto_id", asuntoId).eq("revocada", false).gt("expira_el", ahora()).order("created_at", { ascending: false }),
  ]);
  // Mientras no se integren los cambios de la base, lo que falta llega vacío y el resto del asunto se ve.
  const ok = <D>(r: { data: D | null; error: { code?: string; message?: string } | null }, vacio: D): D => {
    if (r.error) {
      if (["42P01", "PGRST205", "PGRST200", "42703"].includes(r.error.code ?? "")) return vacio;
      fallo(r.error);
    }
    return r.data ?? vacio;
  };
  const documentos = (ok(docs, []) as unknown as DocLeido[]).map((d): DocumentoDelAsunto => ({
    ...d, archivos: (d.archivos ?? []).filter((x) => !x.deleted_at).map((x) => ({ id: x.id, nombre: x.nombre_original, mime: x.mime, por_cliente: x.por_cliente, created_at: x.created_at })),
  }));
  const filasLeidas = ok(fi, []) as unknown as FilaLeida[];
  const conFoto = filasLeidas.filter((f) => f.foto_path).map((f) => f.foto_path!);
  const urls = new Map<string, string>();
  if (conFoto.length) {
    const firmadas = await createServerClient(undefined, true).storage.from(BUCKET_EXPEDIENTES).createSignedUrls(conFoto, 3600);
    for (const s of firmadas.data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  const filas = filasLeidas.map((f): FilaPropia => ({
    id: f.id, apartado_id: f.apartado_id, datos: f.datos ?? {}, texto: typeof f.datos?.texto === "string" ? f.datos.texto : "",
    hecho: f.hecho, foto_url: f.foto_path ? urls.get(f.foto_path) ?? null : null, orden: f.orden, version: f.version,
  }));
  const opLeida = ok(op, null) as unknown as (Omit<Opinion, "puntos"> & { puntos: (PuntoOpinion & { orden: number; deleted_at: string | null })[] }) | null;
  const opinion: Opinion | null = opLeida ? {
    ...opLeida, puntos: (opLeida.puntos ?? []).filter((p) => !p.deleted_at).sort((a, b) => a.orden - b.orden)
      .map(({ id: pid, texto: t, quien, tarea_id, version: v }) => ({ id: pid, texto: t, quien, tarea_id, version: v })),
  } : null;
  const presupuestos = (ok(pr, []) as unknown as (Omit<Presupuesto, "conceptos"> & { conceptos: (Concepto & { orden: number; deleted_at: string | null })[] })[])
    .map((p): Presupuesto => ({
      ...p, conceptos: (p.conceptos ?? []).filter((c) => !c.deleted_at).sort((a, b) => a.orden - b.orden)
        .map((c): Concepto => ({
          id: c.id, clase: c.clase, concepto: c.concepto, monto: num(c.monto), moneda: c.moneda, porcentaje: num(c.porcentaje),
          base_inmueble_id: c.base_inmueble_id, inmueble_id: c.inmueble_id, tercero: c.tercero, version: c.version,
        })),
    }));
  const cobros = (ok(co, []) as unknown as Cobro[]).map((c) => ({ ...c, monto: Number(c.monto) }));
  const ofertas = (ok(of, []) as unknown as (Oferta & { interesado_id: string })[]).map((o) => ({ ...o, monto: Number(o.monto), contraoferta_monto: num(o.contraoferta_monto) }));
  const interesados = (ok(it, []) as unknown as InteresadoLeido[]).map((x): Interesado => {
    const tel = x.persona?.telefonos?.[0];
    return {
      id: x.id, persona_id: x.persona_id, estado: x.estado, nota: x.nota, version: x.version,
      nombre: x.persona?.nombre ?? "Sin nombre", telefono: tel ? `${tel.pais} ${tel.numero}` : null,
      inmuebles: (x.inmuebles ?? []).map((i) => i.inmueble_id),
      ofertas: ofertas.filter((o) => o.interesado_id === x.id).map((o): Oferta => ({
        id: o.id, inmueble_id: o.inmueble_id, monto: o.monto, moneda: o.moneda, fecha: o.fecha, respuesta: o.respuesta,
        contraoferta_monto: o.contraoferta_monto, version: o.version,
      })),
    };
  });
  return {
    documentos, filas, situacion_puntos: ok(si, []) as unknown as PuntoSituacion[], opinion, presupuestos, cobros, interesados,
    ligas: ok(li, []) as unknown as LigaCliente[],
  };
}

// ── Utilidades ───────────────────────────────────────────────────────────────────────────────────────
async function siguienteOrden(client: SupabaseClient, tabla: string, filtro: Record<string, string>): Promise<number> {
  let q = client.from(tabla).select("orden").is("deleted_at", null).order("orden", { ascending: false }).limit(1);
  for (const [k, v] of Object.entries(filtro)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) fallo(error);
  return Number((data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
}

async function actualizar(client: SupabaseClient, tabla: string, asuntoId: string, fila: string, v: number, cambios: Record<string, unknown>) {
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const { data, error } = await client.from(tabla).update(cambios).eq("id", fila).eq("asunto_id", asuntoId).eq("version", v).select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más cambió esto. Vuelve a cargar y repite el cambio.");
}

async function insertar<T = { id: string }>(client: SupabaseClient, tabla: string, fila: Record<string, unknown>, columnas = "id"): Promise<T> {
  const { data, error } = await client.from(tabla).insert(fila).select(columnas).single();
  if (error) fallo(error);
  return data as T;
}

async function nuevaTarea(client: SupabaseClient, user: StaffUser, asuntoId: string, t: Record<string, unknown>): Promise<string> {
  const orden = await siguienteOrden(client, T.tareas, { asunto_id: asuntoId });
  return (await insertar(client, T.tareas, { asunto_id: asuntoId, responsable_id: user.id, creado_por: user.id, orden, ...t })).id;
}

async function etapaLlamada(client: SupabaseClient, user: StaffUser, asuntoId: string, nombre: string): Promise<string> {
  const r = await client.from(T.etapas).select("id").eq("asunto_id", asuntoId).eq("nombre", nombre).is("deleted_at", null).limit(1);
  if (r.error) fallo(r.error);
  const ya = (r.data?.[0] as { id: string } | undefined)?.id;
  if (ya) return ya;
  const orden = await siguienteOrden(client, T.etapas, { asunto_id: asuntoId });
  return (await insertar(client, T.etapas, { asunto_id: asuntoId, nombre, orden, creado_por: user.id })).id;
}

// ── Partes de los apartados a fondo ──────────────────────────────────────────────────────────────────
export const PARTES_APARTADO = ["documentos", "situacion", "opinion", "opinion_puntos", "presupuestos", "conceptos", "cobros", "interesados", "ofertas", "ligas"] as const;
export type ParteApartado = (typeof PARTES_APARTADO)[number];

const nuevoDocumento = z.object({
  nombre: texto(200), grupo: z.string().trim().max(80).nullable().optional(), entrega_papel: z.string().trim().max(40).nullable().optional(),
  entrega_persona_id: id.nullable().optional(), vence_el: fecha.nullable().optional(), inmueble_id: id.nullable().optional(),
}).strict();
const cambioDocumento = z.object({
  id, version, nombre: texto(200).optional(), grupo: z.string().trim().max(80).nullable().optional(), estado: z.enum(ESTADOS_DOCUMENTO).optional(),
  entrega_papel: z.string().trim().max(40).nullable().optional(), entrega_persona_id: id.nullable().optional(),
  vence_el: fecha.nullable().optional(), avisar_dias: z.number().int().min(0).max(365).nullable().optional(),
  paso: z.enum(PASOS_DOCUMENTO).nullable().optional(), es_contrato: z.boolean().optional(), nota: z.string().max(2000).optional(), quitar,
}).strict();

const valorHecho = z.union([z.string().trim().max(200), z.array(z.string().trim().max(60)).max(20)]).nullable();
const nuevoPunto = z.union([
  z.object({ clase: z.literal("hecho"), clave: z.string().regex(/^[a-z_]{1,40}$/), valor: valorHecho }).strict(),
  z.object({ clase: z.literal("por_averiguar"), texto: texto(500) }).strict(),
]);
const cambioPunto = z.object({ id, version, texto: texto(500).optional(), resuelto: z.boolean().optional(), a_plan: z.literal(true).optional(), quitar }).strict();

const guardaOpinion = z.object({ resultado: z.enum(RESULTADOS_OPINION).nullable().optional(), analisis: z.string().max(20000).optional() }).strict();
const cambioOpinion = guardaOpinion.extend({ id, version, pasar_al_plan: z.literal(true).optional() }).strict();
const nuevoPuntoOpinion = z.object({ texto: texto(500), quien: claveCatalogo.default("fortius") }).strict();
const cambioPuntoOpinion = z.object({ id, version, texto: texto(500).optional(), quien: claveCatalogo.optional(), a_plan: z.literal(true).optional(), quitar }).strict();

const nuevoPresupuesto = z.object({ copiar_de: id.optional() }).strict();
const cambioPresupuesto = z.object({
  id, version, estado: z.enum(ESTADOS_PRESUPUESTO).optional(), vigente_hasta: fecha.nullable().optional(),
  paga_persona_id: id.nullable().optional(), nota: z.string().max(2000).optional(),
}).strict();
const camposConcepto = {
  clase: z.enum(["honorario", "tercero"]), concepto: texto(200), monto: z.number().finite().min(0).max(999_999_999_999).nullable().optional(),
  moneda: z.enum(MONEDAS), porcentaje: z.number().finite().positive().max(100).nullable().optional(),
  base_inmueble_id: id.nullable().optional(), inmueble_id: id.nullable().optional(), tercero: z.string().trim().max(120).nullable().optional(),
};
const nuevoConcepto = z.object({ presupuesto_id: id.optional(), ...camposConcepto, moneda: camposConcepto.moneda.default("MXN"), clase: camposConcepto.clase.default("honorario") })
  .strict().refine((c) => c.monto != null || c.porcentaje != null, "Escribe el monto o el porcentaje.");
const cambioConcepto = z.object({
  id, version, clase: camposConcepto.clase.optional(), concepto: camposConcepto.concepto.optional(), monto: camposConcepto.monto,
  moneda: camposConcepto.moneda.optional(), porcentaje: camposConcepto.porcentaje, base_inmueble_id: camposConcepto.base_inmueble_id,
  inmueble_id: camposConcepto.inmueble_id, tercero: camposConcepto.tercero, quitar,
}).strict();

const nuevoCobro = z.object({
  monto, moneda: z.enum(MONEDAS).default("MXN"), forma: z.enum(FORMAS_PAGO).default("transferencia"), fecha: fecha.optional(),
  paga_persona_id: id.nullable().optional(), inmueble_id: id.nullable().optional(), concepto_id: id.nullable().optional(), nota: z.string().max(1000).optional(),
}).strict();
const cambioCobro = z.object({ id, version, monto: monto.optional(), forma: z.enum(FORMAS_PAGO).optional(), fecha: fecha.optional(), nota: z.string().max(1000).optional(), quitar }).strict();

const telefono = z.object({ pais: z.string().trim().regex(/^\+?\d{1,4}$/).default("+52"), numero: z.string().trim().min(4).max(30) }).strict();
const nuevoInteresado = z.object({
  persona_id: id.optional(), nombre: texto(160).optional(), telefono: telefono.optional(), inmuebles: z.array(id).max(50).default([]), es_ejemplo: z.boolean().optional(),
}).strict().refine((x) => Boolean(x.persona_id) !== Boolean(x.nombre), "Elige una persona o escribe su nombre.");
const cambioInteresado = z.object({
  id, version, estado: z.enum(ESTADOS_INTERESADO).optional(), nota: z.string().max(2000).optional(), inmuebles: z.array(id).max(50).optional(),
  visita: z.object({ fecha, hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(), inmueble_id: id.nullable().optional() }).strict().nullable().optional(),
  quitar,
}).strict();
const nuevaOferta = z.object({ interesado_id: id, monto, moneda: z.enum(MONEDAS).default("MXN"), inmueble_id: id.nullable().optional(), fecha: fecha.optional() }).strict();
const cambioOferta = z.object({
  id, version, monto: monto.optional(), respuesta: z.enum(RESPUESTAS_OFERTA).optional(), contraoferta_monto: monto.nullable().optional(), quitar,
}).strict();
const cambioLiga = z.object({ id, version, revocar: z.literal(true) }).strict();

export const cambioColumnas = z.array(z.object({
  clave: z.string().regex(/^[a-z0-9_]{1,40}$/), nombre: texto(60), tipo: z.enum(TIPOS_COLUMNA),
}).strict()).min(1).max(30).refine((c) => new Set(c.map((x) => x.clave)).size === c.length, "Dos columnas con la misma clave.");
const celda = z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()]);
export const datosFila = z.record(z.string().regex(/^[a-z0-9_]{1,40}$/), celda).refine((d) => Object.keys(d).length <= 30, "Demasiadas columnas.");

/** Lee el inmueble que sirve de base al porcentaje y su moneda; un honorario en porcentaje toma la moneda del precio. */
async function monedaDelInmueble(client: SupabaseClient, inmuebleId: string | null | undefined): Promise<string | null> {
  if (!inmuebleId) return null;
  const r = await client.from("fortius_inmuebles_inmuebles").select("moneda").eq("id", inmuebleId).maybeSingle();
  if (r.error) fallo(r.error);
  return (r.data as { moneda?: string } | null)?.moneda ?? null;
}

async function presupuestoVigente(client: SupabaseClient, user: StaffUser, asuntoId: string): Promise<string> {
  const r = await client.from(T.presupuestos).select("id").eq("asunto_id", asuntoId).is("deleted_at", null).order("numero", { ascending: false }).limit(1);
  if (r.error) fallo(r.error);
  const ya = (r.data?.[0] as { id: string } | undefined)?.id;
  return ya ?? (await insertar(client, T.presupuestos, { asunto_id: asuntoId, creado_por: user.id })).id;
}

async function opinionDelAsunto(client: SupabaseClient, user: StaffUser, asuntoId: string): Promise<string> {
  const r = await client.from(T.opiniones).select("id").eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  return (r.data as { id: string } | null)?.id ?? (await insertar(client, T.opiniones, { asunto_id: asuntoId, creado_por: user.id })).id;
}

export async function crearEnApartado(client: SupabaseClient, user: StaffUser, asuntoId: string, parte: ParteApartado, cuerpo: unknown, origen: string): Promise<unknown> {
  switch (parte) {
    case "documentos": {
      const e = nuevoDocumento.parse(cuerpo);
      const orden = await siguienteOrden(client, T.documentos, { asunto_id: asuntoId });
      return insertar(client, T.documentos, { asunto_id: asuntoId, ...e, grupo: e.grupo ?? "Otros", origen: "manual", orden, creado_por: user.id });
    }
    case "situacion": {
      const e = nuevoPunto.parse(cuerpo);
      if (e.clase === "hecho") {
        const r = await client.from(T.situacion).select("id,version").eq("asunto_id", asuntoId).eq("clase", "hecho").eq("clave", e.clave).is("deleted_at", null).maybeSingle();
        if (r.error) fallo(r.error);
        const previo = r.data as { id: string; version: number } | null;
        if (previo) { await actualizar(client, T.situacion, asuntoId, previo.id, previo.version, { valor: e.valor }); return { id: previo.id }; }
        return insertar(client, T.situacion, { asunto_id: asuntoId, clase: "hecho", clave: e.clave, valor: e.valor, creado_por: user.id });
      }
      const orden = await siguienteOrden(client, T.situacion, { asunto_id: asuntoId });
      return insertar(client, T.situacion, { asunto_id: asuntoId, clase: "por_averiguar", texto: e.texto, orden, creado_por: user.id });
    }
    case "opinion": {
      const e = guardaOpinion.parse(cuerpo);
      const opinionId = await opinionDelAsunto(client, user, asuntoId);
      if (Object.keys(e).length) {
        const r = await client.from(T.opiniones).select("version").eq("id", opinionId).single();
        if (r.error) fallo(r.error);
        await actualizar(client, T.opiniones, asuntoId, opinionId, (r.data as { version: number }).version, e);
      }
      return { id: opinionId };
    }
    case "opinion_puntos": {
      const e = nuevoPuntoOpinion.parse(cuerpo);
      const opinionId = await opinionDelAsunto(client, user, asuntoId);
      const orden = await siguienteOrden(client, T.opinionPuntos, { opinion_id: opinionId });
      return insertar(client, T.opinionPuntos, { opinion_id: opinionId, asunto_id: asuntoId, texto: e.texto, quien: e.quien, orden, creado_por: user.id });
    }
    case "presupuestos": {
      const e = nuevoPresupuesto.parse(cuerpo);
      const nuevo = await insertar<{ id: string; numero: number }>(client, T.presupuestos, { asunto_id: asuntoId, creado_por: user.id }, "id,numero");
      if (e.copiar_de) {
        const r = await client.from(T.conceptos).select("clase,concepto,monto,moneda,porcentaje,base_inmueble_id,inmueble_id,paga_persona_id,tercero,orden")
          .eq("presupuesto_id", e.copiar_de).eq("asunto_id", asuntoId).is("deleted_at", null);
        if (r.error) fallo(r.error);
        const filas = (r.data ?? []).map((c) => ({ ...(c as Record<string, unknown>), presupuesto_id: nuevo.id, asunto_id: asuntoId, creado_por: user.id }));
        if (filas.length) { const { error } = await client.from(T.conceptos).insert(filas); if (error) fallo(error); }
      }
      return nuevo;
    }
    case "conceptos": {
      const e = nuevoConcepto.parse(cuerpo);
      const presupuestoId = e.presupuesto_id ?? (await presupuestoVigente(client, user, asuntoId));
      const moneda = e.porcentaje != null ? (await monedaDelInmueble(client, e.base_inmueble_id)) ?? e.moneda : e.moneda;
      const orden = await siguienteOrden(client, T.conceptos, { presupuesto_id: presupuestoId });
      return insertar(client, T.conceptos, {
        presupuesto_id: presupuestoId, asunto_id: asuntoId, clase: e.clase, concepto: e.concepto, monto: e.porcentaje != null ? null : e.monto ?? null,
        moneda, porcentaje: e.porcentaje ?? null, base_inmueble_id: e.base_inmueble_id ?? null, inmueble_id: e.inmueble_id ?? null,
        tercero: e.tercero ?? null, orden, creado_por: user.id,
      });
    }
    case "cobros": {
      const e = nuevoCobro.parse(cuerpo);
      return insertar(client, T.cobros, { asunto_id: asuntoId, ...e, creado_por: user.id });
    }
    case "interesados": {
      const e = nuevoInteresado.parse(cuerpo);
      let personaId = e.persona_id;
      if (!personaId) {
        personaId = (await insertar(client, T.personas, {
          nombre: e.nombre, clase: "persona", telefonos: e.telefono ? [e.telefono] : [], es_ejemplo: e.es_ejemplo ?? false,
          responsable_id: user.id, creado_por: user.id,
        })).id;
      }
      const orden = await siguienteOrden(client, T.interesados, { asunto_id: asuntoId });
      const nuevo = await insertar(client, T.interesados, { asunto_id: asuntoId, persona_id: personaId, orden, creado_por: user.id });
      if (e.inmuebles.length) {
        const { error } = await client.from(T.interesadoInmuebles).insert(e.inmuebles.map((i) => ({ interesado_id: nuevo.id, inmueble_id: i, asunto_id: asuntoId })));
        if (error) fallo(error);
      }
      return nuevo;
    }
    case "ofertas": {
      const e = nuevaOferta.parse(cuerpo);
      const nueva = await insertar(client, T.ofertas, { asunto_id: asuntoId, ...e, creado_por: user.id });
      // Ofertar es lo último que hizo: se anota en su estado, salvo que se haya descartado.
      const r = await client.from(T.interesados).select("version,estado").eq("id", e.interesado_id).maybeSingle();
      if (r.error) fallo(r.error);
      const x = r.data as { version: number; estado: string } | null;
      if (x && x.estado !== "descartado" && x.estado !== "oferto") await actualizar(client, T.interesados, asuntoId, e.interesado_id, x.version, { estado: "oferto" });
      return nueva;
    }
    case "ligas": {
      z.object({}).strict().parse(cuerpo ?? {});
      const token = randomBytes(32).toString("base64url");
      const expira = new Date(Date.now() + DIAS_LIGA * 86_400_000).toISOString();
      const fila = await insertar<{ id: string }>(client, T.ligas, {
        asunto_id: asuntoId, token_hash: createHash("sha256").update(token).digest("hex"), expira_el: expira, creado_por: user.id,
      });
      // El enlace completo se entrega una sola vez; la base solo guarda su huella.
      return { id: fila.id, expira_el: expira, url: `${origen}/subir/${token}` };
    }
  }
}

export async function cambiarEnApartado(client: SupabaseClient, user: StaffUser, asuntoId: string, parte: ParteApartado, cuerpo: unknown): Promise<unknown> {
  switch (parte) {
    case "documentos": {
      const { id: d, version: v, quitar: q, ...c } = cambioDocumento.parse(cuerpo);
      await actualizar(client, T.documentos, asuntoId, d, v, { ...c, ...(q ? { deleted_at: ahora() } : {}) });
      return { ok: true };
    }
    case "situacion": {
      const { id: p, version: v, quitar: q, resuelto, a_plan, ...c } = cambioPunto.parse(cuerpo);
      if (a_plan) {
        const r = await client.from(T.situacion).select("texto,tarea_id").eq("id", p).eq("asunto_id", asuntoId).maybeSingle();
        if (r.error) fallo(r.error);
        const punto = r.data as { texto: string; tarea_id: string | null } | null;
        if (!punto) throw new ApiError(404, "No se encontró.");
        if (punto.tarea_id) return { tarea_id: punto.tarea_id };
        const tarea = await nuevaTarea(client, user, asuntoId, { titulo: `Averiguar: ${punto.texto}`.slice(0, 300), origen: "situacion" });
        await actualizar(client, T.situacion, asuntoId, p, v, { tarea_id: tarea });
        return { tarea_id: tarea };
      }
      await actualizar(client, T.situacion, asuntoId, p, v, {
        ...c, ...(resuelto !== undefined ? { resuelto_el: resuelto ? ahora() : null } : {}), ...(q ? { deleted_at: ahora() } : {}),
      });
      return { ok: true };
    }
    case "opinion": {
      const { id: o, version: v, pasar_al_plan, ...c } = cambioOpinion.parse(cuerpo);
      if (Object.keys(c).length) await actualizar(client, T.opiniones, asuntoId, o, v, c);
      if (!pasar_al_plan) return { ok: true };
      // Lo que hay que resolver se vuelve tarea, en su propia etapa, con quién lo hace.
      const r = await client.from(T.opinionPuntos).select("id,texto,quien,version").eq("opinion_id", o).is("tarea_id", null).is("deleted_at", null).order("orden");
      if (r.error) fallo(r.error);
      const puntos = (r.data ?? []) as { id: string; texto: string; quien: string; version: number }[];
      if (!puntos.length) return { pasadas: 0 };
      const etapa = await etapaLlamada(client, user, asuntoId, "Lo que hay que resolver");
      for (const p of puntos) {
        const tarea = await nuevaTarea(client, user, asuntoId, { titulo: p.texto, quien: p.quien, etapa_id: etapa, origen: "opinion" });
        await actualizar(client, T.opinionPuntos, asuntoId, p.id, p.version, { tarea_id: tarea });
      }
      return { pasadas: puntos.length };
    }
    case "opinion_puntos": {
      const { id: p, version: v, quitar: q, a_plan, ...c } = cambioPuntoOpinion.parse(cuerpo);
      if (a_plan) {
        const r = await client.from(T.opinionPuntos).select("texto,quien,tarea_id").eq("id", p).eq("asunto_id", asuntoId).maybeSingle();
        if (r.error) fallo(r.error);
        const punto = r.data as { texto: string; quien: string; tarea_id: string | null } | null;
        if (!punto) throw new ApiError(404, "No se encontró.");
        if (punto.tarea_id) return { tarea_id: punto.tarea_id };
        const etapa = await etapaLlamada(client, user, asuntoId, "Lo que hay que resolver");
        const tarea = await nuevaTarea(client, user, asuntoId, { titulo: punto.texto, quien: punto.quien, etapa_id: etapa, origen: "opinion" });
        await actualizar(client, T.opinionPuntos, asuntoId, p, v, { tarea_id: tarea });
        return { tarea_id: tarea };
      }
      await actualizar(client, T.opinionPuntos, asuntoId, p, v, { ...c, ...(q ? { deleted_at: ahora() } : {}) });
      return { ok: true };
    }
    case "presupuestos": {
      const { id: p, version: v, ...c } = cambioPresupuesto.parse(cuerpo);
      await actualizar(client, T.presupuestos, asuntoId, p, v, c);
      return { ok: true };
    }
    case "conceptos": {
      const { id: c0, version: v, quitar: q, ...c } = cambioConcepto.parse(cuerpo);
      const limpio: Record<string, unknown> = Object.fromEntries(Object.entries(c).filter(([, x]) => x !== undefined));
      if (limpio.porcentaje != null) limpio.monto = null;
      await actualizar(client, T.conceptos, asuntoId, c0, v, { ...limpio, ...(q ? { deleted_at: ahora() } : {}) });
      return { ok: true };
    }
    case "cobros": {
      const { id: c0, version: v, quitar: q, ...c } = cambioCobro.parse(cuerpo);
      await actualizar(client, T.cobros, asuntoId, c0, v, { ...c, ...(q ? { deleted_at: ahora() } : {}) });
      return { ok: true };
    }
    case "interesados": {
      const { id: i, version: v, quitar: q, inmuebles, visita, ...c } = cambioInteresado.parse(cuerpo);
      if (Object.keys(c).length || q) await actualizar(client, T.interesados, asuntoId, i, v, { ...c, ...(q ? { deleted_at: ahora() } : {}) });
      if (inmuebles) {
        const { error } = await client.from(T.interesadoInmuebles).delete().eq("interesado_id", i).eq("asunto_id", asuntoId);
        if (error) fallo(error);
        if (inmuebles.length) {
          const r = await client.from(T.interesadoInmuebles).insert(inmuebles.map((x) => ({ interesado_id: i, inmueble_id: x, asunto_id: asuntoId })));
          if (r.error) fallo(r.error);
        }
      }
      if (visita !== undefined) await ponerVisita(client, user, asuntoId, i, visita);
      return { ok: true };
    }
    case "ofertas": {
      const { id: o, version: v, quitar: q, ...c } = cambioOferta.parse(cuerpo);
      await actualizar(client, T.ofertas, asuntoId, o, v, { ...c, ...(q ? { deleted_at: ahora() } : {}) });
      return { ok: true };
    }
    case "ligas": {
      const { id: l, version: v } = cambioLiga.parse(cuerpo);
      await actualizar(client, T.ligas, asuntoId, l, v, { revocada: true });
      return { ok: true };
    }
  }
}

/** La visita de un interesado es una tarea del plan con su día y su hora: así sale en Inicio. Una por interesado; vacía, se quita. */
async function ponerVisita(client: SupabaseClient, user: StaffUser, asuntoId: string, interesadoId: string,
  visita: { fecha: string; hora?: string | null; inmueble_id?: string | null } | null) {
  const r = await client.from(T.tareas).select("id,version").eq("asunto_id", asuntoId).eq("interesado_id", interesadoId).eq("clase", "visita")
    .eq("estado", "pendiente").is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
  if (r.error) fallo(r.error);
  const previa = r.data?.[0] as { id: string; version: number } | undefined;
  if (!visita) {
    if (previa) await actualizar(client, T.tareas, asuntoId, previa.id, previa.version, { deleted_at: ahora() });
    return;
  }
  if (previa) {
    await actualizar(client, T.tareas, asuntoId, previa.id, previa.version, { fecha: visita.fecha, hora: visita.hora ?? null, inmueble_id: visita.inmueble_id ?? null });
    return;
  }
  const n = await client.from(T.interesados).select("persona:fortius_inmuebles_personas(nombre)").eq("id", interesadoId).maybeSingle();
  if (n.error) fallo(n.error);
  const nombre = (n.data as unknown as { persona: { nombre: string } | null } | null)?.persona?.nombre ?? "interesado";
  await nuevaTarea(client, user, asuntoId, {
    titulo: `Visita con ${nombre}`.slice(0, 300), clase: "visita", interesado_id: interesadoId, inmueble_id: visita.inmueble_id ?? null,
    fecha: visita.fecha, hora: visita.hora ?? null,
  });
}

// ── Archivos ─────────────────────────────────────────────────────────────────────────────────────────
type Leido = { bytes: Uint8Array; mime: string; ext: string; nombre: string };

/** Revisa la firma (PDF o foto) y le quita a las fotos la ubicación y los datos de la cámara. */
export async function leerArchivo(file: File): Promise<Leido> {
  if (file.size < 1 || file.size > TAMANO_MAXIMO_ARCHIVO) throw new ApiError(413, "Cada archivo puede pesar hasta 20 MB");
  const crudo = new Uint8Array(await file.arrayBuffer());
  const firma = FIRMAS.find((f) => f.es(crudo));
  if (!firma) throw new ApiError(415, "Solo PDF o fotos (JPG, PNG o WebP)");
  const limpio = firma.mime.startsWith("image/") ? await sinMetadatos(new File([crudo], "x", { type: firma.mime }), firma.mime) : null;
  return { bytes: limpio ? new Uint8Array(await limpio.arrayBuffer()) : crudo, mime: firma.mime, ext: firma.ext, nombre: limpiarNombre(file.name, `archivo.${firma.ext}`) };
}

/** Sube al bucket privado y anota el archivo en su documento. Si la anotación falla, el archivo se borra. */
export async function guardarArchivo(privileged: SupabaseClient, asuntoId: string, documentoId: string, a: Leido, subidoPor: string | null, porCliente = false) {
  const path = `asuntos/${asuntoId}/${randomUUID()}.${a.ext}`;
  const subido = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, a.bytes, { contentType: a.mime, upsert: false });
  if (subido.error) throw new ApiError(502, "No se pudo subir el archivo. Vuelve a intentarlo.");
  const r = await privileged.from(T.archivos).insert({
    documento_id: documentoId, asunto_id: asuntoId, path, nombre_original: a.nombre, mime: a.mime, byte_length: a.bytes.byteLength,
    sha256: createHash("sha256").update(a.bytes).digest("hex"), subido_por: subidoPor, por_cliente: porCliente,
  });
  if (r.error) { await privileged.storage.from(BUCKET_EXPEDIENTES).remove([path]); fallo(r.error); }
}

const palabras = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
const PARECIDOS: Record<string, string[]> = { ine: ["identificacion", "credencial", "ine"], curp: ["curp"], rfc: ["rfc", "fiscal"], acta: ["acta"], predial: ["predial"], escritura: ["escritura"] };

/** «Subir varios»: el renglón cuyo nombre más se parece al del archivo (entre los que faltan primero). */
export function renglonParecido(nombreArchivo: string, docs: { id: string; nombre: string; estado: string }[]): string | null {
  const w = new Set(palabras(nombreArchivo.replace(/\.[a-z0-9]{2,5}$/i, "")));
  for (const [clave, sin] of Object.entries(PARECIDOS)) if (sin.some((s) => w.has(s))) w.add(clave);
  let mejor: { id: string; puntos: number } | null = null;
  for (const d of docs) {
    const dw = palabras(d.nombre);
    for (const [clave, sin] of Object.entries(PARECIDOS)) if (sin.some((s) => dw.includes(s))) dw.push(clave);
    const puntos = dw.filter((x) => w.has(x)).length * 2 + (d.estado === "falta" ? 1 : 0);
    if (dw.some((x) => w.has(x)) && (!mejor || puntos > mejor.puntos)) mejor = { id: d.id, puntos };
  }
  return mejor?.id ?? null;
}

const nombreSinExtension = (n: string) => n.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 200) || "Documento";

/** Sube uno o varios archivos al asunto. Cada destino sabe en qué renglón cae. */
export async function subirAlAsunto(client: SupabaseClient, user: StaffUser, asuntoId: string, destino: Destino, archivos: File[], ref: string | null): Promise<ResultadoSubida[]> {
  const visto = await client.from(T.asuntos).select("id").eq("id", asuntoId).is("deleted_at", null).maybeSingle();
  if (visto.error) fallo(visto.error);
  if (!visto.data) throw new ApiError(404, "Ese asunto no existe o no te toca verlo.");
  if (!archivos.length) throw new ApiError(400, "Adjunta al menos un archivo");
  if (archivos.length > 30) throw new ApiError(400, "Hasta 30 archivos a la vez");
  const leidos = await Promise.all(archivos.map(leerArchivo));
  const privileged = createServerClient(undefined, true);

  if (destino === "fila") {
    if (!ref) throw new ApiError(400, "Falta el renglón");
    const f = await client.from(T.filas).select("id,version").eq("id", ref).eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle();
    if (f.error) fallo(f.error);
    if (!f.data) throw new ApiError(404, "No se encontró el renglón.");
    const a = leidos[0];
    if (!a.mime.startsWith("image/")) throw new ApiError(415, "La tarjeta lleva una foto (JPG, PNG o WebP)");
    const path = `asuntos/${asuntoId}/${randomUUID()}.${a.ext}`;
    const subido = await privileged.storage.from(BUCKET_EXPEDIENTES).upload(path, a.bytes, { contentType: a.mime, upsert: false });
    if (subido.error) throw new ApiError(502, "No se pudo subir la foto. Vuelve a intentarlo.");
    await actualizar(client, T.filas, asuntoId, ref, (f.data as { version: number }).version, { foto_path: path });
    return [{ nombre: a.nombre, documento: ref, nuevo: false }];
  }

  const docs = await client.from(T.documentos).select("id,nombre,estado,version").eq("asunto_id", asuntoId).is("deleted_at", null);
  if (docs.error) fallo(docs.error);
  const lista = (docs.data ?? []) as { id: string; nombre: string; estado: string; version: number }[];
  const resultado: ResultadoSubida[] = [];

  const crearDoc = async (nombre: string, extra: Record<string, unknown>) => {
    const orden = await siguienteOrden(client, T.documentos, { asunto_id: asuntoId });
    const d = await insertar<{ id: string; version: number }>(client, T.documentos, {
      asunto_id: asuntoId, nombre, estado: "recibido", origen: "manual", orden, creado_por: user.id, ...extra,
    }, "id,version");
    lista.push({ id: d.id, nombre, estado: "recibido", version: d.version });
    return d;
  };
  const marcarRecibido = async (docId: string) => {
    const d = lista.find((x) => x.id === docId);
    if (d && d.estado !== "recibido") {
      await actualizar(client, T.documentos, asuntoId, docId, d.version, { estado: "recibido" });
      d.estado = "recibido"; d.version += 1;
    }
  };

  // La tarea y su renglón: se busca una vez; si no tiene, el primer archivo crea el renglón y los demás van ahí.
  let tarea: { id: string; titulo: string; documento_id: string | null; version: number } | null = null;
  if (destino === "tarea") {
    if (!ref) throw new ApiError(400, "Falta la tarea");
    const t = await client.from(T.tareas).select("id,titulo,documento_id,version").eq("id", ref).eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle();
    if (t.error) fallo(t.error);
    if (!t.data) throw new ApiError(404, "No se encontró la tarea.");
    tarea = t.data as { id: string; titulo: string; documento_id: string | null; version: number };
    if (tarea.documento_id && !lista.some((d) => d.id === tarea?.documento_id)) tarea.documento_id = null;
  }

  for (const a of leidos) {
    let docId: string;
    let nuevo = false;
    if (tarea) {
      if (tarea.documento_id) docId = tarea.documento_id;
      else {
        docId = (await crearDoc(tarea.titulo.trim().slice(0, 200) || nombreSinExtension(a.nombre), { grupo: "Otros" })).id; nuevo = true;
        await actualizar(client, T.tareas, asuntoId, tarea.id, tarea.version, { documento_id: docId });
        tarea.documento_id = docId; tarea.version += 1;
      }
    } else if (destino === "documento" || destino === "firmado") {
      if (!ref || !lista.some((d) => d.id === ref)) throw new ApiError(404, "No se encontró el documento.");
      docId = ref;
    } else if (destino === "varios") {
      const parecido = renglonParecido(a.nombre, lista);
      if (parecido) docId = parecido;
      else { docId = (await crearDoc(nombreSinExtension(a.nombre), { grupo: "Otros" })).id; nuevo = true; }
    } else if (destino === "contrato") {
      const ya = lista.find((d) => d.nombre === "Contrato firmado");
      docId = ya?.id ?? (await crearDoc("Contrato firmado", { grupo: "Contratos", es_contrato: true, paso: "firmado" })).id;
      nuevo = !ya;
    } else if (destino === "opinion") {
      const d = await crearDoc("Opinión jurídica", { grupo: "Opinión jurídica" });
      docId = d.id; nuevo = true;
      const o = await opinionDelAsunto(client, user, asuntoId);
      const r = await client.from(T.opiniones).select("version").eq("id", o).single();
      if (r.error) fallo(r.error);
      await actualizar(client, T.opiniones, asuntoId, o, (r.data as { version: number }).version, { documento_id: docId });
    } else {
      const p = await presupuestoVigente(client, user, asuntoId);
      const r = await client.from(T.presupuestos).select("numero,version").eq("id", p).single();
      if (r.error) fallo(r.error);
      const pr = r.data as { numero: number; version: number };
      const d = await crearDoc(`Presupuesto ${pr.numero}`, { grupo: "Honorarios" });
      docId = d.id; nuevo = true;
      await actualizar(client, T.presupuestos, asuntoId, p, pr.version, { documento_id: docId });
    }
    await guardarArchivo(privileged, asuntoId, docId, a, user.id);
    await marcarRecibido(docId);
    // El firmado de un documento hecho aquí (un contrato por preguntas): queda como firmado en su renglón.
    if (destino === "firmado") {
      const d = lista.find((x) => x.id === docId);
      if (d) { await actualizar(client, T.documentos, asuntoId, docId, d.version, { paso: "firmado" }); d.version += 1; }
    }
    resultado.push({ nombre: a.nombre, documento: lista.find((d) => d.id === docId)?.nombre ?? "", nuevo });
  }
  return resultado;
}

/** Enlace firmado por un minuto para ver un archivo del asunto (solo si quien entró ve el asunto). */
export async function enlaceArchivo(client: SupabaseClient, asuntoId: string, archivoId: string): Promise<string> {
  const r = await client.from(T.archivos).select("path,nombre_original").eq("id", archivoId).eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  const a = r.data as { path: string; nombre_original: string } | null;
  if (!a) throw new ApiError(404, "No se encontró el archivo.");
  const s = await createServerClient(undefined, true).storage.from(BUCKET_EXPEDIENTES).createSignedUrl(a.path, 60);
  if (s.error || !s.data?.signedUrl) throw new ApiError(502, "No se pudo abrir el archivo.");
  return s.data.signedUrl;
}

// ── Recibo ───────────────────────────────────────────────────────────────────────────────────────────
/** «Hacer recibo»: el formato de recibo ya lleno con el monto, la persona y el asunto. Queda en Documentos como borrador. */
export async function hacerRecibo(client: SupabaseClient, user: StaffUser, asuntoId: string, cobroId: string): Promise<{ documento_id: string }> {
  const [a, c] = await Promise.all([
    client.from(T.asuntos).select("folio,nombre").eq("id", asuntoId).is("deleted_at", null).maybeSingle(),
    client.from(T.cobros).select("id,monto,moneda,forma,fecha,paga_persona_id,inmueble_id,concepto_id,recibo_documento_id,version,nota").eq("id", cobroId).eq("asunto_id", asuntoId).is("deleted_at", null).maybeSingle(),
  ]);
  if (a.error) fallo(a.error);
  if (c.error) fallo(c.error);
  if (!a.data || !c.data) throw new ApiError(404, "No se encontró el cobro.");
  const asunto = a.data as { folio: string; nombre: string };
  const cobro = c.data as Cobro & { recibo_documento_id: string | null };
  if (cobro.recibo_documento_id) return { documento_id: cobro.recibo_documento_id };
  const [persona, inmueble, concepto] = await Promise.all([
    cobro.paga_persona_id ? client.from(T.personas).select("nombre").eq("id", cobro.paga_persona_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    cobro.inmueble_id ? client.from("fortius_inmuebles_inmuebles").select("nombre,colonia,ciudad").eq("id", cobro.inmueble_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    cobro.concepto_id ? client.from(T.conceptos).select("concepto").eq("id", cobro.concepto_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const r of [persona, inmueble, concepto]) if (r.error) fallo(r.error);
  // El número lo reserva la base al crear el renglón (consecutivo por asunto, sin repetirse aunque se hagan dos a la vez);
  // también le pone el nombre «Recibo FOLIO-R01».
  const orden = await siguienteOrden(client, T.documentos, { asunto_id: asuntoId });
  const doc = await insertar<{ id: string; recibo_numero: number; version: number }>(client, T.documentos, {
    asunto_id: asuntoId, nombre: "Recibo", grupo: "Honorarios", estado: "recibido", origen: "formato", paso: "borrador",
    es_recibo: true, inmueble_id: cobro.inmueble_id, orden, creado_por: user.id,
  }, "id,recibo_numero,version");
  const numero = `${asunto.folio}-R${String(doc.recibo_numero).padStart(2, "0")}`;
  try {
    const inm = inmueble.data as { nombre: string; colonia: string | null; ciudad: string | null } | null;
    const { importePromesaLetra } = await import("@/lib/formatos/promesa");
    let letra = "";
    try { letra = importePromesaLetra(Number(cobro.monto), cobro.moneda); } catch { /* fuera de rango: queda en blanco */ }
    const datos: Record<string, unknown> = {
      numeroRecibo: numero, fechaPago: cobro.fecha, pagador: (persona.data as { nombre?: string } | null)?.nombre ?? "",
      importeRecibido: Number(cobro.monto), moneda: cobro.moneda, importeLetra: letra,
      concepto: (concepto.data as { concepto?: string } | null)?.concepto ?? "honorarios",
      inmueble: inm ? [inm.nombre, inm.colonia, inm.ciudad].filter(Boolean).join(", ") : "", folio: asunto.folio,
      medioPago: { transferencia: "Transferencia", efectivo: "Efectivo", cheque: "Cheque", tarjeta: "Tarjeta", otro: "Otro" }[cobro.forma],
    };
    const { createFormatoPdf } = await import("@/lib/formatos/pdf");
    const bytes = await createFormatoPdf("18", datos, [], { incompleto: true });
    await guardarArchivo(createServerClient(undefined, true), asuntoId, doc.id, { bytes, mime: "application/pdf", ext: "pdf", nombre: `Recibo-${numero}.pdf` }, user.id);
    await actualizar(client, T.cobros, asuntoId, cobro.id, cobro.version, { recibo_documento_id: doc.id });
  } catch (e) {
    // Si no se terminó (o el cobro ya tenía su recibo hecho en otra ventana), el renglón va a Eliminados: recuperable.
    await client.from(T.documentos).update({ deleted_at: ahora() }).eq("id", doc.id).eq("asunto_id", asuntoId);
    throw e;
  }
  return { documento_id: doc.id };
}

// ── Continuar en un asunto nuevo ─────────────────────────────────────────────────────────────────────
export const continuarSchema = z.object({ nombre: z.string().trim().max(160).optional(), encargos: z.array(claveCatalogo).max(20).optional() }).strict();

/** Copia personas, inmuebles y documentos con sus archivos. Los archivos se copian en el almacén para que cada asunto tenga los suyos. */
export async function continuarAsunto(client: SupabaseClient, user: StaffUser, asuntoId: string, e: z.infer<typeof continuarSchema>,
  apartadosPara: (encargos: string[]) => string[]): Promise<{ id: string; folio: string }> {
  // Conserva los papeles y encargos del asunto original aunque ya no se ofrezcan; un encargo nuevo sí tiene que ofrecerse.
  const r = await client.rpc("fortius_inmuebles_continuar_asunto_conservando", { p_asunto: asuntoId, p_nombre: e.nombre ?? null, p_encargos: e.encargos ?? null });
  if (r.error) fallo(r.error);
  const nuevo = r.data as { id: string; folio: string; documentos: Record<string, string> };
  // Los apartados del asunto de antes que estaban a la vista, más los que pide lo encargado.
  const ap = await client.from(T.apartados).select("clave,orden").eq("asunto_id", asuntoId).eq("visible", true).is("deleted_at", null).neq("clave", "propio");
  if (ap.error) fallo(ap.error);
  const enc = await client.from(T.asuntos).select("encargos").eq("id", nuevo.id).single();
  if (enc.error) fallo(enc.error);
  const claves = new Set([...(ap.data ?? []).map((x) => (x as { clave: string }).clave), ...apartadosPara((enc.data as { encargos: string[] }).encargos)]);
  const ya = await client.from(T.apartados).select("clave").eq("asunto_id", nuevo.id);
  if (ya.error) fallo(ya.error);
  const tiene = new Set((ya.data ?? []).map((x) => (x as { clave: string }).clave));
  const orden = new Map((ap.data ?? []).map((x) => [(x as { clave: string }).clave, (x as { orden: number }).orden]));
  const faltan = [...claves].filter((c) => !tiene.has(c));
  if (faltan.length) {
    const { error } = await client.from(T.apartados).insert(faltan.map((clave) => ({ asunto_id: nuevo.id, clave, orden: orden.get(clave) ?? 50, creado_por: user.id })));
    if (error) fallo(error);
  }
  const viejos = Object.keys(nuevo.documentos ?? {});
  if (viejos.length) {
    const privileged = createServerClient(undefined, true);
    const ar = await client.from(T.archivos).select("documento_id,path,nombre_original,mime,byte_length,sha256,por_cliente").eq("asunto_id", asuntoId).is("deleted_at", null).in("documento_id", viejos);
    if (ar.error) fallo(ar.error);
    for (const x of (ar.data ?? []) as { documento_id: string; path: string; nombre_original: string; mime: string; byte_length: number; sha256: string; por_cliente: boolean }[]) {
      const destino = `asuntos/${nuevo.id}/${randomUUID()}.${x.path.split(".").pop()}`;
      const copia = await privileged.storage.from(BUCKET_EXPEDIENTES).copy(x.path, destino);
      if (copia.error) continue; // El documento queda en la lista; su archivo se vuelve a subir si hace falta.
      const ins = await privileged.from(T.archivos).insert({
        documento_id: nuevo.documentos[x.documento_id], asunto_id: nuevo.id, path: destino, nombre_original: x.nombre_original, mime: x.mime,
        byte_length: x.byte_length, sha256: x.sha256, subido_por: user.id, por_cliente: x.por_cliente,
      });
      if (ins.error) await privileged.storage.from(BUCKET_EXPEDIENTES).remove([destino]);
    }
  }
  return { id: nuevo.id, folio: nuevo.folio };
}

// ── Liga del cliente (sin sesión) ────────────────────────────────────────────────────────────────────
const huella = (token: string) => createHash("sha256").update(token).digest("hex");
export const tokenValido = (token: string) => /^[\w-]{43}$/.test(token);
export const MAX_SUBIDAS_LIGA = 60;

type LigaViva = { id: string; asunto_id: string; subidos: number; expira_el: string };

/** La liga vigente, con su asunto vivo y quien la creó todavía activo. Si algo falla, no existe. */
async function ligaViva(privileged: SupabaseClient, token: string): Promise<LigaViva | null> {
  if (!tokenValido(token)) return null;
  const l = await privileged.from(T.ligas).select("id,asunto_id,subidos,expira_el,creado_por").eq("token_hash", huella(token)).eq("revocada", false).gt("expira_el", ahora()).maybeSingle();
  if (l.error || !l.data) return null;
  const liga = l.data as LigaViva & { creado_por: string | null };
  const [a, s] = await Promise.all([
    privileged.from(T.asuntos).select("id,en_que_va").eq("id", liga.asunto_id).is("deleted_at", null).maybeSingle(),
    liga.creado_por ? privileged.from("fortius_inmuebles_staff").select("active").eq("user_id", liga.creado_por).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (a.error || !a.data || (a.data as { en_que_va: string }).en_que_va === "cerrado") return null;
  if (s.error || !(s.data as { active?: boolean } | null)?.active) return null;
  return liga;
}

/** Lo que ve el cliente: solo los nombres de los documentos que faltan. Ni su nombre, ni el del asunto, ni lo ya recibido. */
export async function leerLiga(token: string): Promise<{ faltan: { id: string; nombre: string }[]; expira_el: string; quedan: number } | null> {
  const privileged = createServerClient(undefined, true);
  const liga = await ligaViva(privileged, token);
  if (!liga) return null;
  const d = await privileged.from(T.documentos).select("id,nombre").eq("asunto_id", liga.asunto_id).eq("estado", "falta").is("deleted_at", null).order("orden").limit(100);
  if (d.error) return null;
  return { faltan: (d.data ?? []) as { id: string; nombre: string }[], expira_el: liga.expira_el, quedan: Math.max(0, MAX_SUBIDAS_LIGA - liga.subidos) };
}

/** El cliente sube un archivo: cae en el renglón que eligió (o en uno nuevo) y queda recibido, marcado como suyo. */
export async function subirPorLiga(token: string, file: File, documentoId: string | null): Promise<{ documento: string } | null> {
  const privileged = createServerClient(undefined, true);
  const liga = await ligaViva(privileged, token);
  if (!liga) return null;
  if (liga.subidos >= MAX_SUBIDAS_LIGA) throw new ApiError(429, "Esta liga ya recibió muchos archivos. Pídele a tu asesor una nueva.");
  // Se cuenta antes de subir (y con la versión), para que dos envíos a la vez no pasen el tope.
  const cuenta = await privileged.from(T.ligas).update({ subidos: liga.subidos + 1, ultimo_uso: ahora() }).eq("id", liga.id).eq("subidos", liga.subidos).select("id").maybeSingle();
  if (cuenta.error || !cuenta.data) throw new ApiError(409, "Vuelve a intentarlo.");
  const a = await leerArchivo(file);
  type DocLiga = { id: string; nombre: string; version: number; estado: string };
  let doc: DocLiga | null = null;
  if (documentoId) {
    const r = await privileged.from(T.documentos).select("id,nombre,version,estado").eq("id", documentoId).eq("asunto_id", liga.asunto_id).is("deleted_at", null).maybeSingle();
    if (r.error) fallo(r.error);
    doc = r.data as DocLiga | null;
    if (!doc) throw new ApiError(404, "Ese documento ya no está en la lista.");
  } else {
    const orden = await siguienteOrden(privileged, T.documentos, { asunto_id: liga.asunto_id });
    const r = await privileged.from(T.documentos).insert({
      asunto_id: liga.asunto_id, nombre: nombreSinExtension(a.nombre), grupo: "Lo que subió el cliente", estado: "recibido", origen: "cliente", orden,
    }).select("id,nombre,version,estado").single();
    if (r.error) fallo(r.error);
    doc = r.data as DocLiga | null;
  }
  await guardarArchivo(privileged, liga.asunto_id, doc!.id, a, null, true);
  if (doc!.estado !== "recibido") {
    const u = await privileged.from(T.documentos).update({ estado: "recibido" }).eq("id", doc!.id).eq("version", doc!.version);
    if (u.error) fallo(u.error);
  }
  await privileged.from(T.historial).insert({
    entidad: "documento", entidad_id: doc!.id, asunto_id: liga.asunto_id, clase: "nota", resumen: `El cliente subió ${doc!.nombre} por su liga.`, actor_tipo: "publico",
  });
  return { documento: doc!.nombre };
}
