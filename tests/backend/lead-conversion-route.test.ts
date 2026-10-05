import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff, rpc } = vi.hoisted(() => ({ requireStaff: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { POST } from "@/app/api/admin/leads/[id]/convertir/route";
import { ApiError } from "@/lib/backend/http";
const request = (body: unknown = { version: 7 }, origin = "https://panel.test") => new Request("https://panel.test/api/admin/leads/l1/convertir", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: "l1" }) };
beforeEach(() => { vi.clearAllMocks(); requireStaff.mockResolvedValue({ client: { rpc }, user: { role: "editor" } }); });
it("usa el JWT del asesor y una sola operación de conversión con la revisión capturada", async () => {
  rpc.mockResolvedValue({ data: { cliente: { id: "c1" }, lead: { id: "l1" } }, error: null });
  const response = await POST(request(), context);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ cliente: { id: "c1" }, lead: { id: "l1" } });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("fortius_inmuebles_convert_lead", { p_lead_id: "l1", p_version: 7 });
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it.each([{}, { version: null }, { version: 0 }, { version: 1.5 }, { version: 1, clienteId: "forged" }])("rechaza una solicitud inválida %j antes de escribir", async body => {
  expect((await POST(request(body), context)).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});
it("protege la sesión y el origen", async () => {
  expect((await POST(request({ version: 7 }, "https://elsewhere.test"), context)).status).toBe(403);
  requireStaff.mockRejectedValue(new ApiError(401, "Sesión requerida"));
  expect((await POST(request(), context)).status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});
it.each([["PT403", 403], ["PT404", 404], ["PT409", 409], ["XX000", 503]])("traduce %s sin exponer detalles de la base de datos", async (code, status) => {
  rpc.mockResolvedValue({ error: { code, message: "SECRET DATABASE DETAIL" } });
  const response = await POST(request(), context);
  expect(response.status).toBe(status);
  expect(JSON.stringify(await response.json())).not.toContain("SECRET");
});
