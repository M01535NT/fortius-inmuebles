import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
import { cambiarDocumento, finalizarDocumento, listarBandeja, prepararDocumento, type Documento } from "@/lib/backend/documentos";

/* FLX-01 (RP-101, RP-102): la Bandeja guarda sin pedir datos y el servidor comprueba a dónde se liga. */
const userId = "10000000-0000-4000-8000-000000000001";
const stored = new Map<string, Blob>();
const rows: Record<string, unknown>[] = [];
let rejectRow = false;
let asesor: string | null = "ase-ana";
const propiedades: Record<string, { asesorId: string }> = { "terreno-rosarito": { asesorId: "ase-ana" }, "casa-ajena": { asesorId: "ase-beto" } };
const clientes = new Set(["cli-ana"]);
const pdfBytes = "%PDF-1.7\nlevantamiento de ejemplo";
const pdf = new Blob([pdfBytes], { type: "application/pdf" });
const eq = (url: URL, key: string) => url.searchParams.get(key)?.replace(/^eq\./, "");

beforeEach(() => {
  stored.clear(); rows.length = 0; rejectRow = false; asesor = "ase-ana";
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key_only");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init.method ?? "GET";
    if (url.pathname === "/rest/v1/rpc/fortius_inmuebles_current_asesor_id") return Response.json(asesor);
    if (url.pathname === "/rest/v1/rpc/fortius_inmuebles_team_properties") {
      const found = propiedades[(JSON.parse(String(init.body)) as { p_id: string }).p_id];
      return Response.json(found ? [{ data: found }] : []);
    }
    if (url.pathname === "/rest/v1/fortius_inmuebles_records") return Response.json(clientes.has(eq(url, "id") ?? "") ? [{ id: eq(url, "id") }] : []);
    if (url.pathname === "/rest/v1/fortius_inmuebles_documentos") {
      const id = eq(url, "id");
      const matches = (row: Record<string, unknown>) => (!id || row.id === id)
        && (!url.searchParams.has("titulo") || row.titulo === eq(url, "titulo"))
        && [["deleted_at", "deleted_at"], ["archivado_el", "archivado_el"]].every(([key]) => {
          const filter = url.searchParams.get(key);
          return !filter || (filter === "is.null" ? row[key] == null : row[key] != null);
        });
      if (method === "GET") return Response.json(rows.filter(matches));
      if (method === "PATCH") {
        const found = rows.find(matches);
        if (!found) return Response.json({ code: "PGRST116", details: "Results contain 0 rows", message: "JSON object requested, multiple (or no) rows returned" }, { status: 406 });
        Object.assign(found, JSON.parse(String(init.body)));
        return Response.json(found);
      }
      if (rejectRow) return Response.json({ code: "XX000", message: "Unavailable" }, { status: 500 });
      const row = { tipo_documento: null, cliente_id: null, propiedad_slug: null, expediente_id: null, archivado_el: null, ...JSON.parse(String(init.body)), created_at: "2026-11-14T10:00:00Z", deleted_at: null };
      rows.push(row);
      return Response.json(row, { status: 201 });
    }
    if (url.pathname.startsWith("/storage/v1/object/upload/sign/")) return Response.json({ url: `${url.pathname}?token=upload-test` });
    const key = decodeURIComponent(url.pathname.replace("/storage/v1/object/", ""));
    if (method === "DELETE") {
      const { prefixes } = JSON.parse(String(init.body)) as { prefixes: string[] };
      for (const prefix of prefixes) stored.delete(`${key}/${prefix}`);
      return Response.json([]);
    }
    if (method === "POST") {
      const body = init.body;
      stored.set(key, body instanceof FormData ? [...body.values()].find((value) => value instanceof Blob) as Blob : new Blob([body as BlobPart]));
      return Response.json({ Key: key });
    }
    const data = stored.get(key);
    return data ? new Response(data) : Response.json({ statusCode: "404", error: "not_found", message: "Missing" }, { status: 404 });
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Bandeja y documentos sin operación", () => {
  const client = () => createServerClient(undefined, true);
  const editor = { id: userId, role: "editor" }, director = { id: userId, role: "admin" };
  const subir = async (name = "Levantamiento_topografico.pdf") => {
    const prepared = await prepararDocumento(client(), userId, { name, size: pdf.size, contentType: "application/pdf" });
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    return prepared;
  };
  const guardar = async () => finalizarDocumento(client(), client(), userId, { ticket: (await subir()).ticket });
  const visto = (d: Documento) => ({ titulo: d.titulo, eliminado: Boolean(d.deleted_at), archivado: Boolean(d.archivado_el) });

  it("RP-101: guarda sin pedir ningún dato, en la Bandeja de quien lo subió, con su SHA-256", async () => {
    const prepared = await subir();
    const documento = await finalizarDocumento(client(), client(), userId, { ticket: prepared.ticket });
    expect(documento).toMatchObject({ titulo: "Levantamiento topografico", asesor_id: "ase-ana", uploaded_by: userId, cliente_id: null, propiedad_slug: null, expediente_id: null, archivado_el: null });
    expect(rows[0].sha256).toBe(createHash("sha256").update(pdfBytes).digest("hex"));
    expect(String(rows[0].path)).toMatch(/^bandeja\/[a-f0-9-]+\.pdf$/);
    expect(stored.has(`fortius-inmuebles-expedientes/${rows[0].path}`)).toBe(true);
    expect(stored.has(`fortius-inmuebles-staging/${prepared.path}`)).toBe(false);
    expect((await listarBandeja(client())).documentos).toHaveLength(1);
  });

  it("un doble envío del mismo permiso devuelve el mismo documento; si el registro falla, no queda el archivo", async () => {
    const prepared = await subir();
    const primero = await finalizarDocumento(client(), client(), userId, { ticket: prepared.ticket });
    stored.set(`fortius-inmuebles-staging/${prepared.path}`, pdf);
    expect((await finalizarDocumento(client(), client(), userId, { ticket: prepared.ticket })).id).toBe(primero.id);
    expect(rows).toHaveLength(1);
    const otro = await subir("Avaluo.pdf");
    rejectRow = true;
    await expect(finalizarDocumento(client(), client(), userId, { ticket: otro.ticket })).rejects.toThrow();
    expect([...stored.keys()].filter(key => key.startsWith("fortius-inmuebles-expedientes/"))).toHaveLength(1);
  });

  it("el director sin ficha de asesor guarda el documento sin asesor", async () => {
    asesor = null;
    expect((await guardar()).asesor_id).toBeNull();
  });

  it("RP-102: se archiva en un inmueble aunque no tenga propietario, y sale de la Bandeja", async () => {
    const documento = await guardar();
    const archivado = await cambiarDocumento(client(), client(), editor, documento.id, { destino: { propiedadSlug: "terreno-rosarito" }, esperado: visto(documento) });
    expect(archivado).toMatchObject({ propiedad_slug: "terreno-rosarito", cliente_id: null, expediente_id: null });
    expect(archivado.archivado_el).toBeTruthy();
    expect((await listarBandeja(client())).documentos).toHaveLength(0);
    // Un destino vacío lo devuelve a la Bandeja.
    const devuelto = await cambiarDocumento(client(), client(), editor, documento.id, { destino: {}, esperado: visto(archivado) });
    expect(devuelto).toMatchObject({ propiedad_slug: null, archivado_el: null });
  });

  it("el servidor comprueba el destino: inmueble de otro asesor, persona que no ve e inmueble inexistente", async () => {
    const documento = await guardar();
    const pedir = (user: { id: string; role: string }, destino: Record<string, string>) => cambiarDocumento(client(), client(), user, documento.id, { destino, esperado: visto(documento) });
    await expect(pedir(editor, { propiedadSlug: "casa-ajena" })).rejects.toMatchObject({ status: 403 });
    await expect(pedir(editor, { clienteId: "cli-de-otro" })).rejects.toMatchObject({ status: 404 });
    await expect(pedir(editor, { propiedadSlug: "no-existe" })).rejects.toMatchObject({ status: 404 });
    expect(rows[0].archivado_el).toBeNull();
    // El director sí archiva en el inmueble de cualquier asesor; y a una persona visible.
    expect((await pedir(director, { propiedadSlug: "casa-ajena", clienteId: "cli-ana" }))).toMatchObject({ propiedad_slug: "casa-ajena", cliente_id: "cli-ana" });
  });

  it("renombra, pone tipo y manda a la papelera; si alguien lo cambió antes, responde 409", async () => {
    const documento = await guardar();
    const renombrado = await cambiarDocumento(client(), client(), editor, documento.id, { titulo: "Levantamiento del terreno", esperado: visto(documento) });
    expect(renombrado.titulo).toBe("Levantamiento del terreno");
    await expect(cambiarDocumento(client(), client(), editor, documento.id, { tipo: "avaluo", esperado: visto(documento) })).rejects.toMatchObject({ status: 409 });
    expect((await cambiarDocumento(client(), client(), editor, documento.id, { tipo: "levantamiento", esperado: visto(renombrado) })).tipo_documento).toBe("levantamiento");
    const eliminado = await cambiarDocumento(client(), client(), editor, documento.id, { papelera: true, esperado: visto(renombrado) });
    expect(eliminado.deleted_at).toBeTruthy();
    expect(rows[0].deleted_by).toBe(userId);
    const lista = await listarBandeja(client());
    expect([lista.documentos.length, lista.papelera.length]).toEqual([0, 1]);
    expect((await cambiarDocumento(client(), client(), editor, documento.id, { papelera: false, esperado: visto(eliminado) })).deleted_at).toBeNull();
  });

  it("solo acepta PDF e imágenes y rechaza campos que no conoce", async () => {
    await expect(prepararDocumento(client(), userId, { name: "video.mp4", size: 10, contentType: "video/mp4" })).rejects.toThrow();
    const documento = await guardar();
    await expect(cambiarDocumento(client(), client(), editor, documento.id, { destino: { expedienteId: "no-es-uuid" }, esperado: visto(documento) })).rejects.toThrow();
    await expect(cambiarDocumento(client(), client(), editor, documento.id, { asesor_id: "ase-beto", esperado: visto(documento) })).rejects.toThrow();
  });
});
