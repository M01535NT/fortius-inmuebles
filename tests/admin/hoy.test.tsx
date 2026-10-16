import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminDashboard from "@/app/admin/page";
import { clearAdminCache } from "@/lib/admin/store";
import { greeting, interviewProgress, interviewSummary, longDate, overdueReports, todayTasks, upcomingItems, waitingItems, type TodayDossier } from "@/lib/admin/today";
import type { Task } from "@/lib/tasks";

const today = "2026-10-16";
const names = { client: (id?: string) => id === "c1" ? "Familia Navarro" : undefined, property: (slug?: string | null) => slug === "casa" ? "Casa en Playas" : undefined };
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], ...over });
const review = (estado: "pendiente" | "recibido" | "revisado" | "observado", over: Record<string, unknown> = {}) => ({ estado, soporte: "", ...over });
const dossier = (over: Partial<TodayDossier> & { requisitos?: Record<string, unknown> }): TodayDossier => {
  const { requisitos = {}, ...rest } = over;
  return { id: "d1", folio: "EXP-2026-038", etapa: "documentacion", cliente_id: "c1", propiedad_slug: "casa", asesor_id: "a1", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos } as TodayDossier["flujo"], ...rest };
};

afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("Esperan algo de ti shows one card per operation with its most urgent reason", () => {
  const items = waitingItems({ today, names, offers: [], followups: [], tasks: [task({ id: "late", expedienteId: "d1", vence: "2026-10-13", titulo: "Pedir el predial" })], dossiers: [
    dossier({ requisitos: { titularidad: review("observado", { soporte: "Falta la firma del copropietario.", registradoEl: "2026-10-13T10:00:00Z" }), valor: review("recibido") } }),
    dossier({ id: "d2", folio: "EXP-2026-041", requisitos: { valor: review("recibido", { registradoEl: `${today}T09:00:00Z` }) } }),
    dossier({ id: "d3", folio: "EXP-2026-050", etapa: "cerrado" }),
  ] });
  expect(items.map(i => i.folio)).toEqual(["EXP-2026-038", "EXP-2026-041"]);
  expect(items[0]).toMatchObject({ who: "Familia Navarro", reason: "Hay un problema con «Quién es dueño y quién firma»: Falta la firma del copropietario.", when: "Desde el 13 oct", late: true, href: "/admin/operaciones?expediente=d1" });
  expect(items[0].detail).toBe("Casa en Playas · Verificación y precio");
  expect(items[1]).toMatchObject({ reason: "Ya tienes «Opinión de valor». Revísalo.", when: "Hoy", late: false });
});

test("an overdue task, a new offer and a missing next step each make an operation wait", () => {
  const base = { today, names, followups: [] };
  expect(waitingItems({ ...base, offers: [], tasks: [task({ expedienteId: "d1", vence: "2026-10-14", titulo: "Llamar al notario" })], dossiers: [dossier({})] })[0])
    .toMatchObject({ reason: "Tarea vencida: Llamar al notario", when: "Vencida desde el 14 oct", late: true });
  const scheduled = [task({ expedienteId: "d1", vence: "2026-10-20" })];
  expect(waitingItems({ ...base, tasks: scheduled, offers: [{ id: "o", updatedAt: "2026-10-15T20:00:00Z", context: { expedienteId: "d1" } }], dossiers: [dossier({})] })[0])
    .toMatchObject({ reason: "Se registró una oferta. Revísala con el propietario.", when: "El 15 oct" });
  expect(waitingItems({ ...base, tasks: scheduled, offers: [{ id: "o", updatedAt: "2026-10-01T20:00:00Z", context: { expedienteId: "d1" } }], dossiers: [dossier({})] })).toEqual([]);
  expect(waitingItems({ ...base, tasks: [], offers: null, dossiers: [dossier({})] })[0].reason).toBe("No tiene una próxima tarea con fecha. Agenda el siguiente paso.");
  expect(waitingItems({ ...base, tasks: [], offers: null, dossiers: [dossier({ flujo: { version: 1, ruta: "captacion", estado: "pausada", motivo: "", requisitos: {} } })] })).toEqual([]);
});

