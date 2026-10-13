import { afterEach, expect, test, vi } from "vitest";
import { GET as capabilities } from "@/app/api/admin/tareas/capacidades/route";
import { ApiError } from "@/lib/backend/http";
import { PUT } from "@/app/api/admin/collections/[collection]/[id]/route";
const auth = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => auth);
afterEach(() => vi.restoreAllMocks());
const expedienteId = "60000000-0000-4000-8000-000000000010";
const task = { id: "api-task", titulo: "Revisar documentos", categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [], expedienteId, clienteId: "c-own", asesorId: "own", propiedadSlug: "same-property" };
function request(data: unknown) { return new Request("http://localhost/api/admin/collections/tareas/api-task", { method: "PUT", headers: { Origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify({ data, version: null }) }); }
const context = { params: Promise.resolve({ collection: "tareas", id: "api-task" }) };
function client(ready: boolean) {
  return {
    from: () => ({ select: () => ({ limit: async () => ready ? { data: [], error: null } : { data: null, error: { code: "42703" } } }) }),
    rpc: vi.fn(async (_name, args) => ({ data: { id: args.p_id, data: args.p_data, version: 1 }, error: null })),
  };
}
test("API refuses a new expediente reference until its database guard is installed", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const database = client(false); auth.requireStaff.mockResolvedValue({ client: database });
  const response = await PUT(request(task), context);
  expect(response.status).toBe(503); expect(database.rpc).not.toHaveBeenCalled();
});
test("API preserves an authorized expediente UUID for the guarded RPC", async () => {
  const database = client(true); auth.requireStaff.mockResolvedValue({ client: database });
  const response = await PUT(request(task), context);
  expect(response.status).toBe(200);
  expect((await response.json()).record.data.expedienteId).toBe(expedienteId);
});
test("API keeps legacy task updates available when the migration is missing", async () => {
  const database = client(false); auth.requireStaff.mockResolvedValue({ client: database });
  const legacy: Record<string, unknown> = { ...task }; delete legacy.expedienteId;
  const response = await PUT(request(legacy), context);
  expect(response.status).toBe(200); expect((await response.json()).record.data).not.toHaveProperty("expedienteId");
});

test("capability returns only a safe boolean and requires authorized staff", async () => {
  auth.requireStaff.mockResolvedValue({ client: client(true) });
  const enabled = await capabilities(); expect(await enabled.json()).toEqual({ expedienteLinks: true });
  auth.requireStaff.mockResolvedValue({ client: client(false) });
  const disabled = await capabilities(); expect(await disabled.json()).toEqual({ expedienteLinks: false });
  auth.requireStaff.mockRejectedValue(new ApiError(403, "Acceso no autorizado"));
  expect((await capabilities()).status).toBe(403);
});
test("API rejects malformed UUIDs before the database mutation", async () => {
  const database = client(true); auth.requireStaff.mockResolvedValue({ client: database });
  expect((await PUT(request({ ...task, expedienteId: "invalid" }), context)).status).toBe(400);
  expect(database.rpc).not.toHaveBeenCalled();
});
