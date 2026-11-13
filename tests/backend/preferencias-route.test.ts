import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { GET, POST } from "@/app/api/admin/preferencias/route";

/* UX-02 y UX-05: cada quien lee y escribe solo sus preferencias; lo leído de «Para ti» se mezcla en el servidor. */
type Row = { data: Record<string, unknown>; version: number } | null;
let row: Row;
let calls: Array<{ op: string; filters: Record<string, unknown>; payload?: Record<string, unknown> }>;
let raceOnce = false;
function table() {
  const filters: Record<string, unknown> = {};
  let op = "select", payload: Record<string, unknown> | undefined;
  const chain = {
    select: () => chain,
    eq: (column: string, value: unknown) => { filters[column] = value; return chain; },
    insert: (value: Record<string, unknown>) => { op = "insert"; payload = value; return chain; },
    update: (value: Record<string, unknown>) => { op = "update"; payload = value; return chain; },
    maybeSingle: async () => {
      calls.push({ op, filters: { ...filters }, payload });
      if (op === "select") return { data: row, error: null };
      if (raceOnce) { raceOnce = false; row = { data: { bandeja: { leidos: { otra: "2026-11-14T10:00:00.000Z" } } }, version: (row?.version ?? 0) + 1 }; return op === "insert" ? { data: null, error: { code: "23505" } } : { data: null, error: null }; }
      if (op === "update" && filters.version !== row?.version) return { data: null, error: null };
      row = { data: payload!.data as Record<string, unknown>, version: payload!.version as number };
      return { data: { version: row.version }, error: null };
    },
  };
  return chain;
}
const request = (body: unknown, origin = "https://panel.test") => new Request("https://panel.test/api/admin/preferencias", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  row = null; calls = []; raceOnce = false;
  requireStaff.mockResolvedValue({ user: { id: "u-me", role: "editor" }, client: { from: (name: string) => { expect(name).toBe("fortius_inmuebles_user_preferences"); return table(); } } });
});

it("sin fila todavía, las preferencias salen vacías y solo se consulta la propia", async () => {
  const body = await (await GET()).json();
  expect(body.preferencias).toEqual({ data: {}, version: 0 });
  expect(calls[0].filters).toEqual({ user_id: "u-me" });
});

it("marcar como leído crea la fila y después actualiza sobre la versión leída", async () => {
  expect((await POST(request({ claves: ["asignacion:t1"] }))).status).toBe(200);
  expect(calls.find(c => c.op === "insert")?.payload).toMatchObject({ user_id: "u-me", version: 1 });
  const second = await (await POST(request({ claves: ["mencion:n1:x"] }))).json();
  expect(second.preferencias.version).toBe(2);
  expect(Object.keys(second.preferencias.data.bandeja.leidos).sort()).toEqual(["asignacion:t1", "mencion:n1:x"]);
  expect(calls.find(c => c.op === "update")?.filters).toEqual({ user_id: "u-me", version: 1 });
});

it("si otra ventana escribió antes, se vuelve a leer y no se pierde lo suyo", async () => {
  row = { data: {}, version: 1 }; raceOnce = true;
  const body = await (await POST(request({ claves: ["k1"] }))).json();
  expect(Object.keys(body.preferencias.data.bandeja.leidos).sort()).toEqual(["k1", "otra"]);
});

it("rechaza otro origen y datos que no son claves", async () => {
  expect((await POST(request({ claves: ["k"] }, "https://otro.test"))).status).toBe(403);
  expect((await POST(request({ claves: [] }))).status).toBe(400);
  expect((await POST(request({ claves: ["k"], userId: "otra-persona" }))).status).toBe(400);
});
