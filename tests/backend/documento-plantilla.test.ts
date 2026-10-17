import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { BLANK, m } from "@/lib/formatos/documento/modelo";
import { planDocumento } from "@/lib/formatos/documento/plan";
import { intermediacionDocumento } from "@/lib/formatos/documento/intermediacion";
import { documentoDocx } from "@/lib/formatos/documento/docx";
import { renderDocumentoPdf } from "@/lib/formatos/documento/pdf";
import { INTERMEDIACION_CLAUSES } from "@/lib/formatos/intermediacion-text";

const text = (blocks: ReturnType<typeof planDocumento>["blocks"]) => JSON.stringify(blocks);
const assets = { regular: readFileSync("public/fonts/Archivo-Regular.ttf"), bold: readFileSync("public/fonts/Archivo-SemiBold.ttf"), logo: readFileSync("public/brand/fortius-logo.png") };
const docxAssets = { logo: assets.logo, logoSize: { width: 2550, height: 648 }, pie: readFileSync("public/brand/pie-documento.png") };

describe("documentos con el diseño de la plantilla", () => {
  it("el 10 usa el texto de la plantilla y deja la línea donde falta un dato", () => {
    const empty = planDocumento({});
    expect(empty.blocks[0]).toEqual({ kind: "title", text: "Plan de comercialización" });
    expect(empty.blocks[1]).toEqual({ kind: "p", text: `Proponemos ${BLANK} para alcanzar ${BLANK}. Este plan explica qué comunicaremos, cómo atenderemos a los interesados y qué revisaremos durante el lanzamiento. Encargo: ${BLANK}.` });
    expect(empty.blocks.filter(b => b.kind === "h1").map(b => "text" in b && b.text)).toEqual(["01 La estrategia para su inmueble", "02 Del anuncio a la oferta", "03 Preparación de la campaña", "04 Los primeros 21 días", "05 Seguimiento y decisiones"]);
    const filled = planDocumento({ estrategia: "Presentar la casa con fotografías", objetivo: "Vender en seis meses", propietario: "María Ramírez", folio: "EXP-10", fecha: "2026-10-04" });
    expect(text(filled.blocks)).toContain("Proponemos presentar la casa con fotografías para alcanzar vender en seis meses.");
    expect(text(filled.blocks)).toContain("\"label\":\"Propietario\",\"value\":\"María Ramírez\"");
    expect(text(filled.blocks)).toContain("4 de octubre de 2026");
  });
  it("los datos a mitad de frase empiezan en minúscula, salvo siglas", () => {
    expect([m("Cocina renovada"), m("OVC-07"), m("IVA incluido"), m("")]).toEqual(["cocina renovada", "OVC-07", "IVA incluido", BLANK]);
  });
  it("el 09 conserva sus cláusulas, llena el aviso y escribe la pena con letra, en estilo contrato", () => {
    const doc = intermediacionDocumento({ penaMaxima: 60000, medioAvisoPrivacidad: "correo electrónico", fechaAvisoPrivacidad: "2026-10-16", modalidad: "exclusiva", inicio: "2026-10-20", fin: "2027-01-17" });
    expect(doc.estilo).toBe("contrato");
    const clauses = doc.blocks.filter(b => b.kind === "clause" || b.kind === "p" && !b.text.startsWith("CONTRATO") && !b.text.startsWith("El CLIENTE comprende") && !b.text.startsWith("Leído"));
    expect(clauses).toHaveLength(INTERMEDIACION_CLAUSES.length);
    expect(doc.blocks.find(b => b.kind === "clause" && b.lead.startsWith("PRIMERA."))).toMatchObject({ lead: "PRIMERA. Encargo y límites." });
    expect(text(doc.blocks)).toContain("puesto a disposición del CLIENTE en correo electrónico, 16 de octubre de 2026");
    expect(text(doc.blocks)).toContain("sesenta mil pesos");
    expect(text(doc.blocks)).toContain("Plazo: 90 días naturales");
  });
  it("el PDF del 10 sale en tamaño carta con su título; el del 09 sigue bloqueado", async () => {
    const plan = await PDFDocument.load(await renderDocumentoPdf(planDocumento({}), assets));
    expect(plan.getTitle()).toBe("Plan de comercialización");
    expect(plan.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    await expect(createFormatoPdf("09", {})).rejects.toThrow("Formato pendiente de cotejo con el original");
  });
  it("el Word se genera para el 09 y el 10", async () => {
    for (const doc of [planDocumento({}), intermediacionDocumento({})]) {
      const buffer = await Packer.toBuffer(documentoDocx(doc, docxAssets));
      expect(buffer.subarray(0, 2).toString()).toBe("PK");
    }
  });
});
