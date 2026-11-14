import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { nuevoTramite, type Tramite } from "@/lib/tramites";

/* TRA-01 · pantalla de Trámites: el paso se cierra solo con sus pendientes y su documento, y cerrar ofrece Deshacer. */
const data = vi.hoisted(() => ({ tramites: [] as unknown[], archivos: [] as unknown[], upsert: vi.fn() }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return {
    ...actual,
    useCollection: (col: unknown) => col === actual.db.tramites ? data.tramites : col === actual.db.archivos ? data.archivos : [],
    useLoadState: () => ({ status: "ready", error: null }),
    useSession: () => ({ id: "u1", name: "Ana Asesora", email: "ana@example.invalid", role: "admin" }),
    apiRequest: () => Promise.resolve({ asesorId: "a1" }),
    upsert: (...args: unknown[]) => data.upsert(...args),
  };
});

import { TramitesApp } from "@/components/admin/tramites/tramites-app";

const base = (acreedor: "infonavit" | "banco" = "infonavit") => nuevoTramite({ id: "tr-1", acreedor, titulo: "Casa de ejemplo", clienteId: "cli-1", asesorId: "a1" });
const withStep = (t: Tramite, paso: number, hechos: boolean[]): Tramite => ({ ...t, pasoActual: paso, pasos: t.pasos.map((p, i) => i !== paso ? p : { ...p, pendientes: p.pendientes.map((x, j) => ({ ...x, hecho: !!hechos[j] })) }) });

beforeEach(() => { data.upsert.mockReset(); data.upsert.mockImplementation((_c: unknown, item: unknown) => Promise.resolve(item)); data.archivos = []; });
afterEach(cleanup);

test("con pendientes sin marcar no se cierra el paso y marcar uno guarda el cambio", async () => {
  data.tramites = [withStep(base(), 0, [true, false, false])];
  render(<TramitesApp initialId="tr-1" />);
  expect((screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("1 de 3")).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: "Escritura con folio real" }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  const saved = data.upsert.mock.calls[0][1] as Tramite;
  expect(saved.pasos[0].pendientes.map(p => p.hecho)).toEqual([true, true, false]);
});

test("con todo hecho se cierra el paso, avanza uno y ofrece Deshacer", async () => {
  data.tramites = [withStep(base(), 0, [true, true, true])];
  render(<TramitesApp initialId="tr-1" />);
  const cerrar = screen.getByRole("button", { name: /Cerrar el paso/ });
  expect((cerrar as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(cerrar);
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  expect((data.upsert.mock.calls[0][1] as Tramite).pasoActual).toBe(1);
  expect(await screen.findByText(/Paso «Datos del crédito» cerrado/)).toBeTruthy();
  expect(screen.getByRole("button", { name: /Deshacer/ })).toBeTruthy();
});

test("un paso con documento no se cierra hasta subirlo, aunque los pendientes estén hechos", () => {
  data.tramites = [withStep(base("banco"), 2, [true, true])];
  const { unmount } = render(<TramitesApp initialId="tr-1" />);
  expect(screen.getByText("Documento: Carta de finiquito")).toBeTruthy();
  expect((screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement).disabled).toBe(true);
  unmount();
  data.archivos = [{ id: "ar-1", nombre: "carta.pdf", url: "private/carta.pdf", tipo: "pdf", visibility: "private", clienteId: "cli-1", tramiteId: "tr-1", pasoClave: "carta" }];
  render(<TramitesApp initialId="tr-1" />);
  expect((screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement).disabled).toBe(false);
});
