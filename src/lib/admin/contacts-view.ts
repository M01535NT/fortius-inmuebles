import type { Cliente, Evento, Lead } from "@/lib/admin/store";
import type { LeadProfile } from "@/lib/lead-profile";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { arrivedAt, awaitingFirstReply, shortDate } from "@/lib/admin/today";
import { isNextStepTask } from "@/lib/admin/next-step-task";

/*
  Contactos (lienzo: ContactosEscritorio y ContactosMovil): por persona, lo que busca,
  zona y presupuesto, y el siguiente paso con su fecha. Todo sale de datos que ya existen:
  el perfil del prospecto o cliente, sus tareas abiertas, sus citas y el próximo contacto.
*/

const VERB: Record<string, string> = { comprar: "Comprar", rentar: "Rentar", vender: "Vender", arrendar: "Ofrecer en renta", invertir: "Invertir" };
const CLIENT_VERB: Partial<Record<Cliente["tipo"], string>> = { propietario: "Vender", comprador: "Comprar", arrendador: "Ofrecer en renta", arrendatario: "Rentar", inversionista: "Invertir" };
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const whole = (value: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value);

/** «Comprar casa», «Rentar», «Casa» o null si no se sabe. */
export function wants(person: { perfil?: LeadProfile; tipoPropiedad?: string }, fallbackVerb?: string) {
  const verb = (person.perfil?.operacion && VERB[person.perfil.operacion]) || fallbackVerb;
  const kind = person.tipoPropiedad?.trim();
  if (verb && kind) return `${verb} ${kind.toLowerCase()}`;
  return verb ?? (kind ? kind[0].toUpperCase() + kind.slice(1) : null);
}

/** «Hasta $4,200,000 MXN», «$2,500,000 a $3,500,000 MXN» o null. */
export function budget(perfil?: LeadProfile) {
  if (!perfil) return null;
  const currency = perfil.moneda ?? "MXN";
  const min = perfil.presupuestoMin, max = perfil.presupuestoMax;
  if (min !== undefined && max !== undefined) return `$${whole(min)} a $${whole(max)} ${currency}`;
  if (max !== undefined) return `Hasta $${whole(max)} ${currency}`;
  if (min !== undefined) return `Desde $${whole(min)} ${currency}`;
  const declared = perfil.presupuestoDeclarado ?? perfil.capitalDeclarado ?? perfil.precioObjetivo;
  return declared !== undefined ? `$${whole(declared)} ${currency}` : null;
}

/** «Hoy · 16 oct», «Vencido · 14 oct», «Lun · 19 oct»; con hora, «Hoy · 11:00». */
export function stepDate(date: string, today: string, time?: string) {
  const late = date < today;
  const day = new Date(`${date}T00:00:00.000Z`);
  const head = late ? "Vencido" : date === today ? "Hoy" : WEEKDAYS[day.getUTCDay()];
  return { label: `${head} · ${time && !late ? time : shortDate(date)}`, late };
}

export type NextStep = { text: string; date?: string; time?: string };
/** Una operación activa de la persona: su identificador, a quién pertenece y en qué etapa va. */
export type PersonOperation = { id: string; clienteId?: string; stage: string };

/**
  Lo más próximo entre sus tareas abiertas, sus citas pendientes y el próximo contacto. Si la
  persona tiene una operación activa, manda la operación (C40): cuentan sus tareas y citas, el
  «próximo contacto» del perfil ya no, y sin nada con fecha se dice en qué etapa va.
*/
export function nextStep(person: { id: string; perfil?: LeadProfile; estado?: string }, kind: "lead" | "cliente", tasks: Task[], events: Evento[], today: string, operations: PersonOperation[] = []): NextStep | null {
  const ops = kind === "cliente" ? operations.filter(op => op.clienteId === person.id) : [];
  const opIds = new Set(ops.map(op => op.id));
  const mine = (ref: { leadId?: string; clienteId?: string; expedienteId?: string }) => (kind === "lead" ? ref.leadId === person.id : ref.clienteId === person.id) || (!!ref.expedienteId && opIds.has(ref.expedienteId));
  const options: Array<NextStep & { sort: string }> = [];
  for (const task of tasks) if (isTaskOpen(task) && mine(task)) options.push({ text: task.titulo, date: task.vence || undefined, sort: task.vence || "9999" });
  for (const event of events) if (mine(event) && event.fecha >= today) options.push({ text: event.titulo, date: event.fecha, time: event.hora, sort: `${event.fecha} ${event.hora ?? ""}` });
  // DEC-42: con una tarea de siguiente paso, el «próximo contacto» del perfil ya no cuenta.
  const onTasks = tasks.some(task => isNextStepTask(task, { kind, id: person.id }));
  // C-51: el «próximo contacto» de un prospecto descartado o cerrado ya no cuenta (igual que Hoy y Agenda).
  const closedLead = kind === "lead" && (person.estado === "descartado" || person.estado === "cerrado");
  if (person.perfil?.proximoContacto && !ops.length && !onTasks && !closedLead) options.push({ text: person.perfil.proximaAccion?.trim() || "Darle seguimiento", date: person.perfil.proximoContacto, sort: person.perfil.proximoContacto });
  options.sort((a, b) => a.sort.localeCompare(b.sort));
  const first = options[0];
  if (first) return { text: first.text, date: first.date, time: first.time };
  return ops.length ? { text: `Operación en ${ops[0].stage.charAt(0).toLowerCase()}${ops[0].stage.slice(1)}` } : null;
}

