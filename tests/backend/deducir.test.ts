import { describe, expect, it } from "vitest";
import { claveCatastralValida, coloniasDe, curpValida, datosDeCurp, datosDeRfc, domicilioDesde, rfcValido, type CatalogoCp } from "@/lib/formatos/deducir";

/* Deducir en vez de preguntar (CSR-03): reglas fijas; nada se inventa. */
describe("CURP", () => {
  it("una CURP válida dice la fecha de nacimiento, el sexo y la entidad", () => {
    expect(datosDeCurp("ramm800512mbcrrr09")).toEqual({ fechaNacimiento: "1980-05-12", sexo: "Mujer", entidad: "Baja California", entidadClave: "BC" });
    // Desde el año 2000 el penúltimo carácter es una letra.
    expect(datosDeCurp("GOLH040229HJCMPRA1")).toEqual({ fechaNacimiento: "2004-02-29", sexo: "Hombre", entidad: "Jalisco", entidadClave: "JC" });
  });
  it("rechaza lo que no tiene la forma de una CURP o una fecha que no existe", () => {
    expect(curpValida("RAMM800512")).toBe(false);
    expect(curpValida("RAMM801312MBCRRR09")).toBe(false);
    expect(curpValida("RAMM800230MBCRRR09")).toBe(false);
    expect(curpValida("RAMM800512MXXRRR09")).toBe(false);
  });
});

describe("RFC y clave catastral", () => {
  it("distingue persona física de moral y lee la fecha", () => {
    expect(datosDeRfc("RAMM800512AB1")).toEqual({ tipo: "fisica", fecha: "1980-05-12" });
    expect(datosDeRfc("fin 010203 7a9")).toEqual({ tipo: "moral", fecha: "2001-02-03" });
    expect(rfcValido("RAMM80")).toBe(false);
  });
  it("una clave catastral son dígitos, con o sin guiones", () => {
    expect(claveCatastralValida("004-123-456-7890")).toBe(true);
    expect(claveCatastralValida("ABC-123")).toBe(false);
    expect(claveCatastralValida("123")).toBe(false);
  });
});

describe("código postal", () => {
  const catalogo: CatalogoCp = { estado: "Baja California", descargadoEl: "2026-10-31", cp: { "22000": { municipio: "Tijuana", ciudad: "Tijuana", colonias: ["Zona Centro", "Zona Norte"] } } };
  it("devuelve las colonias del código con su municipio y arma el domicilio como se imprime", () => {
    const colonias = coloniasDe(catalogo, "22 000");
    expect(colonias).toEqual([{ cp: "22000", colonia: "Zona Centro", municipio: "Tijuana", ciudad: "Tijuana" }, { cp: "22000", colonia: "Zona Norte", municipio: "Tijuana", ciudad: "Tijuana" }]);
    expect(domicilioDesde("Av. Revolución 123", colonias[0])).toBe("Av. Revolución 123, Zona Centro, C.P. 22000, Tijuana, Baja California");
  });
  it("sin catálogo o con un código desconocido no inventa colonias", () => {
    expect(coloniasDe(null, "22000")).toEqual([]);
    expect(coloniasDe(catalogo, "99999")).toEqual([]);
    expect(coloniasDe(catalogo, "2200")).toEqual([]);
  });
});
