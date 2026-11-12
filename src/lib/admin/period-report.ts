import { LEAD_CANAL_LABELS, leadCanal, type Lead, type Evento, type LeadCanal } from "@/lib/domain/records";
import { operationalDate } from "@/lib/admin/operational-date";
type PeriodFilter = { from: string; to: string; advisor: string };
export function dateInPeriod(
  date: string | undefined,
  filter: Pick<PeriodFilter, "from" | "to">,
) {
  if (!date) return false;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : operationalDate(parsed);
  return (
    (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
  );
}
export function periodMetrics(
  allLeads: Lead[],
  events: Evento[],
  filter: PeriodFilter,
) {
  const leads = allLeads.filter(
    (l) =>
      (!filter.advisor || l.asesorId === filter.advisor) &&
      dateInPeriod(l.creadoEl, filter),
  );
  const responses = leads.flatMap((lead) => {
    if (
      !lead.firstContactedAt ||
      !dateInPeriod(lead.firstContactedAt, { from: "", to: filter.to })
    )
      return [];
    const hours =
      (Date.parse(lead.firstContactedAt) - Date.parse(lead.creadoEl)) / 3600000;
    return Number.isFinite(hours) && hours >= 0 ? [{ lead, hours }] : [];
  });
  const visits = events.filter(
    (e) =>
      e.tipo === "visita" &&
      (!filter.advisor || e.asesorId === filter.advisor) &&
      dateInPeriod(e.fecha, filter),
  );
  return {
    leads,
    responses,
    visits,
    responseHours: responses.length
      ? responses.reduce((total, r) => total + r.hours, 0) / responses.length
      : null,
    unmeasured: leads.length - responses.length,
  };
}

export type ChannelRow = { canal: LeadCanal | "sin-dato"; label: string; recibidos: number; atendidos: number; descartados: number; leads: Lead[] };
/**
  Prospectos del periodo por canal (titular, 29/10/2026). «Atendidos»: con primer
  contacto registrado o que ya cambiaron de «Nuevo». No mide ventas ni contratos:
  la conversión a cliente sale del contrato firmado (RP-90), que aún no se registra.
*/
export function channelMetrics(leads: Lead[]): ChannelRow[] {
  const rows = new Map<ChannelRow["canal"], ChannelRow>();
  for (const lead of leads) {
    const canal = leadCanal(lead);
    const row = rows.get(canal) ?? { canal, label: canal === "sin-dato" ? "Sin dato" : LEAD_CANAL_LABELS[canal], recibidos: 0, atendidos: 0, descartados: 0, leads: [] };
    row.recibidos += 1;
    if (lead.firstContactedAt || lead.estado !== "nuevo") row.atendidos += 1;
    if (lead.estado === "descartado") row.descartados += 1;
    row.leads.push(lead);
    rows.set(canal, row);
  }
  return [...rows.values()].sort((a, b) => Number(a.canal === "sin-dato") - Number(b.canal === "sin-dato") || b.recibidos - a.recibidos || a.label.localeCompare(b.label, "es"));
}

/** Periodo anterior del mismo largo, que termina el día antes de `from` (SIM-11). */
export function previousPeriod(from: string, to: string): { from: string; to: string } | null {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (!day.test(from) || !day.test(to) || from > to) return null;
  const start = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`);
  const length = Math.round((end - start) / 86400000) + 1;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { from: iso(start - length * 86400000), to: iso(start - 86400000) };
}

/** Los cuatro números de arriba de Reportes. Las definiciones son las de `periodMetrics` y `channelMetrics`. */
export function periodSummary(leads: Lead[], events: Evento[], filter: PeriodFilter) {
  const metrics = periodMetrics(leads, events, filter);
  return {
    received: metrics.leads.length,
    attended: metrics.leads.filter(lead => lead.firstContactedAt || lead.estado !== "nuevo").length,
    responseHours: metrics.responseHours,
    visits: metrics.visits.length,
  };
}

const hours = (value: number) => `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`;
/** Texto de comparación con el periodo anterior, sin juzgar si es bueno o malo. */
export function compareCount(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined) return "Sin periodo anterior para comparar";
  const diff = current - previous;
  if (!diff) return `Igual que el periodo anterior`;
  return `${Math.abs(diff)} ${diff > 0 ? "más" : "menos"} que el periodo anterior (${previous})`;
}
export function compareHours(current: number | null, previous: number | null | undefined) {
  if (previous === undefined) return "Sin periodo anterior para comparar";
  if (current === null || previous === null) return "Sin medición en uno de los dos periodos";
  const diff = Math.round((current - previous) * 10) / 10;
  if (!diff) return "Igual que el periodo anterior";
  return `${hours(Math.abs(diff))} ${diff < 0 ? "más rápido" : "más lento"} que el periodo anterior (${hours(previous)})`;
}
