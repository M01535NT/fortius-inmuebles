import type { Cliente, Evento, Lead } from "@/lib/admin/store";
import type { LeadProfile } from "@/lib/lead-profile";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { shortDate } from "@/lib/admin/today";

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

/** Lo más próximo entre sus tareas abiertas, sus citas pendientes y el próximo contacto. */
export function nextStep(person: { id: string; perfil?: LeadProfile }, kind: "lead" | "cliente", tasks: Task[], events: Evento[], today: string): NextStep | null {
  const mine = (ref: { leadId?: string; clienteId?: string }) => kind === "lead" ? ref.leadId === person.id : ref.clienteId === person.id;
  const options: Array<NextStep & { sort: string }> = [];
  for (const task of tasks) if (isTaskOpen(task) && mine(task)) options.push({ text: task.titulo, date: task.vence || undefined, sort: task.vence || "9999" });
  for (const event of events) if (mine(event) && event.fecha >= today) options.push({ text: event.titulo, date: event.fecha, time: event.hora, sort: `${event.fecha} ${event.hora ?? ""}` });
  if (person.perfil?.proximoContacto) options.push({ text: "Darle seguimiento", date: person.perfil.proximoContacto, sort: person.perfil.proximoContacto });
  options.sort((a, b) => a.sort.localeCompare(b.sort));
  const first = options[0];
  return first ? { text: first.text, date: first.date, time: first.time } : null;
}

export type ContactRow = {
  id: string; kind: "lead" | "cliente"; href: string; name: string; phone: string;
  wants: string; zone: string; budget: string | null;
  step: string; when: string | null; late: boolean; sort: string;
};

function row(kind: "lead" | "cliente", person: Lead | Cliente, verb: string | undefined, tasks: Task[], events: Evento[], today: string): ContactRow {
  const step = nextStep(person, kind, tasks, events, today);
  const date = step?.date ? stepDate(step.date, today, step.time) : null;
  return {
    id: person.id, kind, name: person.nombre, phone: person.telefono,
    href: `/admin/${kind === "lead" ? "leads" : "clientes"}/${encodeURIComponent(person.id)}`,
    wants: wants(person, verb) ?? "Por preguntar",
    zone: person.zona?.trim() || "Zona por definir",
    budget: budget(person.perfil),
    step: step?.text ?? "Sin siguiente paso",
    when: date?.label ?? null, late: date?.late ?? false,
    sort: step?.date ? `${step.date} ${step.time ?? ""}` : "9999",
  };
}

const bySort = (a: ContactRow, b: ContactRow) => a.sort.localeCompare(b.sort) || a.name.localeCompare(b.name, "es");
export const leadRows = (leads: Lead[], tasks: Task[], events: Evento[], today: string) => leads.map(l => row("lead", l, undefined, tasks, events, today)).sort(bySort);
export const clientRows = (clients: Cliente[], tasks: Task[], events: Evento[], today: string) => clients.map(c => row("cliente", c, CLIENT_VERB[c.tipo], tasks, events, today)).sort(bySort);

/** Busca sin acentos por nombre, teléfono, correo, zona o lo que busca. */
export function matches(query: string, ...values: Array<string | null | undefined>) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const text = values.filter(Boolean).join(" ");
  return normalize(text).includes(q) || (digits.length >= 3 && text.replace(/\D/g, "").includes(digits));
}
