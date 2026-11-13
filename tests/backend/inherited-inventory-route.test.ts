import { beforeEach, expect, it, vi } from "vitest";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
vi.mock("server-only", () => ({}));
import { POST } from "@/app/api/admin/inventario-heredado/route";

/* COR-24: alta del inventario heredado, solo del director; la base valida cada paso (staff-scope-database). */
const created = { id: "80000000-0000-4000-8000-000000000024", version: 1, checklist: {}, flujo: { ruta: "captacion" } };
function fake({ operations = [] as unknown[] } = {}) {
  const rpc = vi.fn(async (name: string) => ({ data: name === "fortius_inmuebles_put_record" ? { version: 1 } : { ...created, etapa: "documentacion" }, error: null }));
  const inserted: unknown[] = [];
  const from = (table: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is"]) q[m] = () => q;
    if (table === "fortius_inmuebles_records") q.maybeSingle = async () => ({ data: { data: { titulo: "Casa ficticia", operacion: "venta", asesorId: "ana" } }, error: null });
    else { (q as { then?: unknown }).then = (ok: (v: unknown) => void) => ok({ data: operations, error: null }); q.insert = (row: unknown) => { inserted.push(row); return { select: () => ({ single: async () => ({ data: created, error: null }) }) }; }; }
    return q;
  };
  return { client: { from, rpc }, rpc, inserted };
}
const body = { propiedadSlug: "casa-ficticia", propietario: { nombre: "Propietario de ensayo", telefono: "664 123 4567" }, desde: "2026-06-01", motivo: "Inventario anterior con contrato firmado" };
const send = (data: unknown = body) => POST(new Request("https://panel.test/api/admin/inventario-heredado", { method: "POST", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify(data) }));
beforeEach(() => { requireStaff.mockReset(); });

it("solo el director da de alta inventario heredado", async () => {
  const f = fake(); requireStaff.mockResolvedValue({ client: f.client, user: { role: "editor" } });
  expect((await send()).status).toBe(403);
  expect(f.rpc).not.toHaveBeenCalled();
});

it("crea propietario, operación marcada con sus excepciones y tarea, y la lleva a verificación", async () => {
  const f = fake(); requireStaff.mockResolvedValue({ client: f.client, user: { role: "admin" } });
  expect((await send()).status).toBe(201);
  const [row] = f.inserted as Array<{ asesor_id: string; operacion: string; flujo: { heredado: unknown; requisitos: Record<string, { excepcion?: { motivo: string } }> } }>;
  expect(row).toMatchObject({ asesor_id: "ana", operacion: "venta", flujo: { heredado: { desde: "2026-06-01" } } });
  expect(Object.keys(row.flujo.requisitos).sort()).toEqual(["entrevista", "levantamiento", "plan"]);
  const calls = f.rpc.mock.calls as unknown as Array<[string, Record<string, unknown>]>;
  expect(calls.filter(([n]) => n === "fortius_inmuebles_put_record").map(([, a]) => a.p_collection)).toEqual(["clientes", "tareas"]);
  expect(calls.find(([n]) => n === "fortius_inmuebles_update_operation")?.[1]).toMatchObject({ p_stage: "documentacion" });
});

it("no duplica la operación del propietario ni acepta un contrato con fecha futura", async () => {
  const busy = fake({ operations: [{ id: "x", flujo: { ruta: "captacion", estado: "activa" } }] });
  requireStaff.mockResolvedValue({ client: busy.client, user: { role: "admin" } });
  expect((await send()).status).toBe(409);
  requireStaff.mockResolvedValue({ client: fake().client, user: { role: "admin" } });
  expect((await send({ ...body, desde: "2099-01-01" })).status).toBe(400);
});
