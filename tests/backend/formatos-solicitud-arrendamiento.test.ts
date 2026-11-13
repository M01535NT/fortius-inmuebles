import { describe, expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { solicitudArrendamientoDocumento } from "@/lib/formatos/documento/solicitud-arrendamiento";
import { documentosAplicables, mostrarCampoSolicitud, rentaSobreIngreso } from "@/lib/formatos/solicitud-arrendamiento";
import { requirementFormato } from "@/lib/formatos/operation-workflow";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import type { Block } from "@/lib/formatos/documento/modelo";

/* 22: solicitud de arrendamiento y revisión del candidato, redactada por el agente y aprobada por el titular el 13/11/2026. */
const texto = (blocks: Block[]) => blocks.map(b => "text" in b ? b.text : b.kind === "fields" || b.kind === "table" ? b.rows.map(r => r.join(" ")).join("\n") : b.kind === "signatures" ? b.parties.map(p => `${p.role} ${p.name}`).join(" ") : "").join("\n");

export const SOLICITUD_COMPLETA = {
  folio: "EXP-2026-0060", inmueble: "Calle Muestra 10, Tijuana, B.C.", fechaSolicitud: "2026-11-20",
  solicitanteTipo: "fisica", solicitante: "Persona Solicitante de Ejemplo", rfc: "XAXX010101000", identificacion: "INE 0000000000", nacionalidad: "mexicana",
  domicilioActual: "Calle Ejemplo 3, Tijuana, B.C.", tiempoDomicilio: "dos años", telefono: "6640000002", correo: "solicitante@example.test",
  uso: "habitacion", ocupantes: 3, mascotas: "no", rentaOfrecida: 15000, fechaEntrada: "2026-12-01", plazoMeses: 12, garantia: "ninguna",
  actividad: "empleado", empleador: "Empresa de Ejemplo", puesto: "Analista", telefonoEmpleo: "6640000003", antiguedad: "cuatro años", ingresoMensual: 50000,
  ref1Tipo: "anterior", ref1Nombre: "Persona Referencia Uno", ref1Telefono: "6640000004", ref1Relacion: "Arrendador anterior",
  ref2Tipo: "personal", ref2Nombre: "Persona Referencia Dos", ref2Telefono: "6640000005", ref2Relacion: "Conocida",
  mesesComprobantes: 3, documentosRecibidos: ["identificacion", "domicilio"], medioAviso: "correo electrónico", fechaAviso: "2026-11-19", lugar: "Tijuana",
};

describe("solicitud de arrendamiento (22)", () => {
  it("está en el catálogo, lista para emitir, y con la solicitud capturada no le falta nada", () => {
    expect(formatoById("22")).toMatchObject({ title: "Solicitud de arrendamiento y revisión del candidato", readyForEmission: true });
    expect(validateFormato("22", SOLICITUD_COMPLETA)).toEqual([]);
  });

  it("persona física sin garantía: solo sale lo que aplica y la revisión dice qué falta", () => {
    expect(rentaSobreIngreso(SOLICITUD_COMPLETA)).toBe(30);
    const t = texto(solicitudArrendamientoDocumento({ ...SOLICITUD_COMPLETA, coherencia: "si", decision: "acepta" }).blocks);
    expect(t).toContain("Persona física · Persona Solicitante de Ejemplo · RFC: XAXX010101000");
    expect(t).toContain("Analista");
    expect(t).toContain("Recibidos: Identificación oficial, Comprobante de domicilio. Faltan: Comprobantes de ingresos.");
    expect(t).toContain("La renta ofrecida es el 30 % del ingreso mensual comprobable.");
    expect(t).toContain("Fortius Inmuebles no le cobra por presentar esta solicitud.");
    expect(t).toContain("Acepta al candidato.");
    expect(t).not.toMatch(/GARANTE|Acta constitutiva|Referencia 3|giro/);
  });

  it("empresa con fiador con inmueble y uso comercial cambia el texto y los documentos", () => {
    const d = { ...SOLICITUD_COMPLETA, solicitanteTipo: "moral", acta: "escritura 1", representante: "Persona Representante", poder: "escritura 2", uso: "comercial", giro: "oficinas", garantia: "fiador", garante: "Persona Fiadora", telefonoGarante: "6640000006", fiadorConInmueble: "si", inmuebleGarante: "Calle 4", actividad: "empresa", actividadDetalle: "servicios contables", ref3Tipo: "comercial", ref3Nombre: "Proveedor de Ejemplo", ref3Telefono: "6640000007", ref3Relacion: "Proveedor", decision: "condiciones", condiciones: "depósito de dos meses" };
    expect(validateFormato("22", d)).toEqual([]);
    expect(documentosAplicables(d)).toEqual(["identificacion", "domicilio", "ingresos", "acta", "poder", "constanciaFiscal", "garanteIdentificacion", "garanteDomicilio", "escrituraFiador"]);
    const doc = solicitudArrendamientoDocumento(d);
    const t = texto(doc.blocks);
    expect(t).toContain("Comercial u oficina, giro: oficinas");
    expect(t).toContain("Escritura del inmueble del fiador");
    expect(t).toContain("Proveedor de Ejemplo");
    expect(t).toContain("Acepta al candidato con estas condiciones: depósito de dos meses");
    expect(t).not.toContain("Personas que lo habitarán");
    expect(doc.blocks.find(b => b.kind === "signatures")).toMatchObject({ parties: [{ role: "SOLICITANTE", name: "Persona Solicitante de Ejemplo, por conducto de Persona Representante" }, { role: "GARANTE" }] });
  });

  it("solo pide los campos de la opción elegida", () => {
    expect(mostrarCampoSolicitud("acta", { solicitanteTipo: "fisica" })).toBe(false);
    expect(mostrarCampoSolicitud("empleador", { actividad: "pensionado" })).toBe(false);
    expect(mostrarCampoSolicitud("inmuebleGarante", { garantia: "obligado", fiadorConInmueble: "si" })).toBe(false);
    expect(validateFormato("22", { ...SOLICITUD_COMPLETA, garantia: "obligado" })).toEqual(expect.arrayContaining(["Nombre del fiador u obligado solidario"]));
  });

  it("revisa enteros, montos, correo, fechas en orden y documentos que no aplican", () => {
    const errores = validateFormato("22", { ...SOLICITUD_COMPLETA, ocupantes: 2.5, ingresoMensual: 0, correo: "sin-arroba", fechaRecepcion: "2026-11-25", fechaPresentacion: "2026-11-24", documentosRecibidos: ["acta"] });
    expect(errores).toEqual(expect.arrayContaining(["Personas que lo habitarán en número entero mayor que cero", "Ingreso mensual mayor que cero", "Correo del solicitante", "La presentación no puede ser anterior a la recepción", "Documentos recibidos que no aplican a esta solicitud"]));
  });

  it("en la renta del propietario el requisito del arrendatario apunta al 22", () => {
    expect(requirementFormato("arrendatario", "arrendador")).toBe("22");
    expect(requirementFormato("arrendatario", "arrendatario")).toBe("12");
  });

  it("sin datos sale con líneas en blanco, sin romperse, y genera su PDF", async () => {
    expect(texto(solicitudArrendamientoDocumento({}).blocks)).toContain("____");
    const pdf = await createFormatoPdf("22", SOLICITUD_COMPLETA);
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
