import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
import { APP_GROUPS, APPS, RETIRED_APPS, activeApps, appHref, getApp, isRetired, parentOf } from "@/lib/apps/catalog";
import { appRunSchema } from "@/lib/apps/contracts";
import { hipotecaHref, ofertasDesdePropuestas, prefillFromUrl } from "@/lib/apps/contexto";
import { lastMonths, usoPorHerramienta } from "@/lib/apps/uso";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient: vi.fn() }));
import { GET as machote } from "@/app/api/admin/apps/machote/route";
import { GET as uso } from "@/app/api/admin/apps/uso/route";
import { GET as runs } from "@/app/api/admin/apps/runs/route";
import { GET as exportRun } from "@/app/api/admin/apps/runs/[id]/export/route";
import { getFinancialDefaults } from "@/lib/apps/financial";
import type { SupabaseClient } from "@supabase/supabase-js";

beforeEach(() => requireStaff.mockReset());

describe("Catálogo de Herramientas (HER-01)", () => {
  it("queda en tres grupos con lo aprobado el 18/10/2026", () => {
    expect(APP_GROUPS).toEqual(["Documentos", "Calcular", "Presentar"]);
    expect(activeApps("Documentos").map(a => a.title)).toEqual(["Documentos sueltos", "Unir y separar PDF"]);
    expect(activeApps("Calcular").map(a => a.slug)).toEqual(["neto-propietario", "hipoteca", "gastos-compra", "ofertas", "inversiones", "conversor"]);
    expect(activeApps("Presentar").map(a => a.slug)).toEqual(["cotizador"]);
  });
  it("lo retirado deja de mostrarse pero sus trabajos se siguen leyendo y guardando", () => {
    expect(RETIRED_APPS.map(a => a.slug).sort()).toEqual(["comisiones", "comparables", "ficha-comercial", "fotografias", "informe-propietario", "qr", "revisor-expediente", "versiones"]);
    for (const app of RETIRED_APPS) {
      expect(getApp(app.slug)).toBeDefined();
      expect(appRunSchema.safeParse({ slug: app.slug, title: "Trabajo anterior", input: {}, result: null, context: {} }).success).toBe(true);
    }
    expect(APPS).toHaveLength(18);
  });
  it("Rehabilitación vive dentro de Inversiones: sin tarjeta, pero no retirada (12/11/2026)", () => {
    const app = getApp("rehabilitacion")!;
    expect(isRetired(app)).toBe(false);
    expect(parentOf(app)?.slug).toBe("inversiones");
    expect(RETIRED_APPS.some(a => a.slug === "rehabilitacion")).toBe(false);
  });
  it("Comparables abre la opinión de valor sin operación en sus comparables (HER-05)", () => {
    expect(appHref("comparables")).toBe("/admin/apps/documentos?formato=07&seccion=comparables");
    expect(appHref("hipoteca")).toBe("/admin/apps/hipoteca");
  });
});

describe("Herramientas abiertas desde los datos (HER-05)", () => {
  it("la hipoteca trae el precio y el inmueble; lo inválido se ignora", () => {
    expect(prefillFromUrl("hipoteca", new URLSearchParams("precio=3500000&inmueble=casa-playas"))).toEqual({ input: { price: "3500000" }, context: { inmuebleId: "casa-playas" } });
    expect(prefillFromUrl("hipoteca", new URLSearchParams("precio=-5&inmueble=../x"))).toEqual({ input: {}, context: {} });
    expect(prefillFromUrl("ofertas", new URLSearchParams("precio=100"))).toEqual({ input: {}, context: {} });
  });
  it("un precio en dólares no se pasa a la hipoteca, que calcula en pesos", () => {
    expect(hipotecaHref({ precio: 250000, moneda: "USD", inmueble: "depa" })).toBe("/admin/apps/hipoteca?inmueble=depa");
    expect(hipotecaHref({ precio: 2_800_000.5, moneda: "MXN" })).toBe("/admin/apps/hipoteca?precio=2800000.5");
    expect(hipotecaHref({})).toBe("/admin/apps/hipoteca");
  });
  it("lee las ofertas de las propuestas de compra (14) sin recapturar", () => {
    const rows = ofertasDesdePropuestas([
      { id: "a", formato_id: "14", data: { comprador: "Ana Ruiz", precioPropuesto: 3_100_000, moneda: "MXN", credito: 2_000_000, institucionCredito: "Banco", fechaPropuesta: "2026-11-01", fechaFormalizacion: "2026-12-01", condiciones: "Sujeto a avalúo" } },
      { id: "b", formato_id: "14", data: { precioPropuesto: 3_000_000, moneda: "USD", recursosPropios: 3_000_000 } },
      { id: "c", formato_id: "14", data: { comprador: "Sin precio" } },
      { id: "d", formato_id: "13", data: { precioPropuesto: 1 } },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Ana Ruiz", currency: "MXN", price: "3100000", days: "30", conditions: "Sujeto a avalúo", deposit: "", expenses: "" });
    expect(rows[0].financing).toContain("Banco");
    expect(rows[1]).toMatchObject({ name: "Propuesta 2", currency: "USD", financing: "Recursos propios", days: "" });
  });
  it("el inmueble consulta sus trabajos de todas las herramientas", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ["select", "eq", "is", "order"]) query[method] = vi.fn(() => query);
    query.limit = vi.fn().mockResolvedValue({ data: [{ id: "r1", slug: "hipoteca", title: "Hipoteca", input: {}, result: null, context: { inmuebleId: "casa" }, version: 1, updated_at: "2026-11-12" }], error: null });
    requireStaff.mockResolvedValue({ client: { from: () => query } });
    const response = await runs(new Request("https://panel.test/api/admin/apps/runs?inmuebleId=casa"));
    expect((await response.json()).runs).toHaveLength(1);
    expect(query.eq).toHaveBeenCalledWith("context->>inmuebleId", "casa");
    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
  });
});

