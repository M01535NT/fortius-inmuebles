import { describe, expect, it } from "vitest";
import { propiedades } from "@/data/propiedades";
import { parseCollection, parseRecord, parseWrite, parseLead, validateFile, projectPublic } from "@/lib/backend/validation";
import { staffIdentity } from "@/lib/backend/auth";
import { assertSameOrigin, readJson, apiResponse, ApiError } from "@/lib/backend/http";

describe("BFF validation and authorization behavior", () => {
  it("distinguishes absent identity (401) from missing or inactive membership (403)", () => {
    expect(() => staffIdentity(null, null)).toThrow(expect.objectContaining({ status: 401 }));
    expect(() => staffIdentity({ id: "u", email: "a@example.com" }, null)).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => staffIdentity({ id: "u", email: "a@example.com" }, { role: "admin", active: false })).toThrow(expect.objectContaining({ status: 403 }));
    expect(staffIdentity({ id: "u", email: "a@example.com" }, { role: "editor", active: true })).toEqual({ id: "u", email: "a@example.com", role: "editor" });
  });
  it("rejects unknown collections, mismatched IDs and missing version", () => {
    expect(() => parseCollection("staff")).toThrow();
    expect(() => parseRecord("notas", "n1", { id: "n2", titulo: "A", texto: "B", actualizadoEl: "2026-09-02" })).toThrow();
    expect(() => parseWrite({ data: {} })).toThrow();
    expect(() => parseWrite({ data: {}, version: -1 })).toThrow();
    expect(parseWrite({ data: {}, version: null })).toEqual({ data: {}, version: null });
  });
  it("preserves every existing property field while defaulting publication to false", () => {
    const saved = parseRecord("propiedades", propiedades[0].slug, propiedades[0]);
    expect(saved).toEqual({ ...propiedades[0], publicada: false });
    expect(() => parseRecord("propiedades", propiedades[0].slug, { ...propiedades[0], precio: { modalidad: "publico", monto: -2, moneda: "MXN" } })).toThrow();
  });
  it("public projection removes private root and nested keys and hides drafts", () => {
    const input = { ...propiedades[0], publicada: true, notasInternas: "secreto", propietario: { nombre: "secreto" }, ficha: { ...propiedades[0].ficha, propietario: "secreto" }, galeria: [{ src: "/casa.webp", alt: "Casa", notas: "secreto" }], documentos: [{ codigo: "P1", nombre: "Privado", descripcion: "no", url: "/api/admin/files?bucket=cota-private&path=x" }] };
    const output = projectPublic("propiedades", [input, { ...input, publicada: false }]);
    expect(output).toHaveLength(1);
    expect(JSON.stringify(output)).not.toContain("secreto");
    expect(output[0].documentos).toEqual([]);
    expect(projectPublic("leads", [{ nombre: "Privado" }])).toEqual([]);
  });
  it("validates contact, body, origin enum and rejects honeypot/privilege injection", () => {
    expect(parseLead({ nombre: "Persona", telefono: "6641234567", origen: "interes_propiedad" }).origen).toBe("interes_propiedad");
    for (const extra of [{ telefono: "a" }, { email: "wrong" }, { website: "spam" }, { estado: "cerrado" }, { origen: "fake" }]) {
      expect(() => parseLead({ nombre: "Persona", telefono: "6641234567", origen: "contacto", ...extra })).toThrow();
    }
  });
  it("rejects oversized actual streams and cross-origin mutations", async () => {
    await expect(readJson(new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ a: "x".repeat(100) }) }), 50)).rejects.toMatchObject({ status: 413 });
    expect(() => assertSameOrigin(new Request("https://cota.test/api", { headers: { origin: "https://attacker.test" } }))).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertSameOrigin(new Request("https://cota.test/api", { headers: { origin: "https://cota.test" } }))).not.toThrow();
  });
  it("returns noncacheable errors without leaking infrastructure details", async () => {
    const failure = await apiResponse(async () => { throw new Error("database password secret"); });
    expect(failure.status).toBe(500);
    expect(await failure.text()).not.toContain("password");
    const conflict = await apiResponse(async () => { throw new ApiError(409, "Recarga"); });
    expect(conflict.status).toBe(409);
    expect(conflict.headers.get("cache-control")).toContain("no-store");
  });
  it("validates bytes, not merely a client-supplied MIME type", async () => {
    await expect(validateFile(new File(["<svg onload=alert(1)>"], "image.png", { type: "image/png" }))).rejects.toThrow();
    await expect(validateFile(new File(["%PDF-1.7\nhello"], "doc.pdf", { type: "application/pdf" }))).resolves.toMatchObject({ extension: "pdf", type: "application/pdf" });
    await expect(validateFile(new File([new Uint8Array(20 * 1024 * 1024 + 1)], "x.pdf", { type: "application/pdf" }))).rejects.toThrow();
  });
});
