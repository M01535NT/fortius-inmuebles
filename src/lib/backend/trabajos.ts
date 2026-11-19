import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { formatoById } from "@/lib/formatos/catalog";
import { fechasDeHoy } from "@/lib/formatos/datos-expediente";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import { draftWrite } from "@/lib/formatos/schemas";
import { faltantes } from "@/lib/panel/datos/formatos";
import {
  aDevolver, CURP, delAsunto, LEGALES_INMUEBLE, mezclar, RFC, tipoParaFormato,
  type Fuentes, type InmuebleFuente, type Lado, type PersonaFuente,
} from "@/lib/panel/documentos/diccionario";

import { guardarArchivo } from "./apartados";
import { fallo } from "./fallo";
import { createServerClient } from "./auth";
import type { StaffUser } from "./contracts";
import { datosFortius } from "./datos-fortius";
import { ApiError } from "./http";
import {
  CLASES_TRABAJO, FORMATOS_CONTRATO, HERRAMIENTAS, NOMBRE_HERRAMIENTA,
  type FilaTrabajo, type Herramienta, type ResultadoGuardar, type Trabajo, type TrabajoAbierto,
} from "./trabajos-contrato";

/**
 * Documentos por preguntas y Herramientas (etapa 6 de PLAN.md; SPEC.md, secciones 8 y 9).
 * Todo con la sesión de quien entró: la base decide qué ve (RLS). El PDF lo arma el mismo motor de siempre y, si el
 * trabajo es de un asunto, queda en sus Documentos (lo sube el servidor con la llave privilegiada tras comprobar el acceso).
 */

const T = {
  trabajos: "fortius_inmuebles_trabajos",
  asuntos: "fortius_inmuebles_asuntos",
  personas: "fortius_inmuebles_personas",
  papeles: "fortius_inmuebles_asunto_personas",
  legalesPersona: "fortius_inmuebles_persona_datos_legales",
  inmuebles: "fortius_inmuebles_inmuebles",
  asuntoInmuebles: "fortius_inmuebles_asunto_inmuebles",
  legalesInmueble: "fortius_inmuebles_inmueble_datos_legales",
  documentos: "fortius_inmuebles_asunto_documentos",
  archivos: "fortius_inmuebles_documento_archivos",
} as const;

const COLUMNAS = "id,asunto_id,clase,tipo,nombre,datos,resultado,documento_id,pdf_version,persona_id,inmueble_id,responsable_id,version,created_at,updated_at";
const PAPELES_PROPIETARIO = ["propietario", "vendedor", "titular", "copropietario", "heredero"];
const PAPELES_COMPRADOR = ["comprador", "inquilino"];
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// ── Validación ───────────────────────────────────────────────────────────────────────────────────────
const id = z.uuid();
const datosSchema = draftWrite.shape.data;
const tipoSchema = z.string().regex(/^[0-9A-Za-z_]{1,20}$/);
export const crearTrabajoSchema = z.object({
  clase: z.enum(CLASES_TRABAJO), tipo: tipoSchema, asunto_id: id.nullable().optional(),
  datos: datosSchema.optional(), resultado: z.string().trim().max(300).optional(),
}).strict();
export const cambioTrabajoSchema = z.object({
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
  datos: datosSchema.optional(),
  resultado: z.string().trim().max(300).nullable().optional(),
  /** «Pasar a un asunto»: un trabajo suelto se cuelga de un asunto una sola vez. */
  asunto_id: id.optional(),
  /** Mandar a Eliminados (recuperable). */
  quitar: z.literal(true).optional(),
}).strict();

