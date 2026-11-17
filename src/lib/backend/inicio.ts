import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ClaseTarea, Quien } from "./asuntos-contrato";
import { fallo } from "./fallo";
import type { StaffUser } from "./contracts";
import { ApiError } from "./http";
import type {
  CobrarInicio, Contacto, ContactoInicio, Inicio, Moneda, SolicitudInicio, TareaInicio, VenceInicio,
} from "./inicio-contrato";

/**
 * Inicio (etapa 8 de PLAN.md; SPEC.md, secciones 3, 4 y 11). Todo con la sesión de quien entró: la base decide qué ve
 * (RLS). El director ve todo el equipo y las solicitudes que nadie lleva; cada asesor, lo suyo.
 */

const T = {
  solicitudes: "fortius_inmuebles_solicitudes",
  tareas: "fortius_inmuebles_tareas",
  papeles: "fortius_inmuebles_asunto_personas",
  personas: "fortius_inmuebles_personas",
  interesados: "fortius_inmuebles_interesados",
  inmuebles: "fortius_inmuebles_inmuebles",
  asuntoInmuebles: "fortius_inmuebles_asunto_inmuebles",
  asuntos: "fortius_inmuebles_asuntos",
  presupuestos: "fortius_inmuebles_presupuestos",
  conceptos: "fortius_inmuebles_presupuesto_conceptos",
  cobros: "fortius_inmuebles_cobros",
  documentos: "fortius_inmuebles_asunto_documentos",
  consultas: "fortius_inmuebles_consultas",
} as const;

