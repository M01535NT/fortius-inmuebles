import { describe, expect, it } from "vitest";
import { parseLead, parseRecord } from "@/lib/backend/validation";

const oldLead = {
  id: "lead-fixture", nombre: "Persona de prueba", telefono: "6640000000",
  origen: "manual", estado: "nuevo", creadoEl: "2026-09-22", notas: [],
  zona: "Centro", tipoPropiedad: "casa", mensaje: "Solicitud inicial",
  campoFuturo: { conservar: true },
};
const save = (perfil: unknown) => parseRecord("leads", oldLead.id, { ...oldLead, perfil });

describe("private lead qualification profile", () => {
  it("preserves existing leads and unknown root fields without assuming a profile", () => {
    expect(parseRecord("leads", oldLead.id, oldLead)).toEqual(oldLead);
    expect(save({}).perfil).toEqual({});
  });

  it("accepts a complete profile and preserves future nested fields", () => {
    const perfil = {
      operacion: "comprar", uso: "residencial", presupuestoMin: 1000000,
      presupuestoMax: 3000000, moneda: "MXN", superficieMin: 100, superficieMax: 300,
      recamaras: 3, estacionamientos: 2, requisitos: "Patio y acceso sin escalones",
      formaPago: "credito", tipoCredito: "bancario", estadoCredito: "preautorizado",
      origenIngresos: "ambos", plazo: "Seis meses", proximoContacto: "2028-02-29",
      campoFuturo: { conservar: true },
    };
    expect(save(perfil)).toEqual({ ...oldLead, perfil });
  });

  it.each([
    { presupuestoMin: -1, moneda: "MXN" }, { presupuestoMax: 1e13 + 1, moneda: "USD" },
    { presupuestoMin: Infinity, moneda: "MXN" }, { presupuestoMax: NaN, moneda: "USD" },
    { presupuestoMin: 3, presupuestoMax: 2, moneda: "MXN" },
    { presupuestoMin: 0 }, { presupuestoMax: 1 }, { moneda: "EUR" },
    { superficieMin: -1 }, { superficieMax: 1e9 + 1 }, { superficieMin: Infinity },
    { superficieMin: 200, superficieMax: 100 },
    { recamaras: -1 }, { recamaras: 1.5 }, { recamaras: 1001 },
    { estacionamientos: -1 }, { estacionamientos: 1.5 }, { estacionamientos: 1001 },
    { operacion: "venta" }, { uso: "casa" }, { formaPago: "efectivo" },
    { tipoCredito: "desconocido" }, { estadoCredito: "pendiente" }, { origenIngresos: "usa" },
    { proximoContacto: "2026-02-29" }, { proximoContacto: "2026-04-31" },
    { proximoContacto: "2026-9-22" }, { proximoContacto: "2026-09-22T00:00:00Z" },
    { proximoContacto: "2026-13-01" }, { proximoContacto: "" },
    { requisitos: "x".repeat(20001) }, { plazo: "x".repeat(501) },
    { presupuestoMin: "100", moneda: "MXN" }, null, [],
  ])("rejects an invalid profile %#", (perfil) => {
    expect(() => save(perfil)).toThrow();
  });

  it("accepts zero and equal bounds without replacing absent answers", () => {
    const perfil = { presupuestoMin: 0, presupuestoMax: 0, moneda: "USD", superficieMin: 0, superficieMax: 0, recamaras: 0, estacionamientos: 0 };
    expect(save(perfil).perfil).toEqual(perfil);
    expect(save({ presupuestoMax: 1e13, moneda: "MXN", superficieMax: 1e9, recamaras: 1000, estacionamientos: 1000 }).perfil).toMatchObject({ presupuestoMax: 1e13 });
  });

  it("rejects private profile injection through the public contact API", () => {
    const contact = { nombre: "Persona de prueba", telefono: "6640000000", origen: "contacto" };
    expect(parseLead(contact)).toEqual(contact);
    expect(() => parseLead({ ...contact, perfil: { origenIngresos: "mexico" } })).toThrow();
  });
});
