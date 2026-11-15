import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AgendaCalendar } from "@/components/admin/agenda/calendar";
import { clearAdminCache } from "@/lib/admin/store";
import { chooseDate, dateValue } from "./agenda-helpers";

/*
  LV-10g: la Agenda con las piezas del kit (DEC-51, DEC-52): vista de mes con el calendario del kit,
  el detalle de cada cita en el panel con la cara de la persona, la foto del inmueble y «Lo que
  sigue», el campo de fecha del kit en «Agendar» y los atajos de una tecla.
*/
let data: Record<string, Record<string, unknown>[]>;
let saved: Record<string, unknown> | null;

beforeEach(() => {
  clearAdminCache();
  saved = null;
  data = {};
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T07:30:00Z"));
  window.history.replaceState(null, "", "/admin/agenda");
  vi.stubGlobal("fetch", async (url: string, options?: RequestInit) => {
    const name = url.split("?")[0].split("/").at(-1)!;
    if (options?.method === "PUT") {
      saved = JSON.parse(String(options.body)).data;
      return Response.json({ record: { id: saved!.id, data: saved, version: 1 } });
    }
    if (name === "expedientes") return Response.json({ expedientes: data.expedientes ?? [] });
    return Response.json({ records: (data[name] ?? []).map(row => ({ id: row.id ?? row.slug, data: row, version: 1, createdAt: "2026-12-01T00:00:00Z", updatedAt: "2026-12-01T00:00:00Z" })) });
  });
});
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); vi.useRealTimers(); vi.unstubAllGlobals(); clearAdminCache(); });

const cliente = { id: "c1", nombre: "Cliente de ensayo", telefono: "0000000000", tipo: "comprador", notas: "", creadoEl: "2026-12-01", actualizadoEl: "2026-12-01" };
const casa = { slug: "p1", codigo: "F-ENSAYO", titulo: "Casa de ensayo", galeria: [{ src: "/brand/ensayo.jpg", alt: "" }] };

test("la vista de mes muestra el mes elegido, marca los días con citas y elige un día", async () => {
  data.eventos = [{ id: "v1", titulo: "Visita de ensayo", fecha: "2027-01-14", hora: "10:00", tipo: "visita" }];
  render(<AgendaCalendar />);
  fireEvent.click(screen.getByRole("radio", { name: "Mes" }));
  const month = within(screen.getByRole("region", { name: "Agenda del mes" }));
  expect(screen.getByText("Diciembre de 2026")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
  expect(screen.getByText("Enero de 2027")).toBeTruthy();
  const fourteen = await month.findByRole("button", { name: "14 de enero de 2027, 1 eventos" });
  fireEvent.click(fourteen);
  expect(screen.getByRole("heading", { name: "Jueves 14 de enero" })).toBeTruthy();
  expect(screen.getByText("1 visita")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Semana" }));
  expect(screen.getByRole("region", { name: "Agenda semanal" })).toBeTruthy();
});

test("el detalle de una cita lleva la cara, la foto del inmueble y lo que sigue con esa persona", async () => {
  data.clientes = [cliente];
  data.propiedades = [casa];
  data.eventos = [
    { id: "v1", titulo: "Visita a la casa", fecha: "2026-12-31", hora: "10:00", tipo: "visita", clienteId: "c1", propiedadSlug: "p1" },
    { id: "v2", titulo: "Firma de ensayo", fecha: "2027-01-08", hora: "12:00", tipo: "firma", clienteId: "c1" },
  ];
  data.tareas = [{ id: "t1", titulo: "Pedir documentos de ensayo", descripcion: "", categoria: "documentacion", estado: "pendiente", prioridad: "normal", vence: "2027-01-04", pasos: [], clienteId: "c1" }];
  render(<AgendaCalendar />);
  const day = within(screen.getByRole("region", { name: "Jueves 31 de diciembre" }));
  fireEvent.click(await day.findByRole("button", { name: "Abrir Visita a la casa" }));
  const detail = within(screen.getByRole("dialog", { name: "Visita a la casa" }));
  expect(detail.getByRole("link", { name: "Inmueble: Casa de ensayo" }).querySelector("img")?.getAttribute("src")).toBe("/brand/ensayo.jpg");
  expect(detail.getByRole("link", { name: /Cliente de ensayo/ }).getAttribute("href")).toBe("/admin/clientes/c1");
  const next = within(detail.getByRole("region", { name: "Lo que sigue" }));
  expect(next.getByText("Firma de ensayo")).toBeTruthy();
  expect(next.getByRole("link", { name: "Pedir documentos de ensayo" }).getAttribute("href")).toBe("/admin/tareas/t1");
  expect(detail.getByRole("link", { name: "Ver a Cliente" }).getAttribute("href")).toBe("/admin/clientes/c1");
});

test("eliminar desde el detalle cierra el panel y se deshace", async () => {
  data.eventos = [{ id: "e1", titulo: "Llamada de ensayo", fecha: "2026-12-31", hora: "09:00", tipo: "llamada" }];
  render(<AgendaCalendar />);
  fireEvent.click(await screen.findByRole("button", { name: "Abrir Llamada de ensayo" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Llamada de ensayo" })).getByRole("button", { name: "Eliminar" }));
  await screen.findByText("Se eliminó «Llamada de ensayo».");
  expect(screen.queryByRole("dialog", { name: "Llamada de ensayo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(saved).toMatchObject({ titulo: "Llamada de ensayo", hora: "09:00" }));
});

test("«Agendar» toma la fecha del calendario del kit y el tipo del selector", async () => {
  render(<AgendaCalendar />);
  fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
  expect(dateValue()).toBe("2026-12-31");
  fireEvent.change(screen.getByLabelText("Nuevo evento"), { target: { value: "Visita de ensayo" } });
  chooseDate("Fecha", "2027-02-03");
  expect(dateValue()).toBe("2027-02-03");
  fireEvent.click(screen.getByLabelText("Tipo"));
  fireEvent.click(screen.getByRole("option", { name: "Firma" }));
  fireEvent.submit(screen.getByRole("button", { name: "Guardar en la agenda" }).closest("form")!);
  await waitFor(() => expect(saved).toMatchObject({ titulo: "Visita de ensayo", fecha: "2027-02-03", tipo: "firma" }));
  // Guardar lleva al día de la cita.
  await waitFor(() => expect(screen.getByRole("heading", { name: "Miércoles 3 de febrero" })).toBeTruthy());
});

test("atajos: T hoy, flechas mueven la semana, M el mes y A abre «Agendar»; no actúan al escribir", async () => {
  render(<AgendaCalendar />);
  fireEvent.keyDown(document.body, { key: "ArrowRight" });
  expect(screen.getByRole("button", { name: "4 de enero de 2027" })).toBeTruthy();
  fireEvent.keyDown(document.body, { key: "t" });
  expect(screen.getByRole("button", { name: "28 de diciembre de 2026" })).toBeTruthy();
  fireEvent.keyDown(document.body, { key: "m" });
  expect(screen.getByRole("region", { name: "Agenda del mes" })).toBeTruthy();
  fireEvent.keyDown(document.body, { key: "s" });
  fireEvent.keyDown(document.body, { key: "a" });
  const title = screen.getByLabelText("Nuevo evento");
  fireEvent.keyDown(title, { key: "t" });
  fireEvent.keyDown(title, { key: "ArrowRight" });
  expect(screen.getByRole("dialog", { name: "Agendar" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "28 de diciembre de 2026", hidden: true })).toBeTruthy();
});
