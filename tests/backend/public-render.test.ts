import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Children, type ReactElement } from "react";
import RootLayout, { generateMetadata } from "@/app/layout";
import HomePage from "@/app/page";
import { InstitutionalVideo } from "@/components/sections/institutional-video";
import { matchRemotePattern } from "next/dist/shared/lib/match-remote-pattern";

vi.mock("next/font/google", () => ({ Archivo: () => ({ variable: "archivo" }), IBM_Plex_Mono: () => ({ variable: "plex" }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {} }) }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), connection: async () => {} }));

let content: Record<string, unknown>;
let settings: Record<string, unknown>;
beforeEach(() => {
  content = { heroTitulo: "Título del panel", heroSubtitulo: "Subtítulo publicado", manifiestoTitulo: "Proceso actualizado", manifiestoTexto: "Texto actualizado", seoTitle: "SEO publicado", seoDescription: "Descripción publicada", privateNote: "PRIVATE" };
  settings = { nombreComercial: "Firma publicada", telefono: "+52 664 123 4567", whatsapp: "+52 664 765 4321", email: "publico@example.com", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "/video-publico.mp4", privateNote: "PRIVATE" };
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cota-public-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const collection = JSON.parse(init.body).p_collection;
    return Response.json([{ data: collection === "contenido" ? content : settings }]);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test("root layout reads public settings for the next request and preserves smooth-scroll declaration", async () => {
  let html = renderToStaticMarkup(await RootLayout({ children: "Página" }));
  expect(html).toContain('data-scroll-behavior="smooth"');
  expect(html).toContain("Firma publicada");
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).not.toContain("PRIVATE");
  settings.nombreComercial = "Firma editada";
  settings.telefono = "+52 664 321 7654";
  html = renderToStaticMarkup(await RootLayout({ children: "Página" }));
  expect(html).toContain("Firma editada");
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
  expect(allowed("https://cota-public-test.supabase.co/storage/v1/object/public/cota-public/image.webp")).toBe(true);
  expect(allowed("https://cota-public-test.supabase.co/storage/v1/object/public/cota-private/private.webp")).toBe(false);
  expect(allowed("https://fvvmvnduvzxvodeombld.supabase.co/storage/v1/object/public/listings/old.webp")).toBe(false);
  expect(allowed("https://images.unsplash.com/photo.jpg")).toBe(true);
  expect(allowed("https://d8j0ntlcm91z4.cloudfront.net/photo.jpg")).toBe(true);
});
