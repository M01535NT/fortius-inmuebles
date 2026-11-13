import { describe, expect, it } from "vitest";
import { DATOS_FORTIUS_VACIOS, datosFortius, faltantesFortius, prestadorDel09 } from "@/lib/backend/datos-fortius";
import { parseRecord, projectPublic } from "@/lib/backend/validation";

/* FCH-03: datos de Fortius en Configuración, sin inventar los que faltan. */
const settings = { nombreComercial: "Fortius", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" };

describe("datos de Fortius", () => {
  it("sin captura todo sale vacío y se dice qué falta", () => {
    for (const config of [undefined, null, {}, { empresa: "dañado" }, settings]) expect(datosFortius(config)).toEqual(DATOS_FORTIUS_VACIOS);
    expect(faltantesFortius(DATOS_FORTIUS_VACIOS, ["razonSocial", "rfc"])).toEqual(["Razón social", "RFC"]);
  });

  it("lee lo guardado y deja vacío un valor dañado sin tumbar los demás", () => {
    const datos = datosFortius({ empresa: { rfc: "fin201112ab3", domicilio: " C. Dos 4063 ", correo: "no es correo", licenciaVigencia: "2027-01-31" } });
    expect(datos).toMatchObject({ rfc: "FIN201112AB3", domicilio: "C. Dos 4063", correo: "", licenciaVigencia: "2027-01-31", razonSocial: "" });
  });

  it("prellena el prestador del 09 solo con lo capturado", () => {
    const datos = datosFortius({ empresa: { rfc: "FIN201112AB3", representante: "Persona de ejemplo" } });
    expect(prestadorDel09(datos)).toEqual({ rfcPrestador: "FIN201112AB3", representantePrestador: "Persona de ejemplo", firmantePrestador: "Persona de ejemplo" });
  });

  it("se guardan en Configuración, se validan y nunca salen en la proyección pública", () => {
    const empresa = { razonSocial: "Empresa de ejemplo", rfc: "FIN201112AB3" };
    expect(parseRecord("config", "singleton", { ...settings, empresa })).toMatchObject({ empresa });
    expect(projectPublic("config", [{ ...settings, empresa }])).toEqual([settings]);
    for (const bad of [{ rfc: "123" }, { correo: "x" }, { licenciaVigencia: "31/01/2027" }]) expect(() => parseRecord("config", "singleton", { ...settings, empresa: bad })).toThrow();
  });
});
