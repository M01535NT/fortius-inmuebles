import { expect, test } from "vitest";
import { taskSchema, taskBucket } from "@/lib/tasks";
import { parseRecord, projectPublic } from "@/lib/backend/validation";
const task = { id: "t1", titulo: "Seguimiento", categoria: "leads", estado: "pendiente", prioridad: "normal", pasos: [] };
test("tasks validate actual dates, wait reasons and checklist shape", () => {
  expect(parseRecord("tareas", "t1", task)).toMatchObject({ descripcion: "" });
  for (const patch of [{vence:"2026-02-30"},{estado:"en-espera"},{pasos:[{id:"p",texto:"Paso",hecho:"false"}]}]) expect(taskSchema.safeParse({...task,...patch}).success).toBe(false);
  expect(taskSchema.safeParse({...task, vence:"2028-02-29"}).success).toBe(true);
  expect(projectPublic("tareas",[task])).toEqual([]);
});
test("task buckets use UTC date arithmetic and closed states", () => {
  const parsed = taskSchema.parse(task);
  for (const [vence,bucket] of [["2026-09-22","vencidas"],["2026-09-23","hoy"],["2026-09-24","proximas"],["2026-09-30","proximas"],["2026-10-01","futuras"],[undefined,"sin-fecha"]] as const) expect(taskBucket({...parsed,vence},"2026-09-23")).toBe(bucket);
  expect(taskBucket({...parsed,estado:"cancelada"},"2026-09-23")).toBe("cerradas");
});

test("task records persist an optional UUID expediente reference and reject malformed references", () => {
  const expedienteId = "60000000-0000-4000-8000-000000000010";
  expect(parseRecord("tareas", "t1", { ...task, expedienteId })).toMatchObject({ expedienteId });
  for (const invalid of ["not-a-uuid", null, 42]) expect(taskSchema.safeParse({ ...task, expedienteId: invalid }).success).toBe(false);
  expect(taskSchema.safeParse({ ...task, expedienteId: "" }).success).toBe(true);
  expect(parseRecord("tareas", "t1", task)).not.toHaveProperty("expedienteId");
});

test("UUID case does not split task context identity", () => {
  const expedienteId = "6ABC0000-0000-4000-8000-000000000010";
  expect(parseRecord("tareas", "t1", { ...task, expedienteId }).expedienteId).toBe("6abc0000-0000-4000-8000-000000000010");
});
