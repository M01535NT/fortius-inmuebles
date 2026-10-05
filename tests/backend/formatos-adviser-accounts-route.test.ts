import { expect, it, vi } from "vitest";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { GET, PUT } from "@/app/api/admin/asesor-cuentas/route";

it("solo el administrador puede consultar y vincular cuentas de asesores", async () => {
  requireStaff.mockResolvedValue({ user: { id: "u", role: "editor" }, client: {} });
  createServerClient.mockClear();
  const get = await GET();
  expect(get.status).toBe(403);
  const put = await PUT(new Request("https://panel.test/api/admin/asesor-cuentas", { method: "PUT", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ userId: "51000000-0000-4000-8000-000000000002", asesorId: "a1" }) }));
  expect(put.status).toBe(403);
  expect(createServerClient).not.toHaveBeenCalled();
});
