import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import HistoryPage from "@/app/admin/historial/page";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({
  useSession: () => ({ id: "admin", role: "admin" }),
  db: { propiedades: { kind: "propiedades" } },
  useCollection: (c: { kind?: string }) => c?.kind === "propiedades" ? [{ slug: "casa-playas", titulo: "Casa en Playas" }] : [],
  apiRequest: request,
  errorMessage: (e: Error) => e.message,
  loadAdminData: vi.fn(),
}));
afterEach(() => {
  cleanup();
  request.mockReset();
});
test("NAV-13: lo eliminado ya no se recupera aquí; el historial lleva a la papelera única", async () => {
  request.mockResolvedValue({ entries: [], hasMore: false });
  render(<HistoryPage />);
  await waitFor(() => expect(screen.queryByText("Cargando historial…")).toBeNull());
  expect(screen.queryByRole("radio", { name: "Recuperar eliminados" })).toBeNull();
  expect(screen.getByRole("link", { name: "Ver eliminados" }).getAttribute("href")).toBe("/admin/papelera");
  expect(request).toHaveBeenCalledWith(expect.stringContaining("deleted=0"));
});
test("successful history retry clears the obsolete error", async () => {
  request
    .mockRejectedValueOnce(new Error("No disponible"))
    .mockResolvedValue({ entries: [], hasMore: false });
  render(<HistoryPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
test("SIM-15: cada movimiento dice el nombre del registro, quién y cuándo, sin identificadores ni versión", async () => {
  request.mockResolvedValue({ entries: [
    { id: "h1", collection: "propiedades", record_id: "casa-playas", action: "UPDATE", actor_id: "admin", version: 4, changed_fields: ["precio"], created_at: "2026-11-10T18:00:00Z", restored_at: null },
    { id: "h2", collection: "leads", record_id: "uuid-raro", action: "INSERT", actor_id: null, version: 1, created_at: "2026-11-10T18:00:00Z", restored_at: null },
  ], hasMore: false });
  render(<HistoryPage />);
  expect(await screen.findByRole("heading", { name: "Casa en Playas" })).toBeTruthy();
  expect(screen.getByText(/Se cambió · Inmuebles/)).toBeTruthy();
  expect(screen.getAllByText(/· Tú$/)).toHaveLength(1);
  expect(screen.getByText(/Formulario del sitio o el sistema/)).toBeTruthy();
  expect(screen.queryByText(/uuid-raro|Versión/)).toBeNull();
});
test("SIM-15: sin movimientos, el historial explica qué aparecerá", async () => {
  request.mockResolvedValue({ entries: [], hasMore: false });
  render(<HistoryPage />);
  expect(await screen.findByText("Sin movimientos")).toBeTruthy();
});
