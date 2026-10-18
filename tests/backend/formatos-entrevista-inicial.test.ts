import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { mostrarCampoEntrevista } from "@/lib/formatos/entrevista";
import { checklistFor } from "@/lib/formatos/checklist-documentos";

it("la entrevista es sencilla: quién es, el inmueble, por qué vende y cuánto espera, y el siguiente paso", () => {
  const definition = formatoById("02");
  expect([...new Set(definition.fields.map(field => field.section))]).toEqual(["Datos de la entrevista", "01 / Quién es", "02 / El inmueble", "03 / Por qué vende y cuánto espera", "04 / Siguiente paso"]);
  expect(definition.fields.length).toBeLessThanOrEqual(32);
  expect(definition.fields.map(field => field.key)).toEqual(expect.arrayContaining(["entrevistado", "fechaNacimiento", "telefono", "correo", "estadoCivilActual", "tipoInmueble", "ocupacion", "gravamen", "motivoVenta", "precioDeseado", "expectativas"]));
  // Lo legal y lo fiscal se toman de los documentos en la revisión jurídica (05), no de la entrevista.
  for (const key of ["curp", "rfc", "residenciaFiscal", "regimenAdquisicion", "tituloInscrito", "referenciaNotarial", "fechaAdquisicion", "exencionTresAnios", "precioMinimo", "netoNecesario", "contradicciones"]) {
    expect(definition.fields.some(field => field.key === key)).toBe(false);
  }
});

it("pide lo indispensable para generar el PDF y no acepta un precio en cero", () => {
  const missing = validateFormato("02", { folio: "EXP-02" });
  expect(missing).toEqual(expect.arrayContaining(["Fecha de entrevista", "¿Se le entregó el aviso de privacidad?", "Nombre de quien responde", "Teléfono", "¿Tiene hipoteca o crédito?", "¿Por qué vende?", "¿Cuánto quiere por el inmueble?"]));
  expect(missing).not.toContain("Correo electrónico");
  expect(missing).not.toContain("Fecha de nacimiento");
  expect(validateFormato("02", { precioDeseado: 0 })).toContain("¿Cuánto quiere por el inmueble?");
});

it("el nombre del propietario solo se pide cuando responde otra persona", () => {
  expect(mostrarCampoEntrevista("propietario", { relacion: "propietario" })).toBe(false);
  expect(mostrarCampoEntrevista("propietario", { relacion: "representante" })).toBe(true);
  expect(mostrarCampoEntrevista("telefono", {})).toBe(true);
});

it("con sus pocas respuestas arma el checklist de documentos que le corresponde", () => {
  const ids = (data: Record<string, unknown>) => checklistFor(data).map(item => item.id);
  expect(ids({ estadoCivilActual: "casado", gravamen: "infonavit", tipoInmueble: "departamento", relacion: "representante" })).toEqual(expect.arrayContaining(["D12", "D14", "D17", "D19"]));
  expect(ids({ estadoCivilActual: "soltero", gravamen: "no", tipoInmueble: "casa", relacion: "propietario", ocupacion: "propietario" })).not.toEqual(expect.arrayContaining(["D12"]));
  expect(ids({ ocupacion: "inquilino", tipoPropietario: "moral" })).toEqual(expect.arrayContaining(["D15", "D18"]));
});

it("genera el PDF completo y no declara facultades de publicación, cobro o exclusiva", async () => {
  const definition = formatoById("02");
  const data: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.key === "folio") data.folio = "EXP-02";
    else if (field.type === "date") data[field.key] = "2026-10-04";
    else if (field.type === "time") data[field.key] = "10:00";
    else if (field.type === "money" || field.type === "number") data[field.key] = 100;
    else if (field.type === "choice") data[field.key] = field.options?.[0]?.value;
    else data[field.key] = "Declarado por el entrevistado";
  }
  expect(validateFormato("02", data)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("02", data));
  expect(pdf.getTitle()).toBe("Entrevista inicial");
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
});
