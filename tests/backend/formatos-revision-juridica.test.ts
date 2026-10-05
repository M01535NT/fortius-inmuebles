import { expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { JURIDICA_TABLES, mostrarColumnaJuridica } from "@/lib/formatos/juridica";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf } from "@/lib/formatos/pdf";

it("conserva checklist documental, controles especiales y etapas de cierre", () => {
  expect(JURIDICA_TABLES.documentos.fixed).toHaveLength(22);
  expect(JURIDICA_TABLES.especiales.fixed).toHaveLength(8);
  expect(JURIDICA_TABLES.etapas.fixed).toHaveLength(6);
  expect(JURIDICA_TABLES.cierre.fixed).toHaveLength(8);
  expect(formatoById("05").fields.map((field) => field.key)).toEqual(expect.arrayContaining(["personas", "documentos", "tracto", "contraste", "cargas", "especiales", "hallazgos", "conclusion", "etapas", "cierre", "abogado", "cedula"]));
});

it("no equipara un documento recibido con uno verificado ni libera cierre con hallazgos", () => {
  expect(validateFormato("05", { documentos: [{ concepto: "D01", aplica: "si", estado: "recibido", referencia: "Copia simple" }] })).toEqual(expect.arrayContaining(["Control documental"]));
  expect(validateFormato("05", { resultado: "factible", hallazgosEstado: "abiertos", hallazgos: [] })).toContain("Conclusión jurídica");
  expect(mostrarColumnaJuridica("documentos", "estado", { aplica: "no", estado: "verificado" })).toBe(false);
  expect(mostrarColumnaJuridica("documentos", "referencia", { aplica: "si", estado: "no_recibido" })).toBe(false);
});

it("emite una revisión indeterminada con pendientes explícitos", async () => {
  const data: Record<string, unknown> = {};
  for (const field of formatoById("05").fields) {
    if (field.type === "date") data[field.key] = "2026-10-04";
    else if (field.type === "choice") data[field.key] = field.key === "resultado" ? "indeterminada" : field.key === "hallazgosEstado" ? "ninguno" : field.options?.[0].value;
    else if (field.type === "juridicaRows") {
      const config = JURIDICA_TABLES[field.key];
      data[field.key] = config.fixed ? config.fixed.map((item) => Object.fromEntries([
        ["concepto", item.key], ...config.columns.map((column) => [column.key, column.type === "date" ? "2026-10-04" : column.options ? column.options.find((option) => option.value === (field.key === "documentos" ? column.key === "aplica" ? "no" : "no_recibido" : field.key === "etapas" ? "pendiente" : "no_aplica"))?.value ?? column.options[0].value : "Pendiente de comprobar"]),
      ])) : config.min ? [Object.fromEntries(config.columns.map((column) => [column.key, column.type === "date" ? "2026-10-04" : column.options?.[0].value ?? "Declarado; pendiente de comprobar"]))] : [];
    } else data[field.key] = "Pendiente de comprobar con soporte identificado";
  }
  expect(validateFormato("05", data)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("05", data));
  expect(pdf.getTitle()).toBe("Revisión jurídica y control de cierre");
  expect(pdf.getPageCount()).toBeGreaterThan(3);
});
