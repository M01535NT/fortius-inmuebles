import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { mostrarCampoEntrevista } from "@/lib/formatos/entrevista";

it("conserva las ocho secciones de la entrevista y sus preguntas de control", () => {
  const definition = formatoById("02");
  expect(definition.fields.length).toBeGreaterThan(75);
  expect(new Set(definition.fields.map((field) => field.section).filter(Boolean)).size).toBe(9);
  expect(definition.fields.map((field) => field.key)).toEqual(expect.arrayContaining([
    "avisoPrivacidad", "regimenAdquisicion", "tituloInscrito", "ocupacion", "gravamen",
    "exencionTresAnios", "precioDeseado", "precioMinimo", "exclusividad", "contradicciones",
  ]));
});

it("no permite emitir entrevista sin respuestas de estado ni detalles condicionales", () => {
  const missing = validateFormato("02", { folio: "EXP-02" });
  expect(missing).toContain("Fecha de entrevista");
  expect(missing).toContain("Estado del aviso de privacidad");
  expect(missing).toContain("Situación de gravamen o crédito");
  expect(validateFormato("02", { gravamen: "si", estadoCivilActual: "casado", regimenAdquisicion: "sociedad_conyugal" })).toEqual(expect.arrayContaining(["Acreedor del gravamen", "Nombre del cónyuge"]));
});

it("separa los registros pendientes y oculta detalles incompatibles con la respuesta", () => {
  expect(mostrarCampoEntrevista("fechaAviso", { avisoPrivacidad: "pendiente" })).toBe(false);
  expect(mostrarCampoEntrevista("acreedor", { gravamen: "no" })).toBe(false);
  expect(mostrarCampoEntrevista("acreedor", { gravamen: "banco" })).toBe(true);
  expect(validateFormato("02", { documentosEstado: "registrados", documentosPrometidos: [{ documento: "Escritura", responsable: "Dueño", fecha: "2026-02-30" }] })).toContain("Fecha acordada para documento");
  expect(validateFormato("02", { contradiccionesEstado: "registradas", contradicciones: [] })).toContain("Contradicciones y datos faltantes");
});

it("impide declarar por este documento facultades de publicación, cobro o exclusiva", async () => {
  const definition = formatoById("02");
  const data: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.key === "folio") data.folio = "EXP-02";
    else if (field.type === "date") data[field.key] = "2026-10-04";
    else if (field.type === "time") data[field.key] = "10:00";
    else if (field.type === "money" || field.type === "number") data[field.key] = 100;
    else if (field.type === "entrevistaRows") data[field.key] = [];
    else if (field.type === "choice") data[field.key] = field.options?.find((option) => ["no", "ninguno", "pendiente", "no_aplica", "por_definir"].includes(option.value))?.value ?? field.options?.[0]?.value;
    else data[field.key] = "Declarado por el entrevistado";
  }
  expect(validateFormato("02", data)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("02", data));
  expect(pdf.getTitle()).toBe("Entrevista inicial");
  expect(pdf.getPageCount()).toBeGreaterThan(2);
});
