import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/admin/workspace/use-person-status", () => ({ usePersonStatus: () => ({ ofClient: (id: string) => id === "cli-2" ? "cliente" : "prospecto", ofLead: () => undefined }) }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  const OP = "51000000-0000-4000-8000-000000000001";
  const data = new Map<unknown, unknown[]>([
    [actual.db.clientes, [
      { id: "cli-1", nombre: "Laura Méndez", telefono: "6645550142", tipo: "propietario", asesorId: "a1", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" },
      { id: "cli-2", nombre: "Ana Robles", telefono: "6645550119", tipo: "comprador", asesorId: "a1", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" }]],
    [actual.db.leads, [{ id: "lead-1", nombre: "Carlos Vega", telefono: "6645550177", origen: "manual", estado: "nuevo", creadoEl: "2026-11-10T10:00:00Z", notas: [] }]],
    [actual.db.propiedades, [{ slug: "casa-chapultepec", titulo: "Casa en Chapultepec", codigo: "FORTIUS-000209" }]],
  ]);
  return {
    ...actual, useCollection: (col: unknown) => data.get(col) ?? [],
    loadAllDossiers: async () => [{ id: OP, folio: "EXP-000342", version: 1, cliente_id: "cli-1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa-chapultepec", etapa: "documentacion", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {} } }],
  };
});
import { PersonasApp } from "@/components/admin/personas/personas-app";

/* FLX · Personas: lista y perfil en una pantalla, con la guía, lo que sigue y sus documentos. */
const OP = "51000000-0000-4000-8000-000000000001";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function servidor() {
  const calls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, url, body: typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : undefined });
    if (url === "/api/admin/bandeja?clienteId=cli-1") return Response.json({ documentos: [{ id: "d1", titulo: "Identificación oficial", created_at: "2026-11-13T10:00:00Z", tipo_documento: null }] });
    if (url.startsWith("/api/admin/bandeja?clienteId=")) return Response.json({ documentos: [] });
    if (url === `/api/admin/expedientes/${OP}/archivos`) return Response.json({ archivos: [{ id: "a1", titulo: "Escritura pública", created_at: "2026-11-12T10:00:00Z", deleted_at: null }], papelera: [] });
    if (url === `/api/admin/expedientes/${OP}/formatos`) return Response.json({ documentos: [{ id: "f1", formato_id: "02", version: 2, updated_at: "2026-11-12T12:00:00Z" }] });
    if (url === "/api/admin/bandeja" && method === "POST") return Response.json({ signedUrl: "https://storage.example/upload?token=t", ticket: "ticket" });
    if (url.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (url === "/api/admin/bandeja/completar") return Response.json({ documento: { id: "d9", titulo: "Predial" } }, { status: 201 });
    if (url === "/api/admin/bandeja/d9" && method === "PATCH") return Response.json({ documento: { id: "d9", titulo: "Predial" } });
    return Response.json({ expedientes: [] });
  }));
  return calls;
}

it("muestra a prospectos y clientes en una lista y filtra por condición", async () => {
  servidor();
  render(<PersonasApp initialId={null} />);
  const lista = screen.getByRole("complementary", { name: "Personas" });
  expect(within(lista).getAllByRole("button").map(b => b.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Laura Méndez"), expect.stringContaining("Ana Robles"), expect.stringContaining("Carlos Vega")]));
  fireEvent.click(within(lista).getByRole("radio", { name: "Clientes" }));
  expect(within(lista).queryByRole("button", { name: /Carlos Vega/ })).toBeNull();
  expect(within(lista).getByRole("button", { name: /Ana Robles/ })).toBeTruthy();
});

it("el perfil junta la guía de su operación y los documentos de la persona y de la operación", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  expect(await screen.findByRole("heading", { name: "Laura Méndez" })).toBeTruthy();
  const guia = await screen.findByRole("navigation", { name: "Guía de la operación EXP-000342" });
  expect(within(guia).getAllByRole("link").length).toBeGreaterThan(5);
  expect(guia.querySelector("[aria-current='step']")).toBeTruthy();
  expect(await screen.findByText("Identificación oficial")).toBeTruthy();
  expect(await screen.findByText("Escritura pública")).toBeTruthy();
  expect(await screen.findByText("Versión 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Hechos aquí" }));
  expect(screen.queryByText("Escritura pública")).toBeNull();
  expect(screen.getByRole("link", { name: "Abrir la operación" }).getAttribute("href")).toBe(`/admin/operaciones/${OP}`);
});

it("«Agregar archivo» lo guarda y lo liga a la persona; un prospecto todavía no recibe archivos", async () => {
  const calls = servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  await screen.findByRole("heading", { name: "Laura Méndez" });
  fireEvent.change(screen.getByLabelText("Agregar archivos al perfil de Laura Méndez"), { target: { files: [new File(["%PDF-1.7"], "Predial.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(calls.find(c => c.url === "/api/admin/bandeja/d9")?.body).toEqual({ destino: { clienteId: "cli-1" }, esperado: { titulo: "Predial", eliminado: false, archivado: false } }));
  expect(await screen.findByText("Archivo guardado en su perfil.")).toBeTruthy();
  cleanup();
  render(<PersonasApp initialId="lead:lead-1" />);
  expect(await screen.findByRole("heading", { name: "Carlos Vega" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Agregar archivo/ })).toBeNull();
});
