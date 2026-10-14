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
  it("accepts only lowercase hyphenated post slugs", () => {
    const post = { id: "p1", slug: "guia-para-comprar", titulo: "Guía", resumen: "Resumen", contenido: "Texto", estado: "borrador", actualizadoEl: "2026-09-05" };
    expect(parseRecord("posts", "p1", post)).toEqual(post);
    for (const slug of ["Guia-Mayuscula", "guia_con_guion_bajo", "guia--doble", "-guia", "guia-"]) {
      expect(() => parseRecord("posts", "p1", { ...post, slug })).toThrow();
    }
  });
  it("validates calendar links and a real calendar date", () => {
    const event = { id: "event1", titulo: "Visita", fecha: "2026-10-04", tipo: "visita", clienteId: "client1", propiedadSlug: "home1", expedienteId: "4f813087-b257-4a79-9c8d-e2401d941111", asesorId: "adviser1" };
    expect(parseRecord("eventos", "event1", event)).toEqual(event);
    for (const invalid of [{ fecha: "2026-02-31" }, { clienteId: "client space" }, { expedienteId: "not-a-uuid" }, { asesorId: 3 }]) {
      expect(() => parseRecord("eventos", "event1", { ...event, ...invalid })).toThrow();
    }
  });
  it("preserves every existing property field while defaulting publication to false", () => {
    const saved = parseRecord("propiedades", propiedades[0].slug, propiedades[0]);
    expect(saved).toEqual({ ...propiedades[0], publicada: false });
    expect(() => parseRecord("propiedades", propiedades[0].slug, { ...propiedades[0], precio: { modalidad: "publico", monto: -2, moneda: "MXN" } })).toThrow();
  });
  it("public projection removes private root and nested keys and hides drafts", () => {
    const input = { ...propiedades[0], publicada: true, notasInternas: "secreto", propietario: { nombre: "secreto" }, ficha: { ...propiedades[0].ficha, propietario: "secreto" }, galeria: [{ src: "/casa.webp", alt: "Casa", notas: "secreto" }], documentos: [{ codigo: "P1", nombre: "Privado", descripcion: "no", url: "/api/admin/files?bucket=fortius-inmuebles-private&path=x" }] };
    const output = projectPublic("propiedades", [input, { ...input, publicada: false }]);
    expect(output).toHaveLength(1);
    expect(JSON.stringify(output)).not.toContain("secreto");
    expect(output[0].documentos).toEqual([]);
    expect(projectPublic("leads", [{ nombre: "Privado" }])).toEqual([]);
  });
  it("publishes only authorized property facts and rejects malformed review dates", () => {
    const info = { fuenteTerreno: "escritura", disponibilidadRevisadaEl: "2026-10-04", ocupacionEntrega: "Desocupada; fecha por acordar", propietario: "secreto" };
    const input = { ...propiedades[0], publicada: true, informacionPublica: info };
    expect(projectPublic("propiedades", [input])[0].informacionPublica).toEqual({
      fuenteTerreno: "escritura",
      disponibilidadRevisadaEl: "2026-10-04",
      ocupacionEntrega: "Desocupada; fecha por acordar",
    });
    expect(() => parseRecord("propiedades", input.slug, { ...input, informacionPublica: { ...info, disponibilidadRevisadaEl: "mañana" } })).toThrow();
  });
  it.each(["videoInstitucionalUrl", "facebook", "instagram", "whatsapp"])("public configuration blanks private capabilities in %s without dropping contact settings", (field) => {
    const settings = { nombreComercial: "MNT", telefono: "6641234567", whatsapp: "526641234567", email: "contacto@example.com", horario: "Lunes a viernes", facebook: "https://www.facebook.com/mnt", instagram: "https://www.instagram.com/mnt/", videoInstitucionalUrl: "https://assets.example.com/storage/v1/object/public/fortius-inmuebles-public/video.mp4" };
    for (const unsafe of [
      "https://assets.example.com/storage/v1/object/sign/fortius-inmuebles-private/video.mp4?token=PRIVATE_CAPABILITY",
      "/api/admin/files?bucket=fortius-inmuebles-private&path=video.mp4",
      "https://assets.example.com/storage/v1/object/authenticated/fortius-inmuebles-private/video.mp4",
      "https://assets.example.com/storage/v1/object/public/fortius-inmuebles-staging/video.mp4",
      "https://assets.example.com/storage/v1/object/public/legacy-private/video.mp4",
      "https://assets.example.com/storage/v1/object/public/legacy-staging/video.mp4",
      "javascript:alert(1)",
    ]) {
      const input = { ...settings, [field]: unsafe };
      expect(projectPublic("config", [input])).toEqual([{ ...settings, [field]: "" }]);
      expect(input[field as keyof typeof input]).toBe(unsafe);
    }
  });
  it("public configuration preserves legitimate external and local links and empty URL fields", () => {
    const settings = { nombreComercial: "MNT", telefono: "6641234567", whatsapp: "https://wa.me/526640000000", email: "contacto@example.com", horario: "Lunes a viernes", facebook: "https://www.facebook.com/mnt", instagram: "https://www.instagram.com/mnt/", videoInstitucionalUrl: "/media/institucional.mp4" };
    expect(projectPublic("config", [settings])).toEqual([settings]);
    const emptyLinks = { ...settings, facebook: "", instagram: "", videoInstitucionalUrl: "", whatsapp: "" };
    expect(projectPublic("config", [emptyLinks])).toEqual([emptyLinks]);
  });
  it("validates contact, body, origin enum and rejects honeypot/privilege injection", () => {
    expect(parseLead({ nombre: "Persona", telefono: "6641234567", origen: "interes_propiedad" }).origen).toBe("interes_propiedad");
    for (const extra of [{ telefono: "a" }, { email: "wrong" }, { website: "spam" }, { estado: "cerrado" }, { origen: "fake" }]) {
      expect(() => parseLead({ nombre: "Persona", telefono: "6641234567", origen: "contacto", ...extra })).toThrow();
    }
  });
  it("rejects oversized actual streams and cross-origin mutations", async () => {
    await expect(readJson(new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ a: "x".repeat(100) }) }), 50)).rejects.toMatchObject({ status: 413 });
    expect(() => assertSameOrigin(new Request("https://mnt.test/api", { headers: { origin: "https://attacker.test" } }))).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertSameOrigin(new Request("https://mnt.test/api", { headers: { origin: "https://mnt.test" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost:3001/api/auth/login", { headers: { origin: "http://127.0.0.1:3001" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://127.0.0.1:3001/api/auth/login", { headers: { origin: "http://localhost:3001" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost:3001/api/auth/login", { headers: { origin: "http://[::1]:3001" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost:3001/api/auth/login", { headers: { origin: "http://127.0.0.1:3002" } }))).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertSameOrigin(new Request("https://localhost:3001/api/auth/login", { headers: { origin: "http://127.0.0.1:3001" } }))).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertSameOrigin(new Request("https://fortiusinmuebles.com/api/auth/login", { headers: { origin: "http://127.0.0.1:3001" } }))).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertSameOrigin(new Request("https://mnt.test/api"))).toThrow(expect.objectContaining({ status: 403 }));
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
