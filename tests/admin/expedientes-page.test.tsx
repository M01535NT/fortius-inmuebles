import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("@/lib/admin/store", () => ({
  db: { clientes: {}, propiedades: {} }, useCollection: () => [],
}));
import ExpedientesPage from "@/app/admin/expedientes/page";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const exp = { id: "exp-a", cliente_id: "c-own", asesor_id: "own", propiedad_slug: null, folio: "EXP-A", operacion: "venta", unidad: "", version: 1 };
const a = { id: "doc-a", expediente_id: exp.id, formato_id: "18", data: { pagador: "Cliente A" }, version: 1, updated_at: "2026-10-04" };
const b = { ...a, id: "doc-b", formato_id: "02", data: { nombre: "Cliente B" } };
function fixture(put?: (init: RequestInit) => Promise<Response>, open?: (id: string) => Promise<Response>) {
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [exp, { ...exp, id: "exp-b", folio: "EXP-B" }] });
    if (url.endsWith("/formatos")) return Response.json({ documentos: [a, b] });
    if (init?.method === "PUT") return put!(init);
    if (open) return open(url);
    return Response.json({ documento: url.endsWith("doc-a") ? a : b, emisiones: [] });
  });
}
async function openA() {
  render(<ExpedientesPage />);
  fireEvent.click(await screen.findByRole("button", { name: /EXP-A/ }));
  fireEvent.click(await screen.findByRole("button", { name: /^18 ·/ }));
  return await screen.findByLabelText("Quien paga");
}
it("informa las emisiones disponibles y ofrece el control comercial global", async () => {
  fixture(); render(<ExpedientesPage />);
  expect(screen.getByText(/25 formatos/)).toBeTruthy();
  expect(screen.getByText(/23 formatos.*por expediente/)).toBeTruthy();
  expect(screen.getByRole("link", { name: /03.*Control comercial/i }).getAttribute("href")).toBe("/admin/control-comercial");
  expect(screen.getByText(/09.*registro.*cotejo/i)).toBeTruthy();
});
it("conserva los cambios sin guardar al intentar abrir otro documento o expediente", async () => {
  fixture(); const field = await openA();
  fireEvent.change(field, { target: { value: "Captura pendiente" } });
  fireEvent.click(screen.getByRole("button", { name: /^02 ·/ }));
  expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Captura pendiente");
  expect(screen.getByRole("alert").textContent).toMatch(/guarda.*descarta/i);
  fireEvent.click(screen.getByRole("button", { name: /EXP-B/ }));
  expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Captura pendiente");
});
it("bloquea navegación y edición mientras guarda y mantiene captura tras un fallo", async () => {
  let complete!: (response: Response) => void;
  fixture(() => new Promise(resolve => { complete = resolve; }));
  const field = await openA(); fireEvent.change(field, { target: { value: "No perder" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  expect((screen.getByRole("button", { name: /^02 ·/ }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: /EXP-B/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(field.closest("fieldset")?.disabled).toBe(true);
  await act(async () => complete(Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 })));
  expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("No perder");
  expect(screen.getByText(/Guarda los cambios antes de emitir/)).toBeTruthy();
});
it("evita que una apertura lenta se mezcle con otro documento", async () => {
  let complete!: (response: Response) => void;
  fixture(undefined, () => new Promise(resolve => { complete = resolve; }));
  render(<ExpedientesPage />);
  fireEvent.click(await screen.findByRole("button", { name: /EXP-A/ }));
  fireEvent.click(await screen.findByRole("button", { name: /^18 ·/ }));
  expect((screen.getByRole("button", { name: /^02 ·/ }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /^02 ·/ }));
  await act(async () => complete(Response.json({ documento: a, emisiones: [] })));
  await waitFor(() => expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Cliente A"));
});
