import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import BlogPage from "@/app/blog/page";
import BlogPostPage, {
  generateMetadata as generatePostMetadata,
} from "@/app/blog/[slug]/page";
import sitemap from "@/app/sitemap";
import { propiedades as propertyFixtures } from "@/data/propiedades";
import { siteConfig } from "@/data/site";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog";

const published = {
  id: "post-1",
  slug: "guia-de-compra",
  titulo: "Guía de compra <segura>",
  resumen: "Cómo revisar una compra & decidir con información.",
  contenido: "Primer párrafo <script>alert('x')</script>.\n\nSegundo párrafo & cierre.",
  estado: "publicado",
  actualizadoEl: "2026-09-04T18:30:00.000Z",
};
const draft = {
  ...published,
  id: "post-2",
  slug: "borrador-interno",
  titulo: "Borrador interno",
  estado: "borrador",
};

let posts: Record<string, unknown>[];
let properties: Record<string, unknown>[];

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

beforeEach(() => {
  posts = [published, draft];
  properties = [
    {
      ...propertyFixtures[0],
      slug: "casa-publicada",
      demo: false,
      publicada: true,
      publicadaEl: "2026-08-15",
    },
  ];
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mnt-public-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  vi.stubGlobal("fetch", vi.fn(async (_input, init) => {
    const collection = JSON.parse(String(init?.body)).p_collection;
    const rows = collection === "posts" ? posts : collection === "propiedades" ? properties : [];
    return Response.json(rows.map((data) => ({ data })));
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test("the public reader exposes published posts and never returns a draft by slug", async () => {
  expect((await getBlogPosts()).map((post) => post.slug)).toEqual(["guia-de-compra"]);
  expect((await getBlogPostBySlug("guia-de-compra"))?.titulo).toBe("Guía de compra <segura>");
  expect(await getBlogPostBySlug("borrador-interno")).toBeUndefined();
});

test("the blog index has a useful empty state and links every published entry", async () => {
  let html = renderToStaticMarkup(await BlogPage());
  expect(html).toContain('href="/blog/guia-de-compra"');
  expect(html).not.toContain("Borrador interno");

  posts = [];
  html = renderToStaticMarkup(await BlogPage());
  expect(html).toContain("Aún no hay artículos publicados");
});

test("the detail renders plain paragraphs with escaped stored text", async () => {
  const html = renderToStaticMarkup(
    await BlogPostPage({ params: Promise.resolve({ slug: "guia-de-compra" }) }),
  );
  expect(html).toContain("Primer párrafo &lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;.");
  expect(html).toContain("Segundo párrafo &amp; cierre.");
  expect(html).not.toContain("<script>alert");
});

test("the detail renders headings and contiguous lists without merging ordinary paragraphs", async () => {
  posts = [{ ...published, contenido: "Introducción\r\nsegunda línea\r\n\r\n## Documentos\r\n- Escritura\r\n- Identificación\r\n### Pasos\r\n1. Revisar\r\n2. Comparar\r\n\r\nCierre" }];
  const html = renderToStaticMarkup(await BlogPostPage({ params: Promise.resolve({ slug: published.slug }) }));
  expect(html).toMatch(/<p[^>]*>Introducción\nsegunda línea<\/p>/);
  expect(html).toMatch(/<h2[^>]*>Documentos<\/h2>/);
  expect(html).toMatch(/<h3[^>]*>Pasos<\/h3>/);
  expect(html).toMatch(/<ul[^>]*><li[^>]*>Escritura<\/li><li[^>]*>Identificación<\/li><\/ul>/);
  expect(html).toMatch(/<ol[^>]*><li[^>]*>Revisar<\/li><li[^>]*>Comparar<\/li><\/ol>/);
  expect(html).toMatch(/<p[^>]*>Cierre<\/p>/);
});

test.each([
  ["/contacto?tema=compra#formulario", true],
  ["https://example.com/fuente", true],
  ["http://example.com/fuente", true],
  ["javascript:alert%281%29", false],
  ["JaVaScRiPt:alert%281%29", false],
  ["data:text/html,malicioso", false],
  ["//example.com", false],
  ["/\\example.com", false],
  ["https:\\example.com", false],
  ["https://", false],
  ["mailto:test@example.com", false],
  ["/\t/example.com", false],
])("stored Markdown URL %s has safe link status %s", async (url, allowed) => {
  posts = [{ ...published, contenido: `Consulta [fuente](${url}).` }];
  const html = renderToStaticMarkup(await BlogPostPage({ params: Promise.resolve({ slug: published.slug }) }));
  expect(/<a[^>]*>fuente<\/a>/.test(html)).toBe(allowed);
  if (allowed) expect(html).toContain(`href="${url.replaceAll("&", "&amp;")}"`);
  else expect(html).toContain("[fuente](");
});

test("raw HTML in rich content remains inert while long source links can wrap", async () => {
  const url = `https://example.com/${"documento".repeat(40)}`;
  posts = [{ ...published, contenido: `## <img src=x onerror=alert(1)>\n\n[${url}](${url})\n\n<script>alert(1)</script>` }];
  const html = renderToStaticMarkup(await BlogPostPage({ params: Promise.resolve({ slug: published.slug }) }));
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).not.toContain("<img");
  expect(html).not.toContain("<script>");
  expect(html).toMatch(new RegExp(`<a[^>]*class="[^"]*\\[overflow-wrap:anywhere\\][^"]*"[^>]*>${url}</a>`));
});

test("article update date comes from the stored record", async () => {
  const html = renderToStaticMarkup(await BlogPostPage({ params: Promise.resolve({ slug: published.slug }) }));
  expect(html).toContain('dateTime="2026-09-04T18:30:00.000Z"');
  expect(html).toContain("4 de septiembre de 2026");
});

test("a draft or unknown blog slug returns not found", async () => {
  await expect(BlogPostPage({ params: Promise.resolve({ slug: "borrador-interno" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  await expect(BlogPostPage({ params: Promise.resolve({ slug: "inexistente" }) })).rejects.toThrow("NEXT_NOT_FOUND");
});

test("blog metadata uses the stored title, summary and canonical slug", async () => {
  expect(await generatePostMetadata({ params: Promise.resolve({ slug: "guia-de-compra" }) })).toMatchObject({
    title: "Guía de compra <segura>",
    description: "Cómo revisar una compra & decidir con información.",
    alternates: { canonical: "/blog/guia-de-compra" },
    openGraph: { url: `${siteConfig.url}/blog/guia-de-compra` },
  });
  expect(await generatePostMetadata({ params: Promise.resolve({ slug: "borrador-interno" }) })).toEqual({});
});

test("sitemap dates come from records while static routes have no fabricated lastModified", async () => {
  const rows = await sitemap();
  const home = rows.find((row) => row.url === siteConfig.url)!;
  const blog = rows.find((row) => row.url === `${siteConfig.url}/blog`)!;
  const post = rows.find((row) => row.url.endsWith("/blog/guia-de-compra"))!;
  const property = rows.find((row) => row.url.endsWith("/inventario/casa-publicada"))!;

  expect(home.lastModified).toBeUndefined();
  expect(blog.lastModified).toBeUndefined();
  expect(post.lastModified).toEqual(new Date("2026-09-04T18:30:00.000Z"));
  expect(property.lastModified).toEqual(new Date("2026-08-15"));
  expect(rows.some((row) => row.url.endsWith("/blog/borrador-interno"))).toBe(false);
});
