import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminDashboard from "@/app/admin/page";
import { clearAdminCache } from "@/lib/admin/store";
import { resetTodayData } from "@/components/admin/workspace/use-today-queue";
import { requirementName, greeting, interviewProgress, interviewSummary, longDate, overdueReports, queueFromExpiry, queueFromInterviews, queueFromLeads, queueFromReports, queueFromWaiting, sortQueue, todayTasks, upcomingItems, waitingItems, weekDays, type TodayDossier } from "@/lib/admin/today";
import type { Task } from "@/lib/tasks";

const today = "2026-10-16";
const names = { client: (id?: string) => id === "c1" ? "Familia Navarro" : undefined, property: (slug?: string | null) => slug === "casa" ? "Casa en Playas" : undefined };
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], ...over });
const review = (estado: "pendiente" | "recibido" | "revisado" | "observado", over: Record<string, unknown> = {}) => ({ estado, soporte: "", ...over });
const dossier = (over: Partial<TodayDossier> & { requisitos?: Record<string, unknown> }): TodayDossier => {
  const { requisitos = {}, ...rest } = over;
  return { id: "d1", folio: "EXP-2026-038", etapa: "documentacion", cliente_id: "c1", propiedad_slug: "casa", asesor_id: "a1", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos } as TodayDossier["flujo"], ...rest };
};

