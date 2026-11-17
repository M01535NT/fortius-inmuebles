import type { Task } from "@/lib/tasks";
import type { FilaConsulta } from "@/lib/panel/datos/consultas";
import { tiempo } from "@/lib/panel/datos/consultas";
import type { TareaHoy, Vence } from "@/lib/panel/datos/hoy";
import type { FilaTramite } from "@/lib/panel/datos/tramites";
import type { Vencimiento } from "@/lib/panel/datos/vencimientos";
import { horaLegible } from "@/lib/panel/datos/posponer";
import { DIAS_LARGOS, MESES, MESES_CORTOS, deTexto } from "@/lib/panel/calendario";

/**
 * «Atender primero» de Hoy (boceto «Inicio»): una sola lista con lo que pide acción hoy, venga de donde venga.
 * Tareas que vencen hoy o ya vencieron, consultas del sitio sin responder, trámites donde toca preguntar
 * contratos ya vencidos, y los cobros de Dinero y las fechas clave de los asuntos que vencen hoy o ya vencieron. Funciones puras.
 */

export type ClaseItem = "tarea" | "consulta" | "tramite" | "contrato" | "cobro" | "fecha";
export type ItemHoy = {
  id: string; clase: ClaseItem; titulo: string; ctx: string;
  /** Lo que va a la derecha: «Hoy», «Venció lun 10 nov», «hace 2 h». */
  lado: string;
  tono: "error" | "aviso" | "normal";
  vencido: boolean;
  /** Una solicitud que llegó por el sitio y nadie ha respondido. */
  delSitio: boolean;
  href?: string; telefono?: string; nombre?: string; expedienteId?: string; tarea?: Task;
  /** La consulta del sitio de donde sale (para marcarla atendida desde Hoy). */
  consultaId?: string;
  /** Para ordenar dentro de lo de hoy: la hora («17:00») o la fecha en que venció. */
  clave?: string;
};

export type VistaHoy = "todo" | "vencido" | "hoy";
export type OrdenHoy = "vencido" | "solicitudes";

const fechaCorta = (f: string) => { const d = deTexto(f); return d ? `${DIAS_LARGOS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}` : f; };

export function itemsDeHoy(d: {
  tareas: readonly TareaHoy[]; consultas: readonly FilaConsulta[]; tramites: readonly FilaTramite[];
  tonosTramite: Record<string, "error" | "aviso">; /** Contratos y licencias que vencen hoy o ya vencieron. */
  contratosVencidos: readonly Vence[];
  /** Cobros y fechas clave que vencen hoy o ya vencieron (ver `vencimientos.ts`). */
  vencen?: readonly Vencimiento[];
  /** Línea de cada asunto («Ana González · Casa en Otay · Venta») para dar contexto a sus tareas. */
  lineaAsunto: (id: string) => string | undefined; hoy: string;
  rutaConsulta: (id: string) => string; rutaTramite: (id: string) => string;
}): ItemHoy[] {
  const items: ItemHoy[] = [];
  for (const t of d.tareas) {
    const exp = t.tarea.expedienteId || undefined;
    const vencido = t.tono === "error";
    items.push({
      id: `t:${t.id}`, clase: "tarea", titulo: t.titulo, tarea: t.tarea, expedienteId: exp,
      ctx: (exp && d.lineaAsunto(exp)) || t.tarea.descripcion?.split("\n")[0]?.slice(0, 120) || "Tarea",
      lado: vencido ? `Venció ${fechaCorta(t.tarea.vence ?? d.hoy)}` : t.tarea.hora ? horaLegible(t.tarea.hora) : "Hoy",
      tono: vencido ? "error" : "normal", vencido, delSitio: false, clave: vencido ? t.tarea.vence : t.tarea.hora || "99",
    });
  }
  for (const c of d.consultas) {
    if (c.pestana !== "por_atender") continue;
    items.push({
      id: `c:${c.id}`, clase: "consulta", titulo: `Responder a ${c.nombre}`,
      ctx: [c.inmueble, c.canal].filter(Boolean).join(" · ") || c.mensaje?.slice(0, 120) || "Solicitud del sitio",
      lado: `hace ${tiempo(c.esperaMs)}`, tono: c.urgencia, vencido: c.urgencia === "error", delSitio: true,
      href: d.rutaConsulta(c.id), telefono: c.telefono || undefined, nombre: c.nombre, consultaId: c.id,
    });
  }
  for (const t of d.tramites) {
    const tono = d.tonosTramite[t.id] ?? "aviso";
    items.push({
      id: `r:${t.id}`, clase: "tramite", titulo: t.titulo, ctx: [t.linea, t.estado].filter(Boolean).join(" · "),
      lado: tono === "error" ? "Atrasado" : "Hoy", tono, vencido: tono === "error", delSitio: false, href: d.rutaTramite(t.id),
    });
  }
  for (const v of d.contratosVencidos) {
    items.push({
      id: `v:${v.id}`, clase: "contrato", titulo: v.titulo, ctx: v.detalle,
      lado: v.dias < 0 ? `Hace ${-v.dias} ${v.dias === -1 ? "día" : "días"}` : "Hoy", tono: v.dias < 0 ? "error" : "aviso", vencido: v.dias < 0, delSitio: false,
    });
  }
  for (const v of d.vencen ?? []) {
    if (v.clase !== "cobro" && v.clase !== "fecha") continue;
    const vencido = v.fecha < d.hoy;
    items.push({
      id: `x:${v.id}`, clase: v.clase, titulo: v.titulo, ctx: v.detalle,
      lado: vencido ? `Venció ${fechaCorta(v.fecha)}` : "Hoy", tono: vencido ? "error" : "aviso", vencido, delSitio: false,
      href: v.href, expedienteId: v.expedienteId, clave: vencido ? v.fecha : "99",
    });
  }
  return items;
}

