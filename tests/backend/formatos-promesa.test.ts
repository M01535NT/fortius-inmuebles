import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { promesaSample } from "./fixtures/promesa";
import * as promesa from "@/lib/formatos/promesa";

const reviewed = (data = promesaSample) => ({ ...data, revisionEstado: "revisada", versionRevisada: data.versionContrato, revisionDatos: promesa.promesaReviewSnapshot(data) });

it("captura las 26 cláusulas con conceptos y controles de la promesa separados", () => {
  const keys = formatoById("15").fields.map((field) => field.key);
  expect(keys).toEqual(expect.arrayContaining(["identificacionVendedor", "rfcVendedor", "superficie", "colindancias", "fechaLimite", "fechaCondiciones", "fechaFormalizacion", "fechaEntrega", "pagosPrecio", "condiciones", "documentosVendedor", "anexos", "garantia", "pena", "diasConvocatoria", "diasSubsanacion", "diasAviso", "diasDevolucion", "fundamentoAlcance", "referenciaRevision"]));
});

it("exige registrar revisión de los datos antes de emitir una promesa civil", async () => {
  expect(validateFormato("15", promesaSample)).toContain("Registrar revisión de esta versión y sus datos");
  await expect(createFormatoPdf("15", promesaSample)).rejects.toThrow(/Registrar revisión/);
});

it("impide presentar el modelo no registrado como promesa de vivienda de adhesión", async () => {
  const values = { ...promesaSample, calidadVendedor: "proveedor", negociacion: "adhesion", marcoConsumo: "aplica" };
  expect(validateFormato("15", values)).toContain("Se requiere el modelo registrado aplicable; la plantilla civil 15 no habilita esta operación");
});

it("reconcilia el calendario y los recursos con el precio, sin presumir recepción de la garantía", () => {
  expect(validateFormato("15", { ...promesaSample, recursosPropios: 900000 })).toContain("Recursos propios y crédito deben sumar el precio");
  expect(validateFormato("15", { ...promesaSample, pagosPrecio: [{ ...(promesaSample.pagosPrecio as object[])[0], importe: 500000 }] })).toContain("El calendario de pagos debe sumar el precio sin descontar la garantía");
});

it("rechaza fechas incompatibles y pena mayor que el precio", () => {
  const errors = validateFormato("15", { ...promesaSample, fechaCondiciones: "2026-12-02", fechaEntrega: "2026-11-01", pena: 1000001 });
  expect(errors).toContain("Las condiciones deben vencer entre la firma de la promesa y la formalización");
  expect(errors).toContain("La entrega no puede preceder a la formalización");
  expect(errors).toContain("La pena no puede superar el precio");
});

it("exige los datos de crédito, representación y garantía únicamente cuando corresponden", () => {
  const errors = validateFormato("15", { ...promesaSample, compareceVendedor: "representante", credito: 100000, recursosPropios: 900000, condicionCredito: "si", garantia: 50000 });
  expect(errors).toContain("Representante vendedor");
  expect(errors).toContain("Institución de crédito");
  expect(errors).toContain("Fecha límite de solicitud de crédito");
  expect(errors).toContain("Receptor de la garantía");
});

it("emite la promesa civil revisada y exige repetir la revisión si cambian los anexos", async () => {
  const values = reviewed();
  expect(validateFormato("15", values)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("15", values));
  expect(pdf.getTitle()).toBe("Contrato de promesa bilateral de compraventa");
  expect(pdf.getPageCount()).toBeGreaterThan(2);
  expect(validateFormato("15", { ...values, anexos: [{ documento: "Otro anexo", version: "2", referencia: "Copia diferente" }] })).toContain("Registrar revisión de esta versión y sus datos");
});

