import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FinancialEditor } from "@/components/admin/apps/financial-editor";
import { getFinancialDefaults } from "@/lib/apps/financial";
import type { AppInput, AppResult } from "@/lib/apps/types";
afterEach(() => { cleanup(); sessionStorage.clear(); });
function Harness({ slug, initial }: { slug: string; initial?: AppInput }) {
  const [input, setInput] = useState<AppInput>({ ...getFinancialDefaults(slug), ...initial });
  const [result, setResult] = useState<AppResult | null>(null);
  return <><FinancialEditor slug={slug} input={input} context={{}} onChange={(next) => { setInput(next); setResult(null); }} onResult={setResult} /><output aria-label="Datos guardables">{JSON.stringify(input)}</output><output aria-label="Resultado emitido">{JSON.stringify(result)}</output></>;
}
it("edita cargos históricos sin descontarlos, emite resultado y permite recalcular después de editar", () => {
  render(<Harness slug="neto-propietario" initial={{ salePrice: 1000, loan: 0, commissionMode: "importe", commission: 50, isrMode: "importe", isrAmount: 0, taxes: 0 }} />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar gasto" }));
  fireEvent.change(screen.getByLabelText("Concepto 1"), { target: { value: "Obra pagada" } });
  fireEvent.change(screen.getByLabelText("Importe 1"), { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText("Estado 1"), { target: { value: "pagado" } });
  fireEvent.click(screen.getByRole("button", { name: "Calcular neto" }));
  expect(screen.getByLabelText("Resultado emitido").textContent).toContain("$950.00 MXN");
  expect(JSON.parse(screen.getByLabelText("Datos guardables").textContent!).expenses).toEqual([{ concept: "Obra pagada", amount: "300", status: "pagado" }]);
  fireEvent.change(screen.getByLabelText("Precio de venta"), { target: { value: "1200" } });
  expect(screen.getByLabelText("Resultado emitido").textContent).toBe("null");
});
it("permite borrar un importe sin convertirlo a cero y muestra error de captura", () => {
  render(<Harness slug="comisiones" />);
  fireEvent.change(screen.getByLabelText("Base de honorarios"), { target: { value: "1000" } });
  fireEvent.change(screen.getByLabelText("Porcentaje de honorarios"), { target: { value: "6" } });
  fireEvent.change(screen.getByLabelText("Base de honorarios"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Calcular honorarios" }));
  expect(screen.getByRole("alert").textContent).toMatch(/base/i);
  expect(JSON.parse(screen.getByLabelText("Datos guardables").textContent!).base).toBe("");
});
it("conserva los tres escenarios y sus capas al agregar y eliminar flujos", () => {
  render(<Harness slug="inversiones" />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar flujo" }));
  fireEvent.change(screen.getByLabelText("Escenario 1"), { target: { value: "adverso" } });
  fireEvent.change(screen.getByLabelText("Capa 1"), { target: { value: "capital" } });
  fireEvent.change(screen.getByLabelText("Importe 1"), { target: { value: "-100.25" } });
  const saved = JSON.parse(screen.getByLabelText("Datos guardables").textContent!);
  expect(saved.flows[0]).toMatchObject({ scenario: "adverso", layer: "capital", amount: "-100.25" });
  fireEvent.click(screen.getByRole("button", { name: "Eliminar flujo 1" }));
  expect(JSON.parse(screen.getByLabelText("Datos guardables").textContent!).flows).toEqual([]);
});
it("prepara transferencia explícita por sesión sin datos privados en el enlace", () => {
  render(<Harness slug="rehabilitacion" initial={{ contingencyPercent: 0, items: [{ concept: "Pintura privada", unit: "m²", quantity: 2, price: 100, taxPercent: 0 }], payments: [{ concept: "Inicio", date: "2026-10-15", percent: 100 }] }} />);
  fireEvent.click(screen.getByRole("button", { name: "Preparar para inversión" }));
  const payload = JSON.parse(sessionStorage.getItem("fortius.apps.inversiones.transfer.v1")!);
  expect(payload).toMatchObject({ version: 1, source: "rehabilitacion", input: { currency: "MXN" } });
  expect(payload.input.flows).toHaveLength(3);
  expect(screen.getByRole("link", { name: "Abrir inversión con este presupuesto" }).getAttribute("href")).toBe("/admin/apps/inversiones?importar=rehabilitacion");
});
it("cambia de magnitud a moneda y conserva fuente y fecha del tipo de cambio", () => {
  render(<Harness slug="conversor" />);
  fireEvent.change(screen.getByLabelText("Magnitud"), { target: { value: "moneda" } });
  fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("MXN por USD"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("Fuente del tipo de cambio"), { target: { value: "Cotización capturada" } });
  fireEvent.change(screen.getByLabelText("Fecha del tipo de cambio"), { target: { value: "2026-10-13" } });
  fireEvent.click(screen.getByRole("button", { name: "Convertir" }));
  expect(screen.getByLabelText("Resultado emitido").textContent).toContain("$1.00 USD");
  expect(JSON.parse(screen.getByLabelText("Datos guardables").textContent!).rateSource).toBe("Cotización capturada");
});
it("reabre hipoteca conservando anticipos y modo de aplicación", () => {
  render(<Harness slug="hipoteca" initial={{ price: 1200, downPercent: 0, annualRate: 0, months: 12, extraMonthly: 100, prepaymentMode: "payment" }} />);
  expect((screen.getByLabelText("Anticipo mensual") as HTMLInputElement).value).toBe("$100.00");
  expect((screen.getByLabelText("Aplicar anticipos a") as HTMLSelectElement).value).toBe("payment");
  fireEvent.click(screen.getByRole("button", { name: "Calcular hipoteca" }));
  expect(screen.getByLabelText("Resultado emitido").textContent).toContain("Amortización con anticipos");
});

it("invalida la transferencia preparada cuando cambia el presupuesto", () => {
  render(<Harness slug="rehabilitacion" initial={{ contingencyPercent: 0, items: [{ concept: "Pintura", unit: "m²", quantity: 2, price: 100, taxPercent: 0 }], payments: [{ concept: "Inicio", date: "2026-10-15", percent: 100 }] }} />);
  fireEvent.click(screen.getByRole("button", { name: "Preparar para inversión" }));
  expect(sessionStorage.getItem("fortius.apps.inversiones.transfer.v1")).not.toBeNull();
  fireEvent.change(screen.getByLabelText("Precio unitario 1"), { target: { value: "150" } });
  expect(sessionStorage.getItem("fortius.apps.inversiones.transfer.v1")).toBeNull();
  expect(screen.queryByRole("link", { name: "Abrir inversión con este presupuesto" })).toBeNull();
});
it("ISR y neto: pide la UDI solo con casa habitación confirmada y calcula el ISR (HER-03)", () => {
  render(<Harness slug="neto-propietario" initial={{ salePrice: 3000000, loan: 0, commissionPercent: 5, saleDate: "2026-11-20", acquisitionDate: "2016-03-15", acquisitionCost: 1000000, inpcAcquisition: 120, inpcSale: 145.5, improvements: 0, acquisitionExpenses: 50000, taxes: 0 }} />);
  expect(screen.queryByLabelText("Valor de la UDI")).toBeNull();
  fireEvent.click(screen.getByLabelText("Es la casa habitación del vendedor"));
  expect(screen.queryByLabelText("Valor de la UDI")).toBeNull();
  fireEvent.click(screen.getByLabelText("No vendió otra casa habitación exenta en los últimos tres años"));
  expect(screen.getByLabelText("Valor de la UDI")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Es la casa habitación del vendedor"));
  fireEvent.click(screen.getByRole("button", { name: "Agregar gastos habituales" }));
  expect(screen.getByLabelText("Concepto 1")).toHaveProperty("value", "Certificado de libertad de gravamen");
  fireEvent.click(screen.getByRole("button", { name: "Calcular neto" }));
  expect(screen.getByLabelText("Resultado emitido").textContent).toContain("$178,104.48 MXN");
});
