import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { readFileSync } from "node:fs";
import { formatoById } from "@/lib/formatos/catalog";
import { answerText, formatoDocument, shownFields } from "@/lib/formatos/docx";

const entrevista = formatoById("02");
const field = (key: string) => entrevista.fields.find(f => f.key === key)!;

describe("copia en Word de un formato", () => {
  it("escribe respuestas legibles: opciones, cifras y fechas", () => {
    expect(answerText(field("tipoInmueble"), "casa")).toBe("Casa");
    expect(answerText(field("precioDeseado"), 3600000)).toBe("$3,600,000.00");
    expect(answerText(field("fechaEntrevista"), "2026-10-16")).toBe("16/10/2026");
    expect(answerText(field("motivoVenta"), "")).toBe("");
  });
  it("omite las preguntas condicionales que no aplican, como en pantalla", () => {
    // El nombre del propietario solo se pide cuando responde otra persona (entrevista sencilla, 17/10/2026).
    expect(shownFields(entrevista, { relacion: "propietario" }).map(f => f.key)).not.toContain("propietario");
    expect(shownFields(entrevista, { relacion: "representante" }).map(f => f.key)).toContain("propietario");
  });
  it("genera un .docx válido con las secciones y la tabla de documentos por entregar", async () => {
    const values = { folio: "EXP-2026-041", entrevistado: "Familia Castañeda Ortiz", tipoInmueble: "casa", documentosEstado: "registrados", documentosPrometidos: [{ documento: "Escritura", responsable: "Propietario", fecha: "2026-10-20" }] };
    const assets={encabezado:readFileSync('public/brand/membrete-encabezado.png'),pie:readFileSync('public/brand/membrete-pie.png')};
    const buffer = await Packer.toBuffer(formatoDocument(entrevista, values, { folio: "EXP-2026-041", cliente: "Familia Castañeda Ortiz" }, assets));
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    expect(buffer.includes(Buffer.from("word/document.xml"))).toBe(true);
  });
});
