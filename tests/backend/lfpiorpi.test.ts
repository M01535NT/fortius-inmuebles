import { expect, it } from "vitest";
import { efectivoBlockers, esEfectivo, umbralEfectivo } from "@/lib/formatos/lfpiorpi";

/* M-05 (decisión del titular, 14/11/2026): el efectivo por 8,025 UMA o más se impide (art. 32 fr. I LFPIORPI). */
it("calcula el límite de 2026 con la UMA vigente y no inventa la de otro año", () => {
  expect(umbralEfectivo("2026-11-14")).toBe(941412.75);
  expect(umbralEfectivo("2026-01-15")).toBeUndefined();
  expect(umbralEfectivo("2027-02-01")).toBeUndefined();
});
it("reconoce el efectivo escrito de varias formas", () => {
  for (const medio of ["efectivo", "Efectivo", "EN EFECTIVO", "cash", "centenarios de oro", "metales preciosos"]) expect(esEfectivo(medio), medio).toBe(true);
  for (const medio of ["transferencia SPEI", "cheque certificado", "crédito Infonavit", undefined]) expect(esEfectivo(medio), String(medio)).toBe(false);
});
it("impide la operación cuando el efectivo suma el límite o más", () => {
  const debajo = [{ importe: 500000, fecha: "2026-11-20", medio: "efectivo" }, { importe: 441412.74, fecha: "2026-12-01", medio: "Efectivo" }, { importe: 3000000, fecha: "2026-12-15", medio: "transferencia" }];
  expect(efectivoBlockers({ pagos: debajo, moneda: "MXN" })).toEqual([]);
  const justo = [...debajo, { importe: 0.01, fecha: "2026-12-16", medio: "efectivo" }];
  expect(efectivoBlockers({ pagos: justo, moneda: "MXN" })[0]).toContain("prohíbe recibir en efectivo");
});
it("en dólares pide el tipo de cambio y convierte con él", () => {
  const pagos = [{ importe: 60000, fecha: "2026-11-20", medio: "cash" }];
  expect(efectivoBlockers({ pagos, moneda: "USD" })[0]).toContain("tipo de cambio");
  expect(efectivoBlockers({ pagos, moneda: "USD", tipoCambio: 18 })[0]).toContain("prohíbe");
  expect(efectivoBlockers({ pagos, moneda: "USD", tipoCambio: 18.5 }).length).toBe(1);
  expect(efectivoBlockers({ pagos: [{ importe: 40000, fecha: "2026-11-20", medio: "cash" }], moneda: "USD", tipoCambio: 18 })).toEqual([]);
});
it("sin fecha o fuera de la tabla de UMA, el pago en efectivo no pasa", () => {
  expect(efectivoBlockers({ pagos: [{ importe: 10, medio: "efectivo" }] })[0]).toContain("fecha");
  expect(efectivoBlockers({ pagos: [{ importe: 10, fecha: "2027-03-01", medio: "efectivo" }] })[0]).toContain("UMA");
});
