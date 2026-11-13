import { describe, expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { intermediacionRentaDocumento } from "@/lib/formatos/documento/intermediacion-renta";
import { calcularIntermediacionRenta, mostrarCampoIntermediacionRenta } from "@/lib/formatos/intermediacion-renta";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import type { Block } from "@/lib/formatos/documento/modelo";

/* 21: contrato de intermediación inmobiliaria para renta, redactado por el agente y aprobado por el titular el 13/11/2026. */
const texto = (blocks: Block[]) => blocks.map(b => "text" in b ? `${"lead" in b ? `${b.lead} ` : ""}${b.text}` : b.kind === "fields" ? b.rows.map(r => r.join(" ")).join("\n") : b.kind === "signatures" ? b.parties.map(p => `${p.role} ${p.name}`).join(" ") : "").join("\n");

const CLIENTE = { nombre: "Persona Propietaria de Ejemplo", rfc: "XAXX010101000", identificacion: "INE 0000000000", derechoFacultad: "Propietaria", comparecencia: "Por propio derecho", representante: "No aplica", calidadRepresentante: "No aplica", facultades: "No aplica", domicilio: "Calle Ejemplo 1, Tijuana, B.C.", correo: "cliente@example.test", telefono: "6640000000", firmante: "Persona Propietaria de Ejemplo", calidadFirma: "Propietaria" };
export const RENTA_COMPLETA = {
  folio: "EXP-2026-0050", clientesContrato: [CLIENTE],
  prestador: "Prestador de Ejemplo, S.A. de C.V.", rfcPrestador: "XAXX010101000", comparecePrestador: "propia", domicilioPrestador: "Calle Ejemplo 2, Tijuana, B.C.", correoPrestador: "prestador@example.test", telefonoPrestador: "6640000001", firmantePrestador: "Persona Firmante de Ejemplo", calidadFirmaPrestador: "Asesora",
  inmueble: "Calle Muestra 10, Tijuana, B.C.", idInmueble: "INM-0050", claveCatastral: "XX-000-000", tipoInmueble: "Casa", superficie: "95 m² de construcción según escritura", accesorios: "un cajón de estacionamiento",
  derecho: "Propietaria, escritura 1,234", ocupacion: "Desocupado", condominioReglamento: "No aplica", restricciones: "Ninguna",
  uso: "habitacion", rentaAutorizada: 15000, causaIva: "no", mesesDeposito: 1, garantia: "fiador", plazoMinimo: 12, mascotas: "no",
  modalidad: "exclusiva", inicio: "2026-11-20", fin: "2027-02-17", honorariosModo: "meses", mesesHonorarios: 1, ivaHonorariosTasa: 16, renovacion: "sin", penaMaxima: 10000,
  proteccionDias: 60, excepcionesEstado: "ninguna", anexosEstado: "ninguno",
  medioAvisoPrivacidad: "correo electrónico", fechaAvisoPrivacidad: "2026-11-18", ciudad: "Tijuana", lugar: "Tijuana", fecha: "2026-11-20",
};

describe("contrato de intermediación para renta (21)", () => {
  it("está en el catálogo, listo para emitir, y con todo capturado no le falta nada", () => {
    expect(formatoById("21")).toMatchObject({ title: "Contrato de intermediación inmobiliaria para renta", readyForEmission: true });
    expect(validateFormato("21", RENTA_COMPLETA)).toEqual([]);
  });

  it("honorarios por meses de renta: calcula el total con IVA y la pena tope", () => {
    expect(calcularIntermediacionRenta(RENTA_COMPLETA)).toEqual({ honorarios: 15000, ivaHonorarios: 2400, total: 17400, basePena: 10000 });
    const t = texto(intermediacionRentaDocumento(RENTA_COMPLETA).blocks);
    expect(t).toContain("1 mes de la renta pactada en el contrato de arrendamiento. IVA: 16 %. Total estimado a la renta autorizada: $17,400.00");
    expect(t).toContain("Uso: casa habitación · Renta mensual: $15,000.00 MXN · Depósito: 1 mes · Garantía que se pedirá: fiador · Plazo mínimo: 12 meses · Mascotas: no");
    expect(t).toContain("Renovación con el mismo arrendatario No genera honorarios.");
    expect(t).toContain("diez mil pesos 00/100 MXN");
    expect(t).toContain("puesto a disposición del CLIENTE en correo electrónico");
    expect(t).toContain("tribunales competentes de Tijuana, Baja California");
    expect(t).toContain("TERCERA BIS. Revisión de candidatos.");
    expect(t).not.toMatch(/____|PROFECO|más IVA|giro/);
  });

  it("porcentaje del plazo forzoso, uso comercial con IVA y renovación con honorarios cambian el texto", () => {
    const d = { ...RENTA_COMPLETA, uso: "comercial", giro: "oficinas", causaIva: "si", honorariosModo: "porcentaje", porcentajeHonorarios: 8, renovacion: "con", porcentajeRenovacion: 50, penaMaxima: 20000 };
    expect(validateFormato("21", d)).toEqual([]);
    expect(calcularIntermediacionRenta(d)).toEqual({ honorarios: 14400, ivaHonorarios: 2304, total: 16704, basePena: 14400 });
    const t = texto(intermediacionRentaDocumento(d).blocks);
    expect(t).toContain("Uso: comercial u oficina, giro: oficinas · Renta mensual: $15,000.00 MXN, más IVA");
    expect(t).toContain("8 % de la renta total del plazo forzoso del arrendamiento");
    expect(t).toContain("50 % de una renta mensual vigente por cada renovación");
    expect(t).not.toContain("No genera honorarios.");
  });

  it("solo pide los campos de la opción elegida", () => {
    expect(mostrarCampoIntermediacionRenta("giro", { uso: "habitacion" })).toBe(false);
    expect(mostrarCampoIntermediacionRenta("porcentajeHonorarios", { honorariosModo: "meses" })).toBe(false);
    expect(mostrarCampoIntermediacionRenta("mesesHonorarios", { honorariosModo: "porcentaje" })).toBe(false);
    expect(mostrarCampoIntermediacionRenta("porcentajeRenovacion", { renovacion: "sin" })).toBe(false);
    expect(validateFormato("21", { ...RENTA_COMPLETA, uso: "comercial", renovacion: "con" })).toEqual(expect.arrayContaining(["Giro o actividad permitida", "Porcentaje de una renta mensual por cada renovación"]));
  });

  it("revisa vigencia, porcentajes, enteros, renta y clientes", () => {
    const errores = validateFormato("21", { ...RENTA_COMPLETA, fin: "2026-11-01", ivaHonorariosTasa: 120, mesesDeposito: 1.5, rentaAutorizada: 0, mesesHonorarios: 0, clientesContrato: [] });
    expect(errores).toEqual(expect.arrayContaining(["Vigencia válida con inicio y fin", "Tasa de IVA de los honorarios entre 0 y 100", "Meses de depósito en número entero", "Renta autorizada mayor que cero", "Meses de honorarios mayores que cero y hasta 12", "cliente del contrato"]));
  });

  it("sin datos sale con líneas en blanco, sin romperse, y genera su PDF", async () => {
    expect(texto(intermediacionRentaDocumento({}).blocks)).toContain("____");
    expect(validateFormato("21", {}).length).toBeGreaterThan(10);
    const pdf = await createFormatoPdf("21", RENTA_COMPLETA);
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
