import type { Evento, Nota } from "@/lib/admin/store";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import type { Task } from "@/lib/tasks";
import { shortDate } from "@/lib/admin/today";

/*
  LV-10e · Personas como agenda con cara. La lista se lee como agenda: primero a quién le toca hoy
  (o se le pasó), luego lo de esta semana, lo que viene después y al final quien no tiene fecha.
  «Lo que ha pasado» junta lo que ya existe de la persona: sus notas, las citas que ya pasaron,
  las tareas terminadas y las notas del primer contacto. No inventa nada ni lee el historial técnico.
*/

export type Grupo = "toca" | "semana" | "despues" | "sinFecha";
export const GRUPOS: ReadonlyArray<{ id: Grupo; titulo: string }> = [
  { id: "toca", titulo: "Te toca hoy o antes" },
  { id: "semana", titulo: "Esta semana" },
  { id: "despues", titulo: "Más adelante" },
  { id: "sinFecha", titulo: "Sin fecha" },
];

function sumarDias(dia: string, n: number) {
  const d = new Date(`${dia}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** `sort` es la fecha del siguiente paso («2026-11-14» o «2026-11-14 11:00»), o «9999» sin fecha. */
export function grupoDe(sort: string, today: string): Grupo {
  if (sort.startsWith("9999")) return "sinFecha";
  const dia = sort.slice(0, 10);
  if (dia <= today) return "toca";
  return dia <= sumarDias(today, 6) ? "semana" : "despues";
}

/** Día local de Tijuana de una marca de tiempo; una fecha de calendario se queda igual. */
export function diaLocal(valor: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return new Date(valor).toLocaleDateString("en-CA", { timeZone: "America/Tijuana" });
}

export type Suceso = { id: string; clase: "nota" | "cita" | "tarea" | "contacto"; orden: string; dia: string; texto: string; detalle: string; autor?: string };

const recorte = (texto: string, max = 120) => { const t = texto.trim().replace(/\s+/g, " "); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };

/**
  Lo que ha pasado con la persona, lo más reciente primero. `quien` ubica sus registros: el
  prospecto por su id; el cliente por su id o por cualquiera de sus operaciones.
*/
export function sucesos(quien: { kind: "lead" | "cliente"; id: string; operaciones: string[] }, datos: {
  notas: Nota[]; eventos: Evento[]; tareas: Task[]; notasContacto: Array<{ id: string; texto: string; fecha: string }>;
}, today: string, max = 8): Suceso[] {
  const ops = new Set(quien.operaciones);
  const suya = (ref: { leadId?: string; clienteId?: string; expedienteId?: string }) =>
    (quien.kind === "lead" ? ref.leadId === quien.id : ref.clienteId === quien.id) || (!!ref.expedienteId && ops.has(ref.expedienteId));
  const lista: Suceso[] = [];
  if (quien.kind === "cliente") for (const nota of datos.notas) if (!nota.aviso && (nota.clienteId === quien.id || (!!nota.expedienteId && ops.has(nota.expedienteId)))) {
    const dia = diaLocal(nota.actualizadoEl);
    lista.push({ id: `n${nota.id}`, clase: "nota", orden: nota.actualizadoEl, dia, autor: nota.autor, texto: `${nota.autor ? `${nota.autor} anotó` : "Nota"}: «${recorte(nota.titulo || nota.texto)}»`, detalle: `${shortDate(dia)} · nota` });
  }
  for (const evento of datos.eventos) if (suya(evento) && evento.fecha < today)
    lista.push({ id: `e${evento.id}`, clase: "cita", orden: `${evento.fecha}T${evento.hora ?? "00:00"}`, dia: evento.fecha, texto: evento.titulo, detalle: `${shortDate(evento.fecha)} · ${EVENTO_TIPO_LABELS[evento.tipo].toLowerCase()}` });
  for (const tarea of datos.tareas) if (tarea.estado === "completada" && tarea.completadoEl && suya(tarea)) {
    const dia = diaLocal(tarea.completadoEl);
    lista.push({ id: `t${tarea.id}`, clase: "tarea", orden: tarea.completadoEl, dia, texto: `Se terminó: ${recorte(tarea.titulo)}`, detalle: `${shortDate(dia)} · tarea` });
  }
  for (const nota of datos.notasContacto) {
    const dia = diaLocal(nota.fecha);
    lista.push({ id: `c${nota.id}`, clase: "contacto", orden: nota.fecha, dia, texto: `«${recorte(nota.texto)}»`, detalle: `${shortDate(dia)} · primer contacto` });
  }
  return lista.sort((a, b) => b.orden.localeCompare(a.orden)).slice(0, max);
}
