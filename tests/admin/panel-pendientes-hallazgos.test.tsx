vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction: vi.fn().mockResolvedValue(true), confirmDelete: vi.fn().mockResolvedValue(false) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern";
import nextConfig from "../../next.config";
import BlogAdminPage from "@/app/admin/blog/page";
import ArchivosPage from "@/app/admin/archivos/page";
import { PropertyForm } from "@/components/admin/property-form";
import { clearAdminCache } from "@/lib/admin/store";
import type { Property } from "@/data/propiedades";
import { propiedades } from "../fixtures/propiedades";

const rec = (id: string, data: unknown) => ({ id, data, version: 1, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" });
const post = { id: "post-1", slug: "guia-existente", titulo: "Guía existente", resumen: "Resumen", contenido: "Contenido", estado: "borrador", actualizadoEl: "2026-11-01T12:00:00.000Z" };
const fotoExterna = "https://fotos-ensayo.example.com/casa-ensayo.jpg";
const colecciones: Record<string, unknown[]> = {
  posts: [rec(post.id, post)],
  archivos: [rec("arch-1", { id: "arch-1", nombre: "Foto de ensayo", url: fotoExterna, tipo: "imagen" })],
};
let writes: Array<{ url: string; data: Record<string, unknown> }>;
beforeEach(() => {
  clearAdminCache();
  sessionStorage.clear();
  writes = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      writes.push({ url, data: body.data });
      // Respuesta real del servidor cuando la dirección del blog ya existe (índice único → PT409 → databaseError).
      if (url.includes("/collections/posts/")) return Response.json({ error: "El registro cambió o tiene referencias; recarga antes de continuar", requestId: "r1" }, { status: 409 });
      return Response.json({ record: { id: body.data.slug ?? body.data.id, data: body.data, version: 2, createdAt: "2026-11-01", updatedAt: "2026-11-13" } });
    }
    const name = url.split("?")[0].split("/").pop() ?? "";
    return Response.json({ records: colecciones[name] ?? [] });
  }));
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

/*
  BUG-C68: crear una entrada con una dirección que ya usa otra entrada muestra el aviso genérico de
  conflicto de versión («El registro cambió… Conserva tu borrador antes de reintentar»). blog/page.tsx
  no revisa la dirección contra las entradas cargadas y el servidor (http.ts:100) borra el motivo.
*/
test("una dirección repetida en el blog dice que la dirección ya existe", async () => {
  render(<BlogAdminPage />);
  await screen.findByRole("button", { name: "Editar Guía existente" });
  fireEvent.click(screen.getByRole("button", { name: "Nueva entrada" }));
  fireEvent.change(screen.getByLabelText("Dirección en la web"), { target: { value: "guia-existente" } });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Otra guía de ensayo" } });
  fireEvent.change(screen.getByLabelText("Resumen"), { target: { value: "Resumen de ensayo" } });
  fireEvent.change(screen.getByLabelText("Contenido"), { target: { value: "Contenido de ensayo" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar entrada" }));
  const aviso = await waitFor(() => {
    const texto = screen.getAllByRole("alert").map(el => el.textContent ?? "").join(" ");
    expect(texto.trim()).not.toBe("");
    return texto;
  });
  expect(aviso).not.toMatch(/El registro cambió/);
  expect(aviso).toMatch(/direcci[oó]n/i);
});

/*
  BUG-C69: la regla «un inmueble en evaluación permanece privado y sin fecha de publicación» vive solo
  en el servidor (validation.ts:114). property-form.tsx:388 ofrece «En captación · privado» (evaluacion)
  a un inmueble publicado y lo envía con publicada=true y su fecha: el servidor lo rechaza con 400.
*/
test("un inmueble publicado no ofrece pasar a «En captación · privado»", () => {
  const publicado: Property = { ...propiedades[0], publicada: true, publicadaEl: "2026-06-18" };
  render(<PropertyForm initial={publicado} />);
  const opcion = (screen.getByLabelText("Estado") as HTMLSelectElement).querySelector('option[value="evaluacion"]') as HTMLOptionElement | null;
  expect(opcion === null || opcion.disabled, "el formulario ofrece un estado que el servidor rechaza").toBe(true);
});

/*
  BUG-C70: archivos/page.tsx:187 pinta las imágenes de la biblioteca con next/image sin `unoptimized`;
  la URL la escribe el asesor (cualquier https). Si su dominio no está en images.remotePatterns de
  next.config.ts, en desarrollo el cargador de Next lanza «hostname is not configured» y tumba la
  pantalla. En pruebas (NODE_ENV=test) Next omite esa comprobación, así que aquí se verifica la causa:
  la URL no está configurada y aun así la imagen se manda por el optimizador (/_next/image).
*/
test("una imagen externa no configurada en next.config no pasa por el optimizador", async () => {
  expect(hasRemoteMatch([], nextConfig.images?.remotePatterns ?? [], new URL(fotoExterna))).toBe(false);
  render(<ArchivosPage />);
  const img = await screen.findByRole("img", { name: "Foto de ensayo" });
  expect(img.getAttribute("src")).not.toMatch(/^\/_next\/image/);
});
