import { describe, expect, it } from "vitest";
import { fechaEnTexto, proponerReconocido, reconocerTexto } from "@/lib/formatos/reconocer";

/* Pegar y reconocer (CSR-07): patrones fijos; todo entra por confirmar con su frase. */
const CORREO = `Buenas tardes, le comparto los datos de la señora María Ramírez López.
CURP RAMM800512MBCRRR09, RFC RAMM800512AB1, teléfono 664 123 4567, correo maria.ramirez@ejemplo.test.
El inmueble está inscrito bajo folio real número 1,234,567 y clave catastral 004-123-456-7890, partida 88.
Escritura pública número 12,345 de fecha 2 de mayo de 2010 ante la notaría pública número 5 de Tijuana.
Superficie de terreno 160.50 m² y superficie de construcción 210 m². Nació el 12 de mayo de 1980.`;

describe("reconocer texto pegado", () => {
  it("encuentra claves, folios, escritura, contacto y superficies con su frase de origen", () => {
    const datos = Object.fromEntries(reconocerTexto(CORREO).map(item => [item.clave, item.valor]));
    expect(datos).toEqual({
      propietarioCurp: "RAMM800512MBCRRR09",
      propietarioRfc: "RAMM800512AB1",
      folioReal: "1,234,567",
      claveCatastral: "004-123-456-7890",
      partida: "88",
      escritura: "escritura 12,345 del 2010-05-02 notaría 5",
      propietarioTelefono: "6641234567",
      propietarioCorreo: "maria.ramirez@ejemplo.test",
      propietarioNacimiento: "1980-05-12",
      superficieTerreno: 160.5,
      superficieConstruccion: 210,
    });
    expect(reconocerTexto(CORREO).find(item => item.clave === "folioReal")?.cita).toContain("folio real número 1,234,567");
  });
  it("no reconoce nombres ni montos sueltos y no confunde una CURP con un RFC", () => {
    const datos = reconocerTexto("Juan Pérez ofrece $2,950,000 por la casa. CURP PEPJ900101HBCRRN08.");
    expect(datos.map(item => item.clave)).toEqual(["propietarioCurp"]);
  });
  it("lee fechas en letra y en números", () => {
    expect(fechaEnTexto("el 2 de mayo de 2010")).toBe("2010-05-02");
    expect(fechaEnTexto("firmado el 03/11/2026")).toBe("2026-11-03");
    expect(fechaEnTexto("sin fecha")).toBeUndefined();
  });
  it("lo reconocido queda por confirmar y no pisa lo que ya existe", () => {
    const actuales = { folioReal: { valor: "999", estado: "confirmado" as const } };
    const { datos, propuestos } = proponerReconocido(actuales, reconocerTexto(CORREO), "2026-10-31T00:00:00.000Z");
    expect(datos.folioReal).toEqual(actuales.folioReal);
    expect(propuestos).not.toContain("folioReal");
    expect(datos.propietarioCurp).toEqual({ valor: "RAMM800512MBCRRR09", estado: "propuesto", fuente: { documento: "Texto pegado", cita: expect.stringContaining("CURP RAMM800512MBCRRR09") }, actualizadoEl: "2026-10-31T00:00:00.000Z" });
  });
});
