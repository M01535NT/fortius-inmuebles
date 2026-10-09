import { expect, it } from "vitest";
import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";

const aviso = {
  folio: "EXP-01", fechaEmision: "2026-10-04", responsable: "Moisés Núñez Tonalá",
  domicilioResponsable: "Calle Ejemplo 100, Colonia Centro, Tijuana, Baja California, C. P. 22000",
  contactoPrivacidad: "Moisés Núñez Tonalá", correoPrivacidad: "privacidad@example.com",
  titular: "María Ramírez", tipoTitular: "propietario", operacion: "Venta de inmueble",
  consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "no",
  transferenciaAsesor: "no", transferenciaFinanciera: "no", transferenciaOperacion: "no",
  acuseEstado: "pendiente",
};

it("exige identidad, domicilio completo y decisiones separadas", () => {
  const fields = formatoById("01").fields.map((field) => field.key);
  expect(fields).toEqual(expect.arrayContaining(["domicilioResponsable", "correoPrivacidad", "consentimientoPatrimonial", "consentimientoPublicidad", "transferenciaAsesor", "transferenciaFinanciera", "transferenciaOperacion", "acuseEstado"]));
  expect(validateFormato("01", { ...aviso, domicilioResponsable: "[calle, número, colonia]" })).toContain("Domicilio completo del responsable");
  expect(validateFormato("01", { ...aviso, transferenciaAsesor: "si" })).toEqual(expect.arrayContaining(["Destinatario asesor", "País del asesor"]));
  expect(validateFormato("01", { ...aviso, consentimientoPublicidad: "si" })).toEqual(expect.arrayContaining(["Al menos un canal autorizado para publicidad"]));
});

it("emite el aviso sin presumir autorizaciones ni recepción firmada", async () => {
  expect(validateFormato("01", aviso)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("01", aviso));
  expect(pdf.getTitle()).toBe("Aviso de privacidad");
  expect(pdf.getPageCount()).toBe(4);
  expect(pdf.getPages().map(page => page.getSize())).toEqual(Array(4).fill({ width: 612, height: 792 }));
});

it("añade una hoja independiente para los datos propios del representante", async () => {
  const pdf = await PDFDocument.load(await createFormatoPdf("01", { ...aviso, representante: "Ana López QA", documentoRepresentante: "Poder QA, pendiente de cotejo" }));
  expect(pdf.getPageCount()).toBe(5);
  expect(pdf.getPages().map(page => page.getSize())).toEqual(Array(5).fill({ width: 612, height: 792 }));
});

it("valida por separado las autorizaciones del representante sin heredarlas del titular", () => {
  const own = { ...aviso, representante: "Ana López QA", documentoRepresentante: "Poder QA", representanteConsentimientoPublicidad: "si" };
  expect(validateFormato("01", own)).toContain("Representante: al menos un canal autorizado para publicidad");
  expect(validateFormato("01", { ...own, representanteConsentimientoPublicidad: "no", representanteTransferenciaAsesor: "si" })).toEqual(expect.arrayContaining(["Representante: destinatario asesor", "Representante: país del asesor"]));
});

it("deja sin marcar la hoja del representante aunque el titular tenga decisiones capturadas", async () => {
  const data = { ...aviso, consentimientoPatrimonial: "si", representante: "Ana López QA", documentoRepresentante: "Poder QA" };
  async function tickCounts(values: Record<string, unknown>) {
    const pdf = await PDFDocument.load(await createFormatoPdf("01", values));
    return pdf.getPages().slice(3).map(page => {
      const content = page.node.Contents();
      const streams = content instanceof PDFArray ? content.asArray().map(ref => pdf.context.lookup(ref) as PDFRawStream) : [content as PDFRawStream];
      const operators = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")).join("\n");
      return (operators.match(/0\.9 w/g) ?? []).length / 2;
    });
  }
  expect(await tickCounts(data)).toEqual([5, 0]);
  expect(await tickCounts({ ...data, representanteConsentimientoPatrimonial: "no" })).toEqual([5, 1]);
});

it("pagina nombres, domicilios, destinatarios y documentos que exceden una hoja", async () => {
  const pdf = await PDFDocument.load(await createFormatoPdf("01", {
    ...aviso, titular: "Titular " + "Apellido compuesto ".repeat(250),
    domicilioResponsable: "Calle y número de prueba " + "Colonia de nombre extenso ".repeat(150),
    representante: "Representante " + "Apellido compuesto ".repeat(8),
    documentoRepresentante: "Documento de representación de prueba " + "Descripción documentada ".repeat(25),
    transferenciaAsesor: "si", asesorDestinatario: "Agencia de bienes inmuebles con diversos departamentos ".repeat(90), asesorPais: "México",
  }));
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
  for (const page of pdf.getPages()) {
    const content = page.node.Contents();
    const streams = content instanceof PDFArray ? content.asArray().map(ref => pdf.context.lookup(ref) as PDFRawStream) : [content as PDFRawStream];
    const operators = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")).join("\n");
    for (const match of operators.matchAll(/1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/g)) {
      expect(Number(match[1])).toBeGreaterThanOrEqual(50);
      const y = Number(match[2]);
      expect(y).toBeGreaterThanOrEqual(Math.abs(y - 25.3) < 0.01 ? 25 : 60);
      expect(Number(match[2])).toBeLessThanOrEqual(734);
    }
  }
});


it("publica una plantilla de cuatro páginas sin marcar consentimientos", async () => {
  const { createAvisoPdf } = await import("@/lib/formatos/aviso-pdf");
  const pdf = await PDFDocument.load(await createAvisoPdf({ responsable: aviso.responsable, domicilioResponsable: aviso.domicilioResponsable, contactoPrivacidad: aviso.contactoPrivacidad, correoPrivacidad: aviso.correoPrivacidad }, { publicTemplate: true }));
  expect(pdf.getPageCount()).toBe(4);
  const content = pdf.getPages()[3].node.Contents();
  const streams = content instanceof PDFArray ? content.asArray().map(ref => pdf.context.lookup(ref) as PDFRawStream) : [content as PDFRawStream];
  const operators = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")).join("\n");
  expect(operators.match(/0\.9 w/g) ?? []).toHaveLength(0);
});
