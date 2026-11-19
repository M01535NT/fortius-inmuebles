import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  CADA_INFORME, contenidoInforme, informeDocumento, NOMBRE_CADA, PARTES_INFORME,
  type CadaInforme, type MaterialInforme, type OpcionesInforme,
} from "@/lib/formatos/documento/informe";
import { loadLetterhead } from "@/lib/letterhead-server";

import { guardarArchivo } from "./apartados";
import { NOMBRE_RESPUESTA, type Concepto, type Moneda } from "./apartados-contrato";
import { fallo, idSchema, leerAsunto } from "./asuntos";
import type { Asunto } from "./asuntos-contrato";
import { leerEquipo } from "./asuntos-equipo";
import { mapaCatalogos } from "./catalogos";
import { significadoDe } from "./catalogos-contrato";
import { createServerClient } from "./auth";
import type { StaffUser } from "./contracts";
import { ApiError } from "./http";
import { NOMBRE_ESTADO, type EstadoInmueble } from "./inmuebles-contrato";

/**
 * Informes para el cliente (SPEC.md, sección 5). El informe se arma con lo que el asunto ya tiene, queda en sus
 * Documentos (grupo «Informes») con su número y se anota en el Historial. No se manda solo: el asesor lo descarga
 * o lo envía por WhatsApp. Si se repite, la tarea «Mandar el informe» nace para la fecha siguiente.
 */

const T = {
  tareas: "fortius_inmuebles_tareas",
  documentos: "fortius_inmuebles_asunto_documentos",
  archivos: "fortius_inmuebles_documento_archivos",
} as const;
const GRUPO = "Informes";

export const opcionesInformeSchema = z.object({
  para: z.array(idSchema).max(12),
  en_que_va: z.string().trim().max(3000),
  partes: z.array(z.enum(PARTES_INFORME)).max(PARTES_INFORME.length),
  sin: z.array(idSchema).max(300),
  cada: z.enum(CADA_INFORME).nullable(),
}).strict();

