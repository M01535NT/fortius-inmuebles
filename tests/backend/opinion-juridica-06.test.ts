import { describe, expect, it } from "vitest";
import { semillaOpinion } from "@/lib/formatos/opinion-juridica";
import { opinionJuridicaDocumento } from "@/lib/formatos/documento/opinion-juridica";
import { validateFormato } from "@/lib/formatos/catalog";

// Revisión 05 ficticia de ensayo, con datos sensibles que nunca deben pasar al 06 (D-10, DOC-06).
const revision = {
  resultado: "condiciones",
  conclusion: "Hipoteca vigente con Banco Ejemplo, escritura 4521.",
  documentos: [
    { concepto: "D01", aplica: "si", estado: "verificado", referencia: "Escritura 4521, notaría 7", verificacion: "Original" },
    { concepto: "D03", aplica: "si", estado: "no_recibido", referencia: "", verificacion: "" },
    { concepto: "D06", aplica: "no", estado: "", referencia: "", verificacion: "No aplica" },
    { concepto: "D17", aplica: "si", estado: "insuficiente", referencia: "Expediente 123/2026", verificacion: "Falta carta de saldo" },
  ],
  etapas: [{ concepto: "captacion", estado: "avanza", condicion: "Revisó Lic. Torres" }, { concepto: "firma", estado: "condicionado", condicion: "Cancelar hipoteca con Banco Ejemplo" }],
};

describe("06 · opinión jurídica (DOC-06)", () => {
  it("toma de la 05 solo el resultado, el estado de cada etapa y los documentos con su estado", () => {
    const seed = semillaOpinion(revision);
    expect(seed.resultado).toBe("condiciones");
    expect(seed.documentosRevisados).toEqual([{ documento: "Escritura o título", estado: "verificado" }, { documento: "Hipoteca y cancelación", estado: "insuficiente" }]);
    expect(seed.etapasCliente).toHaveLength(6);
    expect((seed.etapasCliente as Array<Record<string, string>>).find(row => row.concepto === "firma")).toEqual({ concepto: "firma", estado: "condicionado" });
    const text = JSON.stringify(seed);
    for (const sensitive of ["4521", "Banco Ejemplo", "123/2026", "Torres", "notaría"]) expect(text).not.toContain(sensitive);
    expect(semillaOpinion(undefined)).toEqual({});
  });

  it("el documento lleva el resultado, el marco jurídico y las tres tablas en el orden aprobado", () => {
    const doc = opinionJuridicaDocumento({ ...semillaOpinion(revision), marcoJuridico: "Código Civil de Baja California, art. 2117 (consultado el 12/11/2026).", antecedentesTabla: [{ acto: "Compraventa", fecha: "2015", acredita: "Titularidad del vendedor" }] });
    const titles = doc.blocks.flatMap(b => b.kind === "numbered" ? [b.text] : []);
    expect(titles).toEqual(["Conclusión", "Objeto y alcance del análisis", "Antecedentes", "Marco jurídico", "Análisis jurídico", "Condiciones por etapa y recomendaciones", "Documentos revisados", "Vigencia y límites de la opinión"]);
    expect(doc.blocks.find(b => b.kind === "fields" && b.rows[0][0] === "Resultado")).toMatchObject({ rows: [["Resultado", "Factible con condiciones"]] });
    const tables = doc.blocks.flatMap(b => b.kind === "table" ? [b] : []);
    expect(tables.map(t => t.header)).toEqual([["Acto o documento", "Fecha", "Qué acredita"], ["Etapa", "Estado", "Condición"], ["Documento", "Estado"]]);
    expect(tables[1].rows.find(row => row[0] === "Firma y desembolso")).toEqual(["Firma y desembolso", "Condicionado", ""]);
    expect(tables[2].rows).toEqual([["Escritura o título", "Verificado"], ["Hipoteca y cancelación", "Insuficiente"]]);
    expect(doc.blocks.some(b => b.kind === "p" && b.text.startsWith("Código Civil de Baja California"))).toBe(true);
  });

  it("los campos nuevos son opcionales: no agregan faltantes", () => {
    const missing = validateFormato("06", {});
    for (const label of ["Resultado de la opinión", "Antecedentes", "Condiciones por etapa", "Documentos revisados", "Leyes y artículos aplicables, con la fecha en que se consultaron", "Notas sobre los antecedentes", "Notas sobre los documentos revisados"]) expect(missing).not.toContain(label);
    expect(missing).toContain("Conclusión ejecutiva");
  });
});
