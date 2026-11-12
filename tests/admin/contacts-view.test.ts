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
