import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";

const opinion = {
  folio: "EXP-06", fechaEmision: "2026-10-04", destinatario: "María Ramírez", inmueble: "Casa en Tijuana",
  operacion: "Venta del pleno dominio", abogado: "Lic. Ana López", cedula: "12345678",
  conclusion: "Con los documentos revisados, la operación puede continuar a la etapa de negociación sujeta a actualizar el certificado registral.",
  objeto: "Examinar los derechos y riesgos para la etapa de negociación.", alcance: "Revisión documental de copias identificadas.",
  antecedentes: "El propietario afirma haber adquirido en 2018.", documentos: "Escritura 100 de 2018, copia simple, y certificado 200 de 2026.",
  titularidad: "La escritura identifica a María como adquirente; falta cotejo del original.",
  registro: "El certificado de fecha 2026-09-20 muestra el antecedente; su vigencia debe actualizarse antes de la firma.",
  impedimentos: "No se identificó bloqueo para negociar; no se ha concluido la revisión de adeudos.",
  sustento: "Escritura 100, cláusula segunda, y certificado 200, folio real 123.",
  recomendaciones: "Obtener certificado actualizado y constancia de adeudos antes de formalizar.",
  responsables: "Propietario: entregar originales; abogado: cotejar y actualizar búsquedas.",
  limites: "No se inspeccionó el inmueble ni se verificó la autenticidad de copias.",
  actualizacion: "Actualizar antes de firma, si aparecen nuevas cargas o cambia la titularidad.",
};

it("conserva las seis partes de la opinión jurídica original", () => {
  const keys = formatoById("06").fields.map((field) => field.key);
  expect(keys).toEqual(expect.arrayContaining(["conclusion", "objeto", "alcance", "antecedentes", "documentos", "titularidad", "registro", "impedimentos", "recomendaciones", "limites", "actualizacion", "abogado", "cedula"]));
  expect(validateFormato("06", { ...opinion, sustento: "" })).toContain("Evidencia y fundamento de la conclusión");
});

it("emite una opinión en prosa con profesional y soporte identificados", async () => {
  expect(validateFormato("06", opinion)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("06", opinion));
  expect(pdf.getTitle()).toBe("Opinión jurídica del inmueble");
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2);
});
