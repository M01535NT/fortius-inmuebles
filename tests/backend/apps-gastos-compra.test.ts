import { describe, expect, it } from "vitest";
import { calculateFinancial, getFinancialDefaults } from "@/lib/apps/financial";
import type { AppResult } from "@/lib/apps/types";

/*
  Gastos de compra del comprador (revisión del catálogo del 12/11/2026). Reutiliza el cálculo del
  sitio público; las cifras esperadas son las del documento legal del 4/10/2026 (base 3,000,000 en
  Tijuana): ISAI 69,080.07; Registro 13,384.22 de contado con 2 avisos y 25,261.56 con hipoteca.
*/
const value = (result: AppResult, label: string) => result.summary.find(item => item.label === label)?.value;
const base = { ...getFinancialDefaults("gastos-compra"), municipality: "tijuana", date: "2026-10-04", price: 3_000_000 };
const row = (result: AppResult, concept: RegExp) => result.sections?.find(s => s.title === "Gastos")?.rows?.find(r => concept.test(String(r[0])));

describe("Gastos de compra en Herramientas", () => {
  it("con crédito y cotizaciones completas da el dinero que necesita el comprador", () => {
    const result = calculateFinancial("gastos-compra", { ...base, financing: "credito", downPayment: 600_000, notary: 40_000, appraisal: 8_000, openingFee: 20_000, other: 0 });
    expect(value(result, "Enganche")).toBe("$600,000.00 MXN");
    expect(value(result, "Crédito")).toBe("$2,400,000.00 MXN");
    expect(value(result, "Gastos de compra")).toBe("$162,341.63 MXN");
    expect(value(result, "Dinero que necesita el comprador")).toBe("$762,341.63 MXN");
    expect(row(result, /adquisición|ISAI/i)?.[1]).toBe("$69,080.07 MXN");
    expect(result.warnings?.[0]).toMatch(/^Estimación/);
    expect(result.warnings?.join(" ")).toMatch(/base del impuesto se supuso igual al precio/);
  });

  it("de contado sin cotizaciones queda preliminar y dice qué falta", () => {
    const result = calculateFinancial("gastos-compra", { ...base, financing: "contado" });
    expect(value(result, "Pago de contado")).toBe("$3,000,000.00 MXN");
    expect(value(result, "Crédito")).toBeUndefined();
    expect(value(result, "Gastos conocidos")).toBeDefined();
    expect(result.warnings?.some(w => w.startsWith("Falta conocer"))).toBe(true);
  });

  it("rechaza capturas incongruentes", () => {
    expect(() => calculateFinancial("gastos-compra", { ...base, price: "" })).toThrow();
    expect(() => calculateFinancial("gastos-compra", { ...base, financing: "credito", downPayment: null })).toThrow(/enganche/);
    expect(() => calculateFinancial("gastos-compra", { ...base, financing: "credito", downPayment: 4_000_000 })).toThrow(/mayor que el precio/);
  });
});
