import type { Evento } from "@/lib/admin/store";

/*
  Agenda (lienzo: AgendaEscritorio y AgendaMovil): semana por horas. Los eventos no
  tienen duración guardada; en la cuadrícula ocupan una hora. Si dos se enciman, se
  reparten el ancho de la columna.
*/

export const HOUR_HEIGHT = 56;
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const parts = (date: string) => ({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) - 1, day: Number(date.slice(8, 10)), weekday: new Date(`${date}T00:00:00.000Z`).getUTCDay() });
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + (m || 0); };

/** «1 de enero de 2027», el nombre accesible de cada día. */
export function dayLabel(date: string) { const p = parts(date); return `${p.day} de ${MONTHS[p.month]} de ${p.year}`; }
/** «Viernes 16 de octubre». */
export function dayTitle(date: string) { const p = parts(date); return `${WEEKDAYS[p.weekday]} ${p.day} de ${MONTHS[p.month]}`; }
/** «Lun», «Mié». */
export function weekdayShort(date: string) { return WEEKDAYS[parts(date).weekday].slice(0, 3); }
/** «Semana del 12 al 18 oct 2026» o, si cruza de mes, «del 28 dic 2026 al 3 ene 2027». */
export function weekTitle(days: string[]) {
  const a = parts(days[0]), b = parts(days[days.length - 1]);
  if (a.year !== b.year) return `Semana del ${a.day} ${MONTHS_SHORT[a.month]} ${a.year} al ${b.day} ${MONTHS_SHORT[b.month]} ${b.year}`;
  if (a.month !== b.month) return `Semana del ${a.day} ${MONTHS_SHORT[a.month]} al ${b.day} ${MONTHS_SHORT[b.month]} ${b.year}`;
  return `Semana del ${a.day} al ${b.day} ${MONTHS_SHORT[b.month]} ${b.year}`;
}

/** Horas que muestra la cuadrícula: de 8:00 a 19:00, más las que necesiten los eventos de la semana. */
export function hourRange(events: Array<Pick<Evento, "hora">>) {
  const hours = events.filter(e => e.hora).map(e => Number(e.hora!.slice(0, 2)));
  return { start: Math.min(8, ...hours), end: Math.min(24, Math.max(19, ...hours.map(h => h + 1))) };
}

export type PlacedEvent = { event: Evento; top: number; height: number; lane: number; lanes: number };

/** Coloca los eventos con hora de un día en la cuadrícula. */
export function placeEvents(events: Evento[], start: number): PlacedEvent[] {
  const timed = events.filter(e => e.hora).sort((a, b) => a.hora!.localeCompare(b.hora!) || a.titulo.localeCompare(b.titulo, "es"));
  const placed: PlacedEvent[] = [];
  let cluster: PlacedEvent[] = [], clusterEnd = -1, laneEnds: number[] = [];
  const close = () => { const lanes = Math.max(1, laneEnds.length); for (const p of cluster) p.lanes = lanes; cluster = []; laneEnds = []; };
  for (const event of timed) {
    const from = minutes(event.hora!), to = from + 60;
    if (from >= clusterEnd) close();
    let lane = laneEnds.findIndex(end => end <= from);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(to); } else laneEnds[lane] = to;
    const item = { event, top: ((from - start * 60) / 60) * HOUR_HEIGHT + 2, height: HOUR_HEIGHT - 4, lane, lanes: 1 };
    cluster.push(item); placed.push(item);
    clusterEnd = Math.max(clusterEnd, to);
  }
  close();
  return placed;
}

/** «2 visitas y 1 cita», o null si el día está libre. */
export function daySummary(events: Array<Pick<Evento, "tipo">>) {
  const visits = events.filter(e => e.tipo === "visita").length, others = events.length - visits;
  const text = [visits && `${visits} ${visits === 1 ? "visita" : "visitas"}`, others && `${others} ${others === 1 ? "cita" : "citas"}`].filter(Boolean);
  return text.length ? text.join(" y ") : null;
}