const hoyTexto = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const diaDe = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)) : null);
const dinero = (n: number, moneda: Moneda) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${moneda}`;
type Totales = Partial<Record<Moneda, number>>;
const sumar = (t: Totales, m: Moneda, n: number) => { t[m] = (t[m] ?? 0) + n; };
const texto = (t: Totales) => (Object.entries(t) as [Moneda, number][]).filter(([, n]) => n > 0.009).map(([m, n]) => dinero(n, m)).join(" y ");

/** El monto de un concepto: fijo, o su porcentaje sobre el precio del inmueble. Sin precio, falta. */
function montoDe(c: Concepto, a: Asunto): number | null {
  if (c.monto != null) return c.monto;
  if (c.porcentaje == null) return null;
  const base = a.inmuebles.find((i) => i.id === c.base_inmueble_id) ?? (a.inmuebles.length === 1 ? a.inmuebles[0] : null);
  return base?.precio ? Math.round(base.precio * c.porcentaje) / 100 : null;
}

/** La fecha en que toca el siguiente informe. */
function siguienteFecha(hoy: string, cada: CadaInforme): string {
  const [a, m, d] = hoy.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  if (cada === "mes") f.setUTCMonth(f.getUTCMonth() + 1); else f.setUTCDate(f.getUTCDate() + (cada === "semana" ? 7 : 15));
  return f.toISOString().slice(0, 10);
}

/** El párrafo de «En qué va» que se propone; el asesor lo cambia a su gusto. */
function proponer(a: Asunto, sigue: MaterialInforme["sigue"], logrado: boolean): string {
  const base: Record<Asunto["en_que_va"], string> = {
    estudio: "Estamos estudiando su asunto: reunimos los documentos y revisamos su situación para decirle qué se puede hacer y cómo.",
    propuesta: "Ya revisamos su asunto y le presentamos nuestra propuesta de trabajo. Quedamos atentos a su respuesta para empezar.",
    en_marcha: "Su asunto está en marcha y avanza conforme al plan.",
    por_cobrar: "El trabajo que nos encargó está terminado. Solo queda pendiente el pago acordado.",
    cerrado: logrado ? "El asunto se cerró: se logró lo que nos encargó." : "El asunto se cerró sin llegar al resultado que se buscaba.",
  };
  const partes = [base[a.en_que_va]];
  if (a.en_espera) partes.push(`Por ahora está en espera${a.espera_motivo ? `: ${a.espera_motivo.replace(/\.$/, "")}` : ""}.`);
  const s = a.en_que_va === "cerrado" ? undefined : sigue[0];
  if (s) partes.push(`Lo siguiente es: ${s.texto.charAt(0).toLowerCase()}${s.texto.slice(1).replace(/\.$/, "")}.`);
  return partes.join(" ");
}

type TareaExtra = { id: string; hecha_el: string | null; repetir: { cada?: string; que?: string } | null };
type DocExtra = { id: string; recibido_el: string | null; created_at: string; deleted_at: string | null; grupo: string | null };

/** Junta todo lo que el asunto puede decir en un informe. Nada de notas, decisiones, análisis ni nombres de interesados. */
export async function materialInforme(client: SupabaseClient, user: StaffUser, asuntoId: string): Promise<{ material: MaterialInforme; asunto: Asunto; tareaPendiente: string[] }> {
  const a = await leerAsunto(client, asuntoId);
  const [tx, dx, equipo, catalogos] = await Promise.all([
    client.from(T.tareas).select("id,hecha_el,repetir").eq("asunto_id", asuntoId).is("deleted_at", null).limit(2000),
    client.from(T.documentos).select("id,recibido_el,created_at,deleted_at,grupo").eq("asunto_id", asuntoId).limit(2000),
    leerEquipo(client, user).catch(() => []),
    mapaCatalogos(client),
  ]);
  if (tx.error) fallo(tx.error);
  if (dx.error) fallo(dx.error);
  const extraTarea = new Map(((tx.data ?? []) as TareaExtra[]).map((t) => [t.id, t]));
  const docs = (dx.data ?? []) as DocExtra[];
  const extraDoc = new Map(docs.map((d) => [d.id, d]));
  // Los informes ya hechos, también los eliminados: un número no se repite.
  const previos = docs.filter((d) => d.grupo === GRUPO).sort((x, y) => y.created_at.localeCompare(x.created_at));
  const desde = diaDe(previos.find((d) => !d.deleted_at)?.created_at ?? null);
  const hoy = hoyTexto();
  const esDeInforme = (id: string) => extraTarea.get(id)?.repetir?.que === "informe";

  // Las tareas ligadas a un interesado (una visita) pueden llevar su nombre: no salen.
  const propias = a.tareas.filter((t) => !t.interesado_id && !esDeInforme(t.id));
  const hecho: MaterialInforme["hecho"] = [
    ...propias.filter((t) => t.estado === "hecha").map((t) => ({ id: t.id, texto: t.titulo, fecha: diaDe(extraTarea.get(t.id)?.hecha_el ?? null) })),
    ...a.documentos.filter((d) => d.estado === "recibido" && d.grupo !== GRUPO && d.origen !== "formato" && d.origen !== "herramienta")
      .map((d) => ({ id: d.id, texto: `Recibimos: ${d.nombre}`, fecha: diaDe(extraDoc.get(d.id)?.recibido_el ?? null) })),
  ].filter((x) => !desde || !x.fecha || x.fecha >= desde)
    .sort((x, y) => (x.fecha ?? "").localeCompare(y.fecha ?? "")).slice(-30);

  const sigue: MaterialInforme["sigue"] = propias.filter((t) => t.estado === "pendiente")
    .sort((x, y) => (x.fecha ?? "9999").localeCompare(y.fecha ?? "9999") || x.orden - y.orden).slice(0, 8)
    .map((t) => ({ id: t.id, texto: t.titulo, fecha: t.fecha, hora: t.hora, quien: t.quien }));

  const comercializa = a.encargos.includes("comercializar") || a.interesados.length > 0;
  const vivos = a.interesados.filter((i) => i.estado !== "descartado");
  const unico = a.inmuebles.length === 1;
  const actividad: MaterialInforme["actividad"] = !comercializa ? [] : a.inmuebles.map((i) => ({
    id: i.id, texto: i.nombre, estado: NOMBRE_ESTADO[i.estado as EstadoInmueble] ?? i.estado,
    preguntaron: vivos.filter((x) => x.inmuebles.includes(i.id) || (unico && !x.inmuebles.length)).length,
    visitas: a.tareas.filter((t) => t.clase === "visita" && t.estado !== "no_aplica" && (t.inmueble_id === i.id || (unico && !t.inmueble_id))).length,
    ofertas: a.interesados.flatMap((x) => x.ofertas).filter((o) => o.inmueble_id === i.id || (unico && !o.inmueble_id))
      .map((o) => `${dinero(o.monto, o.moneda)} · ${NOMBRE_RESPUESTA[o.respuesta].toLowerCase()}`),
  }));

  const p = a.presupuestos.find((x) => x.estado === "aceptado") ?? a.presupuestos[0];
  const total: Totales = {}, cobrado: Totales = {}, falta: Totales = {};
  for (const c of p?.conceptos ?? []) { const n = montoDe(c, a); if (c.clase === "honorario" && n) sumar(total, c.moneda, n); }
  for (const c of a.cobros) sumar(cobrado, c.moneda, c.monto);
  for (const m of Object.keys(total) as Moneda[]) { const n = (total[m] ?? 0) - (cobrado[m] ?? 0); if (n > 0.009) falta[m] = Math.round(n * 100) / 100; }
  const terceros = (p?.conceptos ?? []).filter((c) => c.clase === "tercero").map((c) => {
    const n = montoDe(c, a);
    return { id: c.id, concepto: c.tercero ? `${c.concepto} (${c.tercero})` : c.concepto, monto: n == null ? "Por definir" : dinero(n, c.moneda) };
  });
  const hayDinero = Boolean(p?.conceptos.length || a.cobros.length);

  const vistas = new Set<string>();
  const personas = a.personas.filter((x) => !x.fallecida && !vistas.has(x.persona_id) && vistas.add(x.persona_id))
    .map((x) => ({ id: x.persona_id, nombre: x.nombre, papel: x.papel }));
  const cada = a.tareas.filter((t) => t.estado === "pendiente" && esDeInforme(t.id)).map((t) => extraTarea.get(t.id)?.repetir?.cada)
    .find((c): c is CadaInforme => (CADA_INFORME as readonly string[]).includes(c ?? "")) ?? null;

  const material: MaterialInforme = {
    numero: previos.length + 1, hoy, desde, folio: a.folio, asunto: a.nombre,
    lleva: equipo.find((m) => m.id === a.responsable_id)?.nombre ?? user.name?.trim() ?? "Fortius Inmuebles",
    personas, propuesta: proponer(a, sigue, significadoDe(catalogos.resultado_cierre, a.resultado) !== "no_logrado"), hecho, sigue,
    faltan: a.documentos.filter((d) => d.estado === "falta").map((d) => ({ id: d.id, texto: d.nombre, persona_id: d.entrega_persona_id, papel: d.entrega_papel })),
    toca: a.tareas.filter((t) => t.estado === "pendiente" && t.quien === "cliente" && !t.interesado_id).map((t) => ({ id: t.id, texto: t.titulo })),
    actividad,
    dinero: hayDinero ? { acordado: texto(total), cobrado: texto(cobrado), falta: texto(falta), terceros } : null,
    cada,
  };
  return { material, asunto: a, tareaPendiente: a.tareas.filter((t) => t.estado === "pendiente" && esDeInforme(t.id)).map((t) => t.id) };
}

export type InformeHecho = { numero: number; documento_id: string; archivo_id: string | null; nombre: string };

/** Hace el informe: PDF en Documentos, nota en el Historial y, si se repite, la tarea del siguiente. */
export async function hacerInforme(client: SupabaseClient, user: StaffUser, asuntoId: string, o: OpcionesInforme): Promise<InformeHecho> {
  const { material, asunto, tareaPendiente } = await materialInforme(client, user, asuntoId);
  const c = contenidoInforme(material, o);
  if (!c.para.length) throw new ApiError(400, "Elige para quién es el informe.");

  const { renderDocumentoPdf } = await import("@/lib/formatos/documento/pdf");
  const [regular, bold, membrete] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")),
    loadLetterhead(),
  ]);
  const bytes = await renderDocumentoPdf(informeDocumento(material, o), { regular, bold, ...membrete });

  const ultimo = await client.from(T.documentos).select("orden").eq("asunto_id", asuntoId).is("deleted_at", null).order("orden", { ascending: false }).limit(1);
  if (ultimo.error) fallo(ultimo.error);
  const orden = Number((ultimo.data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10;
  const nombre = `Informe ${material.numero}`;
  const doc = await client.from(T.documentos).insert({
    asunto_id: asuntoId, nombre, grupo: GRUPO, estado: "recibido", origen: "formato", orden, creado_por: user.id,
    nota: `Para ${c.para.join(", ")}.`.slice(0, 2000),
  }).select("id").single();
  if (doc.error) fallo(doc.error);
  const documentoId = (doc.data as { id: string }).id;
  const archivoNombre = `Informe-${material.folio}-${String(material.numero).padStart(2, "0")}.pdf`;
  try {
    await guardarArchivo(createServerClient(undefined, true), asuntoId, documentoId, { bytes, mime: "application/pdf", ext: "pdf", nombre: archivoNombre }, user.id);
  } catch (e) {
    // Sin archivo no hay informe: el renglón no se queda vacío en Documentos.
    await client.from(T.documentos).update({ deleted_at: new Date().toISOString() }).eq("id", documentoId).eq("asunto_id", asuntoId);
    throw e;
  }
  const archivo = await client.from(T.archivos).select("id").eq("documento_id", documentoId).eq("asunto_id", asuntoId).is("deleted_at", null).limit(1).maybeSingle();

  const nota = await client.rpc("fortius_inmuebles_anotar_historial", {
    p_entidad: "asunto", p_entidad_id: asuntoId, p_asunto: asuntoId, p_clase: "nota",
    p_resumen: `Se hizo el informe ${material.numero} para ${c.para.join(", ")}.`.slice(0, 2000),
  });
  if (nota.error) fallo(nota.error);

  // La tarea de mandarlo queda hecha; si se repite, nace la del siguiente.
  if (tareaPendiente.length) {
    const hecha = await client.from(T.tareas).update({ estado: "hecha" }).in("id", tareaPendiente).eq("asunto_id", asuntoId).eq("estado", "pendiente");
    if (hecha.error) fallo(hecha.error);
  }
  if (o.cada) {
    const sig = await client.from(T.tareas).select("orden").eq("asunto_id", asuntoId).is("deleted_at", null).order("orden", { ascending: false }).limit(1);
    if (sig.error) fallo(sig.error);
    const lleva = user.role === "admin" || asunto.responsable_id === user.id ? asunto.responsable_id : user.id;
    const nueva = await client.from(T.tareas).insert({
      asunto_id: asuntoId, titulo: `Mandar el informe a ${c.para.map((n) => n.split(/\s+/)[0]).join(" y ")} (${NOMBRE_CADA[o.cada].toLowerCase()})`.slice(0, 300),
      clase: "seguimiento", quien: "fortius", fecha: siguienteFecha(material.hoy, o.cada), origen: "sistema",
      repetir: { cada: o.cada, que: "informe" }, responsable_id: lleva, creado_por: user.id,
      orden: Number((sig.data?.[0] as { orden?: number } | undefined)?.orden ?? 0) + 10,
    });
    if (nueva.error) fallo(nueva.error);
  }
  return { numero: material.numero, documento_id: documentoId, archivo_id: (archivo.data as { id: string } | null)?.id ?? null, nombre: archivoNombre };
}
