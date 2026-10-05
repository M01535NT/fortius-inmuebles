import { describe, expect, it } from "vitest";
import { draftWrite, expedienteCreate, expedienteWrite } from "@/lib/formatos/schemas";

describe("entrada de expedientes", () => {
  it("acepta un expediente ligado a cliente y asesor", () => {
    expect(expedienteCreate.parse({ clienteId: "c1", asesorId: "a1", folio: "EXP-1", operacion: "venta" }).clienteId).toBe("c1");
  });
  it("rechaza referencias, operaciones y campos ajenos", () => {
    expect(() => expedienteCreate.parse({ clienteId: "../otro", asesorId: "a1", folio: "EXP-1", operacion: "venta" })).toThrow();
    expect(() => expedienteCreate.parse({ clienteId: "c1", asesorId: "a1", folio: "EXP-1", operacion: "venta", admin: true })).toThrow();
    expect(() => expedienteWrite.parse({ folio: "EXP-2", version: 0 })).toThrow();
  });
  it("exige versión positiva y limita el tamaño de un borrador", () => {
    expect(draftWrite.parse({ version: 1, data: { fecha: "2026-10-04" } }).version).toBe(1);
    expect(() => draftWrite.parse({ version: 1, data: { texto: "x".repeat(260000) } })).toThrow();
  });
  it("acepta partidas estructuradas y rechaza filas excesivas", () => {
    expect(draftWrite.parse({ version: 1, data: { partidas: [{ id: "P-1", cantidad: 2, precioUnitario: 100 }] } }).data.partidas).toHaveLength(1);
    expect(() => draftWrite.parse({ version: 1, data: { pagos: Array.from({ length: 71 }, () => ({ importe: 1 })) } })).toThrow();
  });
});