export type ContactRow = {
  id: string; kind: "lead" | "cliente"; href: string; name: string; phone: string;
  wants: string; zone: string; budget: string | null;
  step: string; when: string | null; late: boolean; sort: string;
};

function row(kind: "lead" | "cliente", person: Lead | Cliente, verb: string | undefined, tasks: Task[], events: Evento[], today: string, operations: PersonOperation[] = []): ContactRow {
  const step = nextStep(person, kind, tasks, events, today, operations);
  const date = step?.date ? stepDate(step.date, today, step.time) : null;
  return {
    id: person.id, kind, name: person.nombre, phone: person.telefono,
    href: kind === "lead" ? `/admin/leads/${encodeURIComponent(person.id)}` : `/admin/clientes/${encodeURIComponent(person.id)}`,
    // Hueco vacío en lugar de relleno («Por preguntar», «Zona por definir», «Sin siguiente paso», C40).
    wants: wants(person, verb) ?? "",
    zone: person.zona?.trim() ?? "",
    budget: budget(person.perfil),
    step: step?.text ?? "",
    when: date?.label ?? null, late: date?.late ?? false,
    sort: step?.date ? `${step.date} ${step.time ?? ""}` : "9999",
  };
}

const bySort = (a: ContactRow, b: ContactRow) => a.sort.localeCompare(b.sort) || a.name.localeCompare(b.name, "es");
export const leadRows = (leads: Lead[], tasks: Task[], events: Evento[], today: string) => leads.map(l => row("lead", l, undefined, tasks, events, today)).sort(bySort);
export const clientRows = (clients: Cliente[], tasks: Task[], events: Evento[], today: string, operations: PersonOperation[] = []) => clients.map(c => row("cliente", c, CLIENT_VERB[c.tipo], tasks, events, today, operations)).sort(bySort);

/*
  Lista del día (CRM-01, propuesta A + B aprobada el 12/11/2026): arriba quien llegó y nadie le ha
  escrito, con el tiempo contra el plazo de primera atención; luego lo que toca hoy o se atrasó;
  después lo que viene, y al final quien no tiene siguiente paso con fecha.
*/
export type DayGroupId = "sin-atender" | "hoy" | "despues" | "sin-paso";
export const DAY_GROUP_LABELS: Record<DayGroupId, string> = { "sin-atender": "Sin atender", hoy: "Toca hoy o se atrasó", despues: "Más adelante", "sin-paso": "Sin siguiente paso" };
export type Waiting = { hours: number; late: boolean };

/** Prospecto que llegó solo (sitio web) y nadie ha contactado: horas que lleva y si pasó el plazo. */
export function waitingSince(lead: Pick<Lead, "origen" | "estado" | "firstContactedAt" | "clienteId" | "creadoEl" | "reabiertoEl">, now: Date, limitHours: number): Waiting | null {
  if (!awaitingFirstReply(lead)) return null;
  const elapsed = now.getTime() - new Date(arrivedAt(lead)).getTime();
  if (!Number.isFinite(elapsed)) return null;
  const hours = Math.max(0, Math.floor(elapsed / 3_600_000));
  return { hours, late: elapsed >= limitHours * 3_600_000 };
}

export function dayGroups(rows: ContactRow[], today: string, waiting: (row: ContactRow) => Waiting | null) {
  const groups: Record<DayGroupId, ContactRow[]> = { "sin-atender": [], hoy: [], despues: [], "sin-paso": [] };
  for (const row of rows) {
    if (row.kind === "lead" && waiting(row)) groups["sin-atender"].push(row);
    else if (row.sort === "9999") groups["sin-paso"].push(row);
    else if (row.sort.slice(0, 10) <= today) groups.hoy.push(row);
    else groups.despues.push(row);
  }
  // Sin atender: quien más tiempo lleva esperando, primero.
  groups["sin-atender"].sort((a, b) => (waiting(b)?.hours ?? 0) - (waiting(a)?.hours ?? 0));
  return (Object.keys(groups) as DayGroupId[]).map(id => ({ id, label: DAY_GROUP_LABELS[id], rows: groups[id] })).filter(group => group.rows.length > 0);
}

/** Busca sin acentos por nombre, teléfono, correo, zona o lo que busca. */
export function matches(query: string, ...values: Array<string | null | undefined>) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const text = values.filter(Boolean).join(" ");
  return normalize(text).includes(q) || (digits.length >= 3 && text.replace(/\D/g, "").includes(digits));
}
