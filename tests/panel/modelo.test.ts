import { expect, test } from "vitest";

import {
  abreAsunto, folioAsunto, folioFormato, folioInmueble, folioRecibo, numeroDeFolioAsunto, numeroDeFolioInmueble,
  puedeReasignar, puedeVerAsunto, repartoValido, tipoDeAsunto, type MotivoAlta,
} from "@/lib/panel/modelo";

test("RP-108: solo cinco motivos abren un asunto; una consulta, visita, archivo, cambio de precio o reapertura no", () => {
  const abren: MotivoAlta[] = ["encargo_inmueble", "busqueda_real", "tramite_sin_venta", "mandato_inversion", "recomercializacion"];
  const noAbren: MotivoAlta[] = ["consulta", "visita", "archivo", "cambio_de_precio", "reapertura"];
  abren.forEach((m) => expect(abreAsunto(m), m).toBe(true));
  noAbren.forEach((m) => expect(abreAsunto(m), m).toBe(false));
});

test("RP-108: el tipo de asunto sale del motivo; lo que no abre asunto no tiene tipo", () => {
  expect(tipoDeAsunto("encargo_inmueble", "venta")).toBe("venta");
  expect(tipoDeAsunto("encargo_inmueble", "renta")).toBe("renta");
  expect(tipoDeAsunto("recomercializacion", "renta")).toBe("renta");
  expect(tipoDeAsunto("busqueda_real")).toBe("busqueda");
  expect(tipoDeAsunto("tramite_sin_venta")).toBe("tramite");
  expect(tipoDeAsunto("mandato_inversion")).toBe("inversion");
  expect(tipoDeAsunto("consulta")).toBeNull();
  expect(tipoDeAsunto("reapertura")).toBeNull();
});

test("RP-107: folios con ceros a la izquierda, y más dígitos cuando hacen falta", () => {
  expect(folioAsunto(412)).toBe("EXP-000412");
  expect(folioAsunto(1234567)).toBe("EXP-1234567");
  expect(folioInmueble(87)).toBe("FORTIUS-000087");
  expect(() => folioAsunto(0)).toThrow(RangeError);
  expect(() => folioAsunto(1.5)).toThrow(RangeError);
});

test("RP-107: se lee el número de un folio sin importar mayúsculas ni espacios, y lo mal escrito no es folio", () => {
  expect(numeroDeFolioAsunto(" exp-000412 ")).toBe(412);
  expect(numeroDeFolioAsunto("EXP-412")).toBeNull();
  expect(numeroDeFolioAsunto("FORTIUS-000412")).toBeNull();
  expect(numeroDeFolioInmueble("fortius-000087")).toBe(87);
  expect(numeroDeFolioInmueble("EXP-000087")).toBeNull();
});

test("RP-107: el formato emitido cita el folio del asunto, el formato y la versión; el recibo lleva año y consecutivo", () => {
  expect(folioFormato("EXP-000412", "09", 2)).toBe("EXP-000412·09·v2");
  expect(folioFormato("exp-000412", "04B", 1)).toBe("EXP-000412·04B·v1");
  expect(() => folioFormato("412", "09", 1)).toThrow(RangeError);
  expect(() => folioFormato("EXP-000412", "9", 1)).toThrow(RangeError);
  expect(() => folioFormato("EXP-000412", "09", 0)).toThrow(RangeError);
  expect(folioRecibo(2026, 7)).toBe("REC-2026-0007");
  expect(() => folioRecibo(26, 7)).toThrow(RangeError);
});

test("RP-101: el director ve todo; el asesor ve lo que lleva o en lo que es miembro vigente, y nada de lo borrado", () => {
  const director = { esDirector: true, asesorId: null };
  const ana = { esDirector: false, asesorId: "ana" };
  const sinFicha = { esDirector: false, asesorId: null };
  const suyo = { asesorId: "ana", miembros: [] };
  const compartido = { asesorId: "diego", miembros: [{ asesorId: "ana" }] };
  const retirado = { asesorId: "diego", miembros: [{ asesorId: "ana", retirado: true }] };
  const ajeno = { asesorId: "diego", miembros: [] };
  expect(puedeVerAsunto(director, ajeno)).toBe(true);
  expect(puedeVerAsunto(ana, suyo)).toBe(true);
  expect(puedeVerAsunto(ana, compartido)).toBe(true);
  expect(puedeVerAsunto(ana, retirado)).toBe(false);
  expect(puedeVerAsunto(ana, ajeno)).toBe(false);
  expect(puedeVerAsunto(ana, { ...suyo, borrado: true })).toBe(false);
  expect(puedeVerAsunto(sinFicha, suyo)).toBe(false);
  expect(puedeReasignar(director)).toBe(true);
  expect(puedeReasignar(ana)).toBe(false);
});

test("RP-101: el reparto entre miembros de un asunto no pasa de 100%", () => {
  expect(repartoValido([{ porcentaje: 60 }, { porcentaje: 40 }])).toBe(true);
  expect(repartoValido([{ porcentaje: 70 }, { porcentaje: 40 }])).toBe(false);
  expect(repartoValido([{ porcentaje: 70 }, { porcentaje: 40, retirado: true }])).toBe(true);
  expect(repartoValido([{}, { porcentaje: null }])).toBe(true);
});
