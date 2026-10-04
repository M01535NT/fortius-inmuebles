import Decimal from "decimal.js";
export const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});
export const MAX_MONEY = 10_000_000_000;
export function cents(value: Decimal.Value): number {
  return new D(value).toDecimalPlaces(2).toNumber();
}
export function sumMoney(values: number[]): number {
  return cents(values.reduce((s, v) => s.plus(v), new D(0)));
}
export function money(value: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export function parseAmount(value: string, max = MAX_MONEY): number | null {
  if (!value.trim() || !/^\d+(?:\.\d{0,2})?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}
export function checkAmount(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY)
    throw new RangeError("Importe fuera de rango");
}
export function validIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function supportedFiscalDate(date: string): boolean {
  return validIsoDate(date) && date >= "2026-01-01" && date <= "2026-12-31";
}
export function localToday(): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) => p.find((v) => v.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
