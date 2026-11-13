import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
import { armarExpedientePdf, armarExpedienteZip, elegirEmisiones, nombreEnZip, type BorradorExpediente, type EmisionExpediente } from "@/lib/formatos/expediente-completo";

const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { GET } from "@/app/api/admin/expedientes/[id]/completo/route";

const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function pdfDe(paginas: number) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < paginas; i++) pdf.addPage([612, 792]);
  return pdf.save();
}
const recursos = async () => {
  const [regular, bold, encabezado, pie] = await Promise.all(["public/fonts/Archivo-Regular.ttf", "public/fonts/Archivo-SemiBold.ttf", "public/brand/membrete-encabezado.png", "public/brand/membrete-pie.png"].map(path => readFile(join(process.cwd(), path))));
  return { fuentes: { regular, bold }, membrete: { encabezado, pie } };
};
const borrador = (id: string, formato_id: string, version: number, created_at = "2026-11-01T10:00:00Z"): BorradorExpediente => ({ id, formato_id, version, created_at });
const emision = (id: string, draft_id: string, draft_version: number, created_at: string, extra: Partial<EmisionExpediente> = {}): EmisionExpediente => ({ id, draft_id, draft_version, created_at, sha256: "a".repeat(64), path: `exp/${id}.pdf`, ...extra });

describe("elegirEmisiones", () => {
  it("toma la última emisión de cada borrador, en el orden del catálogo, sin borradores sin emitir", () => {
    const entradas = elegirEmisiones(
      [borrador("d09", "09", 3), borrador("d02", "02", 1), borrador("d04", "04B", 2), borrador("d14", "14", 1)],
      [emision("e1", "d09", 1, "2026-11-02T10:00:00Z"), emision("e2", "d09", 2, "2026-11-05T10:00:00Z"), emision("e3", "d02", 1, "2026-11-01T12:00:00Z"), emision("e4", "d04", 2, "2026-11-03T10:00:00Z", { incompleto: ["superficie"] })],
    );
    expect(entradas.map(e => [e.formatoId, e.emision.id])).toEqual([["02", "e3"], ["04B", "e4"], ["09", "e2"]]);
    expect(entradas.find(e => e.formatoId === "09")?.cambiosSinEmitir).toBe(true);
    expect(entradas.find(e => e.formatoId === "04B")?.conFaltantes).toBe(true);
    expect(entradas.find(e => e.formatoId === "02")).toMatchObject({ cambiosSinEmitir: false, conFaltantes: false });
  });
});

describe("armado del expediente", () => {
  it("une portada, índice y las páginas de cada emisión en orden", async () => {
    const [a, b] = await Promise.all([pdfDe(2), pdfDe(5)]);
    const entradas = elegirEmisiones([borrador("d1", "02", 1), borrador("d2", "15", 1)], [emision("e1", "d1", 1, "2026-11-01T10:00:00Z"), emision("e2", "d2", 1, "2026-11-02T10:00:00Z")])
      .map((entrada, i) => ({ ...entrada, bytes: [a, b][i] }));
    const bytes = await armarExpedientePdf({ folio: "EXP-2026-0001", generado: "2026-11-13T18:00:00Z", entradas, ...await recursos() });
    const unido = await PDFDocument.load(bytes);
    expect(unido.getPageCount()).toBe(1 + 1 + 2 + 5);
    expect(unido.getTitle()).toBe("Expediente EXP-2026-0001");
  });

  it("con muchos documentos el índice continúa en varias hojas", async () => {
    const fuente = await pdfDe(1);
    const borradores = Array.from({ length: 40 }, (_, i) => borrador(`d${i}`, "13", 1, `2026-11-01T10:${String(i).padStart(2, "0")}:00Z`));
    const entradas = elegirEmisiones(borradores, borradores.map((d, i) => emision(`e${i}`, d.id, 1, "2026-11-02T10:00:00Z"))).map(e => ({ ...e, bytes: fuente }));
    const unido = await PDFDocument.load(await armarExpedientePdf({ folio: "EXP-2026-0002", generado: "2026-11-13T18:00:00Z", entradas, ...await recursos() }));
    const indice = unido.getPageCount() - 1 - 40;
    expect(indice).toBeGreaterThan(1);
  });

  it("el ZIP conserva cada PDF byte por byte y lista sus huellas", async () => {
    const a = await pdfDe(1), b = await pdfDe(3);
    const entradas = elegirEmisiones([borrador("d1", "07", 2), borrador("d2", "08", 1)], [emision("e1", "d1", 2, "2026-11-01T10:00:00Z", { sha256: sha(a) }), emision("e2", "d2", 1, "2026-11-02T10:00:00Z", { sha256: sha(b) })])
      .map((entrada, i) => ({ ...entrada, bytes: [a, b][i] }));
    const zip = await JSZip.loadAsync(await armarExpedienteZip({ folio: "EXP-2026-0003", generado: "2026-11-13T18:00:00Z", entradas }));
    const primero = nombreEnZip(entradas[0], 0);
    expect(primero).toBe("01-07-Opinion-de-valor-comercial-v2.pdf");
    expect(sha(await zip.file(primero)!.async("uint8array"))).toBe(sha(a));
    const huellas = await zip.file("huellas.txt")!.async("string");
    expect(huellas).toContain(sha(a));
    expect(huellas).toContain(sha(b));
  });
});

