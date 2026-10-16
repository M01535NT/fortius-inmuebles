import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AgendaCalendar as CalendarioPage } from "@/components/admin/agenda/calendar";
import { clearAdminCache } from "@/lib/admin/store";

let data: Record<string, Record<string, unknown>[]>;
let writes: number;
let failSave: boolean;
let savedEvent: Record<string, unknown> | null;
let expedienteResponse: Promise<Response> | null;

beforeEach(() => {
  clearAdminCache();
  writes = 0;
  failSave = false;
  savedEvent = null;
  expedienteResponse = null;
  data = {};
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T07:30:00Z"));
  window.history.replaceState(null, "", "/admin/agenda");
  vi.stubGlobal("fetch", async (url: string, options?: RequestInit) => {
    const name = url.split("/").at(-1)!;
    if (options?.method === "PUT") {
      writes++;
      if (failSave) return Response.json({ error: "No se pudo guardar el evento" }, { status: 500 });
      const saved = JSON.parse(String(options.body)).data;
      savedEvent = saved;
      return Response.json({ record: { id: saved.id, data: saved, version: 1 } });
    }
    if (name === "expedientes") return expedienteResponse ?? Response.json({ expedientes: data.expedientes ?? [] });
    return Response.json({ records: (data[name] ?? []).map(row => ({
      id: row.id ?? row.slug, data: row, version: 1,
      createdAt: "2026-12-01T00:00:00Z", updatedAt: "2026-12-01T00:00:00Z",
    })) });
  });
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  clearAdminCache();
});

