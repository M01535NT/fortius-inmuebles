import { describe, expect, it } from "vitest";
import { calculateFinancial, getFinancialDefaults, rehabilitationTransfer } from "@/lib/apps/financial";
import type { AppInput, AppResult } from "@/lib/apps/types";
const run = (slug: string, input: AppInput) => calculateFinancial(slug, { ...getFinancialDefaults(slug), ...input });
const value = (result: AppResult, label: string) => result.summary.find((item) => item.label === label)?.value;
const flow = (date: string, amount: number | null, layer = "proyecto", scenario = "base") => ({ date, amount, layer, scenario, concept: "Flujo", source: "Captura de prueba", evidence: "supuesto" });

describe("herramientas financieras", () => {
  it("amortiza sin interés y limita el anticipo al saldo, sin costos desconocidos tratados como completos", () => {
    const result = run("hipoteca", { price: 1200, downPercent: 0, annualRate: 0, months: 12, firstPayment: "2026-01-31", extraOnce: 5000, extraMonth: 2 });
    expect(value(result, "Crédito")).toBe("$1,200.00 MXN");
    const rows = result.sections?.find((s) => s.title === "Amortización con anticipos")?.rows;
    expect(rows).toHaveLength(2);
    expect(rows?.[1]).toContain("2026-02-28");
    expect(rows?.[1]).toContain("$1,000.00 MXN");
    expect(rows?.[1][6]).toBe("$0.00 MXN");
    expect(result.warnings?.join(" ")).toMatch(/Seguro|seguro/);
  });
  it("separa gasto histórico y resta solamente cargos pendientes conocidos", () => {
    const result = run("neto-propietario", { salePrice: 1000, loan: 100, commission: 50, taxes: null, expenses: [{ concept: "Obra pagada", amount: 300, status: "pagado" }, { concept: "Cancelación", amount: 20, status: "pendiente" }] });
    expect(value(result, "Neto preliminar conocido")).toBe("$830.00 MXN");
    expect(value(result, "Gastos históricos pagados")).toBe("$300.00 MXN");
    expect(result.warnings?.join(" ")).toMatch(/impuestos/i);
  });
  it("rechaza dato malformado, fecha inexistente y claves desconocidas sin convertirlos a cero", () => {
    expect(() => run("neto-propietario", { salePrice: "infinito" })).toThrow();
    expect(() => run("neto-propietario", { salePrice: 100, taxes: NaN })).toThrow();
    expect(() => run("neto-propietario", { salePrice: 100, injected: true })).toThrow();
    expect(() => run("hipoteca", { price: 100, downPercent: 0, annualRate: 0, months: 12, firstPayment: "2026-02-30" })).toThrow(/firstPayment|fecha/i);
  });
  it("reparte un centavo residual sin crear ni perder dinero y deja impuestos fuera del reparto", () => {
    const result = run("comisiones", { mode: "fijo", fixed: 100, taxPercent: 16, withholding: 0, shares: [{ name: "A", percent: 33.33 }, { name: "B", percent: 33.33 }, { name: "C", percent: 33.34 }] });
    expect(value(result, "Total a cobrar")).toBe("$116.00 MXN");
    expect(result.sections?.[0].rows).toEqual([["A", "33.33%", "$33.33 MXN"], ["B", "33.33%", "$33.33 MXN"], ["C", "33.34%", "$33.34 MXN"], ["Sin asignar", "0.00%", "$0.00 MXN"]]);
    expect(() => run("comisiones", { mode: "fijo", fixed: 100, shares: [{ name: "A", percent: 101 }] })).toThrow();
  });
  it("calcula honorarios porcentuales y conserva desconocidos fiscales", () => {
    const result = run("comisiones", { base: 1000, percent: 6 });
    expect(value(result, "Honorarios antes de impuestos")).toBe("$60.00 MXN");
    expect(result.warnings?.join(" ")).toMatch(/impuestos/i);
  });
  it("calcula VAN365, ROI con denominador y TIR anual sin mezclar capas", () => {
    const result = run("inversiones", { rates: { proyecto: 10, deuda: 10, capital: 10 }, costsComplete: true, flows: [flow("2025-01-01", -100), flow("2026-01-01", 110), flow("2025-01-01", 60, "deuda"), flow("2026-01-01", -66, "deuda"), flow("2025-01-01", -40, "capital"), flow("2026-01-01", 44, "capital")] });
    const rows = result.sections?.find((s) => s.title === "Escenarios y capas")?.rows;
    expect(rows?.[0]).toEqual(["Base", "Proyecto", "$100.00 MXN", "$10.00 MXN", "10.00%", "$0.00 MXN", "10.00%", "$100.00 MXN"]);
    expect(rows?.[2]?.[2]).toBe("$40.00 MXN");
    expect(rows?.[3]?.[3]).toBe("No determinado");
  });
  it("agrupa por fecha antes de TIR y rechaza múltiples cambios de signo", () => {
    const result = run("inversiones", { rates: { proyecto: 10, deuda: 10, capital: 10 }, flows: [flow("2025-01-01", -100), flow("2026-01-01", 230), flow("2027-01-01", -132)] });
    expect(result.sections?.[0].rows?.[0][6]).toBe("No determinada");
    expect(result.warnings?.join(" ")).toMatch(/cambios de signo/);
    const simultaneous = run("inversiones", { rates: { proyecto: 10, deuda: 10, capital: 10 }, flows: [flow("2025-01-01", -100), flow("2025-01-01", 20), flow("2026-01-01", 88)] });
    expect(simultaneous.sections?.[0].rows?.[0][6]).toBe("10.00%");
  });
  it("un importe faltante impide determinar las métricas de su capa", () => {
    const result = run("inversiones", { flows: [flow("2025-01-01", -100), flow("2026-01-01", null)] });
    expect(result.sections?.[0].rows?.[0][3]).toBe("No determinado");
    expect(result.warnings?.join(" ")).toMatch(/importe/i);
  });
  it("presupuesta cantidad, impuestos y contingencia y concilia sus desembolsos", () => {
    const input = { ...getFinancialDefaults("rehabilitacion"), contingencyPercent: 10, items: [{ concept: "Pintura", unit: "m²", quantity: 2, price: 100, taxPercent: 16 }], payments: [{ concept: "Inicio", date: "2026-10-15", percent: 30 }, { concept: "Entrega", date: "2026-11-15", percent: 70 }] };
    const result = calculateFinancial("rehabilitacion", input);
    expect(value(result, "Presupuesto total")).toBe("$255.20 MXN");
    expect(result.sections?.[1].rows?.map((r) => r[3])).toEqual(["$76.56 MXN", "$178.64 MXN"]);
    const transfer = rehabilitationTransfer(input);
    expect(transfer.flows).toEqual(expect.arrayContaining([expect.objectContaining({ date: "2026-10-15", amount: -76.56, scenario: "base", layer: "proyecto" })]));
    expect((transfer.flows as unknown[])).toHaveLength(6);
    expect(() => run("rehabilitacion", { ...input, payments: [{ concept: "Inicio", date: "2026-10-15", percent: 50 }] })).toThrow();
  });
  it("convierte unidades exactas y exige tipo de cambio con fuente y fecha", () => {
    expect(value(run("conversor", { category: "area", amount: 1, from: "ha", to: "m2" }), "Resultado")).toBe("10,000 m²");
    expect(value(run("conversor", { category: "longitud", amount: 1, from: "ft", to: "m" }), "Resultado")).toBe("0.3048 m");
    expect(() => run("conversor", { category: "moneda", amount: 1, from: "USD", to: "MXN" })).toThrow();
    const currency = run("conversor", { category: "moneda", amount: 12.5, from: "USD", to: "MXN", rate: 20, rateSource: "Cotización manual", rateDate: "2026-10-13" });
    expect(value(currency, "Resultado")).toBe("$250.00 MXN");
    expect(currency.sections?.[0].text).toContain("2026-10-13");
  });
});

