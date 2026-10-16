import { describe, expect, it } from "vitest";
import { Packer } from "docx";
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
    const soltero = shownFields(entrevista, { estadoCivilActual: "soltero", estadoCivilAdquisicion: "soltero" }).map(f => f.key);
    expect(soltero).not.toContain("conyuge");
    expect(shownFields(entrevista, { estadoCivilActual: "casado" }).map(f => f.key)).toContain("conyuge");
  });
  it("genera un .docx válido con las secciones y la tabla de documentos por entregar", async () => {
    const values = { folio: "EXP-2026-041", entrevistado: "Familia Castañeda Ortiz", tipoInmueble: "casa", documentosEstado: "registrados", documentosPrometidos: [{ documento: "Escritura", responsable: "Propietario", fecha: "2026-10-20" }] };
    const buffer = await Packer.toBuffer(formatoDocument(entrevista, values, { folio: "EXP-2026-041", cliente: "Familia Castañeda Ortiz" }));
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    expect(buffer.includes(Buffer.from("word/document.xml"))).toBe(true);
  });
});
