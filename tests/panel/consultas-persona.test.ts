import { afterEach, describe, expect, it, vi } from "vitest";

import type { Cliente } from "@/lib/backend/contracts";
import { operacionSugerida } from "@/lib/panel/datos/consultas-acciones";
import { buscarPersonas, coincidenciasDeConsulta, hayDuplicadoFuerte, normalizar, operacionDeConsulta, quitarAsunto } from "@/lib/panel/datos/consultas-persona";

const p = (id: string, nombre: string, telefono = "", email?: string): Cliente =>
  ({ id, nombre, telefono, ...(email ? { email } : {}), tipo: "otro", notas: "", creadoEl: "2026-11-01T00:00:00.000Z", actualizadoEl: "2026-11-01T00:00:00.000Z" }) as Cliente;

const PERSONAS = [
  p("a", "Ana Pérez Lugo", "664 000 1001", "ana@ejemplo.mx"),
  p("b", "Juan Pérez", "6640001002"),
  p("c", "Ana Ruiz", "6640001003", "ANA.RUIZ@ejemplo.mx"),
  p("d", "Mariana Tijuana", "6640001004"),
];

describe("Consulta a persona y asunto (PN-05)", () => {
  it("sugiere el tipo de asunto según lo que quiere la persona", () => {
    expect(operacionSugerida("propietario")).toBe("venta");
    expect(operacionSugerida("comprador")).toBe("venta");
    expect(operacionSugerida("arrendatario")).toBe("renta");
    expect(operacionSugerida("inversionista")).toBe("inversion");
    expect(operacionSugerida(undefined)).toBe("otra");
  });

  it("sugiere el tipo de asunto según lo que pidió en la consulta", () => {
    expect(operacionDeConsulta({ perfil: { operacion: "comprar" } })).toBe("venta");
    expect(operacionDeConsulta({ perfil: { operacion: "arrendar" } })).toBe("renta");
    expect(operacionDeConsulta({ perfil: { operacion: "invertir" } })).toBe("inversion");
    expect(operacionDeConsulta({})).toBe("otra");
  });

  it("normaliza acentos, mayúsculas y espacios", () => {
    expect(normalizar("  José   PÉREZ ")).toBe("jose perez");
  });
});

describe("Unir con su ficha: coincidencias", () => {
  it("pone primero el mismo teléfono (con +52 y espacios), luego correo y al final nombre, sin repetir", () => {
    const c = coincidenciasDeConsulta({ nombre: "Ana Pérez", telefono: "+52 664 000 1001", email: "ana.ruiz@ejemplo.mx" }, PERSONAS);
    expect(c.map((x) => [x.persona.id, x.por])).toEqual([["a", "telefono"], ["c", "correo"]]);
    expect(hayDuplicadoFuerte(c)).toBe(true);
  });

  it("por nombre pide dos palabras al inicio de palabra y no confunde «Ana» con «Tijuana»", () => {
    const c = coincidenciasDeConsulta({ nombre: "ana perez", telefono: "6649999999" }, PERSONAS);
    expect(c.map((x) => x.persona.id)).toEqual(["a"]);
    expect(c[0].por).toBe("nombre");
    expect(hayDuplicadoFuerte(c)).toBe(false);
    expect(coincidenciasDeConsulta({ nombre: "Ana", telefono: "" }, PERSONAS)).toEqual([]);
  });

  it("respeta el límite", () => {
    const muchas = Array.from({ length: 9 }, (_, i) => p(`x${i}`, "Ana Pérez"));
    expect(coincidenciasDeConsulta({ nombre: "Ana Pérez", telefono: "" }, muchas, 3)).toHaveLength(3);
  });
});

describe("Buscar en Personas desde la consulta", () => {
  it("busca dígitos dentro del teléfono", () => {
    expect(buscarPersonas("1002", PERSONAS).map((x) => x.id)).toEqual(["b"]);
  });
  it("busca nombre por inicio de palabra, sin acentos", () => {
    expect(buscarPersonas("perez", PERSONAS).map((x) => x.id)).toEqual(["a", "b"]);
    expect(buscarPersonas("ana", PERSONAS).map((x) => x.id)).toEqual(["a", "c"]);
  });
  it("busca correo y no busca con menos de 3 caracteres", () => {
    expect(buscarPersonas("ana.ruiz@", PERSONAS).map((x) => x.id)).toEqual(["c"]);
    expect(buscarPersonas("an", PERSONAS)).toEqual([]);
  });
});

describe("Deshacer el asunto", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lo manda a eliminados con la versión que devolvió la base", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ expediente: { id: "e1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await quitarAsunto("e1", 3);
    expect(fetch).toHaveBeenCalledWith("/api/admin/expedientes/e1", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ version: 3 }) }));
  });

  it("si el asunto ya cambió (409) lo dice en lenguaje sencillo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 409 })));
    await expect(quitarAsunto("e1", 3)).rejects.toThrow("El asunto ya cambió; quítalo desde Asuntos.");
  });
});
