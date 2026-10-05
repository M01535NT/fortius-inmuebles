import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import BlogAdminPage from "@/app/admin/blog/page";
import { clearAdminCache, db } from "@/lib/admin/store";

const existingPost = {
  id: "post-1",
  slug: "guia-existente",
  titulo: "Guía existente",
  resumen: "Resumen existente",
  contenido: "Contenido existente",
  estado: "borrador",
  actualizadoEl: "2026-09-03T12:00:00.000Z",
};

let saved: Record<string, unknown> | null;

beforeEach(() => {
  clearAdminCache();
  saved = null;
  vi.stubGlobal("fetch", vi.fn(async (input, init) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      saved = body.data;
      return Response.json({
        record: {
          id: body.data.id,
          data: body.data,
          version: 2,
          createdAt: "2026-09-03T12:00:00.000Z",
          updatedAt: "2026-09-05T12:00:00.000Z",
        },
      });
    }
    return Response.json({
      records: String(input).endsWith("posts")
        ? [{ id: existingPost.id, data: existingPost, version: 1, createdAt: existingPost.actualizadoEl, updatedAt: existingPost.actualizadoEl }]
        : [],
    });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("creation lets staff choose the slug and persists that exact route key", async () => {
  render(<BlogAdminPage />);
  fireEvent.click(screen.getByRole("button", { name: "Nueva entrada" }));
  fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "guia-para-comprar" } });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Guía para comprar" } });
  fireEvent.change(screen.getByLabelText("Resumen"), { target: { value: "Resumen" } });
  fireEvent.change(screen.getByLabelText("Contenido"), { target: { value: "Contenido" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar entrada" }).closest("form")!);

  await waitFor(() => expect(saved).not.toBeNull());
  expect(saved).toMatchObject({ slug: "guia-para-comprar", titulo: "Guía para comprar", estado: "borrador" });
});

test("editing displays the persisted slug as readonly and preserves it on save", async () => {
  await db.posts.load();
  render(<BlogAdminPage />);
  fireEvent.click(screen.getByRole("button", { name: "Editar Guía existente" }));

  const slug = screen.getByLabelText("Slug") as HTMLInputElement;
  expect(slug.readOnly).toBe(true);
  expect(slug.value).toBe("guia-existente");
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Título revisado" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar entrada" }).closest("form")!);

  await waitFor(() => expect(saved).not.toBeNull());
  expect(saved).toMatchObject({ slug: "guia-existente", titulo: "Título revisado" });
});

test("staff can classify and feature a news article with its original source", async () => {
  await db.posts.load();
  render(<BlogAdminPage />);
  fireEvent.click(screen.getByRole("button", { name: "Editar Guía existente" }));
  fireEvent.change(screen.getByLabelText("Tipo de contenido"), { target: { value: "actualidad" } });
  fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "mercado" } });
  fireEvent.change(screen.getByLabelText("Nombre de la fuente"), { target: { value: "SHF" } });
  fireEvent.change(screen.getByLabelText("Enlace a la fuente"), { target: { value: "https://example.com/informe" } });
  fireEvent.click(screen.getByLabelText("Destacar en portada"));
  fireEvent.submit(screen.getByRole("button", { name: "Guardar entrada" }).closest("form")!);
  await waitFor(() => expect(saved).toMatchObject({ formato: "actualidad", categoria: "mercado", destacado: true, fuenteNombre: "SHF", fuenteUrl: "https://example.com/informe" }));
  expect(saved).not.toHaveProperty("publicadoEl");
});
