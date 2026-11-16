import { describe, expect, it } from "vitest";

import {
  agruparCatalogo, aplicar, buscarEnCatalogo, catalogo, faltantes, filasDocumentos, ordenarAsuntosPara, puedeGenerar, textoDe, valorCapturado,
} from "@/lib/panel/datos/formatos";
import { formatoById } from "@/lib/formatos/catalog";

describe("PN-06 formatos", () => {
  it("el catálogo no trae el 03, junta los levantamientos en el 04 y marca la revisión del abogado", () => {
    const c = catalogo();
    expect(c.some((e) => e.id === "03")).toBe(false);
    expect(c.filter((e) => e.id.startsWith("04"))).toHaveLength(1);
    expect(c.find((e) => e.id === "04")?.tipos).toHaveLength(7);
    expect(c.filter((e) => e.abogado).map((e) => e.id)).toEqual(["20", "21", "24"]);
    expect(agruparCatalogo(c).map((g) => g.grupo)).toEqual(["conocer", "revisar", "vender", "rentar", "cerrar"]);
  });

  it("busca por número o por nombre sin acentos", () => {
    expect(buscarEnCatalogo(catalogo(), "18").map((e) => e.id)).toEqual(["18"]);
    expect(buscarEnCatalogo(catalogo(), "promesa").map((e) => e.id)).toContain("15");
    expect(buscarEnCatalogo(catalogo(), "intermediacion").map((e) => e.id)).toEqual(["09", "21"]);
  });

  it("los asuntos de la operación del formato salen primero", () => {
    const a = [{ id: "r", operacion: "renta", movido: "2026-11-16" }, { id: "v", operacion: "venta", movido: "2026-11-01" }];
    expect(ordenarAsuntosPara("20", a).map((x) => x.id)).toEqual(["r", "v"]);
    expect(ordenarAsuntosPara("13", a).map((x) => x.id)).toEqual(["v", "r"]);
    expect(ordenarAsuntosPara("02", a).map((x) => x.id)).toEqual(["r", "v"]);
  });

  it("borradores y emitidos van del más reciente al más viejo con su asunto", () => {
    const f = filasDocumentos([
      { id: "a", expedienteId: "e1", folio: "EXP-1", formatoId: "04B", version: 1, actualizadoEl: "2026-11-01T10:00:00Z", emitido: false },
      { id: "b", expedienteId: "e2", folio: "EXP-2", formatoId: "13", version: 2, actualizadoEl: "2026-11-15T10:00:00Z", emitido: true },
    ], (id) => (id === "e2" ? "Venta · Casa" : undefined));
    expect(f.map((x) => x.id)).toEqual(["b", "a"]);
    expect(f[0]).toMatchObject({ titulo: "13 · Registro de visita y retroalimentación", linea: "EXP-2 · Venta · Casa", emitido: true });
    expect(f[1].titulo.startsWith("04 · ")).toBe(true);
  });

  it("captura: montos a número, vacío quita el dato y el PDF con pendientes se permite salvo 01 y 15", () => {
    const monto = formatoById("18").fields.find((x) => x.type === "money")!;
    expect(valorCapturado(monto, "3,500.50")).toBe(3500.5);
    expect(textoDe(monto, 3500.5)).toBe("3,500.5");
    expect(aplicar({ a: 1, b: "x" }, { a: undefined, c: "y" })).toEqual({ b: "x", c: "y" });
    expect(faltantes("13", {}, "EXP-1").length).toBeGreaterThan(0);
    expect(puedeGenerar("13", 3)).toBe(true);
    expect(puedeGenerar("15", 3)).toBe(false);
    expect(puedeGenerar("01", 0)).toBe(true);
  });
});
