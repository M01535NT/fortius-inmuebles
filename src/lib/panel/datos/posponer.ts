import { aTexto, DIAS_LARGOS, diaLargo, MESES_CORTOS } from "@/lib/panel/calendario";
import type { Task } from "@/lib/tasks";

/**
 * Posponer (DECISIONES, «Patrones de interacción»; boceto «Inicio»): Esta tarde · Mañana · Lunes · Elegir fecha.
 * «Esta tarde» deja la tarea hoy a las 17:00; Mañana y Lunes, a las 9:00. Lo que no guarda hora (las solicitudes del sitio,
 * o un servidor que todavía no conoce la hora de la tarea) pospone solo el día. Funciones puras.
 */

export const HORA_TARDE = "17:00";
export const HORA_MANANA = "9:00";
/** Pasada esta hora ya no se ofrece «Esta tarde» (no tendría sentido posponer a las 17:00 a las 16:50). */
const LIMITE_TARDE_MIN = 16 * 60 + 30;

export type ClavePosponer = "tarde" | "manana" | "lunes";
export type OpcionPosponer = { clave: ClavePosponer; etiqueta: string; pista: string; fecha: string; hora: string | null };

const sumar = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const corto = (d: Date) => `${DIAS_LARGOS[d.getDay()].slice(0, 3).replace(/^./, (c) => c.toUpperCase())} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
/** «09:00» → «9:00» para leer; se guarda con dos cifras. */
export const horaGuardable = (h: string) => h.padStart(5, "0");
export const horaLegible = (h: string) => h.replace(/^0(\d)/, "$1");

/**
 * Opciones rápidas de Posponer. `conHora`: si lo pospuesto guarda la hora (las tareas sí; las solicitudes no).
 * El lunes es el que sigue; si hoy es lunes, el de la otra semana.
 */
export function opcionesPosponer(ahora: Date, conHora: boolean): OpcionPosponer[] {
  const manana = sumar(ahora, 1);
  const lunes = sumar(ahora, ((8 - ahora.getDay()) % 7) || 7);
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const lista: OpcionPosponer[] = [];
  if (conHora && minutos < LIMITE_TARDE_MIN) {
    lista.push({ clave: "tarde", etiqueta: "Esta tarde", pista: HORA_TARDE, fecha: aTexto(ahora), hora: HORA_TARDE });
  }
  lista.push({ clave: "manana", etiqueta: "Mañana", pista: conHora ? `${corto(manana)} · ${HORA_MANANA}` : corto(manana), fecha: aTexto(manana), hora: conHora ? HORA_MANANA : null });
  lista.push({ clave: "lunes", etiqueta: "Lunes", pista: conHora ? `${corto(lunes)} · ${HORA_MANANA}` : corto(lunes), fecha: aTexto(lunes), hora: conHora ? HORA_MANANA : null });
  return lista;
}

/** La tarea con su nuevo día y, si la trae, su hora. Sin hora, se quita la que tuviera. */
export function posponerTarea(t: Task, fecha: string, hora: string | null, ahora = new Date()): Task {
  const n: Task = { ...t, vence: fecha, actualizadoEl: ahora.toISOString() };
  if (hora) n.hora = horaGuardable(hora); else delete n.hora;
  return n;
}

/** ¿Se guardó la hora que se pidió? Si el servidor todavía no la conoce, devuelve la tarea sin ella. */
export const horaPerdida = (pedida: string | null, guardada: Pick<Task, "hora">) => Boolean(pedida) && !guardada.hora;

/** «Pospuesta para las 17:00», «… para mañana a las 9:00», «… para el lunes», «… para el jue 20 nov». */
export function textoPospuesta(fecha: string, hora: string | null, ahora: Date): string {
  const cuando = fecha === aTexto(ahora) ? (hora ? "" : "hoy")
    : fecha === aTexto(sumar(ahora, 1)) ? "mañana"
    : fecha === aTexto(sumar(ahora, ((8 - ahora.getDay()) % 7) || 7)) ? "el lunes"
    : `el ${diaLargo(fecha)}`;
  const h = hora ? `las ${horaLegible(hora)}` : "";
  return `Pospuesta para ${[cuando, h].filter(Boolean).join(" a ")}`;
}
