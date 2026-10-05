import { expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import * as intermediacion from "@/lib/formatos/intermediacion";

it("incorpora condiciones, registros, IVA, protección, excepciones y aviso de privacidad de 09", () => {
  const keys = formatoById("09").fields.map((field) => field.key);
  expect(keys).toEqual(expect.arrayContaining(["clientesContrato", "prestador", "rfcPrestador", "licenciaNumero", "licenciaVigencia", "modeloEstatalReferencia", "profecoEstado", "titulo", "folioReal", "claveCatastral", "derecho", "superficie", "accesorios", "precioAutorizado", "ivaVenta", "inicio", "fin", "comisionPorcentaje", "ivaComisionTasa", "ivaComisionFuente", "penaMaxima", "presupuestoPena", "proteccionDias", "excepcionesProspectos", "anexosContrato", "medioAvisoPrivacidad", "fechaAvisoPrivacidad", "lugar", "fecha"]));
});

it("excluye IVA de venta de la base y desglosa IVA de comisión sin aplicar una tasa por defecto", () => {
  expect(intermediacion).toHaveProperty("calcularIntermediacion");
  const result = (intermediacion as unknown as { calcularIntermediacion: (data: Record<string, unknown>) => Record<string, unknown> }).calcularIntermediacion({ precioAutorizado: 1000000, ivaVenta: 160000, comisionPorcentaje: 3, ivaComisionTasa: 16, penaMaxima: 20000 });
  expect(result).toEqual({ errors: [], basePrecio: 840000, comision: 25200, ivaComision: 4032, total: 29232, basePena: 20000 });
});

it("prorratea la pena con inicio y fin incluidos y descuenta pagos sólo si debe el cliente", () => {
  expect(intermediacion).toHaveProperty("calcularPenaIntermediacion");
  const calc = (intermediacion as unknown as { calcularPenaIntermediacion: (data: Record<string, unknown>, fecha: string, deudor: string, pagos: number) => Record<string, unknown> }).calcularPenaIntermediacion;
  const terms = { precioAutorizado: 1000000, ivaVenta: 160000, comisionPorcentaje: 3, ivaComisionTasa: 16, penaMaxima: 20000, inicio: "2026-10-01", fin: "2026-10-31" };
  expect(calc(terms, "2026-10-10", "cliente", 1000)).toEqual({ errors: [], diasVigencia: 31, diasPendientes: 21, penaAntesAbonos: 13548.39, abono: 1000, estimacion: 12548.39 });
  expect(calc(terms, "2026-10-10", "prestador", 1000).estimacion).toBe(13548.39);
  expect(calc(terms, "2026-10-31", "cliente", 0).estimacion).toBe(0);
  expect(calc(terms, "2026-09-30", "cliente", 0).errors).toContain("La terminación efectiva debe estar dentro de la vigencia");
});

it("mantiene bloqueado el PDF aun si se introduce un número de registro sin cotejar el modelo", async () => {
  expect(formatoById("09").readyForEmission).toBe(false);
  await expect(createFormatoPdf("09", { profecoEstado: "registrado", profecoNumero: "DATO-CAPTURADO" })).rejects.toThrow("Formato pendiente de cotejo con el original");
});

it("no presupone IVA y rechaza bases fiscales imposibles", () => {
  expect(intermediacion.calcularIntermediacion({ precioAutorizado: 1000000, ivaVenta: 0, comisionPorcentaje: 3, penaMaxima: 20000 }).errors).toContain("Tasa de IVA de comisión");
  expect(intermediacion.calcularIntermediacion({ precioAutorizado: 1000000, ivaVenta: 1000000, comisionPorcentaje: 3, ivaComisionTasa: 0, penaMaxima: 0 }).errors).toContain("El IVA de venta debe ser menor que el precio total");
});

it("rechaza una persona duplicada y documentos del contrato posteriores a su firma", () => {
  const client = Object.fromEntries(intermediacion.INTERMEDIACION_TABLES.clientesContrato.columns.map((column) => [column.key, column.key === "correo" ? "persona@example.test" : "Dato de muestra"]));
  const errors = validateFormato("09", { fecha: "2026-10-04", fechaAvisoPrivacidad: "2026-10-05", clientesContrato: [client, client], anexosEstado: "registrados", anexosContrato: [{ documento: "Anexo de muestra", fecha: "2026-10-06", version: "1", referencia: "Copia" }] });
  expect(errors).toContain("Cliente duplicado en el contrato");
  expect(errors).toContain("Aviso de privacidad o anexos posteriores a la firma prevista");
});
