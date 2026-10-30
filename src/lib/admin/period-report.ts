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
