import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { propiedades } from "../fixtures/propiedades";
import { getPropiedades, getPropertyBySlug, getFeaturedProperties } from "@/lib/inventario";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { siteConfig } from "@/data/site";

vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(), cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));

let records: Record<string, unknown>[];
beforeEach(() => {
  records = [{ ...propiedades[0], demo: false, publicada: true, notasPrivadas: "SECRET", galeria: [{ src: "/hero/casa-playa.webp", alt: "Casa" }, { src: "/api/admin/files/secret", alt: "Privada" }] }];
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-public-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.split("?")[0].endsWith("/rest/v1/rpc/fortius_inmuebles_public_records")) {
      const body = JSON.parse(String(init?.body));
      return Response.json(body.p_collection === "propiedades" ? records.map((data) => ({ data })) : []);
    }
    // The old platform has no records for the independent MNT product.
    return Response.json([]);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test("publication and edits change public inventory on the next read; unpublishing removes the detail", async () => {
  expect((await getPropiedades()).map((p) => p.slug)).toEqual([propiedades[0].slug]);
  records[0].titulo = "Título actualizado por el panel";
  expect((await getPropertyBySlug(propiedades[0].slug))?.titulo).toBe("Título actualizado por el panel");
  expect(await getFeaturedProperties()).toHaveLength(1);
  records[0].publicada = false;
  expect(await getPropiedades()).toEqual([]);
  expect(await getPropertyBySlug(propiedades[0].slug)).toBeUndefined();
});
test("public results exclude unpublished records, private fields and private assets", async () => {
  records.push({ ...propiedades[1], publicada: false });
  const visible = await getPropiedades();
  expect(visible).toHaveLength(1);
  expect(visible[0]).not.toHaveProperty("notasPrivadas");
  expect(visible[0].galeria).toEqual([{ src: "/hero/casa-playa.webp", alt: "Casa" }]);
});
test("featured inventory preserves published demos and excludes unavailable real or unpublished records", async () => {
  const base = records[0];
  records = [
    { ...base, slug: "real", destacada: true, demo: false, estado: "disponible" },
    { ...base, slug: "demo", destacada: true, demo: true, estado: "disponible" },
    { ...base, slug: "demo-reserved", destacada: true, demo: true, estado: "apartada" },
    { ...base, slug: "sold", destacada: true, estado: "vendida" },
    { ...base, slug: "reserved", destacada: true, estado: "apartada" },
    { ...base, slug: "rented", destacada: true, operacion: "renta", estado: "rentada" },
    { ...base, slug: "draft", destacada: true, publicada: false },
    { ...base, slug: "ordinary", destacada: false },
  ];
  expect((await getFeaturedProperties()).map((p) => p.slug)).toEqual(["real", "demo", "demo-reserved"]);
  records = records.filter((p) => p.slug !== "real" && p.slug !== "demo" && p.slug !== "demo-reserved");
  expect(await getFeaturedProperties()).toEqual([]);
});
test("sitemap includes only currently published non-demo details", async () => {
  records.push({ ...propiedades[1], publicada: true, demo: true }, { ...propiedades[2], publicada: false, demo: false });
  const urls = (await sitemap()).map((row) => row.url);
  expect(urls).toContain(`${siteConfig.url}/inventario/${propiedades[0].slug}`);
  expect(urls).not.toContain(`${siteConfig.url}/inventario/${propiedades[1].slug}`);
  expect(urls).not.toContain(`${siteConfig.url}/inventario/${propiedades[2].slug}`);
  expect(urls.every((url) => new URL(url).origin === siteConfig.url)).toBe(true);
  expect(JSON.stringify(urls)).not.toContain("mnt.example");
});
test("robots directs crawlers to the real public sitemap and keeps admin excluded", () => {
  expect(robots()).toMatchObject({ sitemap: `${siteConfig.url}/sitemap.xml`, rules: { disallow: "/admin" } });
  expect(JSON.stringify(robots())).not.toContain("mnt.example");
});
