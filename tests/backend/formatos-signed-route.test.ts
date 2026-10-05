import { expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { POST } from "@/app/api/admin/emisiones/[id]/firmado/route";

it("rechaza cargar una copia firmada sin acceso autenticado", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  createServerClient.mockClear();
  const id = "51000000-0000-4000-8000-000000000012";
  const response = await POST(new Request(`https://panel.test/api/admin/emisiones/${id}/firmado`, { method: "POST", headers: { origin: "https://panel.test", "content-type": "multipart/form-data; boundary=abc" }, body: "--abc--" }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(401);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("rechaza archivos que no son PDF antes de usar almacenamiento privilegiado", async () => {
  const id = "51000000-0000-4000-8000-000000000012";
  const client = { from: vi.fn((table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "fortius_inmuebles_formato_emissions" ? { id, draft_id: "51000000-0000-4000-8000-000000000011" } : { expediente_id: "51000000-0000-4000-8000-000000000010" }, error: null }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002" } });
  createServerClient.mockClear();
  const form = new FormData();
  form.set("archivo", new File(["fake"], "firmado.pdf", { type: "application/pdf" }));
  const response = await POST(new Request(`https://panel.test/api/admin/emisiones/${id}/firmado`, { method: "POST", headers: { origin: "https://panel.test" }, body: form }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(400);
  expect(createServerClient).not.toHaveBeenCalled();
});
