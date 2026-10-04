import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Children, type ReactElement } from "react";
import RootLayout, { generateMetadata } from "@/app/layout";
import HomePage from "@/app/page";
import { InstitutionalVideo } from "@/components/sections/institutional-video";
import { matchRemotePattern } from "next/dist/shared/lib/match-remote-pattern";
import type { Metadata } from "next";
import { propiedades } from "@/data/propiedades";
import { siteConfig } from "@/data/site";
import PropertyDetailPage, { generateMetadata as propertyMetadata } from "@/app/inventario/[slug]/page";

vi.mock("next/font/google", () => ({ Archivo: () => ({ variable: "archivo" }), IBM_Plex_Mono: () => ({ variable: "plex" }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-mnt-pathname": "/" }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {} }) }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), connection: async () => {} }));

let content: Record<string, unknown>;
let settings: Record<string, unknown>;
let publicProperty: Record<string, unknown>;
const initialSiteUrl = siteConfig.url;
beforeEach(() => {
  content = { heroTitulo: "Título del panel", heroSubtitulo: "Subtítulo publicado", manifiestoTitulo: "Proceso actualizado", manifiestoTexto: "Texto actualizado", seoTitle: "SEO publicado", seoDescription: "Descripción publicada", privateNote: "PRIVATE" };
  settings = { nombreComercial: "Firma publicada", telefono: "+52 664 123 4567", whatsapp: "+52 664 765 4321", email: "publico@example.com", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "/video-publico.mp4", privateNote: "PRIVATE" };
  publicProperty = { ...propiedades[0], publicada: true, galeria: [{ src: "/hero/casa-playa.webp", alt: "Casa" }, { src: "https://images.unsplash.com/remote.jpg", alt: "Remota" }] };
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mnt-public-test.supabase.co");
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
test("home passes projected panel copy and metadata reads subsequent edits without a build", async () => {
  const home = await HomePage();
  const sections = Children.toArray(home.props.children) as ReactElement<{ content?: unknown }>[];
  expect(sections[0].props.content).toMatchObject({ heroTitulo: "Título del panel" });
  expect(sections[1].props.content).toMatchObject({ manifiestoTexto: "Texto actualizado" });
  expect(sections[0].props.content).not.toHaveProperty("privateNote");
  expect((await generateMetadata()).description).toBe("Descripción publicada");
  content.seoDescription = "Descripción editada";
  expect((await generateMetadata()).description).toBe("Descripción editada");
});
test("institutional video reads the configured public URL and retains its placeholder when empty", async () => {
  expect(renderToStaticMarkup(await InstitutionalVideo())).toContain('src="/video-publico.mp4"');
  settings.videoInstitucionalUrl = "";
  expect(renderToStaticMarkup(await InstitutionalVideo())).toContain("Espacio reservado para el video institucional.");
});
test("image optimization allows only the configured public bucket and existing external hosts", async () => {
  const config = (await import("../../next.config")).default;
  const allowed = (url: string) => config.images!.remotePatterns!.some((pattern) => matchRemotePattern(pattern, new URL(url)));
  expect(allowed("https://mnt-public-test.supabase.co/storage/v1/object/public/mnt-public/image.webp")).toBe(true);
  expect(allowed("https://mnt-public-test.supabase.co/storage/v1/object/public/mnt-private/private.webp")).toBe(false);
  expect(allowed("https://fvvmvnduvzxvodeombld.supabase.co/storage/v1/object/public/listings/old.webp")).toBe(false);
  expect(allowed("https://images.unsplash.com/photo.jpg")).toBe(true);
  expect(allowed("https://d8j0ntlcm91z4.cloudfront.net/photo.jpg")).toBe(true);
});

test("legacy public PDF keeps a permanent route to the Fortius asset", async () => {
  const config = (await import("../../next.config")).default;
  expect(await config.redirects?.()).toContainEqual({
    source: "/descargas/checklist-venta-cota.pdf",
    destination: "/descargas/checklist-venta-fortius.pdf",
    permanent: true,
  });
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
  ["/residencial", () => import("@/app/residencial/page")],
  ["/comercial", () => import("@/app/comercial/page")],
  ["/industrial", () => import("@/app/industrial/page")],
  ["/comprar-propiedad", () => import("@/app/comprar-propiedad/page")],
  ["/vender-propiedad", () => import("@/app/vender-propiedad/page")],
  ["/vender-propiedad/gracias", () => import("@/app/vender-propiedad/gracias/page")],
  ["/due-diligence-inmobiliaria", () => import("@/app/due-diligence-inmobiliaria/page")],
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
  ["http://localhost:3001", "https://fortius-inmuebles.vercel.app"],
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
  const data = JSON.parse(html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>")));
  expect(data.url).toBe(`${siteConfig.url}/inventario/residencia-vista-al-mar-playas`);
  expect(data.image).toEqual([`${siteConfig.url}/hero/casa-playa.webp`, "https://images.unsplash.com/remote.jpg"]);
  expect(html).not.toContain("mnt.example");
});
