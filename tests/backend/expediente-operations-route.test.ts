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
      calls.push({ url: new URL(String(url)), body: JSON.parse(String(init?.body ?? "{}")) });
      return Response.json([]);
    } },
  });
  requireStaff.mockResolvedValue({ client, user: { id: "u" } });
  const response = await PUT(request({ version: 2, etapa: "cierre", fechaObjetivo: "2026-11-15", checklist: {} }), context);
  expect(response.status).toBe(409);
  expect(calls[0].url.searchParams.get("version")).toBe("eq.2");
  expect(calls[0].url.searchParams.get("deleted_at")).toBe("is.null");
  expect(calls[0].body).toMatchObject({ version: 3, etapa: "cierre", fecha_objetivo: "2026-11-15" });
});
it("rechaza notas vacías", async () => {
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u" } });
  expect((await POST(request({ descripcion: "  " }, "POST"), context)).status).toBe(400);
});
