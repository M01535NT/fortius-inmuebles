import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: () => [{ id: "u1", nombre: "Ana" }] };
});
import { ClientDocumentsTab } from "@/components/admin/operation/client-documents-tab";

const OP = "51000000-0000-4000-8000-000000000010";
const escritura = { id: "a1", titulo: "Escritura", nombre_original: "Escritura.pdf", mime: "application/pdf", byte_length: 2048, uploaded_by: "u1", created_at: "2026-10-29T10:00:00Z", deleted_at: null };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function servidor(ia: boolean) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url === `/api/admin/expedientes/${OP}/archivos` && !init?.method) return Response.json({ archivos: [escritura], papelera: [], ia });
    if (url === `/api/admin/expedientes/${OP}/archivos` && init?.method === "POST") return Response.json({ signedUrl: "https://storage.example/upload?token=t", ticket: "ticket" });
    if (url === `/api/admin/expedientes/${OP}/datos`) return Response.json({ datos: {}, version: null });
    if (url.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (url.endsWith("/archivos/completar")) return Response.json({ archivo: { ...escritura, id: "a2", titulo: "CURP", nombre_original: "CURP.pdf" } }, { status: 201 });
    if (url === "/api/admin/archivos-cliente/a2/leer" && init?.method === "POST") return Response.json({ lectura: { tipoDocumento: "curp", propuestos: [], distintos: [], costoUsd: 0.01 } });
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }));
  return calls;
}
const subidas = (calls: string[]) => calls.filter(c => c === `POST /api/admin/expedientes/${OP}/archivos/completar`).length;

/*
  BUG-C36: lo elegido con «Agregar documento» (arriba de Documentos) vive en la pantalla y no se
  limpia; la pestaña «Del cliente» recuerda lo ya subido en una referencia que vuelve a cero al
  montarse. Cada vez que el asesor regresa a «Del cliente» (o a Documentos), el archivo se sube otra vez.
*/
it("un documento agregado se sube una sola vez aunque el asesor salga y vuelva a «Del cliente»", async () => {
  const calls = servidor(false);
  const incoming = { files: [new File(["%PDF-1.7"], "CURP.pdf", { type: "application/pdf" })], n: 1 };
  const primera = render(<ClientDocumentsTab operationId={OP} incoming={incoming} />);
  await waitFor(() => expect(subidas(calls)).toBe(1));
  primera.unmount();
  render(<ClientDocumentsTab operationId={OP} incoming={incoming} />);
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(subidas(calls)).toBe(1);
});

/*
  BUG-C37: con la lectura activada, un documento agregado desde «Del expediente» llega a una
  pestaña recién montada cuya lista todavía no cargó; la subida revisa `lista?.ia` con ese valor
  vacío y no lee el documento.
*/
it("con la lectura activada, el documento agregado desde «Del expediente» se lee al subirlo", async () => {
  const calls = servidor(true);
  const incoming = { files: [new File(["%PDF-1.7"], "CURP.pdf", { type: "application/pdf" })], n: 1 };
  render(<ClientDocumentsTab operationId={OP} incoming={incoming} />);
  await waitFor(() => expect(subidas(calls)).toBe(1));
  await waitFor(() => expect(calls).toContain("POST /api/admin/archivos-cliente/a2/leer"));
});
