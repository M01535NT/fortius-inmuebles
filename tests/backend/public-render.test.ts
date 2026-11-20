import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Children, type ReactElement } from "react";
import RootLayout, { generateMetadata } from "@/app/layout";
import HomePage from "@/app/page";
import NosotrosPage from "@/app/nosotros/page";
import { matchRemotePattern } from "next/dist/shared/lib/match-remote-pattern";
import type { Metadata } from "next";
import { propiedades } from "../fixtures/propiedades";
import { siteConfig } from "@/data/site";
import PropertyDetailPage, { generateMetadata as propertyMetadata } from "@/app/inventario/[slug]/page";

vi.mock("next/font/google", () => ({ Archivo: () => ({ variable: "archivo" }), IBM_Plex_Mono: () => ({ variable: "plex" }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-fortius-inmuebles-pathname": "/" }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {} }) }));
vi.mock("@/lib/backend/public-team", () => ({ getPublishedTeam: async () => [] })); // sin asesores publicados: perfil de ejemplo
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), connection: async () => {} }));

let content: Record<string, unknown>;
let settings: Record<string, unknown>;
let publicProperty: Record<string, unknown>;
const initialSiteUrl = siteConfig.url;
beforeEach(() => {
  content = { heroTitulo: "Título del panel", heroSubtitulo: "Subtítulo publicado", manifiestoTitulo: "Proceso actualizado", manifiestoTexto: "Texto actualizado", seoTitle: "SEO publicado", seoDescription: "Descripción publicada", privateNote: "PRIVATE" };
  settings = { nombreComercial: "Firma publicada", telefono: "+52 664 123 4567", whatsapp: "+52 664 765 4321", email: "publico@example.com", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "/video-publico.mp4", privateNote: "PRIVATE" };
  publicProperty = { ...propiedades[0], publicada: true, galeria: [{ src: "/hero/casa-playa.webp", alt: "Casa" }, { src: "https://images.unsplash.com/remote.jpg", alt: "Remota" }] };
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-public-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const collection = JSON.parse(init.body).p_collection;
    return Response.json(collection === "asesores" ? [] : [{ data: collection === "contenido" ? content : collection === "propiedades" ? publicProperty : settings }]);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); siteConfig.url = initialSiteUrl; });

test("root layout reads public contact settings for the next request and preserves smooth-scroll declaration", async () => {
  let html = renderToStaticMarkup(await RootLayout({ children: "Página" }));
  expect(html).toContain('data-scroll-behavior="smooth"');
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).not.toContain("PRIVATE");
  settings.nombreComercial = "Firma editada";
  settings.telefono = "+52 664 321 7654";
  html = renderToStaticMarkup(await RootLayout({ children: "Página" }));
  expect(html).toContain('href="tel:+526643217654"');
});
test("metadata reads subsequent panel edits without a build", async () => {
  expect((await generateMetadata()).description).toBe("Descripción publicada");
  content.seoDescription = "Descripción editada";
  expect((await generateMetadata()).description).toBe("Descripción editada");
});
test("la tira del inicio muestra lo publicado aunque no sea destacado y nunca lo vendido", async () => {
  publicProperty.destacada = false;
  const slug = String(publicProperty.slug);
  expect(renderToStaticMarkup(await HomePage())).toContain(`href="/inventario/${slug}"`);
  publicProperty.estado = "vendida";
  expect(renderToStaticMarkup(await HomePage())).not.toContain(`href="/inventario/${slug}"`);
});
test("nosotros shows the institutional video from settings and hides the block when empty", async () => {
  let html = renderToStaticMarkup(await NosotrosPage());
  expect(html).toContain('src="/video-publico.mp4"');
  expect(html).toContain('id="video"');
  settings.videoInstitucionalUrl = "";
  html = renderToStaticMarkup(await NosotrosPage());
  expect(html).not.toContain("<video");
  expect(html).not.toContain('id="video"');
  expect(html).not.toContain("PRIVATE");
});
test("image optimization allows only the configured public bucket and existing external hosts", async () => {
  const config = (await import("../../next.config")).default;
  const allowed = (url: string) => config.images!.remotePatterns!.some((pattern) => matchRemotePattern(pattern, new URL(url)));
  expect(allowed("https://fortius-inmuebles-public-test.supabase.co/storage/v1/object/public/fortius-inmuebles-public/image.webp")).toBe(true);
  expect(allowed("https://fortius-inmuebles-public-test.supabase.co/storage/v1/object/public/fortius-inmuebles-private/private.webp")).toBe(false);
  expect(allowed("https://fvvmvnduvzxvodeombld.supabase.co/storage/v1/object/public/listings/old.webp")).toBe(false);
  expect(allowed("https://images.unsplash.com/photo.jpg")).toBe(true);
  expect(allowed("https://d8j0ntlcm91z4.cloudfront.net/photo.jpg")).toBe(true);
});

