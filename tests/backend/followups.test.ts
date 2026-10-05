import { expect, test } from "vitest";
import type { Lead } from "@/lib/admin/store";
import type { Cliente } from "@/lib/backend/contracts";
import { overdueFollowups, projectFollowups } from "@/lib/admin/followups";

const lead = (id: string, fecha: string, extra: Partial<Lead> = {}): Lead => ({
  id, nombre: `Lead ${id}`, telefono: "6641234567", origen: "manual", estado: "activo", creadoEl: "2026-09-01T00:00:00Z", notas: [], perfil: { proximoContacto: fecha }, ...extra,
});
const cliente = (id: string, fecha: string, extra: Partial<Cliente> = {}): Cliente => ({
  id, nombre: `Cliente ${id}`, telefono: "6641234567", tipo: "comprador", notas: "", creadoEl: "2026-09-01T00:00:00Z", actualizadoEl: "2026-09-01T00:00:00Z", perfil: { proximoContacto: fecha }, ...extra,
});

test("a converted lead produces one client followup and keeps the responsible adviser", () => {
  const items = projectFollowups([lead("lead1", "2026-09-20", { clienteId: "client1", asesorId: "old" })], [cliente("client1", "2026-09-21", { leadId: "lead1", asesorId: "new" })]);
  expect(items).toEqual([{ id: "cliente:client1", kind: "cliente", personId: "client1", personName: "Cliente client1", asesorId: "new", fecha: "2026-09-21", href: "/admin/clientes/client1" }]);
});

test("closed leads are excluded; today's followup is not overdue", () => {
  const items = projectFollowups([lead("closed", "2026-09-01", { estado: "cerrado" }), lead("active", "2026-09-22")], [cliente("client", "2026-09-21")]);
  expect(overdueFollowups(items, "2026-09-22").map(item => item.id)).toEqual(["cliente:client"]);
  expect(items.map(item => item.id)).toEqual(["cliente:client", "lead:active"]);
});
