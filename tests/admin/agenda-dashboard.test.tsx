import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import AdminDashboard from "@/app/admin/page";
import { AgendaCalendar as CalendarioPage } from "@/components/admin/agenda/calendar";
import { clearAdminCache, type Evento } from "@/lib/admin/store";
import type { Task } from "@/lib/tasks";

let events: Evento[] = [];
let tasks: Task[] = [];

beforeEach(() => {
  clearAdminCache();
  events = [];
  tasks = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-23T05:24:00Z"));
  vi.stubGlobal("fetch", async (url: string) => Response.json({
    records: (url.endsWith("/eventos") ? events : url.endsWith("/tareas") ? tasks : []).map((event) => ({
      id: event.id,
      data: event,
      version: 1,
      createdAt: "2026-09-20T12:00:00Z",
      updatedAt: "2026-09-20T12:00:00Z",
    })),
  }));
});

test("Hoy lists today's and overdue open tasks by Tijuana date and links to each one", async () => {
  tasks = [
    {id:"late",titulo:"Revisar expediente",descripcion:"",categoria:"documentacion",estado:"pendiente",prioridad:"alta",vence:"2026-09-21",pasos:[]},
    {id:"today",titulo:"Confirmar documentos",descripcion:"",categoria:"cierre",estado:"pendiente",prioridad:"normal",vence:"2026-09-22",pasos:[]},
    {id:"done",titulo:"Tarea terminada",descripcion:"",categoria:"cierre",estado:"completada",prioridad:"normal",vence:"2026-09-21",pasos:[]},
    {id:"later",titulo:"Tarea de mañana",descripcion:"",categoria:"cierre",estado:"pendiente",prioridad:"normal",vence:"2026-09-23",pasos:[]},
  ];
  render(<AdminDashboard />);
  const today = within(screen.getByRole("region", {name:"Tareas de hoy"}));
  await today.findByRole("link", {name:/Revisar expediente/});
  expect(today.getByRole("link", {name:/Revisar expediente/}).getAttribute("href")).toBe("/admin/tareas/late");
  expect(today.getByText("Vencida desde el 21 sep")).toBeTruthy();
  expect(today.getByRole("link", {name:/Confirmar documentos/})).toBeTruthy();
  expect(today.queryByText("Tarea terminada")).toBeNull();
  expect(today.queryByText("Tarea de mañana")).toBeNull();
  expect(within(screen.getByRole("region", {name:"Próximos 7 días"})).getByText("Tarea de mañana")).toBeTruthy();
});

test("calendar projects an open task deadline without creating an event", async () => {
  tasks = [{id:"due",titulo:"Enviar propuesta",descripcion:"",categoria:"negociacion",estado:"en-curso",prioridad:"alta",vence:"2026-09-22",pasos:[]}];
  render(<CalendarioPage />);
  const links = await screen.findAllByRole("link", {name:/Enviar propuesta/});
  expect(new Set(links.map(link => link.getAttribute("href")))).toEqual(new Set(["/admin/tareas/due"]));
  expect(screen.getByRole("button", {name:"22 de septiembre de 2026, 1 tareas"})).toBeTruthy();
  expect(screen.getByText("Sin citas este día")).toBeTruthy();
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  clearAdminCache();
});

function eightEvents(fecha: string): Evento[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `event-${i + 1}`,
    titulo: `Visita ${i + 1}`,
    fecha,
    hora: `23:${String(52 + i).padStart(2, "0")}`,
    tipo: "visita",
  }));
}

test("Hoy keeps this evening's eight Tijuana events when UTC is already tomorrow", async () => {
  events = eightEvents("2026-09-22");
  render(<AdminDashboard />);

  const agenda = within(screen.getByRole("region", {name:"Agenda de hoy"}));
  await agenda.findByText("Visita 1");
  expect(agenda.getByText("Visita 8")).toBeTruthy();
  expect(agenda.getAllByText("Visita", {exact:true})).toHaveLength(8);
  expect(screen.getByText(/8 visitas hoy/)).toBeTruthy();
});

test("Hoy's agenda shows only the operating day, not later or past days", async () => {
  events = [
    ...eightEvents("2026-09-24").reverse(),
    { id: "past", titulo: "Visita de ayer", fecha: "2026-09-21", hora: "23:59", tipo: "visita" },
  ];
  render(<AdminDashboard />);

  const agenda = within(screen.getByRole("region", {name:"Agenda de hoy"}));
  await agenda.findByText("Sin citas hoy");
  // Sin citas hoy, la agenda anuncia la siguiente con su día; no la presenta como de hoy ni muestra las pasadas.
  expect(agenda.queryAllByRole("listitem")).toHaveLength(0);
  expect(agenda.getByText(/La siguiente: Jue 24 · 23:52 · Visita/)).toBeTruthy();
  expect(agenda.getByText("Visita 1")).toBeTruthy();
  expect(screen.queryByText("Visita 8")).toBeNull();
  expect(screen.queryByText("Visita de ayer")).toBeNull();
});

