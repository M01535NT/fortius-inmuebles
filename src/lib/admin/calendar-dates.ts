/** Date-only calendar arithmetic uses UTC so device timezone and DST cannot move a day. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftCalendarDate(value: string, days: number): string {
  const date = new Date(value + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calendarWeekDays(value: string): string[] {
  const weekday = new Date(value + "T00:00:00.000Z").getUTCDay();
  const monday = shiftCalendarDate(value, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftCalendarDate(monday, index));
}

