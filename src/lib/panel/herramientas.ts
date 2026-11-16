import { D, cents } from "@/lib/finance/money";
import { calculateMortgage } from "@/lib/finance/mortgage";

/**
 * Cuentas rápidas de Herramientas (PN-09, adelantada porque no depende de la base de datos).
 * Usan el mismo cálculo de crédito que el resto del sistema (`src/lib/finance`). Son cuentas de referencia:
 * no incluyen seguros, comisiones del banco ni impuestos de la operación.
 */

export type ResultadoCredito = { mensualidad: number; enganche: number; credito: number; intereses: number; totalPagado: number };

export function calcularCredito(precio: number, enganchePct: number, plazoAnios: number, tasaAnual: number, primerPago: string): ResultadoCredito | null {
  if (!(precio > 0) || !(plazoAnios > 0)) return null;
  try {
    const r = calculateMortgage({
      price: precio, downPercent: enganchePct, annualRate: tasaAnual, months: Math.round(plazoAnios * 12), firstPayment: primerPago,
      insurance: null, monthlyFee: null, openingFee: null, extraMonthly: 0, extraOnce: 0, extraMonth: 1, prepaymentFee: null, prepaymentMode: "term",
    });
    return { mensualidad: r.payment, enganche: r.downPayment, credito: r.principal, intereses: r.interest, totalPagado: cents(new D(r.principal).plus(r.interest)) };
  } catch {
    return null;
  }
}

export type ResultadoComision = { comision: number; iva: number; total: number; alPropietario: number };

/** Comisión sobre el precio de venta más IVA. Falta decidir si la base es siempre el precio de venta (DECISIONES.md, Herramientas). */
export function calcularComision(precio: number, pct: number, ivaPct = 16): ResultadoComision | null {
  if (!(precio > 0) || !(pct >= 0) || pct > 100) return null;
  const comision = cents(new D(precio).mul(pct).div(100));
  const iva = cents(new D(comision).mul(ivaPct).div(100));
  const total = cents(new D(comision).plus(iva));
  return { comision, iva, total, alPropietario: cents(new D(precio).minus(total)) };
}

/** «$1,234,567» sin centavos, para cuentas rápidas. */
export function pesos(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}
