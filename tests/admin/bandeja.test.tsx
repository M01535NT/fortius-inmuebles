import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return {
    ...actual, loadAllDossiers: async () => [{ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-000342", unidad: "", cliente_id: "cli-1", asesor_id: "a1", operacion: "venta", version: 1, propiedad_slug: null }],
    useCollection: (col: unknown) => col === actual.db.propiedades ? [{ slug: "terreno-rosarito", titulo: "Terreno en Rosarito", codigo: "FORTIUS-000217" }] : [{ id: "cli-1", nombre: "Carlos Vega" }],
  };
});
import { BandejaApp } from "@/components/admin/bandeja/bandeja-app";

/* FLX-01 (RP-101, RP-102): la Bandeja guarda sin pedir datos y archiva donde se elija. */
const base = { nombre_original: "x.pdf", mime: "application/pdf", byte_length: 2048, sha256: "a".repeat(64), tipo_documento: null, asesor_id: "a1", cliente_id: null, propiedad_slug: null, expediente_id: null, archivado_el: null, deleted_at: null };
const levantamiento = { ...base, id: "d1", titulo: "Levantamiento topografico", created_at: "2026-11-14T17:00:00Z" };
const avaluo = { ...base, id: "d2", titulo: "Avaluo", created_at: "2026-11-14T16:00:00Z" };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function servidor(conflicto = false) {
  const calls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET", body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : undefined;
    calls.push({ method, url, body });
    if (url === "/api/admin/bandeja" && method === "GET") return Response.json({ documentos: [levantamiento, avaluo], papelera: [] });
    if (url === "/api/admin/bandeja" && method === "POST") return Response.json({ signedUrl: "https://storage.example/upload?token=t", ticket: "ticket" });
    if (url.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (url === "/api/admin/bandeja/completar") return Response.json({ documento: { ...base, id: "d3", titulo: "Predial", created_at: "2026-11-14T18:00:00Z" } }, { status: 201 });
    if (url === "/api/admin/bandeja/d1" && method === "PATCH") {
      if (conflicto) return Response.json({ error: "Otra persona cambió este documento; recarga antes de continuar" }, { status: 409 });
      const destino = body?.destino as { propiedadSlug?: string | null } | undefined;
      return Response.json({ documento: { ...levantamiento, ...(destino ? { propiedad_slug: destino.propiedadSlug, archivado_el: "2026-11-14T19:00:00Z" } : {}), ...(body?.papelera ? { deleted_at: "2026-11-14T19:00:00Z" } : {}), ...(typeof body?.tipo === "string" ? { tipo_documento: body.tipo } : {}) } });
    }
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }));
  return calls;
}
const elegir = async (desplegable: RegExp, opcion: RegExp) => {
  fireEvent.click(screen.getByRole("button", { name: desplegable }));
  fireEvent.click(await screen.findByRole("option", { name: opcion }));
};

it("muestra lo que está por archivar y no deja archivar sin elegir un destino", async () => {
  servidor();
  render(<BandejaApp />);
  expect(await screen.findByRole("heading", { name: "Levantamiento topografico" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Avaluo/ })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Archivar" }) as HTMLButtonElement).disabled).toBe(true);
});

it("RP-102: archiva en un inmueble sin persona y el documento sale de la lista", async () => {
  const calls = servidor();
  render(<BandejaApp />);
  await screen.findByRole("heading", { name: "Levantamiento topografico" });
  await elegir(/^Inmueble/, /Terreno en Rosarito/);
  fireEvent.click(screen.getByRole("button", { name: "Archivar" }));
  await waitFor(() => expect(calls.find(c => c.method === "PATCH")?.body).toEqual({
    destino: { propiedadSlug: "terreno-rosarito", expedienteId: null, clienteId: null },
    esperado: { titulo: "Levantamiento topografico", eliminado: false, archivado: false },
  }));
  expect(await screen.findByText("Archivado en Terreno en Rosarito.")).toBeTruthy();
  expect(within(screen.getByRole("complementary", { name: "Bandeja" })).queryByRole("button", { name: /Levantamiento/ })).toBeNull();
});

it("RP-101: un archivo elegido se guarda sin pedir ningún dato y queda seleccionado", async () => {
  const calls = servidor();
  render(<BandejaApp />);
  await screen.findByRole("heading", { name: "Levantamiento topografico" });
  fireEvent.change(screen.getByLabelText("Agregar archivos a la Bandeja"), { target: { files: [new File(["%PDF-1.7"], "Predial.pdf", { type: "application/pdf" })] } });
  expect(await screen.findByRole("heading", { name: "Predial" })).toBeTruthy();
  expect(calls.find(c => c.url === "/api/admin/bandeja" && c.method === "POST")?.body).toEqual({ name: "Predial.pdf", size: 8, contentType: "application/pdf" });
  expect(screen.getByText("Guardado en la Bandeja. No hizo falta llenar nada.")).toBeTruthy();
});

it("rechaza tipos que no se guardan y muestra el conflicto del servidor", async () => {
  servidor(true);
  render(<BandejaApp />);
  await screen.findByRole("heading", { name: "Levantamiento topografico" });
  fireEvent.change(screen.getByLabelText("Agregar archivos a la Bandeja"), { target: { files: [new File(["x"], "video.mp4", { type: "video/mp4" })] } });
  expect(await screen.findByText("Solo se guardan PDF e imágenes JPEG, PNG o WEBP.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Mandar a la papelera" }));
  expect(await screen.findByText(/Otra persona cambió este documento/)).toBeTruthy();
});

it("el desplegable se recorre con el teclado y Escape devuelve el foco al botón", async () => {
  servidor();
  render(<BandejaApp />);
  await screen.findByRole("heading", { name: "Levantamiento topografico" });
  const boton = screen.getByRole("button", { name: /^Inmueble/ });
  fireEvent.click(boton);
  const lista = await screen.findByRole("listbox", { name: "Inmueble" });
  expect(document.activeElement?.textContent).toContain("Ninguno");
  fireEvent.keyDown(lista, { key: "ArrowDown" });
  expect(document.activeElement?.textContent).toContain("Terreno en Rosarito");
  fireEvent.keyDown(lista, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(boton);
});
