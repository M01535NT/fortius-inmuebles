import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff, privileged } = vi.hoisted(() => ({ requireStaff: vi.fn(), privileged: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient: privileged }));
import { PUT as vincular } from "@/app/api/admin/asesor-cuentas/route";

const adminId = "10000000-0000-4000-8000-000000000086";
const cuentaId = "51000000-0000-4000-8000-000000000086";
beforeEach(() => { vi.clearAllMocks(); });

/*
  BUG-C86 (servidor): PUT /api/admin/asesor-cuentas liga una cuenta con una ficha de asesor inactiva.
  asesor-cuentas/route.ts:31-35 revisa que la cuenta sea de un editor activo, pero no mira la ficha;
  el filtro de asesores activos vive solo en la pantalla (adviser-account-links.tsx:52). La cuenta
  queda viendo y operando lo asignado a alguien que Equipo marca como inactivo.
*/
it("no liga una cuenta con una ficha de asesor inactiva", async () => {
  const ficha = { id: "ana", nombre: "Ana Inactiva de ensayo", cargo: "Asesora", iniciales: "AI", activo: false };
  const upsert = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { user_id: cuentaId, asesor_id: "ana" }, error: null }) }) }));
  // Lectura de la ficha disponible por si el servidor la consulta (fortius_inmuebles_records).
  const records = { select: () => records, eq: () => records, maybeSingle: async () => ({ data: { data: ficha, version: 1 }, error: null }), single: async () => ({ data: { data: ficha, version: 1 }, error: null }) };
  const client = { from: (table: string) => table === "fortius_inmuebles_adviser_accounts" ? { upsert } : records, rpc: vi.fn(async () => ({ data: [{ data: ficha }], error: null })) };
  requireStaff.mockResolvedValue({ user: { id: adminId, role: "admin" }, client });
  const staff = { select: () => staff, eq: () => staff, maybeSingle: async () => ({ data: { role: "editor", active: true }, error: null }) };
  privileged.mockReturnValue({ from: (table: string) => table === "fortius_inmuebles_staff" ? staff : records });
  const response = await vincular(new Request("https://panel.test/api/admin/asesor-cuentas", { method: "PUT", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ userId: cuentaId, asesorId: "ana" }) }));
  expect(upsert, "se guardó el vínculo con la ficha inactiva").not.toHaveBeenCalled();
  expect(response.status).toBe(400);
});