test("legacy public PDF keeps a permanent route to the Fortius asset", async () => {
  const config = (await import("../../next.config")).default;
  expect(await config.redirects?.()).toHaveLength(27);
  expect(await config.redirects?.()).toContainEqual({
    source: "/descargas/checklist-venta-mnt.pdf",
    destination: "/descargas/checklist-venta-fortius.pdf",
    permanent: true,
  });
});

test("las listas anteriores del panel redirigen a sus secciones nuevas sin tocar las fichas de detalle", async () => {
  const redirects = await (await import("../../next.config")).default.redirects!();
  const panel = redirects.filter(r => r.source.startsWith("/admin-anterior/"));
  const simple = Object.fromEntries(panel.filter(r => !("has" in r)).map(r => [r.source, r.destination]));
  expect(simple).toEqual({
    "/admin-anterior/expedientes": "/admin-anterior/operaciones",
    "/admin-anterior/proceso/preparacion": "/admin-anterior/operaciones?etapa=verificacion-precio",
    "/admin-anterior/proceso/promocion": "/admin-anterior/operaciones?etapa=publicacion-seguimiento",
    "/admin-anterior/proceso/negociacion": "/admin-anterior/operaciones?etapa=visitas-ofertas",
    "/admin-anterior/proceso/cierre": "/admin-anterior/operaciones?etapa=cierre-entrega",
    "/admin-anterior/proceso/postventa": "/admin-anterior/operaciones?etapa=cierre-entrega",
    "/admin-anterior/proceso/:etapa": "/admin-anterior/operaciones?etapa=:etapa",
    "/admin-anterior/leads": "/admin-anterior/contactos",
    "/admin-anterior/clientes": "/admin-anterior/contactos?tab=clientes",
    "/admin-anterior/calendario": "/admin-anterior/agenda",
    "/admin-anterior/tareas": "/admin-anterior/agenda?tab=tareas",
    "/admin-anterior/apps": "/admin-anterior/herramientas",
    "/admin-anterior/documentos": "/admin-anterior/herramientas",
  });
  // Un expediente enlazado con ?expediente=<id> abre su operación; las fichas de detalle no se redirigen.
  expect(panel.find(r => "has" in r)).toMatchObject({ source: "/admin-anterior/operaciones", destination: "/admin-anterior/operaciones/:id", has: [{ type: "query", key: "expediente" }] });
  expect(panel.every(r => r.permanent === false && !/\/(leads|clientes|tareas|apps)\/:/.test(r.source))).toBe(true);
});

test("root metadata resolves relative images on production without imposing an inherited home canonical", async () => {
  const metadata = await generateMetadata();
  expect(metadata.metadataBase?.toString()).toBe(`${siteConfig.url}/`);
  expect(metadata.alternates?.canonical).toBeUndefined();
  expect(JSON.stringify(metadata)).not.toContain("mnt.example");
});

