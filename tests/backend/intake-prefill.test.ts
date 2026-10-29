import { describe, expect, it } from "vitest";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import { TIPOS_INMUEBLE } from "@/lib/formatos/valor-fields";

const context = (respuestas: Record<string, string>, intencion = "vender") => ({
  expediente: { folio: "EXP-ENSAYO", operacion: "venta", flujo: { ruta: "captacion" } },
  persona: { nombre: "Persona de ensayo" },
  entrevista: { id: "77000000-0000-4000-8000-000000000002", version: 1, intencion, respuestas },
}) as Parameters<typeof prefillFormato>[1];

describe("COR-01 · nombre del propietario", () => {
  it.each(["07", "08", "10"])("un prospecto propietario nuevo llega con su nombre al %s, marcado por confirmar", formato => {
    const data = prefillFormato(formato, context({ relacion: "por_aclarar" }));
    expect(data.propietario).toBe("Persona de ensayo");
    expect(JSON.parse(String(data.origenDatos)).porConfirmar).toEqual(["propietario"]);
  });
  it("la relación aclarada como propietario no queda por confirmar", () => {
    const data = prefillFormato("08", context({ relacion: "propietario" }));
    expect(data.propietario).toBe("Persona de ensayo");
    expect(JSON.parse(String(data.origenDatos)).porConfirmar).toBeUndefined();
  });
  it("no copia el nombre de un representante ni de quien compra", () => {
    expect(prefillFormato("08", context({ relacion: "representante" })).propietario).toBeUndefined();
    expect(prefillFormato("08", context({ relacion: "por_aclarar" }, "comprar")).propietario).toBeUndefined();
  });
});

describe("COR-02 · tipo de inmueble al 07", () => {
  it.each([
    ["casa", "Casa"], ["departamento", "Departamento"], ["terreno", "Terreno"],
    ["local", "Local"], ["oficina", "Oficina"], ["nave-industrial", "Nave o bodega"],
  ])("«%s» de la entrevista llega al 07 como «%s»", (entrevista, plantilla) => {
    expect(TIPOS_INMUEBLE).toContain(plantilla);
    expect(prefillFormato("07", context({ tipoInmueble: entrevista })).tipoInmueble).toBe(plantilla);
  });
  it("«por definir» deja el tipo vacío en el 07", () => {
    expect(prefillFormato("07", context({ tipoInmueble: "por_definir" })).tipoInmueble).toBeUndefined();
  });
});

describe("Levantamiento · datos que el sistema ya sabe", () => {
  it("el levantamiento nace con la fecha de hoy y el asesor como quien lo elabora; los demás formatos no", () => {
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const conAsesor = { ...context({}), asesor: { nombre: "Asesor de ensayo" }, inmueble: { codigo: "FORTIUS-000004", slug: "casa-ensayo" } } as Parameters<typeof prefillFormato>[1];
    const casa = prefillFormato("04B", conAsesor);
    expect(casa).toMatchObject({ fechaVisita: hoy, elaboro: "Asesor de ensayo", asesor: "Asesor de ensayo", idInmueble: "FORTIUS-000004", folio: "EXP-ENSAYO" });
    expect(prefillFormato("13", conAsesor)).not.toHaveProperty("elaboro");
  });
});

describe("aviso de privacidad (01)", () => {
  it("un aviso nuevo llega con los datos del responsable del aviso publicado y la fecha de hoy, sin decisiones", async () => {
    const { SITE_TERMS } = await import("@/data/site-terms");
    const { privacyAddress } = await import("@/data/privacy-notice");
    const aviso = prefillFormato("01", context({}));
    expect(aviso).toMatchObject({ responsable: SITE_TERMS.responsible, domicilioResponsable: privacyAddress, contactoPrivacidad: SITE_TERMS.responsible, correoPrivacidad: SITE_TERMS.email, titular: "Persona de ensayo", folio: "EXP-ENSAYO" });
    expect(aviso.fechaEmision).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Nunca se proponen consentimientos ni firmas.
    for (const key of ["consentimientoPatrimonial", "consentimientoPublicidad", "transferenciaAsesor", "acuseEstado"]) expect(aviso).not.toHaveProperty(key);
    expect(prefillFormato("02", context({}))).not.toHaveProperty("responsable");
  });
});

describe("plan de comercialización (10)", () => {
  it("un plan nuevo llega con la operación, el tipo de inmueble y la fecha de hoy", () => {
    const plan = prefillFormato("10", context({ tipoInmueble: "casa" }));
    expect(plan).toMatchObject({ operacion: "Venta", tipoInmueble: "casa", propietario: "Persona de ensayo", folio: "EXP-ENSAYO" });
    expect(plan.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
