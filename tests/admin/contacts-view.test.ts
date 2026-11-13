import { expect, test } from "vitest";
import { nextStep } from "@/lib/admin/contacts-view";
import type { Task } from "@/lib/tasks";

const today = "2026-11-02";
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "general", estado: "pendiente", prioridad: "normal", pasos: [], ...over } as Task);
const person = { id: "c1", perfil: { proximoContacto: "2026-11-01" } };

test("C40: con una operación activa, el siguiente paso sale de la operación y no del perfil", () => {
  const ops = [{ id: "op1", clienteId: "c1", stage: "Dictamen jurídico" }];
  // Sin operación, manda el «próximo contacto» del perfil.
  expect(nextStep(person, "cliente", [], [], today)).toEqual({ text: "Darle seguimiento", date: "2026-11-01", time: undefined });
  // Con operación, la tarea de la operación aunque no tenga clienteId.
  expect(nextStep(person, "cliente", [task({ titulo: "Pedir el certificado", vence: "2026-11-05", expedienteId: "op1" })], [], today, ops))
    .toEqual({ text: "Pedir el certificado", date: "2026-11-05", time: undefined });
  // Con operación y nada agendado, dice la etapa, sin fecha inventada.
  expect(nextStep(person, "cliente", [], [], today, ops)).toEqual({ text: "Operación en dictamen jurídico" });
  // Las operaciones de otra persona no cuentan.
  expect(nextStep(person, "cliente", [], [], today, [{ id: "op2", clienteId: "c2", stage: "Levantamiento" }])?.text).toBe("Darle seguimiento");
});

test("CRM-01: la lista del día agrupa sin atender, hoy o atrasado, más adelante y sin siguiente paso", async () => {
  const { dayGroups, waitingSince } = await import("@/lib/admin/contacts-view");
  const row = (id: string, sort: string) => ({ id, kind: "lead" as const, href: "", name: id, phone: "", wants: "", zone: "", budget: null, step: "", when: null, late: false, sort });
  const now = new Date("2026-11-02T15:00:00.000Z");
  const lead = (over: Record<string, unknown>) => ({ origen: "contacto", estado: "nuevo", creadoEl: "2026-11-02T12:00:00.000Z", ...over }) as Parameters<typeof waitingSince>[0];
  const waits: Record<string, ReturnType<typeof waitingSince>> = { nuevo: waitingSince(lead({}), now, 2), reciente: waitingSince(lead({ creadoEl: "2026-11-02T14:30:00.000Z" }), now, 2) };
  const groups = dayGroups([row("despues", "2026-11-05 "), row("nuevo", "9999"), row("vencido", "2026-11-01 "), row("hoy", "2026-11-02 10:00"), row("libre", "9999"), row("reciente", "9999")], today, r => waits[r.id] ?? null);
  expect(groups.map(g => [g.id, g.rows.map(r => r.id)])).toEqual([
    ["sin-atender", ["nuevo", "reciente"]], ["hoy", ["vencido", "hoy"]], ["despues", ["despues"]], ["sin-paso", ["libre"]],
  ]);
  expect(waits.nuevo).toEqual({ hours: 3, late: true });
  expect(waits.reciente).toEqual({ hours: 0, late: false });
  // Quien ya fue atendido, se capturó a mano o ya es cliente no espera primera atención.
  for (const over of [{ firstContactedAt: "2026-11-02T13:00:00.000Z" }, { origen: "manual" }, { estado: "contactado" }, { clienteId: "c1" }]) expect(waitingSince(lead(over), now, 2)).toBeNull();
});
