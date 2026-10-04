import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf, prepareFormatoEmission, receiptParagraphs } from "@/lib/formatos/pdf";

const receipt = {
  numeroRecibo: "F-001", lugarEmision: "Tijuana", fechaPago: "2026-10-04", pagador: "Cliente de prueba",
  importeRecibido: 12000, moneda: "MXN", concepto: "Honorarios de intermediación",
  importeLetra: "doce mil pesos", contratoFecha: "Contrato del 1 de octubre de 2026", folio: "EXP-1",
  inmueble: "Casa de prueba, Tijuana", beneficiario: "Fortius Inmuebles", representacionBeneficiario: "cuenta propia", caracter: "prestador",
  medioPago: "Transferencia", referenciaPago: "SPEI-1", soporteRecepcion: "Comprobante SPEI-1",
  pagoParcialTotal: "total", saldo: 0, monedaSaldo: "MXN", soporteSaldo: "Contrato y pagos previos",
  observaciones: "Sin observaciones", cfdiEstado: "Pendiente", receptor: "Persona receptora",
};

describe("emisión de formatos", () => {
  it("rechaza un recibo incompleto antes de crear bytes", async () => {
    await expect(prepareFormatoEmission("18", { ...receipt, medioPago: "" })).rejects.toThrow(/Medio de pago/);
  });

  it("genera PDF paginado, identificado y con huella estable de sus bytes", async () => {
    const emitted = await prepareFormatoEmission("18", receipt);
    const pdf = await PDFDocument.load(emitted.bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(pdf.getTitle()).toMatch(/Recibo de pago de honorarios/);
    expect(pdf.getAuthor()).toBe("Fortius Inmuebles");
    expect(emitted.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(emitted.bytes.slice(0, 5)).toEqual(new Uint8Array([37, 80, 68, 70, 45]));
  });

  it("permite preparar una vista PDF sin archivarla", async () => {
    const bytes = await createFormatoPdf("18", receipt);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("bloquea formatos cuya correspondencia con el original sigue pendiente", async () => {
    await expect(prepareFormatoEmission("07", {})).rejects.toThrow(/pendiente de cotejo/i);
  });

  it("rechaza importes negativos y recibos totales con saldo pendiente", async () => {
    await expect(prepareFormatoEmission("18", { ...receipt, importeRecibido: -1 })).rejects.toThrow(/Importe recibido/);
    await expect(prepareFormatoEmission("18", { ...receipt, saldo: 100 })).rejects.toThrow(/Saldo pendiente/);
    await expect(prepareFormatoEmission("18", { ...receipt, pagoParcialTotal: "indefinido" })).rejects.toThrow(/Pago parcial o total/);
  });

  it("conserva las cláusulas del recibo sobre pago, saldo y CFDI", () => {
    const text = receiptParagraphs(receipt).join(" ");
    expect(text).toContain("Este recibo reconoce únicamente el pago señalado");
    expect(text).toContain("no sustituye el CFDI");
    expect(text).toContain("12,000.00");
  });
});
