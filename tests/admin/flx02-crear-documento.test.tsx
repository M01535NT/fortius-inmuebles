import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const push = vi.hoisted(() => vi.fn());
const dossiers = vi.hoisted(() => ({ list: [] as Array<Record<string, unknown>> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: (col: unknown) => col === actual.db.clientes ? [{ id: "cli-1", nombre: "Laura Méndez" }] : [], loadAllDossiers: async () => dossiers.list };
});
import { PropertyCreateDocument } from "@/components/admin/properties/property-create-document";
import { PasarAAsunto } from "@/components/admin/apps/pasar-a-asunto";
import type { AppRun } from "@/lib/apps/types";

/* FLX-02: crear documentos desde el inmueble y pasar un documento suelto a un asunto (HER-04). Datos de ejemplo. */
const A = "51000000-0000-4000-8000-000000000001", B = "51000000-0000-4000-8000-000000000002";
const op = (id: string, folio: string, over: Record<string, unknown> = {}) => ({ id, folio, version: 1, cliente_id: "cli-1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa-ejemplo", etapa: "captacion", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {} }, ...over });
const foto = { id: "61000000-0000-4000-8000-000000000001", kind: "foto", caption: "Fachada", source: "Visita", observed_on: null };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); push.mockClear(); dossiers.list = []; });

it("el inmueble crea el documento en el asunto elegido entre los suyos; sin asunto ofrece abrir uno con el inmueble puesto", async () => {
  dossiers.list = [op(A, "EXP-000501"), op(B, "EXP-000502", { unidad: "Local 3" }), op("51000000-0000-4000-8000-000000000003", "EXP-000503", { propiedad_slug: "otro" }), op("51000000-0000-4000-8000-000000000004", "EXP-000504", { etapa: "cerrado" })];
  render(<PropertyCreateDocument slug="casa-ejemplo" />);
  fireEvent.click(await screen.findByRole("button", { name: "Crear documento" }));
  const where = await screen.findByRole("combobox", { name: "Asunto donde se crea" });
  expect(where.textContent).toContain("EXP-000501");
  fireEvent.click(screen.getByRole("option", { name: /Opinión de valor comercial/ }));
  expect(push).toHaveBeenLastCalledWith(`/admin-anterior/operaciones/${A}?crear=07`);
  cleanup();
  dossiers.list = [];
  render(<PropertyCreateDocument slug="casa-ejemplo" />);
  expect((await screen.findByRole("link", { name: /Abrir un asunto para sus documentos/ })).getAttribute("href")).toBe("/admin-anterior/operaciones?nuevo=1&inmueble=casa-ejemplo");
});

it("HER-04: el documento suelto pasa al asunto con sus datos (sin sus fotos) y se abre ahí; el suelto no se toca", async () => {
  dossiers.list = [op(A, "EXP-000501")];
  const run: AppRun = { id: "r1", slug: "documentos", title: "Opinión de valor · Casa ejemplo", input: { formatoId: "07", data: { fechaValor: "2026-11-14", adjuntos: [foto] } }, result: null, context: {}, version: 3, updatedAt: "2026-11-14T10:00:00Z" } as unknown as AppRun;
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined });
    if (url === "/api/admin/apps/runs/r1") return Response.json({ run: { ...run, version: 4, input: { formatoId: "07", data: { fechaValor: "2026-11-15", adjuntos: [foto] } } } });
    if (url === `/api/admin/expedientes/${A}/formatos` && method === "POST") return Response.json({ documento: { id: "d77" } }, { status: 201 });
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }));
  render(<PasarAAsunto run={run} onClose={() => undefined} />);
  expect(screen.getByText(/no se copian/)).toBeTruthy();
  const pasar = screen.getByRole("button", { name: /Pasar al asunto/ }) as HTMLButtonElement;
  expect(pasar.disabled).toBe(true);
  fireEvent.click(await screen.findByRole("combobox", { name: "Asunto" }));
  fireEvent.click(await screen.findByRole("option", { name: /Laura Méndez · EXP-000501/ }));
  fireEvent.click(pasar);
  await waitFor(() => expect(push).toHaveBeenCalledWith(`/admin-anterior/operaciones/${A}?documento=d77`));
  // Con la versión guardada más reciente y sin las fotos del usuario; el trabajo suelto no se modifica.
  expect(calls.find(c => c.method === "POST")?.body).toEqual({ formatoId: "07", data: { fechaValor: "2026-11-15" } });
  expect(calls.filter(c => c.url.startsWith("/api/admin/apps/runs") && c.method !== "GET")).toEqual([]);
});
