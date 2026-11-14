import { expect, test } from "vitest";
import { todayTasks } from "@/lib/admin/today";
import { attentionOf, type OperationRecord } from "@/lib/admin/operation-view";
import { emptyWorkflow, workflowBlockers, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";

const task = (over: Partial<Task> = {}): Task => ({ id: "t1", titulo: "Llamar al propietario", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], expedienteId: "51000000-0000-4000-8000-000000000001", asesorId: "a1", vence: "2026-11-13", ...over });

/*
  BUG-C34: «Tareas de hoy» deja ver las tareas que se terminaron hoy, pero compara la marca de la
  base (UTC) recortada a fecha con el «hoy» de Tijuana. Una tarea que vence hoy y se completa
  por la tarde (desde las 16:00, o las 17:00 en horario de verano) desaparece de la lista.
*/
test("una tarea de hoy completada a las 17:30 de Tijuana sigue en «Tareas de hoy»", () => {
  const hecha = task({ estado: "completada", completadoEl: "2026-11-14T01:30:00.000Z" });
  expect(todayTasks([hecha], "2026-11-13").map(t => t.id)).toEqual(["t1"]);
});

/*
  BUG-C35: «Sin próxima tarea» (Hoy, Operaciones y el número del menú) acepta cualquier tarea
  abierta con fecha, pero el avance de etapa exige una del asesor de la operación. Con una tarea
  fechada sin responsable (o de otro asesor) la operación no aparece como pendiente de agendar
  y, al mismo tiempo, su lista de faltantes pide «Agendar la próxima tarea» y bloquea «Pasar a».
*/
test("la cola y el avance coinciden en si falta agendar la próxima tarea", () => {
  const op: OperationRecord = { id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "captacion", flujo: { ...emptyWorkflow("captacion") } as OperationWorkflow };
  const ajena = [task({ asesorId: "a2", vence: "2026-11-20" })];
  const faltaAgendar = workflowBlockers(op.flujo as OperationWorkflow, "documentacion", op, ajena, "2026-11-13").includes("Agendar una próxima tarea con fecha y responsable.");
  expect(faltaAgendar).toBe(true);
  const colaPideAgendar = attentionOf(op, ajena, "2026-11-13")?.kind === "agendar";
  expect(colaPideAgendar).toBe(faltaAgendar);
});
