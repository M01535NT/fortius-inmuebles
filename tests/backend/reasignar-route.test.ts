import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { captorOf, operationWorkflowSchema } from "@/lib/formatos/operation-workflow";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { POST } from "@/app/api/admin/expedientes/[id]/reasignar/route";

/* M-04: la ruta de reasignación solo deja pasar al director y traduce las respuestas de la base. */
const id = "52000000-0000-4000-8000-000000000010";
const context = { params: Promise.resolve({ id }) };
const request = (body: unknown, origin = "https://panel.test") => new Request(`https://panel.test/api/admin/expedientes/${id}/reasignar`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
const body = { asesorId: "other", motivo: "El asesor se dio de baja del equipo" };
function client(reply: () => Response, calls: { path: string; body: unknown }[] = []) {
  return createClient("https://db.test", "fake-anon-key", { auth: { persistSession: false }, global: { fetch: async (url, init) => { calls.push({ path: new URL(String(url)).pathname, body: JSON.parse(String(init?.body ?? "{}")) }); return reply(); } } });
}
beforeEach(() => requireStaff.mockReset());

it("solo el director reasigna y el motivo es obligatorio", async () => {
  const calls: { path: string; body: unknown }[] = [];
  requireStaff.mockResolvedValue({ client: client(() => Response.json({ movidas: [id] }), calls), user: { id: "u", role: "editor" } });
  expect((await POST(request(body), context)).status).toBe(403);
  requireStaff.mockResolvedValue({ client: client(() => Response.json({ movidas: [id] }), calls), user: { id: "u", role: "admin" } });
  expect((await POST(request({ ...body, motivo: "corto" }), context)).status).toBe(400);
  expect((await POST(request(body, "https://otro.test"), context)).status).toBe(403);
  expect(calls).toEqual([]);
});
it("llama a la base con la operación, el asesor y el motivo", async () => {
  const calls: { path: string; body: unknown }[] = [];
  requireStaff.mockResolvedValue({ client: client(() => Response.json({ movidas: [id, "otra"] }), calls), user: { id: "u", role: "admin" } });
  const response = await POST(request(body), context);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ movidas: [id, "otra"] });
  expect(calls).toEqual([{ path: "/rest/v1/rpc/fortius_inmuebles_reassign_operation", body: { p_id: id, p_asesor: "other", p_motivo: body.motivo } }]);
});
it("muestra los motivos de la base y oculta los demás", async () => {
  for (const [code, message, status, shown] of [
    ["PT409", "El cliente tiene otras operaciones abiertas (EXP-1); reasígnalas primero o juntas", 409, "EXP-1"],
    ["PT400", "Elige un asesor activo del equipo", 400, "asesor activo"],
    ["PT400", "detalle interno de SQL", 400, undefined],
  ] as const) {
    requireStaff.mockResolvedValue({ client: client(() => Response.json({ code, message }, { status: 400 })), user: { id: "u", role: "admin" } });
    const response = await POST(request(body), context);
    const error = String((await response.json()).error);
    if (shown) { expect(response.status).toBe(status); expect(error).toContain(shown); } else expect(error).not.toContain("SQL");
  }
});
it("la guía acepta «captó» y el reparto lo toma de ahí", () => {
  const flujo = operationWorkflowSchema.parse({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, captadoPor: "own" });
  expect(captorOf({ asesor_id: "other", flujo })).toBe("own");
  expect(captorOf({ asesor_id: "other", flujo: null })).toBe("other");
});
