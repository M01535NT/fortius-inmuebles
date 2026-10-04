import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
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
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
});