// ── Lo que el asunto ya sabe ─────────────────────────────────────────────────────────────────────────
type FilaPersona = { id: string; nombre: string; fallecida: boolean; telefonos: { pais: string; numero: string }[]; correo: string | null; version: number };
type FilaLegales = {
  nombre_completo: string | null; estado_civil: string | null; curp: string | null; rfc: string | null; identificacion_tipo: string | null;
  identificacion_numero: string | null; domicilio: { texto?: string } | null; nacionalidad: string | null; version: number;
};
type FilaInmueble = { id: string; folio: string; nombre: string; tipo: string | null; colonia: string | null; ciudad: string | null; direccion_exacta: string | null;
  precio: number | null; moneda: string; ficha: Record<string, unknown>; version: number };
type FilaLegalesInmueble = Record<(typeof LEGALES_INMUEBLE)[number], string | null> & { version: number };

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const cifra = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined);

function personaFuente(p: FilaPersona, l: FilaLegales | null): PersonaFuente {
  const tel = p.telefonos?.[0];
  return {
    id: p.id, nombre: l?.nombre_completo ?? p.nombre,
    valores: {
      nombre: l?.nombre_completo ?? p.nombre, telefono: tel ? `${tel.pais === "+52" ? "" : `${tel.pais} `}${tel.numero}` : undefined, correo: p.correo ?? undefined,
      estado_civil: texto(l?.estado_civil), curp: texto(l?.curp), rfc: texto(l?.rfc),
      identificacion: [l?.identificacion_tipo, l?.identificacion_numero].filter(Boolean).join(" ") || undefined,
      domicilio: texto(l?.domicilio?.texto), nacionalidad: texto(l?.nacionalidad),
    },
  };
}

function inmuebleFuente(i: FilaInmueble, l: FilaLegalesInmueble | null): InmuebleFuente {
  const domicilio = [i.direccion_exacta || i.nombre, i.colonia, i.ciudad].filter(Boolean).join(", ");
  const valores: InmuebleFuente["valores"] = {
    domicilio, tipo: i.tipo ? tipoParaFormato(i.tipo) : undefined,
    terreno: cifra(i.ficha?.terreno), construccion: cifra(i.ficha?.construccion), recamaras: cifra(i.ficha?.recamaras), banos: cifra(i.ficha?.banos),
    precio: i.moneda === "MXN" && i.precio !== null ? Number(i.precio) : undefined,
  };
  for (const k of LEGALES_INMUEBLE) if (l?.[k]) valores[k] = l[k] as string;
  return { id: i.id, nombre: i.nombre, valores };
}

type Lados = { fuentes: Fuentes; propietario: string | null; comprador: string | null; inmueble: string | null };