afterEach(() => { cleanup(); clearAdminCache(); resetTodayData(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("Esperan algo de ti shows one card per operation with its most urgent reason", () => {
  const items = waitingItems({ today, names, offers: [], followups: [], tasks: [task({ id: "late", expedienteId: "d1", vence: "2026-10-13", titulo: "Pedir el predial" })], dossiers: [
    dossier({ requisitos: { titularidad: review("observado", { soporte: "Falta la firma del copropietario.", registradoEl: "2026-10-13T10:00:00Z" }), valor: review("recibido") } }),
    dossier({ id: "d2", folio: "EXP-2026-041", requisitos: { valor: review("recibido", { registradoEl: `${today}T09:00:00Z` }) } }),
    dossier({ id: "d3", folio: "EXP-2026-050", etapa: "cerrado" }),
  ] });
  expect(items.map(i => i.folio)).toEqual(["EXP-2026-038", "EXP-2026-041"]);
  // C35: el título es el problema y el requisito va en la línea secundaria, sin folio.
  expect(items[0]).toMatchObject({ who: "Familia Navarro", reason: "Falta la firma del copropietario.", when: "Desde el 13 oct", late: true, href: "/admin/operaciones/d1" });
  expect(items[0].detail).toBe("Quién es dueño y quién firma · Casa en Playas · Dictamen jurídico");
  const silent = waitingItems({ today, names, offers: [], followups: [], tasks: [], dossiers: [dossier({ requisitos: { titularidad: review("observado", { soporte: " " }) } })] });
  expect(silent[0].reason).toBe("Hay un problema con «Quién es dueño y quién firma».");
  expect(silent[0].detail).toBe("Casa en Playas · Dictamen jurídico");
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
  expect(items[0].meta).toBe("Familia Navarro");
  expect(items.every(item => !item.meta.includes("EXP-"))).toBe(true);
});

test("overdue owner reports include operations without any report, only while promoting or negotiating", () => {
  const reports = overdueReports({ today, names, reports: { d1: "2026-09-10T12:00:00Z", d3: "2026-10-10T12:00:00Z" }, dossiers: [
    dossier({ etapa: "comercializacion" }), dossier({ id: "d2", folio: "EXP-2", etapa: "negociacion", cliente_id: undefined }),
    dossier({ id: "d3", folio: "EXP-3", etapa: "comercializacion" }), dossier({ id: "d4", folio: "EXP-4", etapa: "documentacion" }),
  ] });
  expect(reports.map(r => [r.who, r.status])).toEqual([["Familia Navarro", "Vencido desde el 10 oct"], ["EXP-2", "Sin informe preparado"]]);
  // Con una entrega registrada después, el informe ya no está vencido (COR-08).
  const entregado = overdueReports({ today, names, reports: { d1: "2026-09-10T12:00:00Z" }, dossiers: [
    dossier({ etapa: "comercializacion", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, entregasInforme: [{ fecha: "2026-10-01", canal: "en_persona", responsable: "Ana" }] } as TodayDossier["flujo"] }),
  ] });
  expect(entregado).toEqual([]);
});

test("the overdue task behind a waiting card is named so «Tareas de hoy» does not repeat it (C10)", () => {
  const items = waitingItems({ today, names, offers: [], followups: [], tasks: [task({ id: "late", expedienteId: "d1", vence: "2026-10-13", titulo: "Pedir el predial" })], dossiers: [dossier({})] });
  expect(items[0].taskId).toBe("late");
});

test("SIM-16: the single queue puts what is late first, then by kind, and names each pending once", () => {
  const waiting = waitingItems({ today, names, offers: [], followups: [{ id: "f1", kind: "lead", personId: "l1", personName: "Rosa Prospecto", fecha: today, href: "/admin/leads/l1" }], tasks: [task({ id: "late", expedienteId: "d1", vence: "2026-10-13", titulo: "Pedir el predial" })], dossiers: [
    dossier({}), dossier({ id: "d2", folio: "EXP-2026-041", requisitos: { valor: review("recibido", { registradoEl: `${today}T09:00:00Z` }) } }),
  ] });
  const queue = sortQueue([
    ...queueFromWaiting(waiting),
    ...queueFromLeads([{ id: "w1", who: "Llegó del sitio", detail: "Dejó sus datos", since: "Lleva 3 h sin respuesta", late: true, href: "/admin/leads/w1", forDirector: true }, { id: "w2", who: "Recién llegado", detail: "Dejó sus datos", since: "Llegó hace 5 min", late: false, href: "/admin/leads/w2", forDirector: true }]),
    ...queueFromInterviews([{ id: "e1", intencion: "vender", respuestas: {}, estado: "borrador", version: 1, contacto: { nombre: "Héctor Gaxiola" }, updated_at: "2026-10-15T10:00:00Z" } as never]),
    ...queueFromExpiry([{ id: "contrato:d2", date: "2026-10-20", kind: "Contrato", text: "El contrato de servicio vence en 4 días.", meta: "Familia Navarro · Exclusiva", late: false, href: "/admin/operaciones/d2" }]),
    ...queueFromReports(overdueReports({ today, names, reports: { d2: "2026-09-01T12:00:00Z" }, dossiers: [dossier({ id: "d2", folio: "EXP-2026-041", etapa: "comercializacion" })] })),
  ]);
  expect(queue.map(item => [item.kind, item.who, item.late])).toEqual([
    ["vencida", "Familia Navarro", true], ["nuevo", "Llegó del sitio", true], ["informe", "Familia Navarro", true],
    ["nuevo", "Recién llegado", false], ["contrato", "Familia Navarro · Exclusiva", false], ["revisar", "Familia Navarro", false], ["entrevista", "Héctor Gaxiola", false], ["seguimiento", "Rosa Prospecto", false],
  ]);
  expect(queue[0]).toMatchObject({ text: "Pedir el predial", taskId: "late", when: "Vencida desde el 13 oct" });
  expect(new Set(queue.map(item => item.id)).size).toBe(queue.length);
  expect(weekDays(today)).toEqual(["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"]);
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

test("COR-03: Hoy names the stage with the operation's documents instead of calling it «Prospecto»", async () => {
  const started = dossier({ etapa: "captacion", propiedad_slug: null, cliente_id: undefined, requisitos: {} });
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.includes("/api/admin/expedientes")) return Response.json({ expedientes: [started] });
    if (url.includes("/api/admin/documentos")) return Response.json({ documentos: [{ id: "doc", expedienteId: "d1", folio: started.folio, formatoId: "02", version: 1, actualizadoEl: today, emitido: true }], total: 1, nextOffset: null });
    return Response.json({ records: [], expedientes: [], entrevistas: [], runs: [], ultimos: {} });
  });
  render(<AdminDashboard />);
  const card = await within(await screen.findByRole("region", { name: "Lo siguiente" })).findByRole("link", { name: new RegExp(started.folio) });
  await waitFor(() => expect(card.textContent).toContain("Entrevista inicial"));
  expect(card.textContent).not.toContain("Prospecto");
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
  const region = within(await screen.findByRole("list", { name: "Tareas de hoy" }));
  fireEvent.click(await region.findByRole("checkbox", { name: "Marcar como hecha: Confirmar la visita" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ id: "t1", estado: "completada" });
  expect(await screen.findByText("Guardado")).toBeTruthy();
});

test("C40: a client with an active operation is not listed again for the profile follow-up", () => {
  const followup = { id: "f1", kind: "cliente" as const, personId: "c1", personName: "Familia Navarro", fecha: "2026-10-10", href: "/admin/clientes/c1" };
  const scheduled = [task({ expedienteId: "d1", vence: "2026-10-20" })];
  expect(waitingItems({ today, names, offers: [], tasks: scheduled, followups: [followup], dossiers: [dossier({})] })).toEqual([]);
  expect(waitingItems({ today, names, offers: [], tasks: [], followups: [followup], dossiers: [] }).map(i => i.reason)).toEqual(["Darle seguimiento"]);
});

test("COR-21: los prospectos del sitio sin atender le tocan a su asesor, al del inmueble o al director", async () => {
  const { unattendedLeads } = await import("@/lib/admin/today");
  const now = new Date("2026-11-02T18:00:00Z");
  const base = { estado: "nuevo", origen: "contacto", notas: [] };
  const leads = [
    { ...base, id: "w1", nombre: "Llegó por la nave", creadoEl: "2026-11-02T15:30:00Z", propiedadSlug: "nave" },
    { ...base, id: "w2", nombre: "Sin inmueble", creadoEl: "2026-11-02T17:40:00Z", mensaje: "Quiero vender mi casa" },
    { ...base, id: "w3", nombre: "Ya contactado", creadoEl: "2026-11-01T10:00:00Z", firstContactedAt: "2026-11-01T11:00:00Z" },
    { ...base, id: "w4", nombre: "Capturado a mano", origen: "manual", creadoEl: "2026-11-01T10:00:00Z" },
    { ...base, id: "w5", nombre: "Ya en seguimiento", estado: "contactado", creadoEl: "2026-11-01T10:00:00Z" },
  ];
  const properties = [{ slug: "nave", titulo: "Nave en Otay", asesorId: "a2" }];
  const director = unattendedLeads({ leads, properties, me: "a1", admin: true, now, adviserName: id => id === "a2" ? "Rubén" : undefined });
  expect(director.map(i => [i.id, i.since, i.late])).toEqual([["w1", "Lleva 2 h sin respuesta", true], ["w2", "Llegó hace 20 min", false]]);
  expect(director[0].detail).toBe("Le interesa Nave en Otay · le toca a Rubén");
  expect(director[1].detail).toBe("«Quiero vender mi casa» · sin asesor: te toca a ti");
  // El asesor del inmueble ve el suyo; otro asesor no ve nada.
  expect(unattendedLeads({ leads, properties, me: "a2", admin: false, now }).map(i => i.id)).toEqual(["w1"]);
  expect(unattendedLeads({ leads, properties, me: "a3", admin: false, now })).toEqual([]);
});

test("COR-05: la cola de Hoy usa el mismo motivo y orden que Operaciones (RP-84)", () => {
  const base = { today, names, followups: [], offers: [] };
  // Vence hoy: antes no aparecía en Hoy, aunque Operaciones sí lo marcaba.
  const due = waitingItems({ ...base, tasks: [task({ id: "hoy", expedienteId: "d1", vence: today, titulo: "Confirmar la cita" })], dossiers: [dossier({ etapa: "captacion" })] });
  expect(due[0]).toMatchObject({ kind: "hoy", reason: "Vence hoy: Confirmar la cita", when: "Hoy", taskId: "hoy" });
  expect(queueFromWaiting(due)[0]).toMatchObject({ kind: "hoy" });
  // Una etapa anterior sin su documento cuenta como en Operaciones cuando se conocen los formatos.
  const gap = waitingItems({ ...base, tasks: [task({ expedienteId: "d1", vence: "2026-10-20" })], formats: new Map([["d1", new Map([["02", true]])]]), dossiers: [dossier({ inicial: { iniciada: true, emitida: true } })] });
  expect(gap[0]).toMatchObject({ kind: "falta" });
  expect(gap[0].reason).toMatch(/^Falta .* de una etapa anterior\.$/);
  // El orden de las tarjetas sigue RP-84: problema, vencida, falta, revisar, vence hoy, oferta, agendar.
  const ranks = sortQueue(queueFromWaiting(waitingItems({ ...base, offers: [{ id: "o", updatedAt: "2026-10-15T20:00:00Z", context: { expedienteId: "d5" } }], tasks: [
    task({ id: "a", expedienteId: "d2", vence: "2026-10-10" }), task({ id: "b", expedienteId: "d4", vence: today }), task({ id: "c", expedienteId: "d5", vence: "2026-10-20" }), task({ id: "d", expedienteId: "d3", vence: "2026-10-20" }),
  ], dossiers: [
    dossier({ id: "d6", folio: "EXP-6", etapa: "captacion" }),
    dossier({ id: "d5", folio: "EXP-5", etapa: "captacion" }),
    dossier({ id: "d4", folio: "EXP-4", etapa: "captacion" }),
    dossier({ id: "d3", folio: "EXP-3", requisitos: { valor: review("recibido") } }),
    dossier({ id: "d2", folio: "EXP-2", etapa: "captacion" }),
    dossier({ id: "d1", folio: "EXP-1", requisitos: { titularidad: review("observado") } }),
  ] }))).map(item => item.kind);
  expect(ranks).toEqual(["problema", "vencida", "revisar", "hoy", "decidir", "agendar"]);
});

test("COR-07 (RP-86, DEC-27): los nombres sencillos no prometen más que el requisito", () => {
  expect(requirementName("firma")).toBe("Firma acreditada");
  expect(requirementName("pago")).toBe("Pagos para entregar cumplidos según contrato");
  expect(requirementName("privacidad")).toBe("Aviso y controles de privacidad revisados");
  expect(requirementName("firma", "arrendador")).toBe("Contrato de arrendamiento firmado");
  expect(requirementName("pago", "arrendador")).toBe("Depósito y primera renta recibidos");
  for (const key of ["firma", "pago", "privacidad"] as const) expect(requirementName(key)).not.toMatch(/notario|completo|firmado/i);
});