it("rechaza fracciones de centavo en la moneda de origen para no ocultar el importe realmente convertido", () => {
  expect(() => run("conversor", { category: "moneda", amount: 12.555, from: "USD", to: "MXN", rate: 20, rateSource: "Cotización manual", rateDate: "2026-10-13" })).toThrow(/decimales|centavo/i);
});
it("distribuye un centavo entre tres participantes y conserva un reparto incompleto", () => {
  const complete = run("comisiones", { mode: "fijo", fixed: 0.01, taxPercent: 0, withholding: 0, shares: [{ name: "A", percent: 33.33 }, { name: "B", percent: 33.33 }, { name: "C", percent: 33.34 }] });
  expect(complete.sections?.[0].rows?.map((r) => r[2])).toEqual(["$0.00 MXN", "$0.00 MXN", "$0.01 MXN", "$0.00 MXN"]);
  const partial = run("comisiones", { mode: "fijo", fixed: 100.01, shares: [{ name: "A", percent: 50 }] });
  expect(partial.sections?.[0].rows?.map((r) => r[2])).toEqual(["$50.01 MXN", "$50.00 MXN"]);
});
it("no determina TIR para flujos simultáneos, una sola dirección ni retornos fuera del intervalo", () => {
  for (const flows of [[flow("2025-01-01", -100), flow("2025-01-01", 110)], [flow("2025-01-01", 100), flow("2026-01-01", 110)], [flow("2025-01-01", -0.01), flow("2025-01-02", 1e10)]]) {
    const result = run("inversiones", { flows });
    expect(result.sections?.[0].rows?.[0][6]).toBe("No determinada");
  }
});
it("VAN usa los 366 días de un año bisiesto sobre divisor 365", () => {
  const result = run("inversiones", { rates: { proyecto: 10, deuda: 0, capital: 0 }, flows: [flow("2024-01-01", -100), flow("2025-01-01", 110)] });
  expect(result.sections?.[0].rows?.[0][5]).toBe("-$0.03 MXN");
  expect(result.sections?.[0].rows?.[0][6]).toBe("9.97%");
});
it("rechaza mezcla de magnitudes y conserva fuente de cambio explícita", () => {
  expect(() => run("conversor", { amount: 1, from: "m2", to: "m" })).toThrow();
  expect(() => run("conversor", { category: "moneda", amount: 1, from: "MXN", to: "USD", rate: 20, rateSource: "", rateDate: "2026-10-13" })).toThrow();
});


