import { expect, test } from "vitest";
import { budget, nextStep, stepDate, wants } from "@/lib/admin/contacts-view";
import { daySummary, hourRange, placeEvents, weekTitle } from "@/lib/admin/agenda-view";
import type { Evento } from "@/lib/admin/store";
import type { Task } from "@/lib/tasks";

test("contactos: lo que busca, presupuesto y fecha del siguiente paso en palabras", () => {
  expect(wants({ perfil: { operacion: "comprar" }, tipoPropiedad: "Casa" })).toBe("Comprar casa");
  expect(wants({ tipoPropiedad: "terreno" })).toBe("Terreno");
  expect(wants({}, "Vender")).toBe("Vender");
  expect(wants({})).toBeNull();
  expect(budget({ presupuestoMin: 2500000, presupuestoMax: 3500000, moneda: "MXN" })).toBe("$2,500,000 a $3,500,000 MXN");
  expect(budget({ presupuestoMax: 250000, moneda: "USD" })).toBe("Hasta $250,000 USD");
  expect(budget({ capitalDeclarado: 1000000 })).toBe("$1,000,000 MXN");
  expect(budget({})).toBeNull();
  expect(stepDate("2026-10-14", "2026-10-16")).toEqual({ label: "Vencido · 14 oct", late: true });
  expect(stepDate("2026-10-16", "2026-10-16", "11:00")).toEqual({ label: "Hoy · 11:00", late: false });
  expect(stepDate("2026-10-19", "2026-10-16").label).toBe("Lun · 19 oct");
});

test("contactos: el siguiente paso es lo más próximo entre tareas abiertas, citas y el próximo contacto", () => {
  const task = (id: string, vence: string, estado: Task["estado"] = "pendiente") => ({ id, titulo: `Tarea ${id}`, descripcion: "", categoria: "leads", estado, prioridad: "normal", vence, leadId: "l1", pasos: [] }) as Task;
  const event = { id: "e1", titulo: "Visita", fecha: "2026-10-18", hora: "10:00", tipo: "visita", leadId: "l1" } as Evento;
  const person = { id: "l1", perfil: { proximoContacto: "2026-10-20" } };
  expect(nextStep(person, "lead", [task("a", "2026-10-25"), task("b", "2026-10-17", "completada")], [event], "2026-10-16")).toEqual({ text: "Visita", date: "2026-10-18", time: "10:00" });
  expect(nextStep(person, "lead", [task("c", "2026-10-15")], [event], "2026-10-16")?.text).toBe("Tarea c");
  expect(nextStep(person, "cliente", [], [event], "2026-10-16")?.text).toBe("Darle seguimiento");
  expect(nextStep({ id: "x" }, "lead", [], [], "2026-10-16")).toBeNull();
});

test("agenda: título de la semana, horas visibles, eventos encimados y resumen del día", () => {
  expect(weekTitle(["2026-10-12", "2026-10-18"])).toBe("Semana del 12 al 18 oct 2026");
  expect(weekTitle(["2026-09-28", "2026-10-04"])).toBe("Semana del 28 sep al 4 oct 2026");
  expect(weekTitle(["2026-12-28", "2027-01-03"])).toBe("Semana del 28 dic 2026 al 3 ene 2027");
  expect(hourRange([])).toEqual({ start: 8, end: 19 });
  expect(hourRange([{ hora: "06:30" }, { hora: "23:59" }])).toEqual({ start: 6, end: 24 });
  const ev = (id: string, hora: string, tipo: Evento["tipo"] = "visita") => ({ id, titulo: id, fecha: "2026-10-16", hora, tipo }) as Evento;
  const placed = placeEvents([ev("a", "10:00"), ev("b", "10:30"), ev("c", "12:00"), { ...ev("d", ""), hora: undefined }], 8);
  expect(placed.map(p => [p.event.id, p.lane, p.lanes])).toEqual([["a", 0, 2], ["b", 1, 2], ["c", 0, 1]]);
  expect(placed[0].top).toBe(2 * 56 + 2);
  expect(daySummary([ev("a", "10:00"), ev("b", "11:00"), ev("c", "12:00", "llamada")])).toBe("2 visitas y 1 cita");
  expect(daySummary([])).toBeNull();
});
