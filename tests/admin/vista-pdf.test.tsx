import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
const paginas = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/pdf-paginas", () => ({ paginasComoImagenes: paginas }));
import { VistaPdf } from "@/components/admin/vista-pdf";

/* El panel no se deja enmarcar (frame-ancestors 'none'): el PDF privado se dibuja, nunca va en un iframe. */
afterEach(() => { cleanup(); vi.unstubAllGlobals(); paginas.mockReset(); });

it("descarga con la sesión y dibuja las páginas sin iframe", async () => {
  const fetchMock = vi.fn(async () => new Response(new Uint8Array([37, 80, 68, 70])));
  vi.stubGlobal("fetch", fetchMock);
  paginas.mockResolvedValue({ paginas: ["data:image/jpeg;base64,AA", "data:image/jpeg;base64,BB"], total: 9 });
  render(<VistaPdf url="/api/admin/archivos-cliente/a1/descargar" titulo="Escritura" maxPaginas={2} />);
  expect(await screen.findByAltText("Escritura, página 1 de 9")).toBeTruthy();
  expect(screen.getByAltText("Escritura, página 2 de 9")).toBeTruthy();
  expect(screen.getByText("Se muestran 2 de 9 páginas.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Abrir el documento completo" })).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/archivos-cliente/a1/descargar", { credentials: "same-origin" });
  expect(paginas.mock.calls[0][1]).toMatchObject({ maxPaginas: 2 });
  expect(document.querySelector("iframe")).toBeNull();
});

it("si el servidor no entrega el archivo, ofrece abrirlo aparte", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
  render(<VistaPdf url="/api/admin/bandeja/d1/descargar" titulo="Predial" />);
  expect(await screen.findByText("No se pudo mostrar el documento aquí.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Abrir el archivo" })).toBeTruthy();
  expect(paginas).not.toHaveBeenCalled();
});
