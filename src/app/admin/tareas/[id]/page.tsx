"use client";

import * as React from "react";
import Link from "next/link";
import { TaskForm } from "@/components/admin/task-form";
import { EmptyState, PageHeader, btnGhost } from "@/components/admin/ui";
import { db, useCollection, upsert } from "@/lib/admin/store";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, type Task } from "@/lib/tasks";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <TaskDetail key={id} id={id} />;
}

function TaskDetail({ id }: { id: string }) {
  const tasks = useCollection(db.tareas);
  const asesores = useCollection(db.asesores);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const latest = tasks.find((task) => task.id === id);
  const [snapshot, setSnapshot] = React.useState<{ task: Task; version: number | null } | null>(null);
  const [conflict, setConflict] = React.useState<{ task: Task; version: number | null } | "missing" | null>(null);
  const [rebased, setRebased] = React.useState(false);
  // Capture once when the initial fetch arrives; deletion/refetch cannot destroy a draft.
  if (!snapshot && latest) setSnapshot({ task: latest, version: db.tareas.version(latest) });
  const task = snapshot?.task;
  return <div className="min-w-0 space-y-6 [overflow-wrap:anywhere]">
    <Link href="/admin/agenda?tab=tareas" className={btnGhost}>Volver a tareas</Link>
    <PageHeader title={task?.titulo ?? "Tarea"} description="Actualiza el trabajo y conserva sus notas e historial. La fecha límite se interpreta con la fecha de Tijuana." />
    {!snapshot ? <EmptyState title="Tarea no disponible." hint="Puede estar cargando o ya no estar disponible." /> : <>
      {conflict && <section aria-label="Revisar conflicto" className="min-w-0 space-y-3 rounded-lg border border-warning-border bg-warning-surface p-4">
        <h2 className="font-semibold">La tarea cambió mientras la editabas</h2>
        {conflict === "missing" ? <p className="text-sm">La tarea ya no está disponible. Conservamos tu borrador, pero no se puede guardar sobre un registro eliminado.</p> : <>
          <p className="text-sm">Compara la versión actual con tu borrador de abajo. Usarla como base conserva tu borrador; al guardar, sus campos sustituirán los de la versión actual. Ajusta tu borrador para conservar los cambios que necesites. El historial de cambios se conserva.</p>
          <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-medium">Título actual</dt><dd>{conflict.task.titulo}</dd></div>
            <div><dt className="font-medium">Estado actual</dt><dd>{TASK_STATUSES[conflict.task.estado]}</dd></div>
            <div><dt className="font-medium">Responsable actual</dt><dd>{asesores.find((a) => a.id === conflict.task.asesorId)?.nombre ?? (conflict.task.asesorId ? "Responsable no disponible" : "Sin asignar")}</dd></div>
            <div><dt className="font-medium">Fecha límite actual</dt><dd>{conflict.task.vence || "Sin fecha"}</dd></div>
            <div className="sm:col-span-2"><dt className="font-medium">Descripción actual</dt><dd className="whitespace-pre-wrap">{conflict.task.descripcion || "Sin descripción"}</dd></div>
          </dl>
          <details><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">Ver más detalles de la versión actual</summary>
            <dl className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
              <div><dt className="font-medium">Prioridad</dt><dd>{TASK_PRIORITIES[conflict.task.prioridad]}</dd></div>
              <div><dt className="font-medium">Categoría</dt><dd>{TASK_CATEGORIES[conflict.task.categoria]}</dd></div>
              <div><dt className="font-medium">Prospecto</dt><dd>{leads.find((l) => l.id === conflict.task.leadId)?.nombre ?? (conflict.task.leadId ? "Prospecto no disponible" : "Sin vínculo")}</dd></div>
              <div><dt className="font-medium">Cliente</dt><dd>{clientes.find((c) => c.id === conflict.task.clienteId)?.nombre ?? (conflict.task.clienteId ? "Cliente no disponible" : "Sin vínculo")}</dd></div>
              <div><dt className="font-medium">Inmueble</dt><dd>{propiedades.find((p) => p.slug === conflict.task.propiedadSlug)?.titulo ?? (conflict.task.propiedadSlug ? "Inmueble no disponible" : "Sin vínculo")}</dd></div>
              <div><dt className="font-medium">Operación vinculada</dt><dd>{conflict.task.expedienteId ? "Vínculo directo registrado" : "Sin operación vinculada"}</dd></div>
              <div><dt className="font-medium">Motivo de espera</dt><dd>{conflict.task.motivoEspera || "Sin motivo registrado"}</dd></div>
              <div className="sm:col-span-2"><dt className="font-medium">Pasos</dt><dd>{conflict.task.pasos.length ? <ul className="space-y-1">{conflict.task.pasos.map((paso) => <li key={paso.id}>{paso.hecho ? "Completado" : "Pendiente"}: {paso.texto}</li>)}</ul> : "Sin pasos"}</dd></div>
            </dl>
          </details>
          <button type="button" className={btnGhost} onClick={() => { setSnapshot(conflict); setConflict(null); setRebased(true); }}>Usar versión actual como base</button>
        </>}
      </section>}
      {rebased && <p role="status" className="text-sm">Tu borrador se conserva y ya usa la versión revisada como base. Revisa los campos y pulsa Guardar tarea para aplicar tus cambios.</p>}
      <section className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-6"><TaskForm initial={snapshot.task} onSave={async (draft) => {
        try {
          const saved = await upsert(db.tareas, draft, snapshot.version);
          setSnapshot({ task: saved, version: db.tareas.version(saved) });
          setConflict(null); setRebased(false);
          return saved;
        } catch (error) {
          const status = error && typeof error === "object" && "status" in error ? error.status : undefined;
          if (status !== 409) throw error;
          await db.tareas.load();
          const current = db.tareas.list().find((item) => item.id === id);
          setConflict(current ? { task: current, version: db.tareas.version(current) } : "missing");
          throw new Error(current ? "No se guardó: revisa la versión actual arriba. Tu borrador sigue intacto." : "No se guardó: la tarea ya no está disponible. Tu borrador sigue intacto.");
        }
      }} /></section>
      <nav aria-label="Registros relacionados" className="flex flex-wrap gap-2">
        {task?.expedienteId && <Link className={btnGhost} href={`/admin/operaciones/${encodeURIComponent(task.expedienteId)}`}>Ver operación</Link>}
        {task?.leadId && <Link className={btnGhost} href={`/admin/leads/${task.leadId}`}>Ver prospecto</Link>}
        {task?.clienteId && <Link className={btnGhost} href="/admin/contactos?tab=clientes">Ver clientes</Link>}
        {task?.propiedadSlug && <Link className={btnGhost} href={`/admin/propiedades/${task.propiedadSlug}/editar`}>Ver inmueble</Link>}
      </nav>
      <section className="min-w-0 space-y-3 rounded-lg border border-border p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Historial</h2>
        {task?.completadoEl && <p className="break-words text-sm">Completada: {new Date(task.completadoEl).toLocaleString("es-MX")}{task.completadoPor ? ` · ${task.completadoPor}` : ""}</p>}
        {task?.historial?.length ? <ol className="space-y-3">{task.historial.map((event, index) => <li key={`${event.fecha}-${index}`} className="min-w-0 border-l-2 border-border pl-3 text-sm">
          <p className="break-words font-medium">{event.accion}</p>
          {event.texto && <p className="whitespace-pre-wrap break-words">{event.texto}</p>}
          <p className="break-all text-xs text-muted-foreground">{new Date(event.fecha).toLocaleString("es-MX")} · {event.actorEmail ?? event.actorId}</p>
        </li>)}</ol> : <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>}
      </section>
    </>}
  </div>;
}
