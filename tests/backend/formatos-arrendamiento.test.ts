import { describe, expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { arrendamientoDocumento } from "@/lib/formatos/documento/arrendamiento";
import { mostrarCampoArrendamiento } from "@/lib/formatos/arrendamiento";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import type { Block } from "@/lib/formatos/documento/modelo";

/* DOC-14: contrato de arrendamiento (formato 20), redactado por el agente y aprobado por el titular el 13/11/2026. */
const texto = (blocks: Block[]) => blocks.map(b => "text" in b ? `${"lead" in b ? `${b.lead} ` : ""}${b.text}` : b.kind === "signatures" ? b.parties.map(p => `${p.role} ${p.name}`).join(" ") : "").join("\n");

export const ARRENDAMIENTO_COMPLETO = {
  folio: "EXP-2026-0042", arrendadorTipo: "fisica", arrendador: "Persona Arrendadora de Ejemplo", arrendadorNacionalidad: "mexicana", arrendadorIdentificacion: "INE 0000000000", arrendadorRfc: "XAXX010101000",
  arrendadorCaracter: "propietario", tituloPropiedad: "escritura 1,234 del 2 de mayo de 2010, notaría 5 de Tijuana", datosRegistrales: "partida 5000000, sección civil",
  arrendadorDomicilio: "Calle Ejemplo 1, Tijuana, B.C.", arrendadorCorreo: "arrendador@example.test",
  arrendatarioTipo: "fisica", arrendatario: "Persona Arrendataria de Ejemplo", arrendatarioNacionalidad: "mexicana", arrendatarioIdentificacion: "pasaporte G00000000", arrendatarioRfc: "XAXX010101000",
  arrendatarioDomicilio: "Calle Ejemplo 2, Tijuana, B.C.", arrendatarioCorreo: "arrendatario@example.test", porCuentaDeOtro: "no",
  inmueble: "Calle Muestra 10, Fraccionamiento Ejemplo, Tijuana, B.C.", superficieTerreno: 120, superficieConstruccion: 95.5, claveCatastral: "XX-000-000", accesorios: "un cajón de estacionamiento",
  condominio: "no", uso: "habitacion", ocupantesMaximo: 4, mascotas: "no",
  plazo: "un año", fechaInicio: "2026-12-01", fechaTermino: "2027-11-30", diasAvisoRenovacion: 30, rentaMensual: 15000, causaIva: "no", diaPago: 5, primeraProporcional: "no", retencion: "no",
  actualizacion: "inpc", periodoActualizacion: "doce meses", fechaPrimeraActualizacion: "2027-12-01", interesMoratorio: 3,
  deposito: 15000, depositoMeses: 1, diasDevolucionDeposito: 30, garantia: "ninguna",
  serviciosArrendatario: "agua, luz, gas e internet", serviciosArrendador: "ningún otro concepto", diasReparacion: 5, montoReparacionMenor: 1000, seguroRc: "no", seguroInmueble: "no",
  terminacion: "pena", diasAvisoTerminacion: 30, mesesPena: 1, rentasRescision: 2, porcentajeRetencion: 20,
  ciudadJurisdiccion: "Tijuana", ciudadFirma: "Tijuana", fechaFirma: "2026-11-28", numeroTantos: 2,
};

describe("contrato de arrendamiento (20)", () => {
  it("está en el catálogo, listo para emitir, y con todo capturado no le falta nada", () => {
    expect(formatoById("20")).toMatchObject({ title: "Contrato de arrendamiento", readyForEmission: true });
    expect(validateFormato("20", ARRENDAMIENTO_COMPLETO)).toEqual([]);
  });

  it("casa habitación sin garantía: solo sale lo elegido", () => {
    const t = texto(arrendamientoDocumento(ARRENDAMIENTO_COMPLETO).blocks);
    expect(t).toContain("casa habitación del Arrendatario y de las personas que habitan con él, que no serán más de 4");
    expect(t).toContain("quince mil pesos 00/100 MXN");
    expect(t).toContain("el depósito de la cláusula Séptima es la única garantía");
    expect(t).toContain("d) tener mascotas en el inmueble.");
    expect(t).toContain("Índice Nacional de Precios al Consumidor");
    expect(t).not.toMatch(/Fiador|Obligado Solidario|giro|condominio|impuesto al valor agregado|____/);
  });

  it("local comercial con fiador, IVA, condominio y seguro cambia el texto", () => {
    const d = { ...ARRENDAMIENTO_COMPLETO, uso: "comercial", giro: "venta de café", causaIva: "si", condominio: "si", garantia: "fiador", garante: "Persona Fiadora de Ejemplo", garanteIdentificacion: "INE 1", garanteDomicilio: "Calle 3", fiadorConInmueble: "si", garanteInmueble: "Calle 4", garanteTitulo: "escritura 9", seguroRc: "si", sumaAsegurada: 500000, actualizacion: "porcentaje", porcentajeActualizacion: 5, terminacion: "plazo_minimo", mesesMinimos: 6, mascotas: "si", mascotasMaximo: 1 };
    expect(validateFormato("20", d)).toEqual([]);
    const doc = arrendamientoDocumento(d);
    const t = texto(doc.blocks);
    expect(t).toContain("El inmueble se destinará exclusivamente a venta de café.");
    expect(t).toContain("más el impuesto al valor agregado correspondiente");
    expect(t).toContain("III. Declara el Fiador:");
    expect(t).toContain("IV. Declaran las partes");
    expect(t).toContain("El Fiador se obliga a pagar");
    expect(t).toContain("reglamento del condominio del Anexo 4");
    expect(t).toContain("4. Reglamento del condominio.");
    expect(t).toContain("en un 5 % sobre la renta vigente");
    expect(t).toContain("Después de los primeros 6 meses");
    expect(t).toContain("seguro de responsabilidad civil por $500,000.00");
    expect(t).toContain("Las adecuaciones autorizadas");
    expect(doc.blocks.find(b => b.kind === "signatures")).toMatchObject({ parties: [{ role: "EL ARRENDADOR" }, { role: "EL ARRENDATARIO" }, { role: "EL FIADOR", name: "Persona Fiadora de Ejemplo" }] });
  });

  it("sin datos sale con líneas en blanco y avisa lo que falta, sin romperse", () => {
    const t = texto(arrendamientoDocumento({}).blocks);
    expect(t).toContain("____");
    expect(validateFormato("20", {}).length).toBeGreaterThan(10);
  });

  it("solo pide los campos de la opción elegida", () => {
    expect(mostrarCampoArrendamiento("arrendadorActa", { arrendadorTipo: "fisica" })).toBe(false);
    expect(mostrarCampoArrendamiento("arrendadorActa", { arrendadorTipo: "moral" })).toBe(true);
    expect(mostrarCampoArrendamiento("giro", { uso: "habitacion" })).toBe(false);
    expect(mostrarCampoArrendamiento("garanteInmueble", { garantia: "obligado", fiadorConInmueble: "si" })).toBe(false);
    expect(validateFormato("20", { ...ARRENDAMIENTO_COMPLETO, arrendadorTipo: "moral" })).toEqual(expect.arrayContaining(["Acta constitutiva del arrendador", "Representante del arrendador"]));
  });

  it("revisa fechas, día de pago, porcentajes y correos", () => {
    const errores = validateFormato("20", { ...ARRENDAMIENTO_COMPLETO, fechaTermino: "2026-11-01", diaPago: 40, interesMoratorio: 150, arrendatarioCorreo: "sin-arroba", rentaMensual: 0 });
    expect(errores).toEqual(expect.arrayContaining(["El término debe ser posterior al inicio", "Día de pago entre 1 y 31", "Interés moratorio entre 0 y 100", "Correo del arrendatario", "Renta mensual mayor que cero"]));
  });

  it("propone al propietario como arrendador y no usa el plazo de la entrevista", () => {
    const data = prefillFormato("20", { expediente: { folio: "EXP-2026-0042" }, persona: { nombre: "Persona Propietaria", email: "p@example.test" }, entrevista: { id: "e", version: 1, intencion: "arrendar", respuestas: { relacion: "propietario", plazo: "tres meses" } } } as Parameters<typeof prefillFormato>[1]);
    expect(data).toMatchObject({ folio: "EXP-2026-0042", arrendador: "Persona Propietaria", arrendadorCorreo: "p@example.test" });
    expect(data).not.toHaveProperty("plazo");
  });
});
