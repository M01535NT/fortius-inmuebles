import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { POST as createDraft } from "@/app/api/admin/expedientes/[id]/formatos/route";
import { PUT as saveDraft } from "@/app/api/admin/formatos/[id]/route";

beforeEach(() => requireStaff.mockResolvedValue({ client: {}, user: { id: "u", role: "admin" } }));
const request = (path: string, method: string, body: object) => new Request(`https://panel.test${path}`, {
  method, headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify(body),
});

it("rechaza un tipo de documento que no está en los 25 originales", async () => {
  const id = "51000000-0000-4000-8000-000000000010";
  const response = await createDraft(request(`/api/admin/expedientes/${id}/formatos`, "POST", { formatoId: "20", data: {} }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(400);
});
it("el tablero global 03 no crea un borrador por expediente",async()=>{
 const id="51000000-0000-4000-8000-000000000010";const r=await createDraft(request(`/api/admin/expedientes/${id}/formatos`,"POST",{formatoId:"03",data:{}}),{params:Promise.resolve({id})});expect(r.status).toBe(409);
});

it("rechaza guardar una revisión de documento sin versión válida", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const response = await saveDraft(request(`/api/admin/formatos/${id}`, "PUT", { version: 0, data: {} }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(400);
});
