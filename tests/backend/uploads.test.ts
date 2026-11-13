import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServerClient } from "@/lib/backend/auth";
import sharp from "sharp";
import { autorizarDestino, prepareUpload, completeUpload } from "@/lib/backend/files";

const userId = "10000000-0000-4000-8000-000000000001";
const stored = new Map<string, Blob>();
const receipts: { bucket: string; path: string; uploaded_by: string }[] = [];
let rejectReceipt = false;
const pdf = new Blob(["%PDF-1.7\nreal bytes"], { type: "application/pdf" });

beforeEach(() => {
  stored.clear();
  receipts.length = 0; rejectReceipt = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key_only");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname === "/rest/v1/fortius_inmuebles_file_uploads") {
      if (rejectReceipt) return Response.json({ code: "XX000", message: "Unavailable" }, { status: 500 });
      receipts.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 201 });
    }
    if (url.pathname.startsWith("/storage/v1/object/upload/sign/")) return Response.json({ url: `${url.pathname}?token=upload-test` });
    const key = decodeURIComponent(url.pathname.replace("/storage/v1/object/", ""));
    if (init.method === "DELETE") {
      const { prefixes } = JSON.parse(String(init.body)) as { prefixes: string[] };
      for (const prefix of prefixes) stored.delete(`${key}/${prefix}`);
      return Response.json([]);
    }
    if (init.method === "POST") {
      if (stored.has(key)) return Response.json({ statusCode: "409", error: "Duplicate", message: "The resource already exists" }, { status: 409 });
      const body = init.body;
      let blob: Blob;
      if (body instanceof FormData) blob = [...body.values()].find((value) => value instanceof Blob) as Blob;
      else blob = new Blob([body as BlobPart]);
      stored.set(key, blob);
      return Response.json({ Key: key });
    }
    const data = stored.get(key);
    return data ? new Response(data) : Response.json({ statusCode: "404", error: "not_found", message: "Missing" }, { status: 404 });
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("direct upload staging and authenticated completion", () => {
  const client = () => createServerClient(undefined, true);
  const input = () => ({ name: "brochure.pdf", size: pdf.size, contentType: "application/pdf", visibility: "public", destino: "inmueble" });
  it("persists server-authenticated provenance before returning a final file", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(receipts).toEqual([{ bucket: "fortius-inmuebles-public", path: result.path, uploaded_by: userId }]);
  });
  it("does not return an unverified final path when provenance persistence fails", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf); rejectReceipt = true;
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toThrow();
    expect(stored.has(`fortius-inmuebles-public/${prepared.path}`)).toBe(false);
    expect(stored.has(`fortius-inmuebles-staging/${prepared.path}`)).toBe(true);
  });
  it("keeps staging private until the exact signed file is validated, then publishes the verified bytes", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    expect(prepared.signedUrl).toContain("fortius-inmuebles-staging");
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(result).toMatchObject({ bucket: "fortius-inmuebles-public", name: "brochure.pdf", type: "application/pdf" });
    expect(await stored.get(`fortius-inmuebles-public/${result.path}`)?.text()).toBe("%PDF-1.7\nreal bytes");
    expect(stored.has(`fortius-inmuebles-staging/${prepared.path}`)).toBe(false);
  });
  it("rejects manipulated, expired, and foreign-user tickets without publishing", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    const [payload, signature] = prepared.ticket.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    decoded.visibility = "private";
    const manipulated = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${signature}`;
    await expect(completeUpload(client(), userId, manipulated)).rejects.toMatchObject({ status: 403 });
    await expect(completeUpload(client(), "10000000-0000-4000-8000-000000000002", prepared.ticket)).rejects.toMatchObject({ status: 403 });
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 11 * 60000);
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 403 });
    expect([...stored.keys()].every((key) => key.startsWith("fortius-inmuebles-staging/"))).toBe(true);
  });
  it("never publishes invalid bytes or a size mismatch, even when MIME is claimed to be PDF", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, new Blob(["x".repeat(pdf.size)], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 400 });
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, new Blob(["%PDF-1.7\nother-size".repeat(10)], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 400 });
    expect([...stored.keys()].some((key) => key.startsWith("fortius-inmuebles-public/"))).toBe(false);
  });
  it("defaults to private and rejects oversized preparation before issuing upload capability", async () => {
    await expect(prepareUpload(client(), userId, { ...input(), size: 20971521 })).rejects.toThrow();
    const { visibility: _visibility, ...privateInput } = input(); void _visibility;
    const prepared = await prepareUpload(client(), userId, privateInput);
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(result.bucket).toBe("fortius-inmuebles-private");
    expect(result.url).toContain("/api/admin/files?");
    expect(result.url).not.toContain("token=");
  });
  it("accepts a full 20 MB file and prevents replay from overwriting final bytes", async () => {
    const bytes = new Uint8Array(20971520); bytes.set(new TextEncoder().encode("%PDF-1.7\n"));
    const large = new Blob([bytes], { type: "application/pdf" });
    const prepared = await prepareUpload(client(), userId, { ...input(), size: large.size });
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, large);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(stored.get(`fortius-inmuebles-public/${result.path}`)?.size).toBe(20971520);
    // A still-valid signed upload URL might refill the temporary path. Its ticket
    // must never authorize overwriting the already validated final file.
    bytes[20] = 1;
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, new Blob([bytes], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 409 });
    expect(new Uint8Array(await stored.get(`fortius-inmuebles-public/${result.path}`)!.slice(20, 21).arrayBuffer())[0]).toBe(0);
  });
  it("M4: una foto pública se guarda sin EXIF ni GPS y girada; la privada conserva sus bytes", async () => {
    const photo = await sharp({ create: { width: 40, height: 20, channels: 3, background: "#061F3F" } })
      .withExif({ IFD0: { Make: "Telefono de ejemplo" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "32/1 31/1 0/1" } })
      .withMetadata({ orientation: 6 }).jpeg().toBuffer();
    expect((await sharp(photo).metadata()).exif).toBeDefined();
    const blob = new Blob([new Uint8Array(photo)], { type: "image/jpeg" });
    const asked = { name: "casa.jpg", size: blob.size, contentType: "image/jpeg" };

    const publica = await prepareUpload(client(), userId, { ...asked, visibility: "public", destino: "inmueble" });
    stored.set(`fortius-inmuebles-staging/${publica.path}`, blob);
    const saved = await completeUpload(client(), userId, publica.ticket);
    const clean = await sharp(Buffer.from(await stored.get(`fortius-inmuebles-public/${saved.path}`)!.arrayBuffer())).metadata();
    expect(clean.exif).toBeUndefined();
    expect(clean.orientation ?? 1).toBe(1);
    expect([clean.width, clean.height]).toEqual([20, 40]);

    const privada = await prepareUpload(client(), userId, { ...asked, visibility: "private" });
    stored.set(`fortius-inmuebles-staging/${privada.path}`, blob);
    const kept = await completeUpload(client(), userId, privada.ticket);
    expect(Buffer.from(await stored.get(`fortius-inmuebles-private/${kept.path}`)!.arrayBuffer()).equals(photo)).toBe(true);
  });
});

// B5: lo público lo decide el servidor según el destino.
describe("destino de lo público", () => {
  const pedir = (extra: Record<string, unknown>) => ({ name: "casa.jpg", size: 10, contentType: "image/jpeg", visibility: "public", ...extra });
  const base = (propiedad: Record<string, unknown> | null, mine: string | null) => ({
    from: () => { throw new Error("sin lectura directa"); },
    rpc: async (name: string) => name === "fortius_inmuebles_team_properties" ? { data: propiedad ? [{ id: "casa", data: propiedad }] : [], error: null } : { data: mine, error: null },
  }) as never;
  it("sin destino no se prepara nada público", async () => {
    await expect(prepareUpload(createServerClient(undefined, true), userId, pedir({}))).rejects.toMatchObject({ status: 403 });
    await expect(autorizarDestino(base(null, null), "admin", pedir({}))).rejects.toMatchObject({ status: 403 });
  });
  it("lo privado no pide destino", async () => {
    await expect(autorizarDestino(base(null, null), "asesor", { ...pedir({}), visibility: "private" })).resolves.toBeUndefined();
  });
  it("la biblioteca pública del sitio es solo del director", async () => {
    await expect(autorizarDestino(base(null, null), "asesor", pedir({ destino: "sitio" }))).rejects.toMatchObject({ status: 403 });
    await expect(autorizarDestino(base(null, null), "admin", pedir({ destino: "sitio" }))).resolves.toBeUndefined();
  });
  it("las fotos de un inmueble las sube su asesor; las de uno ajeno, no", async () => {
    await expect(autorizarDestino(base({ asesorId: "ana" }, "ana"), "asesor", pedir({ destino: "inmueble", inmueble: "casa" }))).resolves.toBeUndefined();
    await expect(autorizarDestino(base({ asesorId: "luis" }, "ana"), "asesor", pedir({ destino: "inmueble", inmueble: "casa" }))).rejects.toMatchObject({ status: 403 });
    await expect(autorizarDestino(base({ asesorId: "luis" }, "ana"), "admin", pedir({ destino: "inmueble", inmueble: "casa" }))).resolves.toBeUndefined();
  });
  it("un inmueble nuevo, todavía sin guardar, lo sube quien lo captura", async () => {
    await expect(autorizarDestino(base(null, "ana"), "asesor", pedir({ destino: "inmueble", inmueble: "nueva" }))).resolves.toBeUndefined();
    await expect(autorizarDestino(base(null, "ana"), "asesor", pedir({ destino: "inmueble" }))).resolves.toBeUndefined();
  });
});
