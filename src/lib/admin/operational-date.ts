const operationalDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Tijuana",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date for the operation, independent of the browser/server time zone. */
export function operationalDate(now: Date = new Date()): string {
  const parts = operationalDateFormatter.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * Calendar date of a stored value, read in Tijuana: a plain date («2026-11-13») stays as is; a
 * timestamp (UTC from the database) becomes the Tijuana day it happened on.
 */
export function calendarDayOf(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? value.slice(0, 10) : operationalDate(instant);
}

/** Calendar date plus `days`, without time-zone drift. */
export function addCalendarDays(date: string, days: number): string {
  const d = new Date(`${date.slice(0, 10)}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
