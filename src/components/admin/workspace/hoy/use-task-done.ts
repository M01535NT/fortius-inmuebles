"use client";
import * as React from "react";
import { useUndo } from "@/components/admin/workspace/undo-notice";
import { db, upsert, useCollection } from "@/lib/admin/store";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { askNextAfter, type NextRef } from "@/lib/admin/next-step-task";

/*
  Palomear una tarea sin salir de Hoy (LV-10b): «Lo siguiente», las filas de «Tu día» y las tareas
  de la agenda usan el mismo cálculo, así hay un solo aviso con «Deshacer» y una sola pregunta de
  «¿Qué sigue?» a la vez.
  - RP-16: el aviso sale cuando el servidor ya guardó; «Deshacer» la regresa con otra escritura.
  - DEC-42: completar el siguiente paso de una persona o de un asunto pide el que sigue; deshacer
    retira la pregunta (C-71).
*/
export function useTaskDone() {
  const tasks = useCollection(db.tareas);
  const undo = useUndo();
  const [saving, setSaving] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [ask, setAsk] = React.useState<NextRef | null>(null);
  // Dónde se palomeó, para que el mensaje de guardado o de error salga junto a ese bloque.
  const [from, setFrom] = React.useState<"dia" | "agenda">("dia");

  async function toggle(task: Task, where: "dia" | "agenda" = "dia") {
    setSaving(task.id); setMessage(""); setAsk(null); undo.clear(); setFrom(where);
    try {
      const completing = isTaskOpen(task);
      const saved = await upsert(db.tareas, { ...task, estado: completing ? "completada" : "pendiente" }, db.tareas.version(task));
      if (completing) {
        undo.offer({ text: `Completaste «${task.titulo}».`, undo: () => { setAsk(null); return upsert(db.tareas, { ...saved, estado: task.estado as typeof saved.estado }, db.tareas.version(saved.id)); } });
        setAsk(askNextAfter(task, tasks));
      } else setMessage("Guardado");
    } catch (error) {
      setMessage(`No se pudo guardar: ${error instanceof Error ? error.message : "intenta de nuevo"}`);
    } finally { setSaving(null); }
  }

  return { tasks, toggle, saving, message, setMessage, from, ask, closeAsk: () => setAsk(null), undo };
}
export type TaskDone = ReturnType<typeof useTaskDone>;
