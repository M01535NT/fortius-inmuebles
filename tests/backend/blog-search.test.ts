import { expect, test } from "vitest";
import type { Post } from "@/lib/admin/store";
import { blogHref, filterBlogPosts, normalizeBlogSearch } from "@/lib/blog-editorial";

const post = (id: string, date: string, extra: Partial<Post> = {}): Post => ({
  id, slug: id, titulo: "Crédito para vivienda", resumen: "Comprar una propiedad",
  contenido: "Documentos para comprar", estado: "publicado", categoria: "comprar", formato: "guia",
  publicadoEl: date, actualizadoEl: "2026-10-03T18:00:00Z", ...extra,
});

test("date filters use the displayed Tijuana calendar day and include both boundaries", () => {
  const posts = [
    post("before", "2026-09-20T06:59:59Z"),
    post("start", "2026-09-20T07:00:00Z"),
    post("end", "2026-09-21T06:59:59Z"),
    post("after", "2026-09-21T07:00:00Z"),
  ];
  const search = normalizeBlogSearch({ desde: "2026-09-20", hasta: "2026-09-20" });
  expect(filterBlogPosts(posts, search).map((p) => p.id)).toEqual(["end", "start"]);
});

test("date ranges combine with accent-insensitive search, topic and format", () => {
  const posts = [
    post("match", "2026-09-20T18:00:00Z"),
    post("old", "2026-08-20T18:00:00Z"),
    post("other-topic", "2026-09-20T18:00:00Z", { categoria: "vender" }),
    post("news", "2026-09-20T18:00:00Z", { formato: "actualidad" }),
  ];
  expect(filterBlogPosts(posts, normalizeBlogSearch({ q: "CREDITO", tema: "comprar", tipo: "guia", desde: "2026-09-01", hasta: "2026-09-30" })).map((p) => p.id)).toEqual(["match"]);
});

test("open-ended ranges work and inverted ranges return no misleading results", () => {
  const posts = [post("old", "2026-08-20T18:00:00Z"), post("new", "2026-09-20T18:00:00Z")];
  expect(filterBlogPosts(posts, normalizeBlogSearch({ desde: "2026-09-01" })).map((p) => p.id)).toEqual(["new"]);
  expect(filterBlogPosts(posts, normalizeBlogSearch({ hasta: "2026-08-31" })).map((p) => p.id)).toEqual(["old"]);
  expect(filterBlogPosts(posts, normalizeBlogSearch({ desde: "2026-09-30", hasta: "2026-09-01" }))).toEqual([]);
});

test("ordering uses publication rather than edit dates and does not mutate the input", () => {
  const posts = [post("new", "2026-09-20T18:00:00Z"), post("old", "2026-08-20T18:00:00Z"), post("legacy", "2026-09-01T18:00:00Z", { publicadoEl: undefined, actualizadoEl: "2026-09-01T18:00:00Z" })];
  expect(filterBlogPosts(posts, normalizeBlogSearch({ orden: "antiguos" })).map((p) => p.id)).toEqual(["old", "legacy", "new"]);
  expect(filterBlogPosts(posts, normalizeBlogSearch({})).map((p) => p.id)).toEqual(["new", "legacy", "old"]);
  expect(posts.map((p) => p.id)).toEqual(["new", "old", "legacy"]);
});

test("invalid dates, array parameters and unknown views or ordering are normalized", () => {
  expect(normalizeBlogSearch({ desde: "2026-02-30", hasta: ["2026-09-20"], orden: "invalid", vista: "invalid" })).toMatchObject({ desde: "", hasta: "", orden: "recientes", vista: "cuadricula" });
  expect(normalizeBlogSearch({ desde: "2024-02-29", hasta: "2026-09-30", orden: "antiguos", vista: "lista" })).toMatchObject({ desde: "2024-02-29", hasta: "2026-09-30", orden: "antiguos", vista: "lista" });
  expect(normalizeBlogSearch({ desde: "2026-02-29", hasta: "0000-01-01" })).toMatchObject({ desde: "", hasta: "" });
});

test("navigation URLs retain date range, ordering and view along with existing filters", () => {
  const search = normalizeBlogSearch({ q: "crédito", tema: "comprar", tipo: "guia", desde: "2026-09-01", hasta: "2026-09-30", orden: "antiguos", vista: "lista", pagina: "2" });
  const url = new URL(blogHref(search), "https://example.com");
  expect(Object.fromEntries(url.searchParams)).toEqual({ q: "crédito", tema: "comprar", tipo: "guia", desde: "2026-09-01", hasta: "2026-09-30", orden: "antiguos", vista: "lista", pagina: "2" });
  expect(blogHref(normalizeBlogSearch({}))).toBe("/blog");
});