it("conserva las 26 cláusulas y genera importes en letra a partir de los números", () => {
  expect(promesa).toHaveProperty("promesaParagraphs");
  const paragraphs = (promesa as unknown as { promesaParagraphs: (values: Record<string, unknown>) => string[] }).promesaParagraphs(promesaSample);
  expect(paragraphs.filter((paragraph) => /^\d{2}\s/.test(paragraph))).toHaveLength(26);
  expect(paragraphs[0]).toMatch(/^CONTRATO DE PROMESA BILATERAL/);
  const content = paragraphs.join("\n");
  expect(content).not.toMatch(/\[[^\]]+\]|borrador|revisión profesional/i);
  expect(content).toContain("1,000,000.00 MXN (un millón de pesos 00/100 MXN)");
  expect(content).toContain("no transmite por sí misma propiedad");
  expect(content).toContain("La garantía no se confisca");
  expect(content).toContain("No se pacta entrega ni custodia de garantía");
});

it("distingue los casos con crédito, representación y garantía de los casos sin ellos", () => {
  expect(promesa).toHaveProperty("promesaParagraphs");
  const withFunds = { ...promesaSample, credito: 200000, recursosPropios: 800000, condicionCredito: "si", institucionCredito: "Banco de muestra", estadoCredito: "Solicitud documentada", fechaSolicitud: "2026-10-10", garantia: 31200.25, fechaGarantia: "2026-10-12", receptorGarantia: "Ana Ejemplo", cuentaGarantia: "Cuenta de muestra", custodioTipo: "parte", pena: 15000, compareceVendedor: "representante", representanteVendedor: "Carla Ejemplo", documentoRepresentacionVendedor: "Poder de muestra 1" };
  expect(validateFormato("15", reviewed(withFunds))).toEqual([]);
  const paragraphs = (promesa as unknown as { promesaParagraphs: (values: Record<string, unknown>) => string[] }).promesaParagraphs(withFunds).join("\n");
  expect(paragraphs).toContain("treinta y un mil doscientos pesos 25/100 MXN");
  expect(paragraphs).toContain("Carla Ejemplo");
  expect(paragraphs).toContain("Banco de muestra");
  expect(paragraphs).not.toContain("Si se pactó condición de crédito");
  expect(paragraphs).not.toContain("No se pacta entrega ni custodia de garantía");
});

it("rechaza pagos en otra fecha, documentos tardíos, custodia de la inmobiliaria y anexos duplicados", () => {
  expect(validateFormato("15", { ...promesaSample, pagosPrecio: [{ ...(promesaSample.pagosPrecio as object[])[0], fecha: "2026-11-10" }] })).toContain("Los pagos del precio deben pactarse en la fecha de formalización");
  expect(validateFormato("15", { ...promesaSample, documentosVendedor: [{ documento: "Título", fecha: "2026-12-02" }] })).toContain("Los documentos deben entregarse entre promesa y formalización");
  expect(validateFormato("15", { ...promesaSample, garantia: 10000, custodioTipo: "inmobiliaria" })).toContain("Este contrato no autoriza a la inmobiliaria a custodiar la garantía");
  expect(validateFormato("15", { ...promesaSample, anexos: [...promesaSample.anexos as object[], ...promesaSample.anexos as object[]] })).toContain("Anexo duplicado");
});

it("escribe importes exactos y rechaza centavos excesivos o monedas desconocidas", () => {
  expect(promesa.importePromesaLetra(21.01, "USD")).toBe("veintiún dólares 01/100 USD");
  expect(promesa.importePromesaLetra(101000, "MXN")).toBe("ciento un mil pesos 00/100 MXN");
  expect(promesa.importePromesaLetra(1, "MXN")).toBe("un peso 00/100 MXN");
  expect(() => promesa.importePromesaLetra(10.001, "MXN")).toThrow();
  expect(() => promesa.importePromesaLetra(10, "EUR")).toThrow();
});

it("bloquea una revisión futura, clasificación sin resolver y receptor distinto del vendedor", () => {
  expect(validateFormato("15", { ...promesaSample, fechaRevision: "2099-01-01", fecha: "2099-01-02" })).toContain("La revisión no puede fecharse en el futuro");
  expect(validateFormato("15", { ...promesaSample, marcoConsumo: "pendiente" })).toContain("Resolver la clasificación de la operación antes de usar este modelo");
  expect(validateFormato("15", { ...promesaSample, garantia: 10000, custodioTipo: "parte", receptorGarantia: "Otra persona" })).toContain("El receptor debe ser la parte vendedora o un tercero con acuerdo independiente");
});
