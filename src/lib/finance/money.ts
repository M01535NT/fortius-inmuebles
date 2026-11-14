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
/** Importe con dos decimales y separadores de México, sin símbolo de moneda. */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
export function formatAmountOrPending(value: number | null): string {
  return value === null ? "Pendiente" : formatAmount(value);
}
export function parseAmount(value: string, max = MAX_MONEY): number | null {
  if (!value.trim() || !/^\d+(?:\.\d{0,2})?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}
/** Tope razonable para un tipo de cambio en pesos por unidad de moneda extranjera. */
export const MAX_EXCHANGE_RATE = 1_000;
/**
 * Tipo de cambio escrito por el usuario (C-44): admite hasta 4 decimales, como el FIX de Banxico
 * (18.3417), y un punto inicial («.5»). Devuelve null si está vacío, no es número, es cero o excede el tope.
 */
export function parseExchangeRate(value: string, max = MAX_EXCHANGE_RATE): number | null {
  const text = value.trim();
  if (!/^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
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