/** Cliente de Supabase mínimo: cada tabla devuelve lo configurado, venga por maybeSingle o por await. */
function cliente(tablas: Record<string, { data: unknown; error: null }>) {
  return { from: (tabla: string) => {
    const resultado = tablas[tabla] ?? { data: null, error: null };
    const builder: Record<string, unknown> = {};
    for (const metodo of ["select", "eq", "is", "in", "order"]) builder[metodo] = () => builder;
    builder.maybeSingle = async () => resultado;
    builder.then = (resolve: (value: unknown) => unknown) => resolve(resultado);
    return builder;
  } };
}
const id = "51000000-0000-4000-8000-000000000020";
const llamar = (query = "") => GET(new Request(`https://panel.test/api/admin/expedientes/${id}/completo${query}`), { params: Promise.resolve({ id }) });

describe("ruta del expediente completo", () => {
  it("sin sesión no toca el almacenamiento privado", async () => {
    requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
    createServerClient.mockClear();
    expect((await llamar()).status).toBe(401);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("si el permiso no deja ver el expediente responde 404 sin usar el cliente privilegiado", async () => {
    requireStaff.mockResolvedValue({ client: cliente({}) });
    createServerClient.mockClear();
    expect((await llamar("?formato=zip")).status).toBe(404);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("rechaza un formato de descarga desconocido", async () => {
    requireStaff.mockResolvedValue({ client: cliente({}) });
    expect((await llamar("?formato=docx")).status).toBe(400);
  });

  it("no entrega nada si un PDF no coincide con su huella", async () => {
    const bytes = await pdfDe(1);
    requireStaff.mockResolvedValue({ client: cliente({
      fortius_inmuebles_expedientes: { data: { id, folio: "EXP-2026-0004" }, error: null },
      fortius_inmuebles_formato_drafts: { data: [borrador("d1", "02", 1)], error: null },
      fortius_inmuebles_formato_emissions: { data: [emision("e1", "d1", 1, "2026-11-01T10:00:00Z", { sha256: "b".repeat(64) })], error: null },
    }) });
    createServerClient.mockReturnValue({ storage: { from: () => ({ download: async () => ({ data: new Blob([Buffer.from(bytes)]), error: null }) }) } });
    const response = await llamar("?formato=zip");
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("integridad");
  });

  it("entrega el ZIP con las emisiones autorizadas", async () => {
    const bytes = await pdfDe(1);
    requireStaff.mockResolvedValue({ client: cliente({
      fortius_inmuebles_expedientes: { data: { id, folio: "EXP-2026-0005" }, error: null },
      fortius_inmuebles_formato_drafts: { data: [borrador("d1", "02", 1)], error: null },
      fortius_inmuebles_formato_emissions: { data: [emision("e1", "d1", 1, "2026-11-01T10:00:00Z", { sha256: sha(bytes) })], error: null },
    }) });
    createServerClient.mockReturnValue({ storage: { from: () => ({ download: async () => ({ data: new Blob([Buffer.from(bytes)]), error: null }) }) } });
    const response = await llamar("?formato=zip");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});

describe("firmas con nombres largos", () => {
  it("nunca bajan al pie de la hoja ni dejan el título «Firmas» solo", async () => {
    const { crearMaquetador } = await import("@/lib/formatos/documento/pdf");
    const { letterheadBounds } = await import("@/lib/letterhead");
    const { fuentes, membrete } = await recursos();
    const maquetar = await crearMaquetador({ ...fuentes, ...membrete });
    const nombre = Array.from({ length: 8 }, (_, i) => `Firmante número ${i + 1} con nombre compuesto muy largo, en representación de una sociedad`).join("\n");
    for (let relleno = 20; relleno <= 44; relleno += 3) {
      const maqueta = await maquetar({ title: "Prueba", subject: "Prueba", blocks: [
        ...Array.from({ length: relleno }, () => ({ kind: "p" as const, text: "Párrafo de relleno para empujar las firmas hacia el final de la hoja." })),
        { kind: "center" as const, text: "Firmas" },
        { kind: "p" as const, text: "Leído este contrato, las partes lo firman." },
        { kind: "signatures" as const, line: true, parties: [{ role: "CLIENTE", name: nombre }, { role: "PRESTADOR", name: nombre }] },
      ] });
      const limite = letterheadBounds().bottom - 20;
      for (const pagina of maqueta.pages) for (const trazo of pagina) if (trazo.kind === "text" && trazo.text.startsWith("Firmante")) expect(trazo.y, `relleno ${relleno}`).toBeGreaterThanOrEqual(limite);
      const hoja = maqueta.pages.findIndex(p => p.some(t => t.kind === "text" && t.text === "Firmas"));
      expect(maqueta.pages[hoja].some(t => t.kind === "text" && t.text === "CLIENTE"), `relleno ${relleno}`).toBe(true);
    }
  });
});
