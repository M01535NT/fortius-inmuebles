import { expect, test } from "vitest";
import type { Lead } from "@/lib/admin/store";
import type { Cliente } from "@/lib/backend/contracts";
import type { Task } from "@/lib/tasks";
import { askNextAfter, isNextStepTask, openNextStep, planNextStep } from "@/lib/admin/next-step-task";
import { projectFollowups } from "@/lib/admin/followups";
import { nextStep } from "@/lib/admin/contacts-view";

// Datos ficticios de ensayo (DEC-42).
const task = (over: Partial<Task>): Task => ({ id: "t1", titulo: "Llamar", descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", vence: "2026-11-14", pasos: [], leadId: "l1", ...over });
const lead = (over: Partial<Lead> = {}): Lead => ({ id: "l1", nombre: "Interesada de ensayo", telefono: "6640000000", origen: "contacto", estado: "contactado", creadoEl: "2026-11-10T10:00:00Z", notas: [], perfil: { proximoContacto: "2026-11-11", proximaAccion: "Paso viejo" }, ...over });

test("DEC-42: la tarea de siguiente paso es de seguimiento, con la persona y sin operación", () => {
  expect(isNextStepTask(task({}), { kind: "lead", id: "l1" })).toBe(true);
  expect(isNextStepTask(task({ expedienteId: "51000000-0000-4000-8000-000000000001" }))).toBe(false);
  expect(isNextStepTask(task({ categoria: "visitas" }))).toBe(false);
  expect(isNextStepTask(task({}), { kind: "cliente", id: "l1" })).toBe(false);
});

test("«Registrar contacto» mueve la tarea abierta o crea una si no hay", () => {
  const ref = { kind: "lead" as const, id: "l1", asesorId: "a1" };
  const created = planNextStep([], ref, { accion: " Enviarle opciones ", fecha: "2026-11-15", id: "nueva" });
  expect(created).toMatchObject({ id: "nueva", titulo: "Enviarle opciones", vence: "2026-11-15", categoria: "leads", estado: "pendiente", leadId: "l1", asesorId: "a1" });
  const moved = planNextStep([task({ estado: "en-espera", motivoEspera: "Fuera de la ciudad" })], ref, { accion: "Volver a llamar", fecha: "2026-11-20", id: "otra" });
  expect(moved).toMatchObject({ id: "t1", titulo: "Volver a llamar", vence: "2026-11-20", estado: "pendiente" });
  // Una completada no se reabre: se crea la siguiente.
  expect(planNextStep([task({ estado: "completada" })], ref, { accion: "x", fecha: "2026-11-20", id: "otra" }).id).toBe("otra");
  expect(openNextStep([task({ id: "b", vence: "2026-11-20" }), task({ id: "a", vence: "2026-11-13" })], ref)?.id).toBe("a");
});

test("al completar el siguiente paso se pide el que sigue, salvo que ya haya otro abierto", () => {
  const done = task({ estado: "completada", asesorId: "a1" });
  expect(askNextAfter(done, [done])).toEqual({ kind: "lead", id: "l1", asesorId: "a1" });
  expect(askNextAfter(done, [done, task({ id: "t2" })])).toBeNull();
  expect(askNextAfter(task({ categoria: "documentacion" }), [])).toBeNull();
  expect(askNextAfter(task({ leadId: undefined, clienteId: "c1" }), [])).toMatchObject({ kind: "cliente", id: "c1" });
});

test("con tarea de siguiente paso, el «próximo contacto» del perfil ya no aparece en Hoy, la Agenda ni la ficha", () => {
  const cliente: Cliente = { id: "c1", nombre: "Cliente de ensayo", telefono: "6640000000", tipo: "comprador", notas: "", creadoEl: "2026-09-01T00:00:00Z", actualizadoEl: "2026-09-01T00:00:00Z", perfil: { proximoContacto: "2026-11-11" } };
  expect(projectFollowups([lead()], [cliente]).map(f => f.id)).toEqual(["cliente:c1", "lead:l1"]);
  // Aun completada, la tarea manda: la fecha vieja del perfil no vuelve como vencida.
  expect(projectFollowups([lead()], [cliente], null, [task({ estado: "completada" })]).map(f => f.id)).toEqual(["cliente:c1"]);
  expect(nextStep(lead(), "lead", [task({})], [], "2026-11-12")).toEqual({ text: "Llamar", date: "2026-11-14", time: undefined });
  expect(nextStep(lead(), "lead", [task({ estado: "completada" })], [], "2026-11-12")).toBeNull();
  expect(nextStep(lead(), "lead", [], [], "2026-11-12")?.text).toBe("Paso viejo");
});
