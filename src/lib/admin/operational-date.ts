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
