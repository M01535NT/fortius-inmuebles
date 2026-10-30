import { expect, it } from "vitest";
import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { financialPdfPages } from '../helpers/financial-pdf';
import type { Block } from "@/lib/formatos/documento/modelo";

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
  // Cuatro hojas de aviso y la hoja de decisiones del titular, completa en una página para firmar.
  expect(pdf.getPageCount()).toBe(5);
  expect(pdf.getPages().map(page => page.getSize())).toEqual(Array(5).fill({ width: 612, height: 792 }));
  const pages = financialPdfPages(pdf).map(page => page.replace(/\s+/g, " "));
  expect(pages[4]).toContain("Decisiones del titular de los datos");
  expect(pages[4]).toContain("Firma:");
  expect(pages[4]).toContain("Facultades y vigencia comprobadas mediante");
});

it("añade una hoja independiente para los datos propios del representante", async () => {
  const pdf = await PDFDocument.load(await createFormatoPdf("01", { ...aviso, representante: "Ana López QA", documentoRepresentante: "Poder QA, pendiente de cotejo" }));
  expect(pdf.getPageCount()).toBe(6);
  expect(pdf.getPages().map(page => page.getSize())).toEqual(Array(6).fill({ width: 612, height: 792 }));
  const pages = financialPdfPages(pdf).map(page => page.replace(/\s+/g, " "));
  expect(pages[5]).toContain("Decisiones del representante sobre sus propios datos");
  expect(pages[5]).toContain("Nombre del representante, por su propio derecho: Ana López QA");
});

it("valida por separado las autorizaciones del representante sin heredarlas del titular", () => {
  const own = { ...aviso, representante: "Ana López QA", documentoRepresentante: "Poder QA", representanteConsentimientoPublicidad: "si" };
  expect(validateFormato("01", own)).toContain("Representante: al menos un canal autorizado para publicidad");
  expect(validateFormato("01", { ...own, representanteConsentimientoPublicidad: "no", representanteTransferenciaAsesor: "si" })).toEqual(expect.arrayContaining(["Representante: destinatario asesor", "Representante: país del asesor"]));
});

it("deja sin marcar la hoja del representante aunque el titular tenga decisiones capturadas", async () => {
  const { avisoDocumento } = await import("@/lib/formatos/documento/aviso");
  const data = { ...aviso, consentimientoPatrimonial: "si", representante: "Ana López QA", documentoRepresentante: "Poder QA" };
  // Casillas marcadas en cada hoja de decisiones (cada una empieza en hoja nueva).
  function marcadas(values: Record<string, unknown>) {
    const hojas: Block[][] = [];
    for (const block of avisoDocumento(values).blocks) {
      if (block.kind === "pagebreak" && block.hoja) hojas.push([]);
      else hojas.at(-1)?.push(block);
    }
    return hojas.map(hoja => hoja.reduce((sum, block) => sum + (block.kind === "checks" ? block.options.filter(o => Array.isArray(block.selected) ? block.selected.includes(o.value) : o.value === block.selected).length
      : block.kind === "form" ? block.rows.flat().flatMap(cell => cell.marks?.flat() ?? []).filter(mark => mark.check).length : 0), 0));
  }
  expect(marcadas(data)).toEqual([5, 0]);
  expect(marcadas({ ...data, representanteConsentimientoPatrimonial: "no" })).toEqual([5, 1]);
  // El PDF sale del mismo modelo: la hoja del titular y la del representante.
  const pages = financialPdfPages(await PDFDocument.load(await createFormatoPdf("01", data)));
  expect(pages.findIndex(page => page.includes("Decisiones del representante"))).toBeGreaterThan(pages.findIndex(page => page.includes("Decisiones del titular")));
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


it("publica una plantilla de cinco páginas con el nuevo membrete sin marcar consentimientos", async () => {
  const { createAvisoPdf } = await import("@/lib/formatos/aviso-pdf");
  const pdf = await PDFDocument.load(await createAvisoPdf({ responsable: aviso.responsable, domicilioResponsable: aviso.domicilioResponsable, contactoPrivacidad: aviso.contactoPrivacidad, correoPrivacidad: aviso.correoPrivacidad }, { publicTemplate: true }));
  expect(pdf.getPageCount()).toBe(5);
  const streams=pdf.getPages().flatMap(page=>{const content=page.node.Contents();return content instanceof PDFArray?content.asArray().map(ref=>pdf.context.lookup(ref) as PDFRawStream):[content as PDFRawStream];});
  const operators = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")).join("\n");
  expect(operators.match(/0\.9 w/g) ?? []).toHaveLength(0);
});