test("Hoy's agenda includes earlier and untimed events from the operating day, untimed last", async () => {
  events = [
    { id: "untimed", titulo: "Pendiente sin hora", fecha: "2026-09-22", tipo: "otro" },
    { id: "morning", titulo: "Reunión matutina", fecha: "2026-09-22", hora: "08:00", tipo: "reunion" },
  ];
  render(<AdminDashboard />);

  const agenda = within(screen.getByRole("region", {name:"Agenda de hoy"}));
  await agenda.findByText("Pendiente sin hora");
  expect(agenda.getAllByRole("listitem").map(item => item.textContent)).toEqual([expect.stringContaining("Reunión matutina"), expect.stringContaining("Pendiente sin hora")]);
  expect(screen.getByText(/0 visitas hoy/)).toBeTruthy();
});

test("calendar opens the operating day and week even when UTC has crossed the year", async () => {
  vi.setSystemTime(new Date("2027-01-01T07:30:00Z"));
  events = [{ id: "year-end", titulo: "Firma de cierre", fecha: "2026-12-31", hora: "23:59", tipo: "firma" }];
  render(<CalendarioPage />);

  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-12-31");
  expect(screen.getByRole("heading", { name: "Jueves 31 de diciembre" })).toBeTruthy();
  expect((await screen.findAllByText("Firma de cierre")).length).toBeGreaterThan(0);
});

test("calendar lets staff select a day across the year and keeps the form date in sync", async () => {
  vi.setSystemTime(new Date("2026-12-31T20:00:00Z"));
  render(<CalendarioPage />);

  fireEvent.click(screen.getByRole("button", { name: "1 de enero de 2027" }));
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-01");
  fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
  expect(screen.getByRole("button", { name: "4 de enero de 2027" })).toBeTruthy();
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-08");
  fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
  expect(screen.getByRole("button", { name: "28 de diciembre de 2026" })).toBeTruthy();
});

test("Hoy shows one overdue followup for a converted client and points to the client", async () => {
  vi.stubGlobal("fetch", async (url: string) => {
    const records = url.endsWith("/leads") ? [{ id: "lead1", data: { id: "lead1", nombre: "Prospecto", telefono: "6641234567", origen: "manual", estado: "activo", clienteId: "client1", asesorId: "a1", creadoEl: "2026-09-01", notas: [], perfil: { proximoContacto: "2026-09-20" } } }]
      : url.endsWith("/clientes") ? [{ id: "client1", data: { id: "client1", nombre: "Cliente convertido", telefono: "6641234567", tipo: "comprador", asesorId: "a1", leadId: "lead1", notas: "", creadoEl: "2026-09-01", actualizadoEl: "2026-09-01", perfil: { proximoContacto: "2026-09-21" } } }]
      : url.endsWith("/asesores") ? [{ id: "a1", data: { id: "a1", nombre: "Asesora Ana", cargo: "", iniciales: "AA", activo: true } }] : [];
    return Response.json({ records: records.map(item => ({ ...item, version: 1 })) });
  });
  render(<AdminDashboard />);
  const waiting = within(screen.getByRole("region", {name:/Esperan algo de ti/}));
  expect(await waiting.findByRole("link", { name: "Continuar con Cliente convertido" })).toHaveProperty("href", "http://localhost:3000/admin/clientes/client1");
  expect(waiting.getByText("Desde el 21 sep")).toBeTruthy();
  expect(waiting.queryByText("Prospecto", {exact:true})).toBeNull();
  expect(waiting.getAllByRole("article")).toHaveLength(1);
});

test("calendar saves a linked event with client, property, expediente and adviser", async () => {
  let saved: Record<string, unknown> | null = null;
  const expedienteId = "51000000-0000-4000-8000-000000000010";
  window.history.replaceState(null, "", `/admin/agenda?expediente=${expedienteId}`);
  vi.stubGlobal("fetch", async (url: string, options?: RequestInit) => {
    if (options?.method === "PUT") {
      saved = JSON.parse(String(options.body)).data;
      return Response.json({ record: { id: saved!.id, data: saved, version: 1 } });
    }
    if (url.endsWith("/expedientes")) return Response.json({ expedientes: [{ id: expedienteId, folio: "EXP-1", cliente_id: "c1", propiedad_slug: "p1", asesor_id: "a1" }] });
    const data = url.endsWith("/clientes") ? [{ id: "c1", nombre: "Cliente A" }] : url.endsWith("/propiedades") ? [{ slug: "p1", codigo: "F-1", titulo: "Casa" }] : url.endsWith("/asesores") ? [{ id: "a1", nombre: "Asesora A" }] : [];
    return Response.json({ records: data.map(item => ({ id: "id" in item ? item.id : item.slug, data: item, version: 1 })) });
  });
  render(<CalendarioPage />);
  await screen.findByRole("option", { name: "EXP-1" });
  await waitFor(() => expect((screen.getByLabelText("Operación (opcional)") as HTMLSelectElement).value).toBe(expedienteId));
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita vinculada" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(saved).toMatchObject({ titulo: "Visita vinculada", clienteId: "c1", propiedadSlug: "p1", expedienteId, asesorId: "a1" }));
});
