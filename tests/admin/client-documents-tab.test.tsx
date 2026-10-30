import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: () => [{ id: "u1", nombre: "Ana" }] };
});
import { ClientDocumentsTab } from "@/components/admin/operation/client-documents-tab";

/* Documentos del cliente (titular, 29/10/2026): subir, ver, mandar a la papelera y restaurar. */
const OP = "51000000-0000-4000-8000-000000000010";
const escritura = { id: "a1", titulo: "Escritura", nombre_original: "Escritura.pdf", mime: "application/pdf", byte_length: 2048, uploaded_by: "u1", created_at: "2026-10-29T10:00:00Z", deleted_at: null };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function servidor(ia = false) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url === `/api/admin/expedientes/${OP}/archivos` && !init?.method) return Response.json({ archivos: [escritura], papelera: [], ia });
    if (url === `/api/admin/expedientes/${OP}/archivos` && init?.method === "POST") return Response.json({ signedUrl: "https://storage.example/upload?token=t", ticket: "ticket" });
    if (url === `/api/admin/expedientes/${OP}/datos`) return Response.json({ datos: {}, version: null });
    if (url === "/api/admin/archivos-cliente/a2/leer" && init?.method === "POST") return Response.json({ lectura: { tipoDocumento: "curp", propuestos: ["propietarioCurp", "propietarioNacimiento"], distintos: [{ etiqueta: "Nombre del propietario o razón social" }], costoUsd: 0.01 } });
    if (url === "/api/admin/archivos-cliente/a1/leer" && init?.method === "POST") return Response.json({ error: "El servicio de lectura está saturado; inténtalo en unos minutos" }, { status: 503 });
    if (url.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (url.endsWith("/archivos/completar")) return Response.json({ archivo: { ...escritura, id: "a2", titulo: "CURP", nombre_original: "CURP.pdf", created_at: "2026-10-29T11:00:00Z" } }, { status: 201 });
    if (url === "/api/admin/archivos-cliente/a1" && init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      return Response.json({ archivo: { ...escritura, deleted_at: body.papelera ? "2026-10-29T12:00:00Z" : null } });
    }
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }));
  return calls;
}

it("muestra los documentos, sube uno nuevo por la carga directa y lo agrega a la lista", async () => {
  const calls = servidor();
  render(<ClientDocumentsTab operationId={OP} />);
  expect(await screen.findByText("Escritura")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Abrir/ }).getAttribute("href")).toBe("/api/admin/archivos-cliente/a1/descargar");
  const file = new File(["%PDF-1.7"], "CURP.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Elegir archivos"), { target: { files: [file] } });
  expect(await screen.findByText("CURP")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("Se guardó 1 documento.");
  expect(calls).toEqual(expect.arrayContaining([`POST /api/admin/expedientes/${OP}/archivos`, "PUT https://storage.example/upload?token=t", `POST /api/admin/expedientes/${OP}/archivos/completar`]));
});

it("rechaza en el navegador lo que no es PDF ni imagen, sin subirlo", async () => {
  const calls = servidor();
  render(<ClientDocumentsTab operationId={OP} />);
  await screen.findByText("Escritura");
  fireEvent.change(screen.getByLabelText("Elegir archivos"), { target: { files: [new File(["x"], "notas.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })] } });
  expect((await screen.findByRole("alert")).textContent).toContain("sube un PDF o una imagen");
  expect(calls.some(call => call.startsWith("POST"))).toBe(false);
});

it("manda a la papelera y restaura sin borrar el documento", async () => {
  servidor();
  render(<ClientDocumentsTab operationId={OP} />);
  await screen.findByText("Escritura");
  fireEvent.click(screen.getByRole("button", { name: "Mandar Escritura a la papelera" }));
  await waitFor(() => expect(screen.queryByRole("link", { name: /Abrir/ })).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: /Papelera/ }));
  fireEvent.click(screen.getByRole("button", { name: /Restaurar/ }));
  expect(await screen.findByRole("link", { name: /Abrir/ })).toBeTruthy();
});

it("sin la lectura activada no ofrece leer con IA", async () => {
  servidor();
  render(<ClientDocumentsTab operationId={OP} />);
  await screen.findByText("Escritura");
  expect(screen.queryByRole("button", { name: "Leer datos" })).toBeNull();
});

it("con la lectura activada, lee cada documento al subirlo y avisa qué propuso y qué choca con lo confirmado", async () => {
  const calls = servidor(true);
  render(<ClientDocumentsTab operationId={OP} />);
  await screen.findByText("Escritura");
  fireEvent.change(screen.getByLabelText("Elegir archivos"), { target: { files: [new File(["%PDF-1.7"], "CURP.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(screen.getAllByRole("status").map(s => s.textContent).join(" ")).toContain("«CURP»: se encontraron 2 datos; confírmalos en «Datos del expediente»."));
  expect(screen.getAllByRole("status").map(s => s.textContent).join(" ")).toContain("Dice otra cosa que lo ya confirmado en: nombre del propietario o razón social; lo confirmado no se cambió.");
  expect(screen.getByText("Leído · CURP")).toBeTruthy();
  // Regla del titular (29/10/2026): nada en pantalla dice «propuesto» ni que algo lo hizo la IA.
  expect(document.body.textContent).not.toMatch(/propuest|\bIA\b|inteligencia artificial/i);
  expect(calls).toContain("POST /api/admin/archivos-cliente/a2/leer");
  // El panel de datos se vuelve a consultar para mostrar lo propuesto.
  await waitFor(() => expect(calls.filter(call => call === `GET /api/admin/expedientes/${OP}/datos`).length).toBeGreaterThanOrEqual(2));
});

it("si la lectura falla, el documento queda guardado con el aviso y se puede volver a leer", async () => {
  servidor(true);
  render(<ClientDocumentsTab operationId={OP} />);
  await screen.findByText("Escritura");
  fireEvent.click(screen.getByRole("button", { name: "Leer datos" }));
  expect((await screen.findByRole("alert")).textContent).toContain("«Escritura»: El servicio de lectura está saturado");
  expect(screen.getByText(/No se pudo leer: El servicio de lectura está saturado/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Volver a leer" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Abrir/ })).toBeTruthy();
});
