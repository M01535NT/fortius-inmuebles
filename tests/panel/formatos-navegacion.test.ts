import { describe, expect, it } from "vitest";

import type { Zona } from "@/lib/formatos/documento/pdf";
import { cambiosDe, entradaDeFormato, espaciosEnOrden, rutaAsunto, rutaCaptura, rutaDeRegreso, textoFalta } from "@/lib/panel/datos/formatos-navegacion";

const z = (keys: string[], y: number, page = 0): Zona => ({ keys, label: keys.join(","), page, x: 10, y, w: 100, h: 12 }) as Zona;

describe("PN-06 llegar y volver (AUD-05)", () => {
  it("solo acepta rutas del panel para volver", () => {
    expect(rutaDeRegreso("/admin/asuntos?ver=abc")).toBe("/admin/asuntos?ver=abc");
    expect(rutaDeRegreso("/admin")).toBe("/admin");
    expect(rutaDeRegreso("//evil.com/admin")).toBeNull();
    expect(rutaDeRegreso("https://evil.com")).toBeNull();
    expect(rutaDeRegreso("/adminx")).toBeNull();
    // El provisional en reserva no es una ruta del panel: la X no regresa ahí.
    expect(rutaDeRegreso("/admin-anterior")).toBeNull();
    expect(rutaDeRegreso("/admin-anterior/operaciones")).toBeNull();
    expect(rutaDeRegreso("/admin\\..\\x")).toBeNull();
    expect(rutaDeRegreso(null)).toBeNull();
  });

  it("la captura abierta desde un asunto lleva de vuelta a él", () => {
    expect(rutaCaptura("d1", rutaAsunto("e 1"))).toBe(`/admin/formatos/d1?volver=${encodeURIComponent("/admin/asuntos?ver=e%201")}`);
    expect(rutaCaptura("d1", null)).toBe("/admin/formatos/d1");
    expect(rutaCaptura("d1", "https://x.com")).toBe("/admin/formatos/d1");
  });

  it("encuentra el formato pedido; un 04 con tipo abre la entrada 04 con su tipo", () => {
    expect(entradaDeFormato("13")).toMatchObject({ entrada: { id: "13" }, tipo: "" });
    expect(entradaDeFormato("04B")).toMatchObject({ entrada: { id: "04" }, tipo: "04B" });
    expect(entradaDeFormato("99")).toBeNull();
    expect(entradaDeFormato(null)).toBeNull();
  });
});

describe("PN-06 nada escrito se pierde y uno por uno", () => {
  it("cambios pendientes: solo lo distinto de lo guardado", () => {
    expect(cambiosDe({ a: "x", b: "" }, { a: "x" })).toEqual({});
    expect(cambiosDe({ a: "y", b: 2 }, { a: "x", b: 2 })).toEqual({ a: "y" });
    expect(cambiosDe({ l: ["1"] }, { l: [] })).toEqual({ l: ["1"] });
  });

  it("espacios en el orden de la hoja, sin repetir la misma celda; «solo lo que falta» deja los vacíos", () => {
    const zonas = [z(["a"], 700), z(["b", "c"], 680), z(["a"], 600), z([], 500), z(["d"], 700, 1)];
    expect(espaciosEnOrden(zonas, {}, { soloFalta: false }).map((x) => x.keys.join())).toEqual(["a", "b,c", "d"]);
    expect(espaciosEnOrden(zonas, { a: "x", b: "1", c: "2" }, { soloFalta: true }).map((x) => x.keys.join())).toEqual(["d"]);
    expect(espaciosEnOrden(zonas, { a: "x", b: "1", c: "2", d: "y" }, { soloFalta: true, faltan: new Set(["c"]) }).map((x) => x.keys.join())).toEqual(["b,c"]);
  });
});

describe("PN-06 una sola cuenta de lo que falta", () => {
  it("cuenta espacios, y aparte los datos que no tienen espacio en la hoja", () => {
    expect(textoFalta(12)).toBe("Faltan 12 espacios");
    expect(textoFalta(1)).toBe("Falta 1 espacio");
    expect(textoFalta(3, 1)).toBe("Faltan 3 espacios y 1 dato");
    expect(textoFalta(0, 2)).toBe("Faltan 2 datos");
    expect(textoFalta(0)).toBe("Completo");
  });
});
