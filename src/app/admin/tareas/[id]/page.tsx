"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "@/components/admin/icons";
import { TaskForm } from "@/components/admin/task-form";
import { Avatar, Button, ButtonLink, Card, EmptyBox, Notice, Pill, type PillTone } from "@/components/admin/kit";
import { db, useCollection, upsert } from "@/lib/admin/store";
import { stepDate } from "@/lib/admin/contacts-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, type Task } from "@/lib/tasks";
import s from "@/components/admin/form.module.css";

/*
  Ficha de una tarea (rediseño del 18/10/2026): título grande con su estado, vencimiento y
  responsable; el formulario al centro; a la derecha, los registros relacionados y el historial
  como línea de tiempo. El borrador, el conflicto 409 y el historial se conservan como antes.
*/

const STATUS_TONE: Record<Task["estado"], PillTone> = { pendiente: "neutral", "en-curso": "info", "en-espera": "warn", completada: "success", cancelada: "muted" };

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
  const today = operationalDate();
  const open = task ? !["completada", "cancelada"].includes(task.estado) : false;
  const due = task?.vence ? stepDate(task.vence, today) : null;
  const adviser = task ? asesores.find((a) => a.id === task.asesorId)?.nombre ?? (task.asesorId ? "Responsable no disponible" : "Sin asignar") : "";
  const history = [...(task?.historial ?? [])].reverse();
  return <div className="flex min-w-0 flex-col gap-5">
    <div><Link href="/admin/agenda?tab=tareas" className={s.back}><ChevronLeft size={16} aria-hidden="true" />Tareas</Link></div>
    <header className={s.head}>
      <h1>{task?.titulo ?? "Tarea"}</h1>
      {task && <div className={s.meta}>
        <Pill tone={STATUS_TONE[task.estado]}>{TASK_STATUSES[task.estado]}</Pill>
        {due && <Pill tone={!open ? "muted" : due.late ? "alert" : task.vence === today ? "warn" : "neutral"}>{open && due.late ? due.label.replace("Vencido", "Vencida") : due.label}</Pill>}
        {task.prioridad !== "normal" && <Pill tone={task.prioridad === "urgente" ? "alert" : task.prioridad === "alta" ? "warn" : "muted"}>Prioridad {TASK_PRIORITIES[task.prioridad].toLowerCase()}</Pill>}
        <span className={s.who}><Avatar name={task.asesorId ? adviser : "?"} size={26} />{adviser}</span>
        <span>{TASK_CATEGORIES[task.categoria]}</span>
      </div>}
    </header>
    {!snapshot ? <EmptyBox title="Tarea no disponible">Puede estar cargando o ya no estar disponible.</EmptyBox> : <div className={s.layout}>
      <div className="flex min-w-0 flex-col gap-5">
        {conflict && <section aria-label="Revisar conflicto"><Notice title="La tarea cambió mientras la editabas" actions={conflict !== "missing" && <Button onClick={() => { setSnapshot(conflict); setConflict(null); setRebased(true); }}>Usar versión actual como base</Button>}>
          {conflict === "missing" ? <p>La tarea ya no está disponible. Conservamos tu borrador, pero no se puede guardar sobre un registro eliminado.</p> : <div className="flex flex-col gap-3">
            <p>Compara la versión actual con tu borrador de abajo. Usarla como base conserva tu borrador; al guardar, sus campos sustituirán los de la versión actual. Ajusta tu borrador para conservar los cambios que necesites. El historial de cambios se conserva.</p>
            <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
              <div><dt className="font-medium">Título actual</dt><dd>{conflict.task.titulo}</dd></div>
              <div><dt className="font-medium">Estado actual</dt><dd>{TASK_STATUSES[conflict.task.estado]}</dd></div>
              <div><dt className="font-medium">Responsable actual</dt><dd>{asesores.find((a) => a.id === conflict.task.asesorId)?.nombre ?? (conflict.task.asesorId ? "Responsable no disponible" : "Sin asignar")}</dd></div>
              <div><dt className="font-medium">Fecha límite actual</dt><dd>{conflict.task.vence || "Sin fecha"}</dd></div>
              <div className="sm:col-span-2"><dt className="font-medium">Descripción actual</dt><dd className="whitespace-pre-wrap">{conflict.task.descripcion || "Sin descripción"}</dd></div>
            </dl>
            <details><summary className="flex min-h-11 cursor-pointer items-center font-medium">Ver más detalles de la versión actual</summary>
              <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
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
          </div>}
        </Notice></section>}
        {rebased && <p role="status" className="text-sm">Tu borrador se conserva y ya usa la versión revisada como base. Revisa los campos y pulsa Guardar tarea para aplicar tus cambios.</p>}
        <TaskForm initial={snapshot.task} onSave={async (draft) => {
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
        }} />
      </div>
      <aside className={s.side} aria-label="Relacionado e historial">
        {task && (task.expedienteId || task.leadId || task.clienteId || task.propiedadSlug) && <Card className="flex flex-col gap-3 p-5">
          <h2 className="m-0 text-[1.0625rem] font-[600]">Relacionado</h2>
          <nav aria-label="Registros relacionados" className={s.related}>
            {task.expedienteId && <ButtonLink href={`/admin/operaciones/${encodeURIComponent(task.expedienteId)}`}>Ver operación</ButtonLink>}
            {task.leadId && <ButtonLink href={`/admin/leads/${task.leadId}`}>Ver prospecto</ButtonLink>}
            {task.clienteId && <ButtonLink href="/admin/contactos?tab=clientes">Ver clientes</ButtonLink>}
            {task.propiedadSlug && <ButtonLink href={`/admin/propiedades/${task.propiedadSlug}/editar`}>Ver inmueble</ButtonLink>}
          </nav>
        </Card>}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="m-0 text-[1.0625rem] font-[600]">Historial</h2>
          {task?.completadoEl && <p className="text-sm">Completada: {new Date(task.completadoEl).toLocaleString("es-MX")}{task.completadoPor ? ` · ${task.completadoPor}` : ""}</p>}
          {history.length ? <ol className={s.timeline}>{history.map((event, index) => <li key={`${event.fecha}-${index}`} className={s.event}>
            <strong>{event.accion}</strong>
            {event.texto && <p>{event.texto}</p>}
            <span className={s.when}>{new Date(event.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} · {event.actorEmail ?? event.actorId}</span>
          </li>)}</ol> : <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>}
        </Card>
      </aside>
    </div>}
  </div>;
}
