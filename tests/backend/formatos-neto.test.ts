import { expect, it } from "vitest";
import { CARGOS_NETO, calcularNeto, validarNeto } from "@/lib/formatos/neto";

const base = {
  folio: "EXP-8", fechaEmision: "2026-10-04", propietario: "Cliente", inmueble: "Casa Tijuana",
  referencia07: "OVC-07-v1", fecha07: "2026-10-01", estadoOperacion: "En estudio",
  precioSugerido07: 3000000, precioAcordado: 2900000, precioBase: "acordado",
  erogaciones: CARGOS_NETO.map((item) => ({ concepto: item.key, importe: item.key === "comision" ? 90000 : 0, estado: item.key === "comision" ? "Estimado" : "No aplica", justificacion: item.key === "comision" ? "Contrato de intermediación" : "No corresponde; revisión del expediente" })),
  precioRespaldoFiscal: 2900000, respaldoFiscalValidoHasta: "2026-12-31", cierrePrevisto: "2026-11-30",
  revisionCargos: "Revisado", responsableEstimacion: "Ana",
};

it("calcula diferencia, cargos y neto sin tasas supuestas", () => {
  expect(validarNeto(base, "2026-10-04")).toEqual([]);
  expect(calcularNeto(base, "2026-10-04")).toEqual({ precioBase: 2900000, diferenciaAbsoluta: -100000, diferenciaPorcentual: -3.33, erogaciones: 90000, netoEstimado: 2810000 });
});

it("bloquea respaldo fiscal ajeno al precio, cargos pendientes y vigencia vencida", () => {
  expect(validarNeto({ ...base, precioRespaldoFiscal: 3000000 }, "2026-10-04")).toContain("Precio del respaldo fiscal");
  expect(validarNeto({ ...base, erogaciones: [{ ...base.erogaciones[0], estado: "Pendiente" }, ...base.erogaciones.slice(1)] }, "2026-10-04")).toContain("Comisión inmobiliaria (sin IVA)");
  expect(validarNeto({ ...base, respaldoFiscalValidoHasta: "2026-10-01" }, "2026-10-04")).toContain("Vigencia del respaldo fiscal");
});
