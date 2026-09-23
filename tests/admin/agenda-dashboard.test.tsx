import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import AdminDashboard from "@/app/admin/page";
import CalendarioPage from "@/app/admin/calendario/page";
import { clearAdminCache, type Evento } from "@/lib/admin/store";

let events: Evento[] = [];

beforeEach(() => {
  clearAdminCache();
  events = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-23T05:24:00Z"));
  vi.stubGlobal("fetch", async (url: string) => Response.json({
    records: (url.endsWith("/eventos") ? events : []).map((event) => ({
      id: event.id,
      data: event,
      version: 1,
      createdAt: "2026-09-20T12:00:00Z",
      updatedAt: "2026-09-20T12:00:00Z",
    })),
  }));
});

afterEach(() => {
  cleanup();
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

test("dashboard keeps this evening's eight Tijuana events when UTC is already tomorrow", async () => {
  events = eightEvents("2026-09-22");
  render(<AdminDashboard />);

  await screen.findByText("Visita 1");
  expect(screen.getByRole("link", { name: /Eventos próximos/ }).textContent).toContain("08");
  const agenda = screen.getByRole("heading", { name: "Agenda próxima" }).closest("section")!;
  expect(within(agenda).getAllByRole("listitem")).toHaveLength(5);
  expect(screen.queryByText("Visita 6")).toBeNull();
});

test("dashboard counts all eligible days before limiting its chronologically ordered preview", async () => {
  events = [
    ...eightEvents("2026-09-24").reverse(),
    { id: "past", titulo: "Visita de ayer", fecha: "2026-09-21", hora: "23:59", tipo: "visita" },
  ];
  render(<AdminDashboard />);

  await screen.findByText("Visita 1");
  expect(screen.getByRole("link", { name: /Eventos próximos/ }).textContent).toContain("08");
  const agenda = screen.getByRole("heading", { name: "Agenda próxima" }).closest("section")!;
  expect(within(agenda).getAllByRole("listitem").map((item) => within(item).getByText(/Visita/).textContent)).toEqual([
    "Visita 1",
    "Visita 2",
    "Visita 3",
    "Visita 4",
    "Visita 5",
  ]);
  expect(screen.queryByText("Visita de ayer")).toBeNull();
});

test("date-based upcoming includes earlier and untimed events from the operating day", async () => {
  events = [
    { id: "untimed", titulo: "Pendiente sin hora", fecha: "2026-09-22", tipo: "otro" },
    { id: "morning", titulo: "Reunión matutina", fecha: "2026-09-22", hora: "08:00", tipo: "reunion" },
  ];
  render(<AdminDashboard />);

  await screen.findByText("Pendiente sin hora");
  expect(screen.getByText("Reunión matutina")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Eventos próximos/ }).textContent).toContain("02");
});

test("calendar opens the operating day and month even when UTC has crossed the year", async () => {
  vi.setSystemTime(new Date("2027-01-01T07:30:00Z"));
  events = [{ id: "year-end", titulo: "Firma de cierre", fecha: "2026-12-31", hora: "23:59", tipo: "firma" }];
  render(<CalendarioPage />);

  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2026-12-31");
  expect(screen.getByRole("heading", { name: "Diciembre 2026" })).toBeTruthy();
  await screen.findByText("Firma de cierre");
});

test("calendar lets staff select a day across the year and keeps the form date in sync", async () => {
  vi.setSystemTime(new Date("2026-12-31T20:00:00Z"));
  render(<CalendarioPage />);

  fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
  expect(screen.getByRole("heading", { name: "Enero 2027" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "1 de enero de 2027" }));
  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe("2027-01-01");
  fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
  expect(screen.getByRole("heading", { name: "Diciembre 2026" })).toBeTruthy();
});
