import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/backend/http";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { PUT } from "@/app/api/admin/expedientes/[id]/operacion/route";
import { POST } from "@/app/api/admin/expedientes/[id]/actividad/route";
const id = "52000000-0000-4000-8000-000000000010";
const context = { params: Promise.resolve({ id }) };
function request(body: unknown, method = "PUT", origin = "https://panel.test") {
  return new Request(`https://panel.test/api/admin/expedientes/${id}/operacion`, {
    method, headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
beforeEach(() => requireStaff.mockReset());
it("exige sesión y origen para la edición operativa", async () => {
  requireStaff.mockRejectedValueOnce(new ApiError(401, "Inicia sesión"));
  expect((await PUT(request({}), context)).status).toBe(401);
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
  expect((await PUT(request({}, "PUT", "https://otro.test"), context)).status).toBe(403);
});
it("rechaza etapa y checklist desconocidos antes de escribir", async () => {
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
  const input = { version: 1, etapa: "captacion", fechaObjetivo: null, checklist: { identidad: "recibido" } };
  expect((await PUT(request({ ...input, etapa: "inventada" }), context)).status).toBe(400);
  expect((await PUT(request({ ...input, checklist: { identidad: "inventado" } }), context)).status).toBe(400);
  expect((await PUT(request({ ...input, fechaObjetivo: "mañana" }), context)).status).toBe(400);
});
it("actualiza sólo la versión activa y reporta conflicto si ya cambió", async () => {
  const calls: { url: URL; body: Record<string, unknown> }[] = [];
  const client = createClient("https://db.test", "fake-anon-key", {
    auth: { persistSession: false },
    global: { fetch: async (url, init) => {
      const target = new URL(String(url));
      if (target.pathname.endsWith("/fortius_inmuebles_expedientes")) return Response.json({ etapa: "contrato", operacion: "venta", flujo: null });
      if (target.pathname.endsWith("/fortius_inmuebles_tramites_que_frenan_firma")) return Response.json(0);
      calls.push({ url: target, body: JSON.parse(String(init?.body ?? "{}")) });
      return Response.json({code:"PT409",message:"Conflicto"},{status:409});
    } },
  });
  requireStaff.mockResolvedValue({ client, user: { id: "u" } });
  const response = await PUT(request({ version: 2, etapa: "cierre", fechaObjetivo: "2026-11-15", checklist: {} }), context);
  expect(response.status).toBe(409);
  expect(calls[0].url.pathname).toBe("/rest/v1/rpc/fortius_inmuebles_update_operation");
  expect(calls[0].body).toMatchObject({p_id:id,p_version:2,p_stage:"cierre",p_date:"2026-11-15",p_flow:null,p_property_specified:false});
});
it("rechaza notas vacías", async () => {
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
  expect((await POST(request({ descripcion: "  " }, "POST"), context)).status).toBe(400);
});

it("conserva motivos operativos permitidos sin exponer errores arbitrarios",async()=>{
 for(const [code,message,expected] of [["PT403","Tomar el encargo lo decide el director","Tomar el encargo"],["PT403","Contraparte incompatible o fuera de tu alcance","Contraparte incompatible"],["PT409","secret SQL detail","El registro cambió"]]){
  requireStaff.mockResolvedValue({client:fakeClient({expediente:{etapa:"documentacion",operacion:"venta",flujo:null}},async()=>({data:null,error:{code,message}})),user:{id:"u"}});
  const response=await PUT(request({version:1,etapa:"documentacion",fechaObjetivo:null,checklist:{}}),context);
  expect(response.status).toBe(Number(code.slice(2)));expect((await response.json()).error).toContain(expected);
 }
});

type Tables = { expediente?: Record<string, unknown> | null; drafts?: Record<string, unknown>[]; emissions?: Record<string, unknown>[]; task?: Record<string, unknown> | null };
/** Cliente falso: cada consulta encadenada responde con la tabla configurada. */
function fakeClient(tables: Tables, rpc: (...args: unknown[]) => Promise<unknown> = vi.fn(async () => ({ data: { id }, error: null }))) {
  const answer = (table: string) => {
    if (table === "fortius_inmuebles_expedientes") return { data: tables.expediente ?? null, error: null };
    if (table === "fortius_inmuebles_formato_drafts") return { data: tables.drafts ?? [], error: null };
    if (table === "fortius_inmuebles_formato_emissions") return { data: tables.emissions ?? [], error: null };
    return { data: tables.task ? { data: tables.task } : null, error: null };
  };
  const chain = (table: string): unknown => new Proxy({}, { get: (_t, key) => key === "then" ? (resolve: (v: unknown) => void) => resolve(answer(table)) : key === "maybeSingle" ? async () => answer(table) : () => chain(table) });
  return { from: (table: string) => chain(table), rpc };
}
const owner = { etapa: "captacion", operacion: "venta", flujo: null };
const advance = { version: 3, etapa: "documentacion", fechaObjetivo: null, checklist: {} };
const fullTask = { pasos: [{ id: "D01", texto: "Escritura", hecho: true }] };

// Sin frenos de proceso (titular, 16/11/2026): la ruta ya no exige el arranque ni frena la firma por la hipoteca;
// el panel lo avisa. La base tampoco lo exige (20261116100000).
it("sale de captación aunque falten el 02, el 04 y el checklist (se avisa, no frena)", async () => {
  const rpc = vi.fn(async () => ({ data: { id }, error: null }));
  requireStaff.mockResolvedValue({ client: fakeClient({ expediente: owner, drafts: [{ id: "d02", formato_id: "02", version: 2, updated_at: "2026-10-01" }], emissions: [{ draft_id: "d02", draft_version: 1 }], task: { pasos: [{ id: "D01", texto: "Escritura", hecho: false }] } }, rpc), user: { id: "u" } });
  expect((await PUT(request(advance), context)).status).toBe(200);
  expect(rpc).toHaveBeenCalledOnce();
});

it("avanza cuando 02 y 04 están emitidos en su versión vigente y el checklist está completo", async () => {
  const rpc = vi.fn(async () => ({ data: { id }, error: null }));
  requireStaff.mockResolvedValue({ client: fakeClient({ expediente: owner, drafts: [
    { id: "d02", formato_id: "02", version: 2, updated_at: "2026-10-01" },
    { id: "d04", formato_id: "04B", version: 1, updated_at: "2026-10-02" },
  ], emissions: [{ draft_id: "d02", draft_version: 2 }, { draft_id: "d04", draft_version: 1 }], task: fullTask }, rpc), user: { id: "u" } });
  expect((await PUT(request(advance), context)).status).toBe(200);
  expect(rpc).toHaveBeenCalledOnce();
});

it("compradores, inversión y quien sigue en captación avanzan igual", async () => {
  for (const [expediente, etapa] of [
    [{ ...owner, flujo: { ruta: "compra" } }, "documentacion"],
    [{ ...owner, operacion: "inversion" }, "documentacion"],
    [owner, "captacion"],
    [{ ...owner, etapa: "documentacion" }, "comercializacion"],
  ] as const) {
    const rpc = vi.fn(async () => ({ data: { id }, error: null }));
    requireStaff.mockResolvedValue({ client: fakeClient({ expediente }, rpc), user: { id: "u" } });
    expect((await PUT(request({ ...advance, etapa }), context)).status).toBe(200);
    expect(rpc).toHaveBeenCalledOnce();
  }
});

it("responde 404 si el expediente no existe o está eliminado", async () => {
  requireStaff.mockResolvedValue({ client: fakeClient({ expediente: null }), user: { id: "u" } });
  expect((await PUT(request(advance), context)).status).toBe(404);
});

it("en una venta, una cancelación de hipoteca abierta ya no frena la firma ni las etapas posteriores", async () => {
  const sale = { etapa: "negociacion", operacion: "venta", flujo: null };
  for (const [expediente, etapa] of [[sale, "cierre"], [{ ...sale, etapa: "cierre" }, "entrega"]] as const) {
    const rpc = vi.fn(async (name: unknown) => name === "fortius_inmuebles_tramites_que_frenan_firma" ? { data: 1, error: null } : { data: { id }, error: null });
    requireStaff.mockResolvedValue({ client: fakeClient({ expediente }, rpc), user: { id: "u" } });
    expect((await PUT(request({ ...advance, etapa }), context)).status).toBe(200);
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("fortius_inmuebles_update_operation", expect.anything());
  }
});
