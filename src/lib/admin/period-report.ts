import type { Lead, Evento } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
export type PeriodFilter = { from: string; to: string; advisor: string };
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