const PESO: Record<ClaseItem, number> = { contrato: 0, cobro: 1, tarea: 2, fecha: 3, tramite: 4, consulta: 5 };

export function ordenarHoy(items: readonly ItemHoy[], orden: OrdenHoy): ItemHoy[] {
  return [...items].sort((a, b) => {
    if (orden === "solicitudes" && a.delSitio !== b.delSitio) return a.delSitio ? -1 : 1;
    if (a.vencido !== b.vencido) return a.vencido ? -1 : 1;
    // Lo vencido, lo más antiguo primero; lo de hoy, por hora (DECISIONES, Inicio: «Orden de urgencia»).
    const c = (a.clave ?? "99").localeCompare(b.clave ?? "99");
    return c || PESO[a.clase] - PESO[b.clase];
  });
}

/**
 * Todo · Vencido · Hoy (boceto): «Hoy» es lo de hoy que no venció, sin las solicitudes del sitio,
 * que tienen su propia línea ámbar y su ajuste «Solo solicitudes del sitio».
 */
export function filtrarHoy(items: readonly ItemHoy[], vista: VistaHoy, soloSitio: boolean): ItemHoy[] {
  return items.filter((i) => (vista === "todo" || (vista === "vencido" ? i.vencido : !i.vencido && !i.delSitio)) && (!soloSitio || i.delSitio));
}

/** Lo que sigue cuando no hay nada pendiente (DECISIONES, Inicio): «Mañana: 2 citas y 3 tareas». */
export function resumenManana(citas: number, tareas: number): string {
  const partes = [
    citas ? `${citas} ${citas === 1 ? "cita" : "citas"}` : null,
    tareas ? `${tareas} ${tareas === 1 ? "tarea" : "tareas"}` : null,
  ].filter(Boolean);
  return partes.length ? `Mañana: ${partes.join(" y ")}` : "Mañana no hay nada agendado";
}

/** Minutos desde medianoche de «HH:mm»; null si no se entiende. */
export function minutosDe(hora?: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hora ?? "");
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

/** Una cita de hoy ya terminó si tiene hora y su duración supuesta ya pasó. Las de sin hora no terminan. */
export function citaTerminada(hora: string | undefined, duracionMin: number, minutosAhora: number): boolean {
  const ini = minutosDe(hora);
  return ini !== null && ini + duracionMin <= minutosAhora;
}

/** «Domingo 15 de noviembre». */
export function fechaTitulo(d: Date): string {
  const dia = DIAS_LARGOS[d.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
