import { expect, test } from "vitest";

import type { Evento } from "@/lib/domain/records";
import { bloquesDelDia, conFecha, conHora, correrFecha, horasParaMover, marcasDeHora, moverPasos, pasosDesdePixeles, rangoDelDia } from "@/lib/panel/datos/agenda-dia";

const cita = (id: string, hora: string | undefined, tipo: Evento["tipo"] = "visita"): Evento => ({ id, titulo: id, fecha: "2026-11-16", tipo, ...(hora ? { hora } : {}) });

test("PN-04 día: arranca una hora antes de la primera cita y llega al menos a las 20:00", () => {
  expect(rangoDelDia([])).toEqual({ inicio: 7 * 60, fin: 20 * 60 });
  expect(rangoDelDia([cita("a", "10:15"), cita("b", undefined)])).toEqual({ inicio: 9 * 60, fin: 20 * 60 });
  expect(rangoDelDia([cita("a", "00:30")]).inicio).toBe(0);
  expect(rangoDelDia([cita("a", "20:00")]).fin).toBe(21 * 60);
  expect(marcasDeHora(9 * 60 + 30, 12 * 60)).toEqual([600, 660, 720]);
});

test("PN-04 día: las citas que se cruzan van lado a lado", () => {
  const b = bloquesDelDia([cita("a", "10:00"), cita("b", "10:30"), cita("c", "11:00", "llamada"), cita("d", "13:00"), cita("e", undefined)]);
  const de = (id: string) => b.find((x) => x.id === id)!;
  expect(b.map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  expect([de("a").carril, de("b").carril, de("c").carril]).toEqual([0, 1, 0]);
  expect(de("a").carriles).toBe(2);
  expect(de("c").carriles).toBe(2);
  expect(de("d")).toMatchObject({ carril: 0, carriles: 1, ini: 780, fin: 840 });
});

test("PN-04 día: mover de 30 en 30 sin salir de 7:00 a 20:00", () => {
  expect(moverPasos(10 * 60, 1)).toBe(630);
  expect(moverPasos(10 * 60 + 15, -1)).toBe(570);
  expect(moverPasos(7 * 60, -2)).toBe(420);
  expect(moverPasos(19 * 60 + 30, 3)).toBe(1200);
  expect(pasosDesdePixeles(50)).toBe(1);
  expect(pasosDesdePixeles(-20)).toBe(0);
  expect(pasosDesdePixeles(-100)).toBe(-2);
  expect(conHora(cita("a", "10:00"), 630)).toEqual({ ...cita("a", "10:00"), hora: "10:30" });
  const horas = horasParaMover();
  expect(horas[0]).toEqual({ valor: "07:00", etiqueta: "7:00" });
  expect(horas.at(-1)).toEqual({ valor: "20:00", etiqueta: "20:00" });
  expect(horas).toHaveLength(27);
});

test("PN-04 agenda: mover una cita a otro día conserva la hora y no va al pasado", () => {
  expect(correrFecha("2026-11-30", 1)).toBe("2026-12-01");
  expect(correrFecha("2026-11-16", -1)).toBe("2026-11-15");
  const c = { ...cita("a", "10:00"), fecha: "2026-11-16" };
  expect(conFecha(c, "2026-11-18", "2026-11-16")).toEqual({ ...c, fecha: "2026-11-18" });
  expect(conFecha(c, "2026-11-15", "2026-11-16")).toBeNull();
  expect(conFecha(c, "2026-11-16", "2026-11-16")).toBeNull();
});
