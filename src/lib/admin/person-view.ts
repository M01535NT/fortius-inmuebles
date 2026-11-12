import type { Evento, LeadEstado } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { stepDate } from "@/lib/admin/contacts-view";
import { shortDate } from "@/lib/admin/today";
import { isTaskOpen, type Task } from "@/lib/tasks";

/*
  Ficha de persona (SIM-07, 11/11/2026): los tres estados visibles del prospecto (DEC-46) y la
  línea de tiempo que reúne notas, citas, tareas y registros. Solo presentación: la base
  conserva los seis estados y cada cosa sigue guardada donde estaba.
*/

/** Lo que ve el asesor. «cerrado» es un estado anterior: se muestra, pero ya no se elige. */
export type LeadStage = "nuevo" | "seguimiento" | "descartado" | "cerrado";
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = { nuevo: "Nuevo", seguimiento: "En seguimiento", descartado: "Descartado", cerrado: "Cerrado" };
/** Los que se pueden elegir (titular, 11/11/2026). */
export const LEAD_STAGE_CHOICES: LeadStage[] = ["nuevo", "seguimiento", "descartado"];

export function leadStage(estado: LeadEstado | undefined): LeadStage {
  if (!estado || estado === "nuevo") return "nuevo";
  if (estado === "descartado" || estado === "cerrado") return estado;
  return "seguimiento";
}
/** El estado que se guarda al elegir una etapa: «En seguimiento» conserva el intermedio que ya tenía. */
export function estadoForStage(stage: LeadStage, current: LeadEstado): LeadEstado {
  if (stage === "seguimiento") return leadStage(current) === "seguimiento" ? current : "contactado";
  return stage;
}

/** «21 oct 2026» a partir de un instante o una fecha. */
export function humanDay(instant?: string) {
  if (!instant) return "";
  const date = new Date(instant.length <= 10 ? `${instant}T12:00:00.000Z` : instant);
  if (Number.isNaN(date.getTime())) return "";
  const day = instant.length <= 10 ? instant : operationalDate(date);
  return `${shortDate(day)} ${day.slice(0, 4)}`;
}

export type TimelineItem = {
  id: string; kind: "Nota" | "Cita" | "Visita" | "Tarea" | "Registro";
  text: string;
  /** «Hoy · 11:00», «Vencido · 9 nov» o «21 oct 2026». */
  when: string;
  late?: boolean; done?: boolean; href?: string;
  /** Para ordenar: fecha y hora comparables. */
  sort: string;
};
type Note = { id: string; texto: string; fecha: string };

/**
  Lo que viene (citas de hoy en adelante y tareas abiertas, lo más próximo primero) y lo que ya
  pasó (notas, citas anteriores, tareas cerradas y registros, lo más reciente primero).
*/
export function personTimeline({ notes = [], events, tasks, records = [], today }: { notes?: Note[]; events: Evento[]; tasks: Task[]; records?: Array<{ id: string; text: string; at?: string }>; today: string }) {
  const upcoming: TimelineItem[] = [], past: TimelineItem[] = [];
  for (const event of events) {
    const kind = event.tipo === "visita" ? "Visita" as const : "Cita" as const;
    const href = `/admin/agenda?fecha=${event.fecha}&evento=${encodeURIComponent(event.id)}`;
    const sort = `${event.fecha} ${event.hora ?? ""}`;
    if (event.fecha >= today) upcoming.push({ id: `e:${event.id}`, kind, text: event.titulo, when: stepDate(event.fecha, today, event.hora).label, href, sort });
    else past.push({ id: `e:${event.id}`, kind, text: event.titulo, when: humanDay(event.fecha), href, sort });
  }
  for (const task of tasks) {
    const href = `/admin/tareas/${encodeURIComponent(task.id)}`;
    if (isTaskOpen(task)) {
      const date = task.vence ? stepDate(task.vence, today) : null;
      upcoming.push({ id: `t:${task.id}`, kind: "Tarea", text: task.titulo, when: date?.label ?? "Sin fecha", late: date?.late, href, sort: task.vence ?? "9999" });
    } else past.push({ id: `t:${task.id}`, kind: "Tarea", text: task.titulo, when: humanDay(task.completadoEl ?? task.vence), done: task.estado === "completada", href, sort: task.completadoEl ?? task.vence ?? "" });
  }
  for (const note of notes) past.push({ id: `n:${note.id}`, kind: "Nota", text: note.texto, when: humanDay(note.fecha), sort: note.fecha });
  for (const record of records) if (record.at) past.push({ id: `r:${record.id}`, kind: "Registro", text: record.text, when: humanDay(record.at), sort: record.at });
  upcoming.sort((a, b) => a.sort.localeCompare(b.sort));
  past.sort((a, b) => b.sort.localeCompare(a.sort));
  return { upcoming, past };
}
