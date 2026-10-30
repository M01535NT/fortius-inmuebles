import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf, prepareFormatoEmission } from "@/lib/formatos/pdf";

const oferta = {
  folio: "EXP-14", lugarPropuesta: "Tijuana", fechaPropuesta: "2026-10-04",
  propietario: "María Ramírez", comprador: "Luis García", representacionComprador: "Por cuenta propia",
  inmueble: "Casa en Tijuana", folioInmueble: "123", partida: "456",
  precioPropuesto: 3000000, moneda: "MXN",
  recursosPropios: 1000000, credito: 2000000, institucionCredito: "Banco A", estadoCredito: "En trámite",
  condiciones: "Revisión de título y aprobación de crédito",
  fechaCondiciones: "2026-11-01", fechaFormalizacion: "2026-12-01",
  fechaLimitePropuesta: "2026-10-10", horaLimitePropuesta: "17:00",
  estadoRespuesta: "pendiente",
};

it("emite la carta de oferta con sumas comprobadas sin inventar respuesta del propietario", async () => {
  expect(validateFormato("14", oferta)).toEqual([]);
  const bytes = await createFormatoPdf("14", oferta);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getTitle()).toBe("Propuesta de compra");
  expect(pdf.getPageCount()).toBeGreaterThan(0);
});

it("impide emitir una oferta cuyo desglose de financiación no suma el precio", async () => {
  expect(validateFormato("14", { ...oferta, credito: 1500000 })).toContain("Desglose de recursos y crédito");
  await expect(prepareFormatoEmission("14", { ...oferta, credito: 1500000 })).rejects.toThrow(/Desglose de recursos y crédito/);
});

it("rechaza precio cero y respuesta tardía sin ratificación del comprador", () => {
  expect(validateFormato("14", { ...oferta, precioPropuesto: 0, recursosPropios: 0, credito: 0 })).toContain("Precio propuesto");
  const late = { ...oferta, estadoRespuesta: "registrada", lugarRespuesta: "Tijuana", fechaRespuesta: "2026-10-11", horaRespuesta: "10:00", caracterPropietario: "Propietaria", decisionPropietario: "aceptar", motivoRespuesta: "Las bases son aceptables" };
  expect(validateFormato("14", late)).toContain("Confirmación de vigencia por el comprador");
  expect(validateFormato("14", { ...late, confirmacionVigencia: "Correo del comprador del 11/10/2026" })).toEqual([]);
});

it("exige detalles de una contraoferta solo cuando el propietario la registra", async () => {
  const response = { ...oferta, estadoRespuesta: "registrada", lugarRespuesta: "Tijuana", fechaRespuesta: "2026-10-06", horaRespuesta: "10:00",
    caracterPropietario: "Propietaria", decisionPropietario: "contraoferta", motivoRespuesta: "Ajuste por condiciones de entrega",
    precioContraoferta: 3100000, monedaContraoferta: "MXN", impuestosContraoferta: "Sin cambio", cambiosContraoferta: "Entrega el 15 de diciembre",
    fechaLimiteContraoferta: "2026-10-09", horaLimiteContraoferta: "17:00" };
  expect(validateFormato("14", response)).toEqual([]);
  expect(validateFormato("14", { ...response, cambiosContraoferta: "" })).toContain("Cambios precisos de la contraoferta");
  const bytes = await createFormatoPdf("14", response);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
});

it("la carta sigue la plantilla del 26/10/2026: derechos de propiedad, folio real y partida, y el precio en letra", async () => {
  const { ofertaDocumento } = await import("@/lib/formatos/documento/oferta-promesa");
  const text = JSON.stringify(ofertaDocumento(oferta).blocks);
  expect(text).toContain("Le propongo adquirir los derechos de propiedad sobre el inmueble ubicado en Casa en Tijuana, identificado con Folio Real: 123 y Partida: 456.");
  expect(text).toContain("tres millones de pesos 00/100 MXN");
  expect(text).not.toMatch(/Bienes y accesorios|Calendario|recibir el inmueble|Gastos a cargo/);
});
