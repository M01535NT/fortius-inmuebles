// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { BlogContent, blogHeadings } from "@/components/blog/blog-content";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogFigures } from "@/data/blog-figures";
import { getBlogCover } from "@/data/blog-covers";
import type { Post } from "@/lib/admin/store";

const slugs = ["indice-shf-tijuana-primer-semestre-2026", "mes-testamento-baja-california-2026", "predial-isai-tijuana-condonacion-octubre-diciembre-2026", "acciones-vivienda-bienestar-baja-california-2026", "alerta-registral-baja-california-monitoreo-inmuebles", "isr-venta-casa-habitacion-exencion-requisitos"];

describe("September 27 editorial batch", () => {
  test("long articles expose stable heading links for a table of contents", () => {
    expect(blogHeadings("## Primero\n\nTexto\n\n### Después\n\nMás texto")).toEqual([
      { id: "articulo-seccion-0", text: "Primero", level: "h2" },
      { id: "articulo-seccion-2", text: "Después", level: "h3" },
    ]);
  });

  test.each(slugs)("%s actually renders an accessible explanation inside its article", (slug) => {
    const index = slugs.indexOf(slug) + 1;
    const content = readFileSync(`content/blog/2026-09-27/${String(index).padStart(2, "0")}.md`, "utf8");
    const figures = getBlogFigures(slug);
    expect(figures.length).toBeGreaterThanOrEqual(1);
    const root = document.createElement("div");
    root.innerHTML = renderToStaticMarkup(createElement(BlogContent, { content, figures }));
    expect(root.querySelectorAll("figure")).toHaveLength(figures.length);
    for (const figure of figures) {
      expect(root.querySelector(`[id="${figure.id}-caption"]`)?.textContent).toContain(figure.source);
      expect(root.querySelector(`[id="${figure.id}-title"]`)?.textContent).toBe(figure.title);
    }
  });

  test("licensed photograph has correct authorship and the other five topics have no generated covers", () => {
    const cover = getBlogCover(slugs[0]);
    expect(cover?.src).toBe("/images/blog/tijuana-urbaner44-2021.webp");
    const html = renderToStaticMarkup(createElement(BlogCard, { post: { slug: slugs[0], titulo: "Tijuana", resumen: "Contexto", contenido: "Texto", estado: "publicado", actualizadoEl: "2026-09-27T18:00:00Z" } as Post }));
    expect(html).toContain("Urbaner44");
    expect(html).toContain("CC BY-SA 4.0");
    expect(html).not.toContain("generada con IA");
    expect(html).not.toContain("credit=");
    for (const slug of slugs.slice(1)) expect(getBlogCover(slug)).toBeUndefined();
  });
});