const hoyTexto = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const masDias = (base: string, n: number) => { const d = new Date(`${base}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
type Tel = { pais: string; numero: string };
const telefonoDe = (t: unknown): string | null => {
  const x = Array.isArray(t) ? (t[0] as Tel | undefined) : undefined;
  return x?.numero ? `${x.pais} ${x.numero}` : null;
};
/** A quién se le escribe según quién hace la tarea (igual que en el Plan del asunto). */
const PAPELES_DE: Record<Quien, string[]> = {
  cliente: ["propietario", "titular", "vendedor", "comprador", "heredero", "inquilino", "inversionista", "contacto", "copropietario"],
  abogado: ["abogado"], notaria: ["notaria"], otro: ["apoderado", "banco", "contraparte"], fortius: [],
};
const trozos = <X,>(xs: X[], n = 200) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

// ── Lectura ──────────────────────────────────────────────────────────────────────────────────────────
export async function leerInicio(client: SupabaseClient): Promise<Inicio> {
  const hoy = hoyTexto(), semana = masDias(hoy, 7);
  const [sol, ta, con, ven] = await Promise.all([
    client.from(T.solicitudes).select("id,nombre,telefono,correo,mensaje,recibida_el,asignada_a,asunto_id,interesado_id,consulta_id,version,inmueble:fortius_inmuebles_inmuebles(id,nombre,folio)")
      .eq("estado", "por_atender").order("recibida_el").limit(200),
    client.from(T.tareas).select("id,asunto_id,titulo,quien,clase,fecha,hora,volver_a_preguntar,recordada_el,responsable_id,quien_persona_id,interesado_id,inmueble_id,version,asunto:fortius_inmuebles_asuntos(folio,nombre,en_que_va,deleted_at)")
      .eq("estado", "pendiente").is("deleted_at", null).not("asunto_id", "is", null)
      .or(`fecha.lte.${semana},quien.neq.fortius`).order("fecha", { ascending: true, nullsFirst: false }).limit(1000),
    client.from(T.personas).select("id,nombre,telefonos,nota,volver_a_llamar,version")
      .lte("volver_a_llamar", hoy).eq("no_contactar", false).eq("fallecida", false).is("deleted_at", null).order("volver_a_llamar").limit(100),
    client.from(T.documentos).select("id,asunto_id,nombre,vence_el,avisar_dias,asunto:fortius_inmuebles_asuntos(nombre,deleted_at)")
      .not("vence_el", "is", null).lte("vence_el", masDias(hoy, 90)).neq("estado", "no_aplica").is("deleted_at", null).order("vence_el").limit(200),
  ]);
  for (const r of [sol, ta, con, ven]) if (r.error) fallo(r.error);

  type FilaTarea = Omit<TareaInicio, "asunto" | "para" | "interesado" | "inmueble"> & {
    quien_persona_id: string | null; interesado_id: string | null; inmueble_id: string | null;
    asunto: { folio: string; nombre: string; en_que_va: string; deleted_at: string | null } | null;
  };
  const filas = ((ta.data ?? []) as unknown as FilaTarea[]).filter((t) => t.asunto && !t.asunto.deleted_at && t.asunto.en_que_va !== "cerrado");
  const [para, interesados, inmuebles] = await Promise.all([
    contactosPara(client, filas.filter((t) => t.quien !== "fortius")),
    nombresInteresados(client, [...new Set(filas.map((t) => t.interesado_id).filter((x): x is string => !!x))]),
    nombresInmuebles(client, [...new Set(filas.map((t) => t.inmueble_id).filter((x): x is string => !!x))]),
  ]);
  const tareas: TareaInicio[] = filas.map((t) => ({
    id: t.id, asunto_id: t.asunto_id, asunto: { folio: t.asunto!.folio, nombre: t.asunto!.nombre }, titulo: t.titulo, quien: t.quien as Quien,
    clase: t.clase as ClaseTarea, fecha: t.fecha, hora: t.hora?.slice(0, 5) ?? null, volver_a_preguntar: t.volver_a_preguntar, recordada_el: t.recordada_el,
    responsable_id: t.responsable_id, version: t.version, para: para.get(t.id) ?? null,
    interesado: t.interesado_id ? interesados.get(t.interesado_id) ?? null : null, inmueble: t.inmueble_id ? inmuebles.get(t.inmueble_id) ?? null : null,
  }));

  type FilaVence = { id: string; asunto_id: string; nombre: string; vence_el: string; avisar_dias: number | null; asunto: { nombre: string; deleted_at: string | null } | null };
  const vencen: VenceInicio[] = ((ven.data ?? []) as unknown as FilaVence[])
    .filter((d) => d.asunto && !d.asunto.deleted_at && masDias(d.vence_el, -(d.avisar_dias ?? 15)) <= hoy)
    .map((d) => ({ id: d.id, asunto_id: d.asunto_id, asunto: d.asunto!.nombre, nombre: d.nombre, vence_el: d.vence_el }));

  const contactos: ContactoInicio[] = ((con.data ?? []) as { id: string; nombre: string; telefonos: unknown; nota: string; volver_a_llamar: string; version: number }[])
    .map((p) => ({ id: p.id, nombre: p.nombre, telefono: telefonoDe(p.telefonos), nota: p.nota ?? "", volver_a_llamar: p.volver_a_llamar, version: p.version }));

  return { hoy, solicitudes: (sol.data ?? []) as unknown as SolicitudInicio[], tareas, contactos, cobrar: await porCobrar(client), vencen };
}

async function contactosPara(client: SupabaseClient, tareas: { id: string; asunto_id: string; quien: string; quien_persona_id: string | null }[]): Promise<Map<string, Contacto>> {
  const salida = new Map<string, Contacto>();
  if (!tareas.length) return salida;
  type Papel = { asunto_id: string; papel: string; principal: boolean; persona: { id: string; nombre: string; telefonos: unknown; no_contactar: boolean; fallecida: boolean } | null };
  const papeles: Papel[] = [];
  for (const ids of trozos([...new Set(tareas.map((t) => t.asunto_id))])) {
    const r = await client.from(T.papeles).select("asunto_id,papel,principal,persona:fortius_inmuebles_personas(id,nombre,telefonos,no_contactar,fallecida)")
      .in("asunto_id", ids).is("retirado_el", null).order("orden");
    if (r.error) fallo(r.error);
    papeles.push(...((r.data ?? []) as unknown as Papel[]));
  }
  const vivo = (p: Papel) => p.persona && !p.persona.fallecida && !p.persona.no_contactar && telefonoDe(p.persona.telefonos);
  for (const t of tareas) {
    const del = papeles.filter((p) => p.asunto_id === t.asunto_id && vivo(p));
    const fija = t.quien_persona_id ? del.find((p) => p.persona!.id === t.quien_persona_id) : undefined;
    const p = fija ?? PAPELES_DE[t.quien as Quien]?.map((x) => del.find((y) => y.papel === x)).find(Boolean) ?? (t.quien === "cliente" ? del[0] : undefined);
    if (p?.persona) salida.set(t.id, { nombre: p.persona.nombre, telefono: telefonoDe(p.persona.telefonos) });
  }
  return salida;
}

async function nombresInteresados(client: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  for (const xs of trozos(ids)) {
    const r = await client.from(T.interesados).select("id,persona:fortius_inmuebles_personas(nombre)").in("id", xs);
    if (r.error) fallo(r.error);
    for (const x of (r.data ?? []) as unknown as { id: string; persona: { nombre: string } | null }[]) if (x.persona) m.set(x.id, x.persona.nombre);
  }
  return m;
}

async function nombresInmuebles(client: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  for (const xs of trozos(ids)) {
    const r = await client.from(T.inmuebles).select("id,nombre").in("id", xs);
    if (r.error) fallo(r.error);
    for (const x of (r.data ?? []) as { id: string; nombre: string }[]) m.set(x.id, x.nombre);
  }
  return m;
}

/** Lo que falta cobrar: honorarios del presupuesto aceptado (los de porcentaje, sobre el precio del inmueble) menos lo cobrado. */
export async function porCobrar(client: SupabaseClient): Promise<CobrarInicio[]> {
  const pr = await client.from(T.presupuestos).select("id,asunto_id,numero").eq("estado", "aceptado").is("deleted_at", null).order("numero", { ascending: false }).limit(500);
  if (pr.error) fallo(pr.error);
  const porAsunto = new Map<string, string>();
  for (const p of (pr.data ?? []) as { id: string; asunto_id: string }[]) if (!porAsunto.has(p.asunto_id)) porAsunto.set(p.asunto_id, p.id);
  if (!porAsunto.size) return [];
  const asuntos = [...porAsunto.keys()], presupuestos = [...porAsunto.values()];
  type Concepto = { asunto_id: string; monto: number | null; porcentaje: number | null; moneda: Moneda; base_inmueble_id: string | null };
  const conceptos: Concepto[] = [], cobros: { asunto_id: string; monto: number; moneda: Moneda }[] = [];
  const ligas: { asunto_id: string; inmueble: { id: string; precio: number | null } | null }[] = [];
  const nombres: { id: string; folio: string; nombre: string; deleted_at: string | null }[] = [];
  for (const xs of trozos(presupuestos)) {
    const r = await client.from(T.conceptos).select("asunto_id,monto,porcentaje,moneda,base_inmueble_id").in("presupuesto_id", xs).eq("clase", "honorario").is("deleted_at", null);
    if (r.error) fallo(r.error);
    conceptos.push(...((r.data ?? []) as Concepto[]));
  }
  for (const xs of trozos(asuntos)) {
    const [c, l, a] = await Promise.all([
      client.from(T.cobros).select("asunto_id,monto,moneda").in("asunto_id", xs).is("deleted_at", null),
      client.from(T.asuntoInmuebles).select("asunto_id,inmueble:fortius_inmuebles_inmuebles(id,precio)").in("asunto_id", xs).is("retirado_el", null),
      client.from(T.asuntos).select("id,folio,nombre,deleted_at").in("id", xs),
    ]);
    for (const r of [c, l, a]) if (r.error) fallo(r.error);
    cobros.push(...((c.data ?? []) as typeof cobros));
    ligas.push(...((l.data ?? []) as unknown as typeof ligas));
    nombres.push(...((a.data ?? []) as typeof nombres));
  }
  const salida: CobrarInicio[] = [];
  for (const a of nombres) {
    if (a.deleted_at) continue;
    const inm = ligas.filter((x) => x.asunto_id === a.id && x.inmueble).map((x) => x.inmueble!);
    const total: Partial<Record<Moneda, number>> = {};
    for (const c of conceptos.filter((x) => x.asunto_id === a.id)) {
      const base = inm.find((i) => i.id === c.base_inmueble_id) ?? (inm.length === 1 ? inm[0] : null);
      const n = c.monto !== null ? Number(c.monto) : c.porcentaje !== null && base?.precio ? Math.round(Number(base.precio) * Number(c.porcentaje)) / 100 : 0;
      total[c.moneda] = (total[c.moneda] ?? 0) + n;
    }
    for (const c of cobros.filter((x) => x.asunto_id === a.id)) total[c.moneda] = (total[c.moneda] ?? 0) - Number(c.monto);
    const falta = Object.fromEntries(Object.entries(total).filter(([, n]) => (n ?? 0) > 0.009).map(([m, n]) => [m, Math.round((n ?? 0) * 100) / 100])) as Partial<Record<Moneda, number>>;
    if (Object.keys(falta).length) salida.push({ asunto_id: a.id, folio: a.folio, nombre: a.nombre, falta });
  }
  return salida.sort((x, y) => (y.falta.MXN ?? 0) - (x.falta.MXN ?? 0));
}

// ── Solicitudes ──────────────────────────────────────────────────────────────────────────────────────
export const cambioSolicitudSchema = z.union([
  z.object({ version: z.number().int().positive(), accion: z.literal("atender") }).strict(),
  z.object({ version: z.number().int().positive(), accion: z.literal("no_procede") }).strict(),
  z.object({ version: z.number().int().positive(), accion: z.literal("pasar"), a: z.uuid() }).strict(),
]);

/** Atender abre la consulta ya llena con lo que escribió la persona; pasarla es del director; «No procede» la quita de Inicio. */
export async function cambiarSolicitud(client: SupabaseClient, user: StaffUser, id: string, e: z.infer<typeof cambioSolicitudSchema>): Promise<{ consulta_id?: string }> {
  if (e.accion === "pasar") {
    if (user.role !== "admin") throw new ApiError(403, "Solo el director pasa una solicitud a otra persona.");
    await actualizar(client, id, e.version, { asignada_a: e.a });
    return {};
  }
  if (e.accion === "no_procede") { await actualizar(client, id, e.version, { estado: "no_procede" }); return {}; }

  const r = await client.from(T.solicitudes).select("nombre,telefono,correo,mensaje,persona_id,consulta_id,inmueble:fortius_inmuebles_inmuebles(nombre)").eq("id", id).maybeSingle();
  if (r.error) fallo(r.error);
  const s = r.data as unknown as { nombre: string; telefono: string; correo: string | null; mensaje: string; persona_id: string | null; consulta_id: string | null; inmueble: { nombre: string } | null } | null;
  if (!s) throw new ApiError(404, "Esa solicitud ya no está.");
  if (s.consulta_id) return { consulta_id: s.consulta_id };
  const d = s.telefono.replace(/\D/g, "");
  const telefonos = d.length >= 6 ? [d.length > 10 ? { pais: `+${d.slice(0, d.length - 10)}`, numero: d.slice(-10) } : { pais: "+52", numero: d }] : [];
  const c = await client.from(T.consultas).insert({
    quien_nombre: s.nombre.slice(0, 160), quien_telefonos: telefonos, quien_correo: s.correo, canal: "sitio", persona_id: s.persona_id,
    que_pasa: [s.mensaje, s.inmueble ? `(Preguntó por ${s.inmueble.nombre}.)` : ""].filter(Boolean).join(" ").slice(0, 4000),
    solicitud_id: id, responsable_id: user.id, creado_por: user.id,
  }).select("id").single();
  if (c.error) fallo(c.error);
  const consultaId = (c.data as { id: string }).id;
  await actualizar(client, id, e.version, { estado: "atendida", consulta_id: consultaId });
  return { consulta_id: consultaId };
}

async function actualizar(client: SupabaseClient, id: string, v: number, cambios: Record<string, unknown>) {
  const { data, error } = await client.from(T.solicitudes).update(cambios).eq("id", id).eq("version", v).select("id").maybeSingle();
  if (error) fallo(error);
  if (!data) throw new ApiError(409, "Alguien más ya movió esta solicitud. Vuelve a cargar.");
}