const publicPages: [string, () => Promise<{ metadata: Metadata } >][] = [
  ["/", () => import("@/app/page")],
  ["/contacto", () => import("@/app/contacto/page")],
  ["/inventario", () => import("@/app/inventario/page")],
  ["/opinion-de-valor", () => import("@/app/opinion-de-valor/page")],
  ["/preguntas-frecuentes", () => import("@/app/preguntas-frecuentes/page")],
  ["/comprar-propiedad", () => import("@/app/comprar-propiedad/page")],
  ["/vender-propiedad", () => import("@/app/vender-propiedad/page")],
  ["/vender-propiedad/gracias", () => import("@/app/vender-propiedad/gracias/page")],
  ["/herramientas", () => import("@/app/herramientas/page")],
  ["/herramientas/hipoteca", () => import("@/app/herramientas/hipoteca/page")],
  ["/herramientas/gastos-de-cierre", () => import("@/app/herramientas/gastos-de-cierre/page")],
  ["/nosotros", () => import("@/app/nosotros/page")],
  ["/privacidad", () => import("@/app/privacidad/page")],
  ["/terminos", () => import("@/app/terminos/page")],
];
test.each(publicPages)("public page %s declares its own canonical path", async (path, load) => {
  expect((await load()).metadata?.alternates?.canonical).toBe(path);
});
test.each([
  ["https://fortius-inmuebles.vercel.app", "https://fortius-inmuebles.vercel.app"],
  ["http://localhost:3001", "https://fortiusinmuebles.com"],
  ["https://inmuebles.example.org", "https://inmuebles.example.org"],
])("dynamic details share public canonical and OG URLs from %s while keeping demo noindex", async (configuredUrl, publicOrigin) => {
  siteConfig.url = configuredUrl;
  const metadata = await propertyMetadata({ params: Promise.resolve({ slug: propiedades[0].slug }) });
  expect(metadata.alternates?.canonical).toBe(`${publicOrigin}/inventario/residencia-vista-al-mar-playas`);
  expect(metadata.openGraph).toMatchObject({
    url: `${publicOrigin}/inventario/residencia-vista-al-mar-playas`,
    images: [{ url: `${publicOrigin}/inventario/residencia-vista-al-mar-playas/imagen-social`, type: "image/jpeg", width: 1200, height: 630 }],
  });
  expect(metadata.robots).toEqual({ index: false, follow: true });
  expect(JSON.stringify(metadata)).not.toContain("mnt.example");
});
test("the three specialty pages became inventory filters", async () => {
  const config = (await import("../../next.config")).default;
  const redirects = await config.redirects?.();
  for (const segmento of ["residencial", "comercial", "industrial"]) {
    expect(redirects).toContainEqual({ source: `/${segmento}`, destination: `/inventario?segmento=${segmento}`, permanent: true });
  }
});
test("retired zone pages redirect to inventory and leave the sitemap", async () => {
  const config = (await import("../../next.config")).default;
  const redirects = await config.redirects?.();
  expect(redirects).toContainEqual({ source: "/zonas", destination: "/inventario", permanent: true });
  expect(redirects).toContainEqual({ source: "/zonas/:zona", destination: "/inventario", permanent: true });
  const sitemap = (await import("@/app/sitemap")).default;
  expect((await sitemap()).some((entry) => entry.url.includes("/zonas"))).toBe(false);
});
test("rendered listing structured data uses production URLs for local assets and preserves remote URLs", async () => {
  const page = await PropertyDetailPage({ params: Promise.resolve({ slug: propiedades[0].slug }) });
  const script = (Children.toArray(page.props.children) as ReactElement[]).find((child) => child.type === "script")!;
  const html = renderToStaticMarkup(script);
  const graph = JSON.parse(html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>")))["@graph"];
  const data = graph.find((node: { "@type": string }) => node["@type"] === "RealEstateListing");
  const crumbs = graph.find((node: { "@type": string }) => node["@type"] === "BreadcrumbList");
  expect(data.address.addressLocality).toBe("Tijuana");
  expect(crumbs.itemListElement.at(-1).item).toBe(`${siteConfig.url}/inventario/residencia-vista-al-mar-playas`);
  expect(data.url).toBe(`${siteConfig.url}/inventario/residencia-vista-al-mar-playas`);
  expect(data.image).toEqual([`${siteConfig.url}/hero/casa-playa.webp`, "https://images.unsplash.com/remote.jpg"]);
  expect(html).not.toContain("mnt.example");
});
