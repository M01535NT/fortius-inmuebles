import { expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { GET } from "@/app/api/admin/emisiones/[id]/descargar/route";

it("nunca busca un PDF privado si no hay sesión", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  createServerClient.mockClear();
  const id = "51000000-0000-4000-8000-000000000012";
  const response = await GET(new Request(`https://panel.test/api/admin/emisiones/${id}/descargar`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(401);
  expect(createServerClient).not.toHaveBeenCalled();
});
