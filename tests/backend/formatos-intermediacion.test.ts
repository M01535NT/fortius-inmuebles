import { expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import * as intermediacion from "@/lib/formatos/intermediacion";

it("incorpora condiciones, registros, IVA, protección, excepciones y aviso de privacidad de 09", () => {
  const keys = formatoById("09").fields.map((field) => field.key);
  expect(keys).toEqual(expect.arrayContaining(["clientesContrato", "prestador", "rfcPrestador", "licenciaNumero", "licenciaVigencia", "modeloEstatalReferencia", "titulo", "folioReal", "claveCatastral", "derecho", "superficie", "accesorios", "precioAutorizado", "ivaVenta", "inicio", "fin", "comisionPorcentaje", "ivaComisionTasa", "ivaComisionFuente", "penaMaxima", "presupuestoPena", "proteccionDias", "excepcionesProspectos", "anexosContrato", "medioAvisoPrivacidad", "fechaAvisoPrivacidad", "lugar", "fecha"]));
});

it("ya no captura ni revisa el registro ante PROFECO (COR-12)", () => {
  const keys = formatoById("09").fields.map((field) => field.key);
  expect(keys.filter((key) => key.startsWith("profeco"))).toEqual([]);
  expect(validateFormato("09", {}).some((error) => /PROFECO/i.test(error))).toBe(false);
});

it("excluye IVA de venta de la base y desglosa IVA de comisión sin aplicar una tasa por defecto", () => {
  expect(intermediacion).toHaveProperty("calcularIntermediacion");
  const result = (intermediacion as unknown as { calcularIntermediacion: (data: Record<string, unknown>) => Record<string, unknown> }).calcularIntermediacion({ precioAutorizado: 1000000, ivaVenta: 160000, comisionPorcentaje: 3, ivaComisionTasa: 16, penaMaxima: 20000 });
  expect(result).toEqual({ errors: [], basePrecio: 840000, comision: 25200, ivaComision: 4032, total: 29232, basePena: 20000 });
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
