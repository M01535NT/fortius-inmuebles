"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { AsyncButton, btnGhost } from "@/components/admin/ui";
import { db, upsert, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { overdueFollowups, projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen, taskBucket, TASK_PRIORITIES } from "@/lib/tasks";

const buckets = { vencidas: "Vencidas", hoy: "Hoy", proximas: "Próximos 7 días", "sin-fecha": "Sin fecha" } as const;

export function DashboardTasks() {
  const tasks = useCollection(db.tareas);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const asesores = useCollection(db.asesores);
  const hoy = operationalDate();
  const overdue = overdueFollowups(projectFollowups(leads, clientes), hoy);
  const open = tasks.filter(isTaskOpen);
  const preview = [...open].sort((a, b) => (a.vence || "9999").localeCompare(b.vence || "9999") || a.titulo.localeCompare(b.titulo)).slice(0, 5);
  return (
    <section aria-labelledby="dashboard-tasks" className="min-w-0 rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-border px-4 py-2 sm:px-5">
        <h2 id="dashboard-tasks" className="display-soft text-lg">Tareas pendientes</h2>
        <div className="flex flex-wrap gap-3 text-sm font-medium text-primary-ink">
          <Link className="inline-flex min-h-11 items-center" href="/admin/tareas?nueva=1">Nueva tarea</Link>
          <Link className="inline-flex min-h-11 items-center" href="/admin/tareas">Ver todas</Link>
        </div>
      </div>
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-foreground">Seguimientos vencidos: <span className="font-mono text-destructive">{overdue.length}</span></h3>
        {overdue.length ? <ul className="mt-2 space-y-1">
          {overdue.slice(0, 5).map(item => <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <Link href={item.href} className="min-h-11 py-2 font-medium text-primary-ink hover:text-foreground">{item.personName}</Link>
            <span className="text-muted-foreground">{item.kind === "cliente" ? "Cliente" : "Lead"} · {item.fecha} · {asesores.find(a => a.id === item.asesorId)?.nombre ?? "Sin asesor"}</span>
          </li>)}
          {overdue.length > 5 ? <li className="text-xs text-muted-foreground">{overdue.length - 5} seguimientos más vencidos</li> : null}
        </ul> : <p className="mt-1 text-sm text-muted-foreground">No hay próximos contactos vencidos.</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {Object.entries(buckets).map(([bucket, label]) => (
          <Link key={bucket} aria-label={`${open.filter(task => taskBucket(task, hoy) === bucket).length} ${label}`} href={`/admin/tareas?vence=${bucket}`} className="min-w-0 rounded-md border border-border px-3 py-2 hover:bg-secondary">
            <span className={`block font-mono text-xl ${bucket === "vencidas" ? "text-destructive" : "text-primary-ink"}`}>{open.filter(task => taskBucket(task, hoy) === bucket).length}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>
      {preview.length ? <ul className="divide-y divide-border border-t border-border">
        {preview.map(task => <li key={task.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-2 sm:px-5">
          <div className="min-w-0">
            <Link className="inline-flex min-h-11 items-center text-sm font-medium [overflow-wrap:anywhere] hover:text-primary-ink" href={`/admin/tareas/${task.id}`}>{task.titulo}</Link>
            <p className="text-xs text-muted-foreground">{task.vence || "Sin fecha"} · Prioridad {TASK_PRIORITIES[task.prioridad].toLowerCase()}</p>
          </div>
          <AsyncButton aria-label={`Completar ${task.titulo}`} className={btnGhost + " shrink-0 px-3"} onClick={() => upsert(db.tareas, {...task, estado: "completada"}, db.tareas.version(task))}><Check className="size-4" aria-hidden="true" /></AsyncButton>
        </li>)}
      </ul> : <p className="px-4 pb-4 text-sm text-muted-foreground">Sin tareas pendientes. Crea una tarea para organizar el siguiente paso.</p>}
    </section>
  );
}