test("the week runs Monday to Sunday, navigates across the year and keeps the form date in sync", async () => {
  render(<CalendarioPage />);
  expect(screen.getByText("Semana del 28 dic 2026 al 3 ene 2027")).toBeTruthy();
  const week = screen.getByRole("region", { name: "Agenda semanal" });
  expect(within(week).getAllByRole("button", { name: /^\d+ de/ }).map(button => button.getAttribute("aria-label"))).toEqual([
    "28 de diciembre de 2026", "29 de diciembre de 2026", "30 de diciembre de 2026",
    "31 de diciembre de 2026", "1 de enero de 2027", "2 de enero de 2027", "3 de enero de 2027",
  ]);
  fireEvent.click(within(week).getByRole("button", { name: "1 de enero de 2027" }));
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-01");
  expect(screen.getByRole("heading", { name: "Viernes 1 de enero" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
  expect(within(week).getByRole("button", { name: "4 de enero de 2027" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
  expect(within(week).getByRole("button", { name: "28 de diciembre de 2026" })).toBeTruthy();
});

test("the selected day lists its events by time, untimed last, with the operation they belong to", async () => {
  data.eventos = [
    { id: "tomorrow", titulo: "Firma de mañana", fecha: "2027-01-01", hora: "07:00", tipo: "firma" },
    { id: "untimed", titulo: "Revisión sin hora", fecha: "2026-12-31", tipo: "otro" },
    { id: "late", titulo: "Visita de tarde", fecha: "2026-12-31", hora: "18:00", tipo: "visita" },
    { id: "early", titulo: "Visita de mañana", fecha: "2026-12-31", hora: "08:00", tipo: "visita", clienteId: "c1", propiedadSlug: "p1", expedienteId: "exp1", asesorId: "a1" },
    { id: "past", titulo: "Evento de ayer", fecha: "2026-12-30", hora: "19:00", tipo: "otro" },
  ];
  data.clientes = [{ id: "c1", nombre: "Cliente de prueba", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" }];
  data.propiedades = [{ slug: "p1", codigo: "F-PRUEBA", titulo: "Inmueble de prueba" }];
  data.asesores = [{ id: "a1", nombre: "Asesora de prueba", cargo: "", iniciales: "AP", activo: true }];
  data.expedientes = [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: "p1", asesor_id: "a1" }];
  render(<CalendarioPage />);
  const day = within(screen.getByRole("region", { name: "Jueves 31 de diciembre" }));
  await day.findByText("Visita de mañana");
  expect(day.getAllByRole("listitem").filter(item => item.closest("ol")).map(item => item.querySelector(".font-semibold")?.textContent)).toEqual([
    "Visita de mañana", "Visita de tarde", "Revisión sin hora",
  ]);
  expect(day.getByText("2 visitas y 1 cita")).toBeTruthy();
  expect(day.queryByText("Evento de ayer")).toBeNull();
  expect((await day.findByRole("link", { name: "Operación: EXP-PRUEBA" })).getAttribute("href")).toBe("/admin/operaciones/exp1");
  expect(day.getByText("Sin hora")).toBeTruthy();
  const week = within(screen.getByRole("region", { name: "Agenda semanal" }));
  expect(week.getByRole("button", { name: "Ver evento: Evento de ayer" })).toBeTruthy();
  expect(writes).toBe(0);
});

test("the week shows open tasks and the client contact without creating records", async () => {
  data.tareas = [
    { id: "task", titulo: "Confirmar documentos", descripcion: "", categoria: "documentacion", estado: "en-curso", prioridad: "alta", vence: "2027-01-01", pasos: [] },
    { id: "done", titulo: "Tarea completada", descripcion: "", categoria: "cierre", estado: "completada", prioridad: "normal", vence: "2027-01-01", pasos: [] },
  ];
  data.leads = [{ id: "lead", nombre: "Prospecto convertido", telefono: "0000000000", origen: "manual", estado: "activo", clienteId: "client", creadoEl: "2026-12-01", notas: [], perfil: { proximoContacto: "2027-01-01" } }];
  data.clientes = [{ id: "client", nombre: "Cliente convertido", telefono: "0000000000", tipo: "comprador", notas: "", leadId: "lead", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01", perfil: { proximoContacto: "2027-01-02" } }];
  render(<CalendarioPage />);
  const week = within(screen.getByRole("region", { name: "Agenda semanal" }));
  expect((await week.findByRole("link", { name: /Confirmar documentos/ })).getAttribute("href")).toBe("/admin/tareas/task");
  expect((await week.findByRole("link", { name: /Cliente convertido/ })).getAttribute("href")).toBe("/admin/clientes/client");
  expect(week.queryByText(/Tarea completada/)).toBeNull();
  expect(week.queryByText(/Prospecto convertido/)).toBeNull();
  expect(week.getByRole("button", { name: "1 de enero de 2027, 1 tareas" })).toBeTruthy();
  expect(writes).toBe(0);
});

test("a free day has a useful empty state", async () => {
  render(<CalendarioPage />);
  const day = within(screen.getByRole("region", { name: "Jueves 31 de diciembre" }));
  expect(await day.findByText("Sin citas este día")).toBeTruthy();
  fireEvent.click(day.getByRole("button", { name: "Agendar algo" }));
  expect(document.activeElement).toBe(screen.getByLabelText("Nuevo evento"));
  expect(writes).toBe(0);
});

test("URL context is visible before saving and a rejected draft survives view changes", async () => {
  data.clientes = [{ id: "c1", nombre: "Cliente de prueba", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" }];
  data.expedientes = [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: null, asesor_id: "a1" }];
  window.history.replaceState(null, "", "/admin/agenda?fecha=2027-01-02&expediente=exp1&nueva=1");
  render(<CalendarioPage />);
  const context = within(screen.getByRole("region", { name: "Contexto del evento" }));
  expect(await context.findByText("Operación: EXP-PRUEBA")).toBeTruthy();
  expect(context.getByText("Cliente: Cliente de prueba")).toBeTruthy();
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-02");
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Mi visita pendiente" } });
  failSave = true;
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
  fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Mi visita pendiente");
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-02");
  expect(screen.getByRole("alert")).toBeTruthy();
  await waitFor(() => expect(writes).toBe(1));
});


test("URL references populate selectors after their options arrive", async () => {
  data.leads = [{ id: "l1", nombre: "Prospecto de prueba", telefono: "0000000000", origen: "manual", estado: "activo", creadoEl: "2026-12-01", notas: [] }];
  data.clientes = [{ id: "c1", nombre: "Cliente de prueba", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" }];
  data.propiedades = [{ slug: "p1", codigo: "F-PRUEBA", titulo: "Casa de prueba" }];
  data.asesores = [{ id: "a1", nombre: "Asesora de prueba", cargo: "", iniciales: "AP", activo: true }];
  window.history.replaceState(null, "", "/admin/agenda?nueva=1&leadId=l1&clienteId=c1&propiedadSlug=p1&asesorId=a1");
  render(<CalendarioPage />);
  await screen.findByRole("option", { name: "Cliente de prueba" });
  await waitFor(() => expect((screen.getByLabelText("Cliente (opcional)") as HTMLSelectElement).value).toBe("c1"));
  expect((screen.getByLabelText("Prospecto (opcional)") as HTMLSelectElement).value).toBe("l1");
  expect((screen.getByLabelText("Inmueble (opcional)") as HTMLSelectElement).value).toBe("p1");
  expect((screen.getByLabelText("Asesor (opcional)") as HTMLSelectElement).value).toBe("a1");
  const context = within(screen.getByRole("region", { name: "Contexto del evento" }));
  expect(context.getByText("Cliente: Cliente de prueba")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Cliente (opcional)"), { target: { value: "" } });
  expect(context.queryByText("Cliente: Cliente de prueba")).toBeNull();
});



test("opening an event in the week selects its day and focuses the detail independently of capture", async () => {
  data.eventos = [{ id: "future", titulo: "Firma futura", fecha: "2027-01-02", hora: "09:00", tipo: "firma" }];
  render(<CalendarioPage />);
  const week = within(screen.getByRole("region", { name: "Agenda semanal" }));
  fireEvent.click(await week.findByRole("button", { name: "Ver evento: Firma futura" }));
  expect(screen.getByRole("heading", { name: "Sábado 2 de enero" })).toBeTruthy();
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-12-31");
  expect(document.activeElement).toBe(document.getElementById("calendar-selected-day"));
});

test("a typed capture date and title survive navigating to the next week", async () => {
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita aún sin guardar" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "10:30" } });
  fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Visita aún sin guardar");
  expect((screen.getByLabelText("Hora") as HTMLInputElement).value).toBe("10:30");
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Visita aún sin guardar", fecha: "2026-11-20", hora: "10:30" }));
});

test("opening an event in the week preserves the date being captured", async () => {
  data.eventos = [{ id: "future", titulo: "Firma futura", fecha: "2027-01-02", hora: "09:00", tipo: "firma" }];
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita aún sin guardar" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  const week = within(screen.getByRole("region", { name: "Agenda semanal" }));
  fireEvent.click(await week.findByRole("button", { name: "Ver evento: Firma futura" }));
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Visita aún sin guardar");
  expect(screen.getByRole("heading", { name: "Sábado 2 de enero" })).toBeTruthy();
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Visita aún sin guardar", fecha: "2026-11-20" }));
});

test("a late URL expediente cannot replace a client explicitly chosen while loading", async () => {
  let complete!: (response: Response) => void;
  expedienteResponse = new Promise(resolve => { complete = resolve; });
  data.clientes = [
    { id: "c1", nombre: "Cliente del expediente", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" },
    { id: "c2", nombre: "Cliente elegido", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" },
  ];
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  await screen.findByRole("option", { name: "Cliente elegido" });
  fireEvent.change(screen.getByLabelText("Cliente (opcional)"), { target: { value: "c2" } });
  await act(async () => complete(Response.json({ expedientes: [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: null, asesor_id: "a1" }] })));
  await screen.findByRole("option", { name: "EXP-PRUEBA" });
  const context = within(screen.getByRole("region", { name: "Contexto del evento" }));
  expect((screen.getByLabelText("Cliente (opcional)") as HTMLSelectElement).value).toBe("c2");
  expect(context.getByText("Cliente: Cliente elegido")).toBeTruthy();
  expect((screen.getByLabelText("Operación (opcional)") as HTMLSelectElement).value).toBe("");
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita elegida" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Visita elegida", clienteId: "c2" }));
  expect(savedEvent?.expedienteId).toBeUndefined();
});

test("editing a relation detaches the selected expediente and saves the visible client", async () => {
  data.clientes = [
    { id: "c1", nombre: "Cliente del expediente", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" },
    { id: "c2", nombre: "Cliente elegido", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" },
  ];
  data.expedientes = [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: null, asesor_id: "a1" }];
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  await waitFor(() => expect((screen.getByLabelText("Operación (opcional)") as HTMLSelectElement).value).toBe("exp1"));
  await screen.findByRole("option", { name: "Cliente elegido" });
  fireEvent.change(screen.getByLabelText("Cliente (opcional)"), { target: { value: "c2" } });
  expect((screen.getByLabelText("Operación (opcional)") as HTMLSelectElement).value).toBe("");
  const context = within(screen.getByRole("region", { name: "Contexto del evento" }));
  expect(context.getByText("Cliente: Cliente elegido")).toBeTruthy();
  expect(context.queryByText("Operación: EXP-PRUEBA")).toBeNull();
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita elegida" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Visita elegida", clienteId: "c2" }));
  expect(savedEvent?.expedienteId).toBeUndefined();
});

test("an unresolved URL expediente blocks generic writes without clearing the capture", async () => {
  expedienteResponse = new Promise(() => {});
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita de expediente cargando" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await act(async () => { await Promise.resolve(); });
  expect(writes).toBe(0);
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Visita de expediente cargando");
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
});

test("a failed URL expediente lookup exposes error retry and explicit withdrawal", async () => {
  expedienteResponse = Promise.resolve(Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 }));
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita por recuperar" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Reintentar consulta de operaciones" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Quitar operación solicitada" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Visita por recuperar");
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
  expect(writes).toBe(0);
});

test("retry resolves the requested expediente and saves its context with the preserved capture", async () => {
  expedienteResponse = Promise.resolve(Response.json({}, { status: 503 }));
  data.clientes = [{ id: "c1", nombre: "Cliente del expediente", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" }];
  data.expedientes = [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: null, asesor_id: "a1" }];
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita por recuperar" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  await screen.findByRole("alert");
  expedienteResponse = null;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar consulta de operaciones" }));
  const context = within(screen.getByRole("region", { name: "Contexto del evento" }));
  await context.findByText("Operación: EXP-PRUEBA");
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByLabelText("Nuevo evento") as HTMLInputElement).value).toBe("Visita por recuperar");
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Visita por recuperar", fecha: "2026-11-20", expedienteId: "exp1", clienteId: "c1" }));
  expect(savedEvent?.propiedadSlug).toBeUndefined();
});

test("an absent requested expediente stays blocked until explicit withdrawal", async () => {
  window.history.replaceState(null, "", "/admin/agenda?expediente=missing");
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Evento sin expediente confirmado" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  await screen.findByRole("alert");
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Quitar operación solicitada" }));
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-11-20");
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Evento sin expediente confirmado", fecha: "2026-11-20" }));
  expect(savedEvent?.expedienteId).toBeUndefined();
});

test("explicit withdrawal while loading prevents later reattachment", async () => {
  let complete!: (response: Response) => void;
  expedienteResponse = new Promise(resolve => { complete = resolve; });
  window.history.replaceState(null, "", "/admin/agenda?expediente=exp1");
  render(<CalendarioPage />);
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Evento retirado explícitamente" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-11-20" } });
  fireEvent.click(screen.getByRole("button", { name: "Quitar operación solicitada" }));
  expect((screen.getByRole("button", { name: "Guardar en la agenda" }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(savedEvent).toMatchObject({ titulo: "Evento retirado explícitamente", fecha: "2026-11-20" }));
  expect(savedEvent?.expedienteId).toBeUndefined();
  await act(async () => complete(Response.json({ expedientes: [{ id: "exp1", folio: "EXP-PRUEBA", cliente_id: "c1", propiedad_slug: null, asesor_id: "a1" }] })));
  await screen.findByRole("option", { name: "EXP-PRUEBA" });
  expect((screen.getByLabelText("Operación (opcional)") as HTMLSelectElement).value).toBe("");
});
