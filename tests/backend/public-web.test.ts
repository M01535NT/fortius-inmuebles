import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { propiedades } from "@/data/propiedades";
import { getPropiedades, getPropertyBySlug, getFeaturedProperties } from "@/lib/inventario";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { enviarProspecto } from "@/lib/prospectos";
import { POST } from "@/app/api/leads/route";

let records: Record<string, unknown>[];
let persisted: unknown[];
let rejectWrite: boolean;
beforeEach(() => {
  records = [{ ...propiedades[0], demo: false, publicada: true, notasPrivadas: "SECRET", galeria: [{ src: "/hero/casa-playa.webp", alt: "Casa" }, { src: "/api/admin/files/secret", alt: "Privada" }] }];
  persisted = [];
  rejectWrite = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cota-public-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/leads") return POST(new Request("http://localhost/api/leads", { ...init, headers: { "content-type": "application/json", origin: "http://localhost" } }));
    if (url.split("?")[0].endsWith("/rest/v1/rpc/cota_public_records")) {
      const body = JSON.parse(String(init?.body));
      return Response.json(body.p_collection === "propiedades" ? records.map((data) => ({ data })) : []);
    }
    if (url.endsWith("/rest/v1/rpc/cota_capture_lead")) {
      if (rejectWrite) return Response.json({ message: "Database unavailable", code: "XX000" }, { status: 503 });
      persisted.push(JSON.parse(String(init?.body)).p_data);
      return Response.json("lead-confirmed");
    }
    // The old platform has no records for the independent COTA product.
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
test("sitemap includes only currently published non-demo details", async () => {
  records.push({ ...propiedades[1], publicada: true, demo: true }, { ...propiedades[2], publicada: false, demo: false });
  const urls = (await sitemap()).map((row) => row.url);
  expect(urls).toContain(`https://cota-eight.vercel.app/inventario/${propiedades[0].slug}`);
  expect(urls).not.toContain(`https://cota-eight.vercel.app/inventario/${propiedades[1].slug}`);
  expect(urls).not.toContain(`https://cota-eight.vercel.app/inventario/${propiedades[2].slug}`);
  expect(urls.every((url) => new URL(url).origin === "https://cota-eight.vercel.app")).toBe(true);
  expect(JSON.stringify(urls)).not.toContain("cota.example");
});
test("robots directs crawlers to the real public sitemap and keeps admin excluded", () => {
  expect(robots()).toMatchObject({ sitemap: "https://cota-eight.vercel.app/sitemap.xml", rules: { disallow: "/admin" } });
  expect(JSON.stringify(robots())).not.toContain("cota.example");
});
test("legacy lead entry reports success only after same-origin BFF persistence", async () => {
  const id = await enviarProspecto({ nombre: "Consulta pública", telefono: "6641234567", origen: "contacto" });
  expect(id).toBe("lead-confirmed");
  expect(persisted).toEqual([{ nombre: "Consulta pública", telefono: "6641234567", origen: "contacto" }]);
});
test("failed remote persistence rejects instead of reporting lead success", async () => {
  rejectWrite = true;
  await expect(enviarProspecto({ nombre: "Consulta pública", telefono: "6641234567", origen: "contacto" })).rejects.toThrow();
  expect(persisted).toEqual([]);
});
