import { describe, expect, it } from "vitest";

import { opcionesCrearDocumento, tiposLevantamiento } from "@/lib/panel/datos/formatos";

describe("Crear documento desde el asunto", () => {
  it("pone primero los formatos del tipo de asunto y trae el levantamiento una sola vez", () => {
    const venta = opcionesCrearDocumento("venta");
    const renta = opcionesCrearDocumento("renta");
    expect(venta.length).toBe(renta.length);
    expect(venta[0]?.valor).not.toBe(renta[0]?.valor);
    expect(venta.filter((o) => o.valor === "04")).toHaveLength(1);
    expect(venta.some((o) => o.valor === "03")).toBe(false);
    expect(new Set(venta.map((o) => o.valor)).size).toBe(venta.length);
    expect(tiposLevantamiento().length).toBeGreaterThan(1);
  });
});
