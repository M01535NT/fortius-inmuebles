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