describe("Uso por herramienta en Reportes (HER-05)", () => {
  it("cuenta trabajos por mes de Tijuana", () => {
    const months = lastMonths(new Date("2026-11-12T18:00:00Z"), 3);
    expect(months).toEqual(["2026-09", "2026-10", "2026-11"]);
    // El 1 de noviembre a las 03:00 UTC todavía es octubre en Tijuana.
    const report = usoPorHerramienta([{ slug: "hipoteca", created_at: "2026-11-01T03:00:00Z" }, { slug: "hipoteca", created_at: "2026-11-05T18:00:00Z" }, { slug: "qr", created_at: "2026-09-02T18:00:00Z" }, { slug: "hipoteca", created_at: "2026-01-01T18:00:00Z" }], months);
    expect(report.rows[0]).toMatchObject({ slug: "hipoteca", byMonth: [0, 1, 1], total: 2 });
    expect(report.rows.find(r => r.slug === "qr")).toMatchObject({ retired: true, total: 1 });
    expect(report.rows.at(-1)?.retired).toBe(true);
  });
  it("solo el administrador lo consulta", async () => {
    requireStaff.mockResolvedValue({ client: {}, user: { id: "u", role: "editor" } });
    expect((await uso()).status).toBe(403);
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ["select", "gte", "order"]) query[method] = vi.fn(() => query);
    query.range = vi.fn().mockResolvedValue({ data: [], error: null });
    requireStaff.mockResolvedValue({ client: { from: () => query }, user: { id: "u", role: "admin" } });
    const response = await uso();
    expect(response.status).toBe(200);
    expect((await response.json()).months).toHaveLength(6);
    expect(query.select).toHaveBeenCalledWith("slug,created_at");
  });
});

describe("Machote en blanco (HER-02)", () => {
  const get = (formato: string) => machote(new Request(`https://panel.test/api/admin/apps/machote?formato=${formato}`));
  it("descarga cualquier formato en blanco, también la promesa", async () => {
    requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
    for (const formato of ["15", "04B", "07", "09"]) {
      const response = await get(formato);
      expect(response.status, formato).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
    }
  }, 60000);
  it("el 03 no es un documento y exige sesión", async () => {
    requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
    expect((await get("03")).status).toBe(400);
    requireStaff.mockRejectedValueOnce(new ApiError(401, "Inicia sesión"));
    expect((await get("06")).status).toBe(401);
  });
});

describe("ISR y neto: dos PDF para el propietario (HER-03)", () => {
  const id = "71000000-0000-4000-8000-000000000003";
  const input = { ...getFinancialDefaults("neto-propietario"), salePrice: 3_000_000, loan: 0, commissionPercent: 5, saleDate: "2026-11-20", acquisitionDate: "2016-03-15", acquisitionCost: 1_000_000, inpcAcquisition: 120, inpcSale: 145.5, improvements: 0, acquisitionExpenses: 50_000, taxes: 0 };
  const client = (row: Record<string, unknown>) => {
    const query = { eq: () => query, is: () => query, maybeSingle: async () => ({ data: { id, slug: "neto-propietario", title: "Neto", input, result: { title: "Estimación", summary: [] }, context: {}, version: 1, updated_at: "2026-11-12", ...row }, error: null }) };
    return { from: () => ({ select: () => query }) } as unknown as SupabaseClient;
  };
  const get = (query: string) => exportRun(new Request(`https://panel.test/api/admin/apps/runs/${id}/export?${query}`), { params: Promise.resolve({ id }) });
  it("descarga el neto y la hoja del ISR armados con la captura guardada", async () => {
    requireStaff.mockResolvedValue({ client: client({}), user: { id: "u" } });
    for (const parte of ["neto", "isr"]) {
      const response = await get(`format=pdf&parte=${parte}`);
      expect(response.status, parte).toBe(200);
      expect(response.headers.get("content-disposition")).toContain(parte === "isr" ? "fortius-hoja-isr.pdf" : "fortius-neto-vendedor.pdf");
      expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
    }
  }, 60000);
  it("no hay hoja sin cálculo del ISR ni en otras herramientas", async () => {
    requireStaff.mockResolvedValue({ client: client({ input: { ...input, isrMode: "importe", isrAmount: 1 } }), user: { id: "u" } });
    expect((await get("format=pdf&parte=isr")).status).toBe(400);
    requireStaff.mockResolvedValue({ client: client({ slug: "hipoteca" }), user: { id: "u" } });
    expect((await get("format=pdf&parte=neto")).status).toBe(400);
  });
});
