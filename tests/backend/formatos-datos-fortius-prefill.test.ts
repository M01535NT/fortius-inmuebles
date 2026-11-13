import { describe, expect, it } from "vitest";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import { datosFortius } from "@/lib/backend/datos-fortius";
import { SITE_TERMS } from "@/data/site-terms";
import { privacyAddress } from "@/data/privacy-notice";

/* FCH-03: el 01 y el 09 toman los datos de Fortius de Configuración; lo vacío no se inventa. */
const expediente = { folio: "EXP-2026-0099" };
const completa = datosFortius({ empresa: {
  razonSocial: "Empresa de Ejemplo, S.A. de C.V.", rfc: "EEJ010101AB1", domicilio: "Calle Ejemplo 1, Tijuana, B.C.", correo: "contratos@example.test",
  telefono: "6640000000", representante: "Persona de Ejemplo", calidadRepresentante: "Administrador único", facultades: "Escritura de ejemplo",
  licenciaNumero: "LIC-EJEMPLO", licenciaVigencia: "2027-01-31",
} });

describe("datos de Fortius en los formatos", () => {
  it("el 09 propone al prestador con lo capturado, compareciendo por su representante", () => {
    const data = prefillFormato("09", { expediente, empresa: completa });
    expect(data).toMatchObject({
      prestador: "Empresa de Ejemplo, S.A. de C.V.", rfcPrestador: "EEJ010101AB1", domicilioPrestador: "Calle Ejemplo 1, Tijuana, B.C.",
      correoPrestador: "contratos@example.test", telefonoPrestador: "6640000000", comparecePrestador: "representante",
      representantePrestador: "Persona de Ejemplo", calidadRepresentante: "Administrador único", facultadesPrestador: "Escritura de ejemplo",
      firmantePrestador: "Persona de Ejemplo", calidadFirmaPrestador: "Administrador único", licenciaNumero: "LIC-EJEMPLO", licenciaVigencia: "2027-01-31",
    });
  });

  it("sin datos capturados el 09 no propone nada del prestador", () => {
    const data = prefillFormato("09", { expediente, empresa: datosFortius({}) });
    for (const key of ["prestador", "rfcPrestador", "domicilioPrestador", "comparecePrestador", "representantePrestador", "firmantePrestador", "licenciaNumero"]) expect(data).not.toHaveProperty(key);
  });

  it("el 01 usa la razón social y el domicilio capturados, y si faltan los del aviso publicado", () => {
    expect(prefillFormato("01", { expediente, empresa: completa })).toMatchObject({ responsable: "Empresa de Ejemplo, S.A. de C.V.", domicilioResponsable: "Calle Ejemplo 1, Tijuana, B.C." });
    expect(prefillFormato("01", { expediente, empresa: datosFortius({}) })).toMatchObject({ responsable: SITE_TERMS.responsible, domicilioResponsable: privacyAddress });
  });

  it("los demás formatos no toman datos de Fortius", () => {
    expect(prefillFormato("14", { expediente, empresa: completa })).not.toHaveProperty("prestador");
  });
});
