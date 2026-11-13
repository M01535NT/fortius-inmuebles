import { describe, expect, it } from "vitest";
import { calculateSellerIsrCase, completedYears, updateFactor, type SellerIsrCase } from "@/lib/finance/seller-isr";
import { calculateFinancial, getFinancialDefaults, netInput, netResults } from "@/lib/apps/financial";
import type { AppResult } from "@/lib/apps/types";

/*
  ISR y neto del vendedor (HER-03). Las cifras esperadas se calcularon aparte con Python Decimal
  (redondeo a centavos hacia arriba en .5, factor al diezmilésimo truncado) sobre la tarifa A.I 2026.
*/
const base: SellerIsrCase = {
  price: 3_000_000, saleDate: "2026-11-20", acquisitionDate: "2016-03-15", owners: 1, costMode: "historico",
  updatedCost: null, acquisitionCost: 1_000_000, landCost: null, inpcAcquisition: 120, inpcSale: 145.5,
  improvements: 0, expenses: 50_000, commission: 174_000, homeExemption: false, noPriorExemption: false, udiValue: null,
};
const value = (result: AppResult, label: string) => result.summary.find(item => item.label === label)?.value;

describe("ISR por la venta (HER-03)", () => {
  it("cuenta años completos y el factor al diezmilésimo, nunca menor a 1", () => {
    expect(completedYears("2016-03-15", "2026-03-14")).toBe(9);
    expect(completedYears("2016-03-15", "2026-03-15")).toBe(10);
    expect(updateFactor(120, 145.5)).toBe(1.2125);
    expect(updateFactor(130, 120)).toBe(1);
  });

  it("deprecia la construcción, separa 20% de terreno y actualiza el costo", () => {
    const result = calculateSellerIsrCase(base);
    expect(result).toMatchObject({ status: "ok", years: 10, factor: 1.2125, land: 200_000, construction: 800_000, depreciatedConstruction: 560_000, updatedCost: 921_500, gain: 1_854_500, provisional: 178_104.48, state: 92_725, federal: 85_379.48 });
  });

  it("casa habitación: exenta hasta 700,000 UDIS y por el excedente la ganancia en proporción", () => {
    const home: SellerIsrCase = { ...base, price: 9_000_000, saleDate: "2026-06-01", acquisitionDate: "2018-01-10", costMode: "actualizado", updatedCost: 4_000_000, expenses: 0, commission: 0, homeExemption: true, noPriorExemption: true, udiValue: 8.6 };
    const one = calculateSellerIsrCase(home);
    expect(one).toMatchObject({ status: "ok", exemptLimit: 6_020_000, gain: 5_000_000, provisional: 173_298.03, state: 82_777.78, federal: 90_520.25 });
    if (one.status === "ok") expect(one.owners[0]).toMatchObject({ taxableGain: 1_655_555.56, exempt: 6_020_000 });
    // Dos cónyuges: cada uno vende 4,500,000, debajo de su límite; no hay ISR.
    expect(calculateSellerIsrCase({ ...home, owners: 2 })).toMatchObject({ status: "ok", provisional: 0 });
    // Sin la manifestación de los tres años, no se aplica la exención.
    expect(calculateSellerIsrCase({ ...home, noPriorExemption: false })).toMatchObject({ status: "ok", exemptLimit: null });
  });

  it("aplica el costo mínimo del 10% y el tope de 20 años", () => {
    const result = calculateSellerIsrCase({ ...base, price: 1_000_000, acquisitionDate: "1990-01-01", costMode: "actualizado", updatedCost: 50_000, expenses: 0, commission: 0 });
    expect(result).toMatchObject({ status: "ok", updatedCost: 100_000, costFloorApplied: true, yearsForTax: 20, gain: 900_000, provisional: 48_518.85, state: 45_000, federal: 3_518.85 });
  });

  it("sin regla vigente o sin datos queda pendiente, sin suponer nada", () => {
    expect(calculateSellerIsrCase({ ...base, saleDate: "2027-01-15" })).toMatchObject({ status: "pendiente" });
    const missing = calculateSellerIsrCase({ ...base, inpcSale: null, homeExemption: true, noPriorExemption: true });
    expect(missing.status === "pendiente" && missing.missing).toEqual(["INPC del mes anterior a la venta", "Valor de la UDI en la fecha de la escritura"]);
    expect(calculateSellerIsrCase({ ...base, acquisitionDate: "2026-12-01" })).toMatchObject({ status: "pendiente" });
  });
});

describe("ISR y neto del vendedor en Herramientas (HER-03)", () => {
  const input = { ...getFinancialDefaults("neto-propietario"), salePrice: 3_000_000, loan: 0, commissionPercent: 5, commissionVat: 16, saleDate: base.saleDate, acquisitionDate: base.acquisitionDate, acquisitionCost: 1_000_000, inpcAcquisition: 120, inpcSale: 145.5, improvements: 0, acquisitionExpenses: 50_000, taxes: 0 };

  it("resta comisión con IVA e ISR estimado, y entrega dos documentos", () => {
    const { neto, isr } = netResults(input);
    expect(value(neto, "Comisión con IVA")).toBe("$174,000.00 MXN");
    expect(value(neto, "ISR estimado")).toBe("$178,104.48 MXN");
    expect(value(neto, "Neto estimado")).toBe("$2,647,895.52 MXN");
    expect(neto.warnings?.[0]).toMatch(/^Estimación/);
    expect(isr?.title).toBe("Hoja de cálculo del ISR por la venta");
    expect(value(isr!, "ISR estimado a pagar ante notario")).toBe("$178,104.48 MXN");
    expect(isr?.sections?.find(s => s.title === "Reglas y fuentes")?.text).toMatch(/DOF 01-04-2024.*Anexo 8/);
    const combined = calculateFinancial("neto-propietario", input);
    expect(combined.sections?.some(s => s.title === "ISR · Costo de adquisición")).toBe(true);
  });

  it("con datos faltantes el neto queda preliminar y el ISR pendiente", () => {
    const { neto, isr } = netResults({ ...input, inpcSale: null });
    expect(value(neto, "ISR estimado")).toBe("Pendiente");
    expect(value(neto, "Neto preliminar conocido")).toBeDefined();
    expect(neto.warnings?.join(" ")).toMatch(/inpc del mes anterior/);
    expect(value(isr!, "ISR estimado")).toBe("Pendiente");
  });

  it("en dólares no calcula el ISR; con importe capturado no hay hoja", () => {
    expect(netResults({ ...input, currency: "USD" }).neto.warnings?.join(" ")).toMatch(/en pesos/);
    const captured = netResults({ ...input, isrMode: "importe", isrAmount: 90_000 });
    expect(captured.isr).toBeNull();
    expect(value(captured.neto, "ISR estimado")).toBe("$90,000.00 MXN");
  });

  it("un trabajo guardado antes de HER-03 se sigue leyendo igual", () => {
    const old = { currency: "MXN", salePrice: 1000, loan: 100, commission: 50, taxes: 20, expenses: [] };
    expect(netInput(old)).toMatchObject({ isrMode: "incluido", commissionMode: "importe" });
    const result = calculateFinancial("neto-propietario", old);
    expect(value(result, "Neto estimado")).toBe("$830.00 MXN");
    expect(value(result, "ISR estimado")).toBeUndefined();
  });
});
