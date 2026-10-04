import { expect, it, vi } from "vitest";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { POST } from "@/app/api/admin/formatos/[id]/emitir/route";

it("impide emitir un recibo guardado con datos faltantes y no toca Storage", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const client = { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, expediente_id: "51000000-0000-4000-8000-000000000010", formato_id: "18", data: {}, version: 1 }, error: null }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002", role: "editor" } });
  createServerClient.mockClear();
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(409);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("bloquea un formato cuyo original aún no fue cotejado", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const client = { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, expediente_id: "51000000-0000-4000-8000-000000000010", formato_id: "07", data: {}, version: 1 }, error: null }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002", role: "editor" } });
  createServerClient.mockClear();
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toMatch(/pendiente de cotejo/i);
  expect(createServerClient).not.toHaveBeenCalled();
});
