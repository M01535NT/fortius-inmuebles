import { beforeEach, expect, it, vi } from "vitest";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
vi.mock("server-only", () => ({}));
import { POST } from "@/app/api/admin/inventario-heredado/route";

/*
  BUG-C16: el alta de inventario heredado crea cliente, expediente, tarea y avance en llamadas separadas,
  sin transacción ni compensación. Si falla un paso intermedio (aquí el avance a verificación), la
  respuesta es error pero el expediente ya quedó; el reintento del director responde 409 «Este inmueble
  ya tiene una operación del propietario» y la operación se queda a medias, sin avance.

  La base simulada guarda lo que se escribe, para que el reintento vea lo que dejó el primer intento.
  Si la corrección mueve el alta a una sola función de la base, esta prueba se sustituye por una de PGlite.
*/
type Row = { id: string; version: number; checklist: Record<string, unknown>; flujo: Record<string, unknown>; deleted_at: string | null; etapa: string; propiedad_slug: string };
function base() {
  const expedientes: Row[] = [];
  const records = new Map<string, unknown>();
  let fallaAvance = true;
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    if (name === "fortius_inmuebles_put_record") { records.set(`${args.p_collection}/${args.p_id}`, args.p_data); return { data: { version: 1 }, error: null }; }
    if (name === "fortius_inmuebles_update_operation") {
      if (fallaAvance) { fallaAvance = false; return { data: null, error: { code: "PT409", message: "Fallo controlado del avance" } }; }
      const row = expedientes.find(e => e.id === args.p_id)!; row.etapa = String(args.p_stage); row.version++;
      return { data: row, error: null };
    }
    return { data: null, error: { code: "PT400", message: `RPC no simulada: ${name}` } };
  });
  const from = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    const q: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit"]) q[m] = () => q;
    q.eq = (col: string, value: unknown) => { filters.push([col, value]); return q; };
    q.is = (col: string, value: unknown) => { filters.push([col, value]); return q; };
    const visibles = () => expedientes.filter(e => filters.every(([c, v]) => (e as Record<string, unknown>)[c] === v));
    if (table === "fortius_inmuebles_records") {
      q.maybeSingle = async () => ({ data: { data: { titulo: "Casa ficticia", operacion: "venta", asesorId: "ana" } }, error: null });
      return q;
    }
    q.then = (ok: (v: unknown) => void) => ok({ data: visibles(), error: null });
    q.maybeSingle = async () => ({ data: visibles()[0] ?? null, error: null });
    q.insert = (row: Partial<Row>) => {
      const saved: Row = { id: crypto.randomUUID(), version: 1, checklist: {}, deleted_at: null, etapa: "captacion", propiedad_slug: String(row.propiedad_slug), flujo: row.flujo ?? {} };
      expedientes.push(saved);
      return { select: () => ({ single: async () => ({ data: saved, error: null }), maybeSingle: async () => ({ data: saved, error: null }) }) };
    };
    q.update = (patch: Partial<Row>) => {
      const chain: Record<string, unknown> = {};
      const conds: Array<[string, unknown]> = [];
      const run = () => { const rows = expedientes.filter(e => conds.every(([c, v]) => (e as Record<string, unknown>)[c] === v)); rows.forEach(r => Object.assign(r, patch)); return rows; };
      for (const m of ["eq", "is"]) chain[m] = (c: string, v: unknown) => { conds.push([c, v]); return chain; };
      chain.select = () => chain;
      chain.maybeSingle = async () => ({ data: run()[0] ?? null, error: null });
      chain.single = async () => ({ data: run()[0] ?? null, error: null });
      chain.then = (ok: (v: unknown) => void) => ok({ data: run(), error: null });
      return chain;
    };
    q.delete = () => {
      const chain: Record<string, unknown> = {};
      const conds: Array<[string, unknown]> = [];
      for (const m of ["eq", "is"]) chain[m] = (c: string, v: unknown) => { conds.push([c, v]); return chain; };
      chain.then = (ok: (v: unknown) => void) => { for (const r of expedientes.filter(e => conds.every(([c, v]) => (e as Record<string, unknown>)[c] === v))) expedientes.splice(expedientes.indexOf(r), 1); ok({ data: null, error: null }); };
      return chain;
    };
    return q;
  };
  return { client: { from, rpc }, expedientes };
}
const body = { propiedadSlug: "casa-ficticia", propietario: { nombre: "Propietario de ensayo", telefono: "664 123 4567" }, desde: "2026-06-01", motivo: "Inventario anterior con contrato firmado" };
const send = () => POST(new Request("https://panel.test/api/admin/inventario-heredado", { method: "POST", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify(body) }));
beforeEach(() => { requireStaff.mockReset(); });

it("si falla un paso del alta, el reintento del director termina el alta y deja una sola operación", async () => {
  const db = base();
  requireStaff.mockResolvedValue({ client: db.client, user: { role: "admin" } });
  expect((await send()).status).not.toBe(201);
  const retry = await send();
  expect(retry.status).toBe(201);
  const vivas = db.expedientes.filter(e => e.propiedad_slug === "casa-ficticia" && e.deleted_at === null);
  expect(vivas).toHaveLength(1);
  expect(vivas[0].etapa).toBe("documentacion");
});
