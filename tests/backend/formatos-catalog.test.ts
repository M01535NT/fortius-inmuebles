import { describe, expect, it } from "vitest";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";

describe("catálogo de formatos exclusivos", () => {
  it("incluye cada original una sola vez y conserva los siete levantamientos", () => {
    expect(FORMATOS).toHaveLength(25);
    expect(new Set(FORMATOS.map((formato) => formato.id)).size).toBe(25);
    expect(FORMATOS.filter((formato) => /^04[A-G]$/.test(formato.id))).toHaveLength(7);
    expect(FORMATOS.filter((formato) => formato.source.endsWith(".xlsx"))).toHaveLength(4);
  });

  it("bloquea la emisión cuando faltan campos obligatorios", () => {
    expect(validateFormato("18", {})).toContain("Número de recibo");
    expect(validateFormato("18", { numeroRecibo: "R-1" })).toContain("Importe recibido");
  });

  it("mantiene valoración y neto como documentos distintos", () => {
    expect(formatoById("07").title).toMatch(/valor comercial/i);
    expect(formatoById("08").title).toMatch(/neto/i);
    expect(formatoById("08").fields.some((field) => field.key === "precioSugerido07")).toBe(true);
  });

  it("solo marca listo para emitir un formato cotejado con su original", () => {
    expect(FORMATOS.filter((formato) => formato.readyForEmission).map((formato) => formato.id)).toEqual(["18"]);
  });
});
