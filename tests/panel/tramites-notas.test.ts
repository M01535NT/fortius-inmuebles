import { describe, expect, it } from "vitest";

import { historialTramite, nombreAutor, notasInternas } from "@/lib/panel/datos/tramites";
import { nuevoTramite, textoDelAvance, type Tramite } from "@/lib/tramites";

const base = nuevoTramite({ id: "t1", acreedor: "banco", titulo: "Casa Playas", clienteId: "c1", asesorId: "a1", pagos: ["Derechos"] });
const t: Tramite = {
  ...base,
  pasoActual: 2,
  notas: [
    { id: "n1", tipo: "nota", texto: "El propietario debe la cuota de mantenimiento", autor: "u1", fecha: "2026-11-14T10:00:00Z" },
    { id: "e1", tipo: "evento", texto: "Se cerró el paso «Datos del crédito»", autor: "u1", fecha: "2026-11-15T09:00:00Z" },
    { id: "n2", tipo: "nota", texto: "SECRETO interno: negociar honorarios", autor: "u2", fecha: "2026-11-16T12:00:00Z" },
    { id: "n3", tipo: "nota", texto: "Nota vieja sin fecha" },
  ],
};

describe("notas internas e historial", () => {
  it("separa las notas del historial y pone las nuevas primero", () => {
    expect(notasInternas(t).map((n) => n.id)).toEqual(["n2", "n1", "n3"]);
    expect(historialTramite(t).map((n) => n.id)).toEqual(["e1"]);
  });
  it("dice quién escribió cada nota", () => {
    const cuentas = [{ user_id: "u1", role: "editor", asesor_id: "a1" }, { user_id: "u2", role: "admin", asesor_id: null }];
    const asesores = [{ id: "a1", nombre: "Laura Ejemplo" }];
    expect(nombreAutor("u1", cuentas, asesores)).toBe("Laura Ejemplo");
    expect(nombreAutor("u2", cuentas, asesores)).toBe("Dirección");
    expect(nombreAutor("u9", cuentas, asesores)).toBe("Alguien del equipo");
    expect(nombreAutor(undefined, [], [])).toBe("Alguien del equipo");
  });
});

describe("avance al propietario", () => {
  it("nunca lleva notas internas ni el historial, con todas las partes encendidas", () => {
    const texto = textoDelAvance(t, { listo: true, sigue: true, necesita: true, pagos: true }, "Ana", "Laura");
    for (const n of t.notas) expect(texto).not.toContain(n.texto);
    expect(texto).not.toMatch(/SECRETO|mantenimiento|Nota vieja/);
    expect(texto).toContain("Casa Playas");
  });
});
