import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServerClient } from "@/lib/backend/auth";
import { prepareUpload, completeUpload } from "@/lib/backend/files";

const userId = "10000000-0000-4000-8000-000000000001";
const stored = new Map<string, Blob>();
const receipts: { bucket: string; path: string; uploaded_by: string }[] = [];
let rejectReceipt = false;
const pdf = new Blob(["%PDF-1.7\nreal bytes"], { type: "application/pdf" });

beforeEach(() => {
  stored.clear();
  receipts.length = 0; rejectReceipt = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mnt-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key_only");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname === "/rest/v1/mnt_file_uploads") {
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
  const input = () => ({ name: "brochure.pdf", size: pdf.size, contentType: "application/pdf", visibility: "public" });
  it("persists server-authenticated provenance before returning a final file", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`mnt-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(receipts).toEqual([{ bucket: "mnt-public", path: result.path, uploaded_by: userId }]);
  });
  it("does not return an unverified final path when provenance persistence fails", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`mnt-staging/${prepared.path}`, pdf); rejectReceipt = true;
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toThrow();
    expect(stored.has(`mnt-public/${prepared.path}`)).toBe(false);
    expect(stored.has(`mnt-staging/${prepared.path}`)).toBe(true);
  });
  it("keeps staging private until the exact signed file is validated, then publishes the verified bytes", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    expect(prepared.signedUrl).toContain("mnt-staging");
    stored.set(`mnt-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(result).toMatchObject({ bucket: "mnt-public", name: "brochure.pdf", type: "application/pdf" });
    expect(await stored.get(`mnt-public/${result.path}`)?.text()).toBe("%PDF-1.7\nreal bytes");
    expect(stored.has(`mnt-staging/${prepared.path}`)).toBe(false);
  });
  it("rejects manipulated, expired, and foreign-user tickets without publishing", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`mnt-staging/${prepared.path}`, pdf);
    const [payload, signature] = prepared.ticket.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    decoded.visibility = "private";
    const manipulated = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${signature}`;
    await expect(completeUpload(client(), userId, manipulated)).rejects.toMatchObject({ status: 403 });
    await expect(completeUpload(client(), "10000000-0000-4000-8000-000000000002", prepared.ticket)).rejects.toMatchObject({ status: 403 });
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 11 * 60000);
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 403 });
    expect([...stored.keys()].every((key) => key.startsWith("mnt-staging/"))).toBe(true);
  });
  it("never publishes invalid bytes or a size mismatch, even when MIME is claimed to be PDF", async () => {
    const prepared = await prepareUpload(client(), userId, input());
    stored.set(`mnt-staging/${prepared.path}`, new Blob(["x".repeat(pdf.size)], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 400 });
    stored.set(`mnt-staging/${prepared.path}`, new Blob(["%PDF-1.7\nother-size".repeat(10)], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 400 });
    expect([...stored.keys()].some((key) => key.startsWith("mnt-public/"))).toBe(false);
  });
  it("defaults to private and rejects oversized preparation before issuing upload capability", async () => {
    await expect(prepareUpload(client(), userId, { ...input(), size: 20971521 })).rejects.toThrow();
    const { visibility: _visibility, ...privateInput } = input(); void _visibility;
    const prepared = await prepareUpload(client(), userId, privateInput);
    stored.set(`mnt-staging/${prepared.path}`, pdf);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(result.bucket).toBe("mnt-private");
    expect(result.url).toContain("/api/admin/files?");
    expect(result.url).not.toContain("token=");
  });
  it("accepts a full 20 MB file and prevents replay from overwriting final bytes", async () => {
    const bytes = new Uint8Array(20971520); bytes.set(new TextEncoder().encode("%PDF-1.7\n"));
    const large = new Blob([bytes], { type: "application/pdf" });
    const prepared = await prepareUpload(client(), userId, { ...input(), size: large.size });
    stored.set(`mnt-staging/${prepared.path}`, large);
    const result = await completeUpload(client(), userId, prepared.ticket);
    expect(stored.get(`mnt-public/${result.path}`)?.size).toBe(20971520);
    // A still-valid signed upload URL might refill the temporary path. Its ticket
    // must never authorize overwriting the already validated final file.
    bytes[20] = 1;
    stored.set(`mnt-staging/${prepared.path}`, new Blob([bytes], { type: "application/pdf" }));
    await expect(completeUpload(client(), userId, prepared.ticket)).rejects.toMatchObject({ status: 409 });
    expect(new Uint8Array(await stored.get(`mnt-public/${result.path}`)!.slice(20, 21).arrayBuffer())[0]).toBe(0);
  });
});
