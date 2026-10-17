import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/backend/http";
import { saveRun } from "@/lib/apps/repository";
import { getApp } from "@/lib/apps/catalog";
import { FORMATOS_INDEPENDIENTES } from "@/lib/apps/documentos";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient: vi.fn() }));
import { GET } from "@/app/api/admin/apps/runs/[id]/documento/route";

const id = "71000000-0000-4000-8000-000000000001";
const opinion = {
  fechaEmision: "2026-10-04", destinatario: "María Ramírez", inmueble: "Casa en Tijuana",
  operacion: "Venta del pleno dominio", abogado: "Lic. Ana López", cedula: "12345678",
  conclusion: "Con los documentos revisados, la operación puede continuar a la etapa de negociación sujeta a actualizar el certificado registral.",
  objeto: "Examinar los derechos y riesgos para la etapa de negociación.", alcance: "Revisión documental de copias identificadas.",
  antecedentes: "El propietario afirma haber adquirido en 2018.", documentos: "Escritura 100 de 2018, copia simple, y certificado 200 de 2026.",
  titularidad: "La escritura identifica a María como adquirente; falta cotejo del original.",
  registro: "El certificado de fecha 2026-09-20 muestra el antecedente; su vigencia debe actualizarse antes de la firma.",
  impedimentos: "No se identificó bloqueo para negociar; no se ha concluido la revisión de adeudos.",
  sustento: "Escritura 100, cláusula segunda, y certificado 200, folio real 123.",
  recomendaciones: "Obtener certificado actualizado y constancia de adeudos antes de formalizar.",
  responsables: "Propietario: entregar originales; abogado: cotejar y actualizar búsquedas.",
  limites: "No se inspeccionó el inmueble ni se verificó la autenticidad de copias.",
  actualizacion: "Actualizar antes de firma, si aparecen nuevas cargas o cambia la titularidad.",
};

/** Cliente que guarda lo insertado y responde con la fila. */
function insertClient() {
  let saved: Record<string, unknown> = {};
  const client = { from: () => ({ insert: (value: Record<string, unknown>) => { saved = value; return { select: () => ({ single: async () => ({ data: { ...value, id, version: 1, updated_at: "2026-10-17" }, error: null }) }) }; } }) } as unknown as SupabaseClient;
  return { client, saved: () => saved };
}
/** Cliente que devuelve un trabajo guardado. */
function runClient(row: Record<string, unknown>) {
  const query = { eq: () => query, is: () => query, maybeSingle: async () => ({ data: { id, slug: "documentos", title: "Opinión", result: null, context: {}, version: 2, updated_at: "2026-10-17", ...row }, error: null }) };
  return { from: () => ({ select: () => query }) } as unknown as SupabaseClient;
}
const get = (version = 2) => GET(new Request(`https://panel.test/api/admin/apps/runs/${id}/documento?version=${version}`), { params: Promise.resolve({ id }) });

describe("Documentos sin expediente", () => {
  beforeEach(() => requireStaff.mockReset());

  it("aparece en Herramientas con los formatos elegidos", () => {
    expect(getApp("documentos")?.title).toBe("Documentos sin expediente");
    expect([...FORMATOS_INDEPENDIENTES]).toEqual(["06", "07", "08", "09", "10", "12", "14", "15", "19"]);
  });

  it("guarda el documento como trabajo independiente", async () => {
    const { client, saved } = insertClient();
    const run = await saveRun(client, "user", { slug: "documentos", title: "Opinión jurídica", input: { formatoId: "06", data: { destinatario: "María" } }, result: null, context: {} });
    expect(run.input).toEqual({ formatoId: "06", data: { destinatario: "María" } });
    expect(saved().expediente_id).toBeNull();
  });

  it("no se vincula a una operación ni acepta formatos fuera de la lista", async () => {
    const save = (body: Record<string, unknown>) => saveRun({} as SupabaseClient, "user", { slug: "documentos", title: "x", result: null, context: {}, input: { formatoId: "06", data: {} }, ...body });
    await expect(save({ context: { expedienteId: id } })).rejects.toThrow("no se vinculan");
    await expect(save({ input: { formatoId: "02", data: {} } })).rejects.toThrow("Revisa la captura");
    await expect(save({ input: { formatoId: "07", data: { adjuntos: [{ id: "no-uuid" }] } } })).rejects.toThrow("Revisa la captura");
  });

  it("genera el PDF de la versión guardada sin archivarlo", async () => {
    requireStaff.mockResolvedValue({ client: runClient({ input: { formatoId: "06", data: opinion } }), user: { id: "u" } });
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
  }, 30000);

  it("rechaza versiones viejas, capturas incompletas y el 09 en PDF", async () => {
    requireStaff.mockResolvedValue({ client: runClient({ input: { formatoId: "06", data: opinion } }), user: { id: "u" } });
    expect((await get(1)).status).toBe(409);
    requireStaff.mockResolvedValue({ client: runClient({ input: { formatoId: "06", data: { ...opinion, sustento: "" } } }), user: { id: "u" } });
    expect((await (await get()).json()).error).toContain("Faltan datos");
    requireStaff.mockResolvedValue({ client: runClient({ input: { formatoId: "09", data: {} } }), user: { id: "u" } });
    expect((await (await get()).json()).error).toContain("Word");
    requireStaff.mockResolvedValue({ client: runClient({ slug: "hipoteca", input: {} }), user: { id: "u" } });
    expect((await get()).status).toBe(400);
  });

  it("exige sesión", async () => {
    requireStaff.mockRejectedValueOnce(new ApiError(401, "Inicia sesión"));
    expect((await get()).status).toBe(401);
  });
});
