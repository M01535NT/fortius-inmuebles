import { expect, test } from "vitest";

import { calcularComision, calcularCredito, pesos } from "@/lib/panel/herramientas";

test("PN-09 comisión: 5% de $2,500,000 más IVA de 16%", () => {
  expect(calcularComision(2_500_000, 5)).toEqual({ comision: 125_000, iva: 20_000, total: 145_000, alPropietario: 2_355_000 });
  expect(calcularComision(2_500_000, 4)).toMatchObject({ comision: 100_000, total: 116_000 });
});

test("PN-09 comisión: sin precio o con porcentaje fuera de rango no hay cuenta", () => {
  expect(calcularComision(0, 5)).toBeNull();
  expect(calcularComision(1_000_000, -1)).toBeNull();
  expect(calcularComision(1_000_000, 101)).toBeNull();
});

test("PN-09 crédito: el enganche y el crédito suman el precio y la mensualidad sale del cálculo común", () => {
  const r = calcularCredito(2_500_000, 20, 20, 11.5, "2026-11-16");
  expect(r).not.toBeNull();
  expect(r!.enganche).toBe(500_000);
  expect(r!.credito).toBe(2_000_000);
  // Misma fórmula que src/lib/finance/mortgage.ts: 2,000,000 a 11.5% anual en 240 meses.
  expect(r!.mensualidad).toBeGreaterThan(21_000);
  expect(r!.mensualidad).toBeLessThan(22_500);
  expect(r!.intereses).toBeGreaterThan(3_000_000);
  expect(r!.totalPagado).toBeCloseTo(r!.credito + r!.intereses, 2);
});

test("PN-09 crédito: tasa cero reparte el crédito en partes iguales y datos inválidos no rompen", () => {
  const r = calcularCredito(1_200_000, 0, 10, 0, "2026-11-16");
  expect(r!.mensualidad).toBe(10_000);
  expect(r!.intereses).toBe(0);
  expect(calcularCredito(0, 20, 20, 11.5, "2026-11-16")).toBeNull();
  expect(calcularCredito(1_000_000, 20, 20, 99, "2026-11-16")).toBeNull();
  expect(calcularCredito(1_000_000, 20, 20, 11.5, "mal")).toBeNull();
});

test("PN-09 pesos: sin centavos y con separadores de México", () => {
  expect(pesos(145000)).toMatch(/145,000/);
  expect(pesos(145000)).toContain("$");
});

test("PN-09 herramientas: el inmueble de la ficha llena el precio solo si está publicado en pesos (AUD-03, T1)", async () => {
  const { datosParaCalcular } = await import("@/components/panel/herramientas/inmueble-elegido");
  const base = { codigo: "FORTIUS-000001", titulo: "Casa en Playas" };
  expect(datosParaCalcular({ ...base, precio: { modalidad: "publico", monto: 3_200_000, moneda: "MXN" } })).toMatchObject({ precio: 3_200_000, aviso: null });
  expect(datosParaCalcular({ ...base, precio: { modalidad: "publico", monto: 250_000, moneda: "USD" } })).toMatchObject({ precio: null });
  expect(datosParaCalcular({ ...base, precio: { modalidad: "consulta" } }).aviso).toContain("no tiene precio publicado");
});
