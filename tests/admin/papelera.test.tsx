import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/* NAV-13 (N23): una sola papelera con operaciones y registros, cada uno con su restauración de siempre. */
const h = vi.hoisted(() => ({ role: "admin" as "admin" | "editor", request: vi.fn(), fetchJson: vi.fn(), confirm: vi.fn(async () => true), load: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/papelera" }));
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction: h.confirm }));
vi.mock("@/lib/admin/store", () => ({
  useSession: () => ({ id: "yo", role: h.role }),
  db: { clientes: { kind: "clientes" }, propiedades: { kind: "propiedades" }, notas: { kind: "notas" }, eventos: { kind: "eventos" } },
  useCollection: (c: { kind: string }) => c.kind === "clientes" ? [{ id: "c1", nombre: "Familia de ejemplo" }] : c.kind === "propiedades" ? [{ slug: "casa-ejemplo", titulo: "Casa de ejemplo" }] : [],
  apiRequest: h.request, fetchJson: h.fetchJson, errorMessage: (e: Error) => e.message, loadAdminData: h.load, onAdminCacheClear: () => {},
}));
import { PapeleraScreen } from "@/components/admin/papelera/papelera";

const op = { id: "e1", folio: "EXP-0001", cliente_id: "c1", propiedad_slug: null, version: 3 };
const entry = { id: "h1", collection: "propiedades", record_id: "casa-ejemplo", created_at: "2026-11-10T18:00:00Z", actor_id: "yo" };
beforeEach(() => {
  h.role = "admin";
  h.fetchJson.mockImplementation(async (url: string) => url.includes("estado=eliminados") ? { expedientes: [op] } : {});
  h.request.mockImplementation(async (url: string) => url.startsWith("/api/admin/historial?") ? { entries: [entry], hasMore: false } : { record: {} });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("reúne operaciones e inmuebles eliminados y restaura cada uno por su ruta de siempre", async () => {
  render(<PapeleraScreen />);
  expect(screen.getByRole("heading", { level: 1, name: "Eliminados" })).toBeTruthy();
  expect(screen.getByRole("navigation", { name: "Administración" })).toBeTruthy();
  fireEvent.click(await screen.findByRole("button", { name: "Restaurar EXP-0001" }));
  expect(await screen.findByText("Operación EXP-0001 de vuelta en Operaciones.")).toBeTruthy();
  expect(h.fetchJson).toHaveBeenCalledWith("/api/admin/expedientes/e1", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ version: 3 }) }));

  expect(screen.getByText(/Inmueble · se eliminó el .* · por ti/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Restaurar Casa de ejemplo" }));
  expect(await screen.findByText("Inmueble de vuelta en su lugar.")).toBeTruthy();
  expect(h.request).toHaveBeenCalledWith("/api/admin/historial", "POST", { historyId: "h1" });
  expect(h.request).toHaveBeenCalledWith(expect.stringContaining("deleted=1"));
  expect(h.load).toHaveBeenCalled();
});

it("si se cancela la confirmación, no restaura nada", async () => {
  h.confirm.mockResolvedValueOnce(false);
  render(<PapeleraScreen />);
  fireEvent.click(await screen.findByRole("button", { name: "Restaurar EXP-0001" }));
  await waitFor(() => expect(h.confirm).toHaveBeenCalled());
  expect(h.fetchJson).not.toHaveBeenCalledWith(expect.stringContaining("/api/admin/expedientes/e1"), expect.anything());
});

it("el asesor ve sus operaciones eliminadas; los demás registros los restaura el director", async () => {
  h.role = "editor";
  render(<PapeleraScreen />);
  expect(await screen.findByRole("button", { name: "Restaurar EXP-0001" })).toBeTruthy();
  expect(screen.getByText(/El director restaura los inmuebles/)).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Administración" })).toBeNull();
  expect(h.request).not.toHaveBeenCalled();
});

it("vacía, lo dice; con error, ofrece reintentar", async () => {
  h.fetchJson.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValue({ expedientes: [] });
  h.request.mockResolvedValue({ entries: [], hasMore: false });
  render(<PapeleraScreen />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("No hay operaciones eliminadas")).toBeTruthy();
  expect(screen.getByText("Nada más que recuperar")).toBeTruthy();
});