test("Próximos 7 días lists tasks, expiring reviewed documents and monthly reports within the week only", () => {
  const items = upcomingItems({ today, names, reports: { d1: "2026-09-20T12:00:00Z", d2: "2026-10-01T12:00:00Z" }, tasks: [
    task({ id: "soon", titulo: "Llevar comparables", vence: "2026-10-19", expedienteId: "d1" }),
    task({ id: "far", titulo: "Muy lejos", vence: "2026-10-24" }),
    task({ id: "done", titulo: "Hecha", vence: "2026-10-18", estado: "completada" }),
  ], dossiers: [
    dossier({ etapa: "comercializacion", requisitos: { factibilidad: review("revisado", { vigenteHasta: "2026-10-20" }), revision_cierre: review("revisado", { vigenteHasta: "2026-11-30" }) } }),
    dossier({ id: "d2", folio: "EXP-2", etapa: "comercializacion" }),
  ] });
  expect(items.map(i => [i.date, i.kind, i.text])).toEqual([
    ["2026-10-19", "Tarea", "Llevar comparables"],
    ["2026-10-20", "Informe", "Informe mensual al propietario"],
    ["2026-10-20", "Vence", "Que se pueda vender sin obstáculos"],
  ]);
  expect(items[0].meta).toBe("EXP-2026-038 · Familia Navarro");
});

test("overdue owner reports include operations without any report, only while promoting or negotiating", () => {
  const reports = overdueReports({ today, names, reports: { d1: "2026-09-10T12:00:00Z", d3: "2026-10-10T12:00:00Z" }, dossiers: [
    dossier({ etapa: "comercializacion" }), dossier({ id: "d2", folio: "EXP-2", etapa: "negociacion", cliente_id: undefined }),
    dossier({ id: "d3", folio: "EXP-3", etapa: "comercializacion" }), dossier({ id: "d4", folio: "EXP-4", etapa: "documentacion" }),
  ] });
  expect(reports.map(r => [r.who, r.status])).toEqual([["Familia Navarro", "Vencido desde el 10 oct"], ["EXP-2", "Sin informe preparado"]]);
});

test("today's tasks keep the ones finished today, below the open ones", () => {
  const list = todayTasks([
    task({ id: "done", titulo: "Hecha hoy", vence: today, estado: "completada", completadoEl: `${today}T15:00:00Z` }),
    task({ id: "old", titulo: "Hecha ayer", vence: "2026-10-15", estado: "completada", completadoEl: "2026-10-15T15:00:00Z" }),
    task({ id: "open", titulo: "Abierta", vence: "2026-10-15" }),
    task({ id: "none", titulo: "Sin fecha" }),
  ], today);
  expect(list.map(t => t.id)).toEqual(["open", "done"]);
});

test("interviews report the sections still missing, dates and greetings read naturally", () => {
  expect(interviewProgress({ intencion: "vender", respuestas: {} }).missing).toBe(interviewProgress({ intencion: "vender", respuestas: {} }).total);
  expect(interviewSummary({ intencion: "vender", respuestas: {} })).toMatch(/^Quiere vender · Faltan \d+ de \d+ secciones$/);
  expect(longDate(today)).toBe("Viernes 16 oct 2026");
  expect([greeting(8), greeting(13), greeting(21)]).toEqual(["Buenos días", "Buenas tardes", "Buenas noches"]);
});

test("a task is marked done from Hoy and the change is saved", async () => {
  const writes: Array<Record<string, unknown>> = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${today}T18:00:00Z`));
  const due = task({ id: "t1", titulo: "Confirmar la visita", vence: today });
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") { const body = JSON.parse(String(init.body)); writes.push(body.data); return Response.json({ record: { id: "t1", data: body.data, version: 2 } }); }
    return Response.json({ records: url.endsWith("/tareas") ? [{ id: "t1", data: due, version: 1 }] : [] });
  });
  render(<AdminDashboard />);
  const region = within(await screen.findByRole("region", { name: "Tareas de hoy" }));
  fireEvent.click(await region.findByRole("checkbox", { name: "Marcar como hecha: Confirmar la visita" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ id: "t1", estado: "completada" });
  expect(await region.findByText("Guardado")).toBeTruthy();
});