it("conserva el porcentaje capturado en la base explicada de honorarios y en el reparto", () => {
  const result = run("comisiones", { base: 1000000, percent: 6.005, shares: [{ name: "A", percent: 33.3333 }, { name: "B", percent: 66.6667 }] });
  expect(value(result, "Honorarios antes de impuestos")).toBe("$60,050.00 MXN");
  expect(result.sections?.find((s) => s.title === "Base y redondeo")?.text).toContain("× 6.005%.");
  expect(result.sections?.[0].rows?.map((row) => row[1])).toEqual(["33.3333%", "66.6667%", "0.00%"]);
});
it("conserva las tasas capturadas de hipoteca, inversión, contingencia y desembolsos", () => {
  const mortgage = run("hipoteca", { price: 1000, downPercent: 0, annualRate: 12.3456, months: 12 });
  expect(mortgage.sections?.find((s) => s.title === "Supuestos")?.text).toContain("12.3456%");
  const investment = run("inversiones", { rates: { proyecto: 12.3456, deuda: 0, capital: 0 }, flows: [flow("2025-01-01", -3), flow("2026-01-01", 4)] });
  expect(investment.sections?.find((s) => s.title === "Convenciones y supuestos")?.text).toContain("Proyecto 12.3456%");
  expect(investment.sections?.[0].rows?.[0][4]).toBe("33.33%");
  const rehab = run("rehabilitacion", { contingencyPercent: 2.3456, items: [{ concept: "Obra", unit: "lote", quantity: 1, price: 1000000, taxPercent: 0 }], payments: [{ concept: "Inicio", date: "2026-10-15", percent: 33.3333 }, { concept: "Entrega", date: "2026-11-15", percent: 66.6667 }] });
  expect(value(rehab, "Presupuesto total")).toBe("$1,023,456.00 MXN");
  expect(rehab.sections?.find((s) => s.title === "Criterio del presupuesto")?.text).toContain("2.3456%");
  expect(rehab.sections?.[1].rows?.map((r) => r[2])).toEqual(["33.3333%", "66.6667%"]);
});
it("conserva centavos al convertir importes mayores a la resolución monetaria de Number", () => {
  const result = run("conversor", { category: "moneda", amount: 9999999999.99, from: "USD", to: "MXN", rate: 9999, rateSource: "Prueba de límite", rateDate: "2026-10-13" });
  expect(value(result, "Resultado")).toBe("$99,989,999,999,900.01 MXN");
});
it("conserva los ocho decimales mostrados en conversiones grandes de longitud", () => {
  const result = run("conversor", { category: "longitud", amount: 9999999999.99, from: "m", to: "ft" });
  expect(value(result, "Resultado")).toBe("32,808,398,950.0984252 ft");
});
it("redondea el ROI grande desde Decimal sin perder los decimales del porcentaje", () => {
  const result = run("inversiones", { flows: [flow("2025-01-01", -0.03), ...Array.from({ length: 599 }, () => flow("2026-01-01", 10000000000))] });
  expect(result.sections?.[0].rows?.[0][4]).toBe("19966666666666566.67%");
});
it("rechaza precisión de entrada que se perdería silenciosamente al normalizar a número", () => {
  expect(() => run("comisiones", { base: 1000000, percent: "6.00500000000000000001" })).toThrow(/precisión|número/i);
});

it("muestra una TIR de equilibrio sin un signo negativo causado por aproximación numérica", () => {
  const result = run("inversiones", { flows: [flow("2025-01-01", -100), flow("2026-01-01", 100)] });
  expect(result.sections?.[0].rows?.[0][6]).toBe("0.00%");
});
