import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { GET, POST } from "@/app/api/admin/expedientes/route";

beforeEach(() => { requireStaff.mockReset(); });

it("deniega la lista sin sesión", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  const response = await GET();
  expect(response.status).toBe(401);
});

it("rechaza un expediente con cliente inválido antes de escribir", async () => {
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u", role: "admin" } });
  const request = new Request("https://panel.test/api/admin/expedientes", {
    method: "POST", headers: { origin: "https://panel.test", "content-type": "application/json" },
    body: JSON.stringify({ clienteId: "../otro", asesorId: "a1", folio: "E1", operacion: "venta" }),
  });
  const response = await POST(request);
  expect(response.status).toBe(400);
});
