import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
import { finalizarArchivo, prepararArchivo, tituloDe } from "@/lib/backend/expediente-archivos";

/* Documentos del cliente (titular, 29/10/2026): carga directa autorizada y registro con su integridad. */
const userId = "10000000-0000-4000-8000-000000000001";
const expediente = "51000000-0000-4000-8000-000000000010";
const stored = new Map<string, Blob>();
const rows: Record<string, unknown>[] = [];
let rejectRow = false;
const pdfBytes = "%PDF-1.7\nescritura de ejemplo";
const pdf = new Blob([pdfBytes], { type: "application/pdf" });

beforeEach(() => {
  stored.clear(); rows.length = 0; rejectRow = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key_only");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname === "/rest/v1/fortius_inmuebles_expediente_archivos") {
      if (rejectRow) return Response.json({ code: "XX000", message: "Unavailable" }, { status: 500 });
      const row = { ...JSON.parse(String(init.body)), created_at: "2026-10-29T10:00:00Z", deleted_at: null };
      rows.push(row);
      return Response.json(row, { status: 201 });
    }
    if (url.pathname.startsWith("/storage/v1/object/upload/sign/")) return Response.json({ url: `${url.pathname}?token=upload-test` });
    const key = decodeURIComponent(url.pathname.replace("/storage/v1/object/", ""));
    if (init.method === "DELETE") {
      const { prefixes } = JSON.parse(String(init.body)) as { prefixes: string[] };
      for (const prefix of prefixes) stored.delete(`${key}/${prefix}`);
      return Response.json([]);
    }
    if (init.method === "POST") {
      const body = init.body;
      const blob = body instanceof FormData ? [...body.values()].find((value) => value instanceof Blob) as Blob : new Blob([body as BlobPart]);
      stored.set(key, blob);
      return Response.json({ Key: key });
    }
    const data = stored.get(key);
    return data ? new Response(data) : Response.json({ statusCode: "404", error: "not_found", message: "Missing" }, { status: 404 });
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("documentos del cliente", () => {
  const client = () => createServerClient(undefined, true);
  const subir = async (name = "Escritura_casa.pdf") => {
    const prepared = await prepararArchivo(client(), userId, { name, size: pdf.size, contentType: "application/pdf" });
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    return prepared;
  };

  it("guarda el archivo en el bucket privado del expediente con su SHA-256 y retira la carga temporal", async () => {
    const prepared = await subir();
    const archivo = await finalizarArchivo(client(), userId, expediente, { ticket: prepared.ticket });
    expect(archivo).toMatchObject({ expediente_id: expediente, titulo: "Escritura casa", nombre_original: "Escritura_casa.pdf", mime: "application/pdf", uploaded_by: userId });
    expect(rows[0].sha256).toBe(createHash("sha256").update(pdfBytes).digest("hex"));
    expect(String(rows[0].path)).toMatch(new RegExp(`^${expediente}/cliente/[a-f0-9-]+\\.pdf$`));
    expect(stored.has(`fortius-inmuebles-expedientes/${rows[0].path}`)).toBe(true);
    expect(stored.has(`fortius-inmuebles-staging/${prepared.path}`)).toBe(false);
  });

  it("si el registro falla, el archivo no queda en el expediente sin su registro", async () => {
    const prepared = await subir();
    rejectRow = true;
    await expect(finalizarArchivo(client(), userId, expediente, { ticket: prepared.ticket, titulo: "Escritura" })).rejects.toThrow();
    expect([...stored.keys()].some(key => key.startsWith("fortius-inmuebles-expedientes/"))).toBe(false);
  });

  it("solo acepta PDF e imágenes, y el permiso es de quien lo pidió", async () => {
    await expect(prepararArchivo(client(), userId, { name: "video.mp4", size: 10, contentType: "video/mp4" })).rejects.toThrow();
    await expect(prepararArchivo(client(), userId, { name: "x.pdf", size: 25 * 1024 * 1024, contentType: "application/pdf" })).rejects.toThrow();
    const prepared = await subir();
    await expect(finalizarArchivo(client(), "10000000-0000-4000-8000-000000000002", expediente, { ticket: prepared.ticket })).rejects.toThrow(/Permiso de carga/);
  });

  it("el título inicial es el nombre del archivo sin extensión", () => {
    expect(tituloDe("CURP_Juan_Perez.pdf")).toBe("CURP Juan Perez");
    expect(tituloDe(".pdf")).toBe("Documento");
  });
});
