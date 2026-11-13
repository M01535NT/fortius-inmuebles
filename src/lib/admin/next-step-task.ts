import { isTaskOpen, type Task } from "@/lib/tasks";

/*
  DEC-42 (titular, 12/11/2026): el siguiente paso de una persona es siempre una tarea con fecha,
  la misma que ven su ficha, Hoy y la Agenda. «Registrar contacto» la crea o la mueve; al
  completarla se pide la siguiente. Es una tarea de seguimiento (`leads`) ligada a la persona y a
  ninguna operación: las de una operación las lleva la operación.
  El «próximo contacto» del perfil se sigue guardando, pero en cuanto la persona tiene una tarea de
  siguiente paso deja de mostrarse: manda la tarea.
*/

export type PersonRef = { kind: "lead" | "cliente"; id: string; asesorId?: string };
/** Una operación: su siguiente paso es su próxima tarea con fecha (tarjeta «Próxima tarea»). */
export type OperationRef = { kind: "operacion"; id: string; asesorId?: string; clienteId?: string; propiedadSlug?: string };
export type NextRef = PersonRef | OperationRef;
export const OPERATION_NEXT_DESCRIPTION = "Próxima acción de la operación";

/** La tarea nueva con que una operación agenda su siguiente paso. */
export function operationNextStep(ref: OperationRef, step: { accion: string; fecha: string; id: string }): Task {
  return {
    id: step.id, titulo: step.accion.trim().slice(0, 160), descripcion: OPERATION_NEXT_DESCRIPTION, categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [], vence: step.fecha,
    expedienteId: ref.id, ...(ref.asesorId ? { asesorId: ref.asesorId } : {}), ...(ref.clienteId ? { clienteId: ref.clienteId } : {}), propiedadSlug: ref.propiedadSlug ?? "",
  };
}

const owns = (task: Pick<Task, "leadId" | "clienteId">, ref: Pick<PersonRef, "kind" | "id">) => ref.kind === "lead" ? task.leadId === ref.id : task.clienteId === ref.id;

/** Tarea de siguiente paso de una persona (abierta o cerrada): seguimiento, con la persona y sin operación. */
export function isNextStepTask(task: Pick<Task, "categoria" | "expedienteId" | "leadId" | "clienteId">, ref?: Pick<PersonRef, "kind" | "id">) {
  if (task.categoria !== "leads" || task.expedienteId) return false;
  return ref ? owns(task, ref) : !!(task.leadId || task.clienteId);
}

/** La tarea de siguiente paso abierta de la persona; si hubiera varias, la que vence primero. */
export function openNextStep(tasks: readonly Task[], ref: Pick<PersonRef, "kind" | "id">): Task | undefined {
  return tasks.filter(task => isTaskOpen(task) && isNextStepTask(task, ref))
    .sort((a, b) => (a.vence || "9999").localeCompare(b.vence || "9999"))[0];
}

/** Personas («lead:id», «cliente:id») cuyo siguiente paso ya vive en tareas. */
export function peopleOnTasks(tasks: readonly Task[]): Set<string> {
  const keys = new Set<string>();
  for (const task of tasks) {
    if (!isNextStepTask(task)) continue;
    if (task.leadId) keys.add(`lead:${task.leadId}`);
    if (task.clienteId) keys.add(`cliente:${task.clienteId}`);
  }
  return keys;
}

/** Mueve la tarea abierta al nuevo paso y fecha, o crea una si no hay. Devuelve el registro a guardar. */
export function planNextStep(tasks: readonly Task[], ref: PersonRef, step: { accion: string; fecha: string; id: string }): Task {
  const titulo = step.accion.trim().slice(0, 160);
  const current = openNextStep(tasks, ref);
  if (current) return { ...current, titulo, vence: step.fecha, ...(current.estado === "en-espera" ? { estado: "pendiente" as const, motivoEspera: undefined } : {}) };
  return {
    id: step.id, titulo, descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", vence: step.fecha, pasos: [],
    ...(ref.kind === "lead" ? { leadId: ref.id } : { clienteId: ref.id }),
    ...(ref.asesorId ? { asesorId: ref.asesorId } : {}),
  };
}

/**
  Al completar una tarea, si la persona (o la operación) se queda sin otra abierta, hay que pedir
  la siguiente. En una operación cuenta cualquier tarea suya: «Próxima tarea» muestra la primera abierta.
*/
export function askNextAfter(completed: Task, tasks: readonly Task[]): NextRef | null {
  if (completed.expedienteId) {
    const others = tasks.some(task => task.id !== completed.id && task.expedienteId === completed.expedienteId && isTaskOpen(task));
    return others ? null : { kind: "operacion", id: completed.expedienteId, asesorId: completed.asesorId, clienteId: completed.clienteId, propiedadSlug: completed.propiedadSlug };
  }
  if (!isNextStepTask(completed)) return null;
  const ref: PersonRef = completed.leadId ? { kind: "lead", id: completed.leadId, asesorId: completed.asesorId } : { kind: "cliente", id: completed.clienteId!, asesorId: completed.asesorId };
  return openNextStep(tasks.filter(task => task.id !== completed.id), ref) ? null : ref;
}
