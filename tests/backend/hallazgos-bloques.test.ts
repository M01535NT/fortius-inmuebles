import { expect, test } from "vitest";
import { calculateFinancial } from "@/lib/apps/financial";
import { calculateCommercial } from "@/lib/apps/commercial";

// C-14 (Calidad): el mes del abono único fuera del plazo no bloquea si no hay abono único.
test("la hipoteca se calcula sin abono único aunque su mes quede fuera del plazo", () => {
  expect(() => calculateFinancial("hipoteca", { price: 1000000, downPercent: 10, annualRate: 10, months: 12, extraMonth: 24, extraOnce: 0, extraMonthly: 0 })).not.toThrow();
  expect(() => calculateFinancial("hipoteca", { price: 1000000, downPercent: 10, annualRate: 10, months: 12, extraMonth: 24, extraOnce: 5000, extraMonthly: 0 })).toThrow();
});

// C-25 (Calidad): un precio capturado con espacios no rompe la cotización.
test("la cotización acepta un precio unitario con espacios", () => {
  const quote = (unitPrice: unknown) => calculateCommercial("cotizador", { client: "Cliente de ejemplo", currency: "MXN", issuedAt: "2026-11-13", validUntil: "2026-11-20", items: [{ concept: "Servicio", category: "honorarios", quantity: 1, unitPrice, discountPct: 0, taxPct: 0 }] });
  expect(() => quote(" 100 ")).not.toThrow();
  expect(() => quote(" 100.005 ")).toThrow(/dos decimales/);
});
