import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf, prepareFormatoEmission } from "@/lib/formatos/pdf";

const oferta = {
  folio: "EXP-14", lugarPropuesta: "Tijuana", fechaPropuesta: "2026-10-04",
  propietario: "María Ramírez", comprador: "Luis García", representacionComprador: "Por cuenta propia",
  derechoAdquirir: "pleno dominio", inmueble: "Casa en Tijuana", folioInmueble: "Folio real 123",
  precioPropuesto: 3000000, moneda: "MXN", impuestosPrecio: "Excluye gastos e impuestos de escrituración",
  bienesIncluidos: "Cocina integral", bienesExcluidos: "Muebles personales",
  recursosPropios: 1000000, credito: 2000000, institucionCredito: "Banco A", estadoCredito: "En trámite",
  calendarioPagos: "Un pago de 3,000,000 MXN al formalizar", condiciones: "Revisión de título y aprobación de crédito",
  fechaCondiciones: "2026-11-01", fechaFormalizacion: "2026-12-01", fechaEntrega: "2026-12-01",
  gastosComprador: "Escrituración", gastosPropietario: "Cancelación de gravamen",
  fechaLimitePropuesta: "2026-10-10", horaLimitePropuesta: "17:00", zonaHoraria: "America/Tijuana",
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