/** Quién vende, quién compra y qué inmueble: los de un papel de cada lado (el principal primero, nunca un fallecido). */
async function ladosDelAsunto(client: SupabaseClient, asuntoId: string, personaId: string | null, inmuebleId: string | null): Promise<Lados> {
  const [pa, ai] = await Promise.all([
    client.from(T.papeles).select("persona_id,papel,principal,orden,persona:fortius_inmuebles_personas(id,nombre,fallecida,telefonos,correo,version)")
      .eq("asunto_id", asuntoId).is("retirado_el", null).order("principal", { ascending: false }).order("orden"),
    client.from(T.asuntoInmuebles).select("inmueble_id,orden").eq("asunto_id", asuntoId).is("retirado_el", null).order("orden"),
  ]);
  if (pa.error) fallo(pa.error);
  if (ai.error) fallo(ai.error);
  const papeles = (pa.data ?? []) as unknown as { persona_id: string; papel: string; persona: FilaPersona | null }[];
  const vivo = (x: { persona: FilaPersona | null }) => x.persona && !x.persona.fallecida;
  const prop = (personaId ? papeles.find((x) => x.persona_id === personaId) : undefined) ?? papeles.find((x) => PAPELES_PROPIETARIO.includes(x.papel) && vivo(x));
  const comp = papeles.find((x) => PAPELES_COMPRADOR.includes(x.papel) && vivo(x) && x.persona_id !== prop?.persona_id);
  const inmId = inmuebleId ?? ((ai.data ?? []) as { inmueble_id: string }[])[0]?.inmueble_id ?? null;
  const ids = [prop?.persona_id, comp?.persona_id].filter((x): x is string => Boolean(x));
  const [leg, inm, legInm] = await Promise.all([
    ids.length ? client.from(T.legalesPersona).select("persona_id,nombre_completo,estado_civil,curp,rfc,identificacion_tipo,identificacion_numero,domicilio,nacionalidad,version").in("persona_id", ids) : Promise.resolve({ data: [], error: null }),
    inmId ? client.from(T.inmuebles).select("id,folio,nombre,tipo,colonia,ciudad,direccion_exacta,precio,moneda,ficha,version").eq("id", inmId).is("deleted_at", null).maybeSingle() : Promise.resolve({ data: null, error: null }),
    inmId ? client.from(T.legalesInmueble).select(`${LEGALES_INMUEBLE.join(",")},version`).eq("inmueble_id", inmId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const r of [leg, inm, legInm]) if (r.error) fallo(r.error);
  const legales = (leg.data ?? []) as unknown as (FilaLegales & { persona_id: string })[];
  const fuentePara = (x: typeof prop) => (x?.persona ? personaFuente(x.persona, legales.find((l) => l.persona_id === x.persona_id) ?? null) : null);
  const inmueble = inm.data as FilaInmueble | null;
  return {
    fuentes: { propietario: fuentePara(prop), comprador: fuentePara(comp), inmueble: inmueble ? inmuebleFuente(inmueble, legInm.data as unknown as FilaLegalesInmueble | null) : null },
    propietario: prop?.persona_id ?? null, comprador: comp?.persona_id ?? null, inmueble: inmueble?.id ?? null,
  };
}

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
async function leer(client: SupabaseClient, trabajoId: string): Promise<Trabajo> {
  const r = await client.from(T.trabajos).select(COLUMNAS).eq("id", trabajoId).is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(404, "Ese trabajo no existe o no te toca verlo.");
  return r.data as unknown as Trabajo;
}

async function asuntoVisible(client: SupabaseClient, asuntoId: string): Promise<{ id: string; folio: string; nombre: string }> {
  const r = await client.from(T.asuntos).select("id,folio,nombre").eq("id", asuntoId).is("deleted_at", null).maybeSingle();
  if (r.error) fallo(r.error);
  if (!r.data) throw new ApiError(404, "Ese asunto no existe o no te toca verlo.");
  return r.data as { id: string; folio: string; nombre: string };
}

export async function listarTrabajos(client: SupabaseClient, user: StaffUser, filtro: { asunto: string } | { sueltos: true }): Promise<FilaTrabajo[]> {
  let q = client.from(T.trabajos).select("id,asunto_id,clase,tipo,nombre,resultado,documento_id,version,updated_at").is("deleted_at", null);
  q = "asunto" in filtro ? q.eq("asunto_id", filtro.asunto) : q.is("asunto_id", null).eq("responsable_id", user.id);
  const r = await q.order("updated_at", { ascending: false }).limit(200);
  if (r.error) fallo(r.error);
  return (r.data ?? []) as FilaTrabajo[];
}

export async function abrirTrabajo(client: SupabaseClient, trabajoId: string): Promise<TrabajoAbierto> {
  const t = await leer(client, trabajoId);
  if (!t.asunto_id) return { trabajo: t, asunto: null, del_asunto: {}, origen: {}, quienes: { propietario: null, comprador: null, inmueble: null }, documento: null };
  const [asunto, lados, doc] = await Promise.all([
    asuntoVisible(client, t.asunto_id),
    t.clase === "formato" ? ladosDelAsunto(client, t.asunto_id, t.persona_id, t.inmueble_id) : Promise.resolve(null),
    t.documento_id ? client.from(T.documentos).select("id,paso,archivos:fortius_inmuebles_documento_archivos(id,nombre_original,created_at,deleted_at)").eq("id", t.documento_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (doc.error) fallo(doc.error);
  const d = doc.data as { id: string; paso: "borrador" | "revisado" | "firmado" | null; archivos: { id: string; nombre_original: string; created_at: string; deleted_at: string | null }[] } | null;
  const { valores, origen } = lados ? delAsunto(t.tipo, lados.fuentes) : { valores: {}, origen: {} };
  return {
    trabajo: t, asunto, del_asunto: valores, origen,
    quienes: { propietario: lados?.fuentes.propietario?.nombre ?? null, comprador: lados?.fuentes.comprador?.nombre ?? null, inmueble: lados?.fuentes.inmueble?.nombre ?? null },
    documento: d ? {
      id: d.id, paso: d.paso ?? "borrador",
      archivos: d.archivos.filter((a) => !a.deleted_at).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((a) => ({ id: a.id, nombre: a.nombre_original, created_at: a.created_at })),
    } : null,
  };
}

// ── Crear ────────────────────────────────────────────────────────────────────────────────────────────
/** Lo fijo de un formato nuevo: folio, fechas de hoy, quién lo elabora, los datos de Fortius y los textos de la plantilla. */
async function inicialDelFormato(client: SupabaseClient, user: StaffUser, tipo: string, asunto: { id: string; folio: string } | null, lados: Lados | null): Promise<Record<string, unknown>> {
  let empresa;
  if (["01", "09", "21"].includes(tipo)) {
    const c = await createServerClient(undefined, true).from("fortius_inmuebles_records").select("data").eq("collection", "config").eq("id", "singleton").maybeSingle();
    empresa = datosFortius(c.data?.data);
  }
  const datos: Record<string, unknown> = {
    ...prefillFormato(tipo, { expediente: { folio: asunto?.folio ?? "" }, asesor: { nombre: user.name }, empresa }),
    ...fechasDeHoy(tipo, {}, hoy()),
  };
  if (!asunto) delete datos.folio;
  // El 09 lleva a los clientes en una tabla: el primero es quien vende, con lo que ya se sabe de él.
  const p = lados?.fuentes.propietario;
  if (tipo === "09" && p) {
    datos.clientesContrato = [Object.fromEntries(Object.entries({
      nombre: p.valores.nombre, rfc: p.valores.rfc, identificacion: p.valores.identificacion, domicilio: p.valores.domicilio,
      correo: p.valores.correo, telefono: p.valores.telefono, firmante: p.valores.nombre,
    }).filter(([, v]) => v))];
  }
  // Recibo 18: el número lo pone el sistema (folio del asunto y consecutivo de sus recibos).
  if (tipo === "18" && asunto) {
    const n = await client.from(T.documentos).select("id", { count: "exact", head: true }).eq("asunto_id", asunto.id).eq("es_recibo", true);
    datos.numeroRecibo = `${asunto.folio}-R${String((n.count ?? 0) + 1).padStart(2, "0")}`;
  }
  return datos;
}

/** El renglón en Documentos del asunto de lo que se hizo aquí. */
async function documentoDelTrabajo(client: SupabaseClient, user: StaffUser, asuntoId: string, t: Pick<Trabajo, "id" | "clase" | "tipo" | "nombre" | "resultado" | "inmueble_id">): Promise<{ id: string; recibo_numero: number | null }> {
  const o = await client.from(T.documentos).select("orden").eq("asunto_id", asuntoId).order("orden", { ascending: false }).limit(1);
  if (o.error) fallo(o.error);
  const orden = Number((o.data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
  const contrato = t.clase === "formato" && FORMATOS_CONTRATO.has(t.tipo);
  const r = await client.from(T.documentos).insert({
    asunto_id: asuntoId, nombre: t.nombre, grupo: contrato ? "Contratos" : t.clase === "herramienta" ? "Cuentas" : "Hechos en Fortius",
    estado: "recibido", origen: t.clase, paso: "borrador", entrega_papel: "fortius", es_contrato: contrato, es_recibo: t.clase === "formato" && t.tipo === "18",
    inmueble_id: t.inmueble_id, nota: t.resultado ?? "", trabajo_id: t.id, orden, creado_por: user.id,
  }).select("id,recibo_numero").single();
  if (r.error) fallo(r.error);
  return r.data as { id: string; recibo_numero: number | null };
}

/**
 * El número del recibo lo reserva la base al crear su renglón en Documentos (uno por asunto, sin repetirse aunque
 * se hagan dos a la vez). Si el recibo traía el número provisional del sistema (o ninguno), queda el reservado.
 */
function conNumeroDeRecibo(datos: Record<string, unknown>, folio: string, n: number | null): Record<string, unknown> | null {
  if (!n) return null;
  const numero = `${folio}-R${String(n).padStart(2, "0")}`;
  const actual = datos.numeroRecibo;
  if (actual === numero) return null;
  // Un número escrito a mano (que no tiene la forma «FOLIO-R01» del sistema) se respeta.
  if (actual !== undefined && actual !== "" && !(typeof actual === "string" && /^[A-Z]+-\d+-R\d+$/.test(actual))) return null;
  return { ...datos, numeroRecibo: numero };
}

export async function crearTrabajo(client: SupabaseClient, user: StaffUser, e: z.infer<typeof crearTrabajoSchema>): Promise<{ id: string }> {
  let nombre: string;
  if (e.clase === "formato") {
    let def;
    try { def = formatoById(e.tipo); } catch { throw new ApiError(400, "Ese formato no existe."); }
    if (e.tipo === "03" || !def.readyForEmission) throw new ApiError(400, "Ese formato todavía no se puede hacer aquí.");
    nombre = def.title;
  } else {
    if (!(HERRAMIENTAS as readonly string[]).includes(e.tipo)) throw new ApiError(400, "Esa herramienta no existe.");
    nombre = NOMBRE_HERRAMIENTA[e.tipo as Herramienta];
  }
  const asunto = e.asunto_id ? await asuntoVisible(client, e.asunto_id) : null;
  const lados = asunto && e.clase === "formato" ? await ladosDelAsunto(client, asunto.id, null, null) : null;
  const datos = e.clase === "formato" ? { ...(await inicialDelFormato(client, user, e.tipo, asunto, lados)), ...(e.datos ?? {}) } : (e.datos ?? {});
  const r = await client.from(T.trabajos).insert({
    asunto_id: asunto?.id ?? null, clase: e.clase, tipo: e.tipo, nombre, datos: datosSchema.parse(datos), resultado: e.resultado ?? null,
    persona_id: lados?.propietario ?? null, inmueble_id: lados?.inmueble ?? null, responsable_id: user.id, creado_por: user.id,
  }).select(COLUMNAS).single();
  if (r.error) fallo(r.error);
  const t = r.data as unknown as Trabajo;
  if (asunto) {
    const doc = await documentoDelTrabajo(client, user, asunto.id, t);
    const datosRecibo = t.clase === "formato" && t.tipo === "18" ? conNumeroDeRecibo(t.datos, asunto.folio, doc.recibo_numero) : null;
    const u = await client.from(T.trabajos).update({ documento_id: doc.id, ...(datosRecibo ? { datos: datosRecibo } : {}) }).eq("id", t.id).eq("version", t.version).select("id").maybeSingle();
    if (u.error) fallo(u.error);
  }
  return { id: t.id };
}

// ── Guardar y devolver a la persona o al inmueble ────────────────────────────────────────────────────
const IDENTIFICACION = /^(INE|IFE|pasaporte|c[eé]dula|licencia|credencial)\b[\s:.-]*(.*)$/i;

/** Lo que se capturó en el documento vuelve a la ficha. Lo que no tiene la forma correcta se queda solo en el documento. */
async function devolver(client: SupabaseClient, user: StaffUser, lados: Lados, items: { lado: Lado; campo: string; valor: string | number }[]) {
  const guardadoEn = new Set<string>();
  const noGuardado: string[] = [];
  const porLado = (l: Lado) => items.filter((x) => x.lado === l);

  for (const lado of ["propietario", "comprador"] as const) {
    const personaId = lados[lado];
    const fuente = lados.fuentes[lado];
    const lista = porLado(lado);
    if (!personaId || !fuente || !lista.length) continue;
    const cambios: Record<string, unknown> = {};
    let correo: string | null = null;
    for (const { campo, valor } of lista) {
      const v = String(valor).trim();
      if (campo === "nombre") cambios.nombre_completo = v.slice(0, 200);
      else if (campo === "estado_civil") cambios.estado_civil = v.slice(0, 80);
      else if (campo === "curp") { if (CURP.test(v.toUpperCase())) cambios.curp = v.toUpperCase(); else noGuardado.push("CURP"); }
      else if (campo === "rfc") { if (RFC.test(v.toUpperCase())) cambios.rfc = v.toUpperCase(); else noGuardado.push("RFC"); }
      else if (campo === "identificacion") {
        const m = IDENTIFICACION.exec(v);
        cambios.identificacion_tipo = m ? m[1].toUpperCase().replace("CEDULA", "Cédula") : null;
        cambios.identificacion_numero = (m ? m[2] : v).slice(0, 60) || null;
      } else if (campo === "domicilio") cambios.domicilio = { texto: v.slice(0, 1500) };
      else if (campo === "nacionalidad") cambios.nacionalidad = v.slice(0, 60);
      else if (campo === "correo" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && !fuente.valores.correo) correo = v.toLowerCase();
    }
    if (Object.keys(cambios).length) {
      const ya = await client.from(T.legalesPersona).select("version").eq("persona_id", personaId).maybeSingle();
      if (ya.error) fallo(ya.error);
      const r = ya.data
        ? await client.from(T.legalesPersona).update(cambios).eq("persona_id", personaId).eq("version", (ya.data as { version: number }).version).select("persona_id").maybeSingle()
        : await client.from(T.legalesPersona).insert({ persona_id: personaId, creado_por: user.id, ...cambios }).select("persona_id").maybeSingle();
      if (r.error || !r.data) noGuardado.push(`los datos de ${fuente.nombre}`); else guardadoEn.add(`la ficha de ${fuente.nombre}`);
    }
    if (correo) {
      const p = await client.from(T.personas).select("version,correo").eq("id", personaId).maybeSingle();
      const fila = p.data as { version: number; correo: string | null } | null;
      if (fila && !fila.correo) {
        const r = await client.from(T.personas).update({ correo }).eq("id", personaId).eq("version", fila.version).select("id").maybeSingle();
        if (r.error || !r.data) noGuardado.push("el correo"); else guardadoEn.add(`la ficha de ${fuente.nombre}`);
      }
    }
  }

  const inmuebleId = lados.inmueble;
  const lista = porLado("inmueble");
  if (inmuebleId && lista.length) {
    const legales: Record<string, unknown> = {};
    const ficha: Record<string, number> = {};
    let direccion: string | null = null;
    for (const { campo, valor } of lista) {
      if ((LEGALES_INMUEBLE as readonly string[]).includes(campo)) legales[campo] = String(valor).trim().slice(0, campo === "predial" || campo === "agua" ? 500 : 2000);
      else if (["terreno", "construccion", "recamaras", "banos"].includes(campo)) { const n = cifra(valor); if (n !== undefined) ficha[campo] = n; }
      else if (campo === "domicilio") direccion = String(valor).trim().slice(0, 300);
    }
    if (Object.keys(legales).length) {
      const ya = await client.from(T.legalesInmueble).select("version").eq("inmueble_id", inmuebleId).maybeSingle();
      if (ya.error) fallo(ya.error);
      const r = ya.data
        ? await client.from(T.legalesInmueble).update(legales).eq("inmueble_id", inmuebleId).eq("version", (ya.data as { version: number }).version).select("id").maybeSingle()
        : await client.from(T.legalesInmueble).insert({ inmueble_id: inmuebleId, creado_por: user.id, ...legales }).select("id").maybeSingle();
      if (r.error || !r.data) noGuardado.push("los datos del inmueble"); else guardadoEn.add("el inmueble");
    }
    if (Object.keys(ficha).length || direccion) {
      const i = await client.from(T.inmuebles).select("version,ficha,direccion_exacta").eq("id", inmuebleId).maybeSingle();
      const fila = i.data as { version: number; ficha: Record<string, unknown>; direccion_exacta: string | null } | null;
      if (fila) {
        // Solo llena lo que la ficha no tiene: la ficha del inmueble manda sobre lo escrito en un formato.
        const nuevaFicha = { ...fila.ficha };
        let cambia = false;
        for (const [k, n] of Object.entries(ficha)) if (cifra(nuevaFicha[k]) === undefined) { nuevaFicha[k] = n; cambia = true; }
        const cambios: Record<string, unknown> = {};
        if (cambia) cambios.ficha = nuevaFicha;
        if (direccion && !fila.direccion_exacta) cambios.direccion_exacta = direccion;
        if (Object.keys(cambios).length) {
          const r = await client.from(T.inmuebles).update(cambios).eq("id", inmuebleId).eq("version", fila.version).select("id").maybeSingle();
          if (r.error || !r.data) noGuardado.push("la ficha del inmueble"); else guardadoEn.add("el inmueble");
        }
      }
    }
  }
  return { guardadoEn: [...guardadoEn], noGuardado };
}

export async function cambiarTrabajo(client: SupabaseClient, user: StaffUser, trabajoId: string, e: z.infer<typeof cambioTrabajoSchema>): Promise<ResultadoGuardar> {
  const t = await leer(client, trabajoId);
  if (t.version !== e.version) throw new ApiError(409, "Alguien más cambió este documento. Vuelve a cargarlo.");
  const cambios: Record<string, unknown> = {};
  let resultado = { guardadoEn: [] as string[], noGuardado: [] as string[] };
  let pasaA: { id: string; folio: string } | null = null;
  let lados: Lados | null = null;

  if (e.quitar) { cambios.deleted_at = new Date().toISOString(); cambios.deleted_by = user.id; }
  if (e.resultado !== undefined) cambios.resultado = e.resultado;
  if (e.asunto_id) {
    if (t.asunto_id) throw new ApiError(409, "Este trabajo ya está en un asunto.");
    pasaA = await asuntoVisible(client, e.asunto_id);
    cambios.asunto_id = pasaA.id;
    if (t.clase === "formato") {
      lados = await ladosDelAsunto(client, pasaA.id, null, null);
      cambios.persona_id = lados.propietario;
      cambios.inmueble_id = lados.inmueble;
      // Lo que el suelto no tenía y el asunto sí sabe se queda en el documento; el folio pasa a ser el del asunto.
      cambios.datos = { ...mezclar(e.datos ?? t.datos, delAsunto(t.tipo, lados.fuentes).valores), folio: pasaA.folio };
    }
  }
  if (e.datos && !cambios.datos) {
    cambios.datos = e.datos;
    if (t.asunto_id && t.clase === "formato") {
      // Lo que cambió en el documento y tiene un dato detrás vuelve a la persona o al inmueble.
      const antes = t.datos;
      const nuevos = Object.fromEntries(Object.entries(e.datos).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(antes[k])));
      const items = aDevolver(t.tipo, nuevos);
      if (items.length) {
        lados = await ladosDelAsunto(client, t.asunto_id, t.persona_id, t.inmueble_id);
        resultado = await devolver(client, user, lados, items);
      }
    }
  }
  if (!Object.keys(cambios).length) throw new ApiError(400, "No hay nada que cambiar.");
  const u = await client.from(T.trabajos).update(cambios).eq("id", t.id).eq("version", t.version).select(COLUMNAS).maybeSingle();
  if (u.error) fallo(u.error);
  if (!u.data) throw new ApiError(409, "Alguien más cambió este documento. Vuelve a cargarlo.");
  let nuevo = u.data as unknown as Trabajo;
  if (pasaA) {
    const doc = await documentoDelTrabajo(client, user, pasaA.id, nuevo);
    const datosRecibo = nuevo.clase === "formato" && nuevo.tipo === "18" ? conNumeroDeRecibo(nuevo.datos, pasaA.folio, doc.recibo_numero) : null;
    const r = await client.from(T.trabajos).update({ documento_id: doc.id, ...(datosRecibo ? { datos: datosRecibo } : {}) }).eq("id", nuevo.id).eq("version", nuevo.version).select(COLUMNAS).maybeSingle();
    if (r.error) fallo(r.error);
    nuevo = r.data as unknown as Trabajo;
    // Un formato que se pasa deja su PDF en los Documentos del asunto.
    if (nuevo.clase === "formato") {
      try { nuevo = (await pdfDelTrabajo(client, user, nuevo.id)).trabajo; } catch { /* sin PDF: queda el renglón y se descarga desde la ventana */ }
    }
  }
  return { trabajo: nuevo, guardado_en: resultado.guardadoEn, no_guardado: resultado.noGuardado };
}

// ── PDF ──────────────────────────────────────────────────────────────────────────────────────────────
/**
  El PDF sale como la plantilla, con lo escrito y lo que ya sabe el asunto. Sale aunque falten datos (con los espacios en
  blanco), salvo el aviso de privacidad, que no sale incompleto (SPEC.md, sección 8). Si el trabajo es de un asunto y cambió
  desde el último PDF, el nuevo queda en sus Documentos; los anteriores se conservan.
*/
export async function pdfDelTrabajo(client: SupabaseClient, user: StaffUser, trabajoId: string): Promise<{ trabajo: Trabajo; nombre: string; pdf: string; guardado: boolean }> {
  const abierto = await abrirTrabajo(client, trabajoId);
  const t = abierto.trabajo;
  if (t.clase !== "formato") throw new ApiError(400, "Esta cuenta no tiene PDF.");
  const folio = abierto.asunto?.folio ?? "";
  const datos = { ...mezclar(t.datos, abierto.del_asunto), ...(folio ? { folio } : {}) };
  const falta = faltantes(t.tipo, datos, folio);
  if (t.tipo === "01" && falta.length) {
    throw new ApiError(409, `El aviso de privacidad no sale incompleto: ${falta.length === 1 ? "falta 1 dato" : `faltan ${falta.length} datos`}.`);
  }
  let bytes: Uint8Array;
  try {
    const { createFormatoPdf } = await import("@/lib/formatos/pdf");
    bytes = await createFormatoPdf(t.tipo, datos, [], { incompleto: true });
  } catch (err) {
    throw new ApiError(409, err instanceof Error ? `No se pudo armar el PDF: ${err.message}.` : "No se pudo armar el PDF.");
  }
  const nombre = `${[folio, t.tipo, t.nombre].filter(Boolean).join(" ")}.pdf`;
  let guardado = false;
  let trabajo = t;
  if (t.asunto_id && t.documento_id && t.pdf_version !== t.version) {
    await guardarArchivo(createServerClient(undefined, true), t.asunto_id, t.documento_id, { bytes, mime: "application/pdf", ext: "pdf", nombre }, user.id);
    const u = await client.from(T.trabajos).update({ pdf_version: t.version + 1 }).eq("id", t.id).eq("version", t.version).select(COLUMNAS).maybeSingle();
    if (u.error) fallo(u.error);
    if (u.data) trabajo = u.data as unknown as Trabajo;
    guardado = true;
  }
  return { trabajo, nombre, pdf: Buffer.from(bytes).toString("base64"), guardado };
}
