import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { GET } from "@/app/api/admin/apps/runs/route";

const expediente = "80000000-0000-4000-8000-000000000010";
function chain(result: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "is", "not", "order"]) query[method] = vi.fn(() => query);
  query.range = vi.fn().mockResolvedValue(result); query.limit = vi.fn().mockResolvedValue(result);
  return query;
}
beforeEach(() => { requireStaff.mockReset(); });

it("deniega la consulta sin sesión", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  expect((await GET(new Request("https://panel.test/api/admin/apps/runs?slug=ofertas"))).status).toBe(401);
});

it("filtra los trabajos por expediente cuando se indica", async () => {
  const query = chain({ data: [], count: 0, error: null });
  requireStaff.mockResolvedValue({ client: { from: () => query } });
  const response = await GET(new Request(`https://panel.test/api/admin/apps/runs?slug=ofertas&expedienteId=${expediente}`));
  expect(response.status).toBe(200);
  expect(query.eq).toHaveBeenCalledWith("expediente_id", expediente);
});

it("rechaza un expediente con formato inválido", async () => {
  requireStaff.mockResolvedValue({ client: { from: () => chain({ data: [], count: 0, error: null }) } });
  expect((await GET(new Request("https://panel.test/api/admin/apps/runs?slug=ofertas&expedienteId=../otro"))).status).toBe(400);
});

it("resume el último informe por expediente sin devolver contenido", async () => {
  const query = chain({ data: [{ expediente_id: expediente, updated_at: "2026-10-10T18:00:00Z" }, { expediente_id: expediente, updated_at: "2026-09-01T18:00:00Z" }, { expediente_id: null, updated_at: "2026-10-12T18:00:00Z" }], error: null });
  requireStaff.mockResolvedValue({ client: { from: () => query } });
  const response = await GET(new Request("https://panel.test/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente"));
  expect(await response.json()).toEqual({ ultimos: { [expediente]: "2026-10-10T18:00:00Z" } });
  expect(query.select).toHaveBeenCalledWith("expediente_id,updated_at");
  expect(query.is).toHaveBeenCalledWith("deleted_at", null);
  expect(query.not).toHaveBeenCalledWith("result", "is", null);
});

it("recorre todas las páginas antes de resumir el último informe", async () => {
  const otro = "80000000-0000-4000-8000-000000000011";
  const query = chain(null);
  query.range = vi.fn()
    .mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => ({ expediente_id: expediente, updated_at: "2026-10-10T18:00:00Z" })), error: null })
    .mockResolvedValueOnce({ data: [{ expediente_id: otro, updated_at: "2026-08-01T18:00:00Z" }], error: null });
  requireStaff.mockResolvedValue({ client: { from: () => query } });
  const response = await GET(new Request("https://panel.test/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente"));
  expect(await response.json()).toEqual({ ultimos: { [expediente]: "2026-10-10T18:00:00Z", [otro]: "2026-08-01T18:00:00Z" } });
  expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
});
