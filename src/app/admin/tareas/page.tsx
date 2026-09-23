"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TaskForm } from "@/components/admin/task-form";
import { Badge, EmptyState, Field, PageHeader, btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { db, useCollection, upsert } from "@/lib/admin/store";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, taskBucket } from "@/lib/tasks";
import { operationalDate } from "@/lib/admin/operational-date";

export default function TasksPage() { return <React.Suspense fallback={<p>Cargando tareas…</p>}><Tasks /></React.Suspense>; }

function Tasks() {
  const params = useSearchParams();
  const router = useRouter();
  const tareas = useCollection(db.tareas);
  const asesores = useCollection(db.asesores);
  const [creating, setCreating] = React.useState(params.get("nueva") === "1");
  const [query, setQuery] = React.useState("");
  const [responsible, setResponsible] = React.useState("todas");
  const [status, setStatus] = React.useState("abiertas");
  const [priority, setPriority] = React.useState("todas");
  const [category, setCategory] = React.useState("todas");
  const due = params.get("vence") ?? "todas";
  const today = operationalDate();
  const filtered = tareas.filter((task) => {
    const bucket = taskBucket(task, today);
    return (status === "todas" || (status === "abiertas" ? !["completada", "cancelada"].includes(task.estado) : task.estado === status))
      && (responsible === "todas" || (responsible === "sin-asignar" ? !task.asesorId : task.asesorId === responsible))
      && (priority === "todas" || task.prioridad === priority)
      && (category === "todas" || task.categoria === category)
      && (due === "todas" || bucket === due)
      && `${task.titulo} ${task.descripcion ?? ""}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
  }).sort((a, b) => (a.vence ?? "9999").localeCompare(b.vence ?? "9999") || a.titulo.localeCompare(b.titulo, "es"));
  const activeFilters = Number(responsible !== "todas") + Number(status !== "todas") + Number(priority !== "todas") + Number(category !== "todas");
  const options = (record: Record<string, string>) => Object.entries(record).map(([value, label]) => <option key={value} value={value}>{label}</option>);
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Tareas." description="Organiza el trabajo del equipo, sus pendientes y avances." actions={<button className={btnPrimary} type="button" aria-expanded={creating} onClick={() => setCreating(!creating)}>{creating ? "Cerrar captura" : "Nueva tarea"}</button>} />
    {creating && <section className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-6"><h2 className="mb-4 text-lg font-semibold">Nueva tarea</h2><TaskForm onSave={async (task) => { const saved = await upsert(db.tareas, task, null); router.push(`/admin/tareas/${saved.id}`); return saved; }} /></section>}
    <section aria-label="Filtros de tareas" className="min-w-0 space-y-3">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <Field label="Buscar tareas" htmlFor="tasks-search"><input id="tasks-search" className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Título o descripción" /></Field>
      <Field label="Vencimiento" htmlFor="tasks-due"><select id="tasks-due" className={selectClass} value={due} onChange={(e) => { const next = new URLSearchParams(params.toString()); next.set("vence", e.target.value); router.replace(`/admin/tareas?${next}`, { scroll: false }); }}><option value="todas">Todas las fechas</option><option value="vencidas">Vencidas</option><option value="hoy">Hoy</option><option value="proximas">Próximos 7 días</option><option value="sin-fecha">Sin fecha</option></select></Field>
      </div>
      <details className="min-w-0 rounded-md border border-border px-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Más filtros · {activeFilters} activos</summary>
        <div className="grid min-w-0 gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Responsable" htmlFor="tasks-responsible"><select id="tasks-responsible" className={selectClass} value={responsible} onChange={(e) => setResponsible(e.target.value)}><option value="todas">Todos los responsables</option><option value="sin-asignar">Sin asignar</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
      <Field label="Estado" htmlFor="tasks-status"><select id="tasks-status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="abiertas">Abiertas</option><option value="todas">Todos los estados</option>{options(TASK_STATUSES)}</select></Field>
      <Field label="Prioridad" htmlFor="tasks-priority"><select id="tasks-priority" className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value)}><option value="todas">Todas las prioridades</option>{options(TASK_PRIORITIES)}</select></Field>
      <Field label="Categoría" htmlFor="tasks-category"><select id="tasks-category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}><option value="todas">Todas las categorías</option>{options(TASK_CATEGORIES)}</select></Field>
        </div>
      </details>
    </section>
    <p className="text-xs text-muted-foreground">Hoy y los vencimientos se calculan con la fecha de Tijuana.</p>
    <p className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} {filtered.length === 1 ? "tarea" : "tareas"}</p>
    {filtered.length ? <div className="grid min-w-0 gap-3 lg:grid-cols-2">{filtered.map((task) => <article key={task.id} className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2"><Badge tone={task.estado === "completada" ? "green" : "neutral"}>{TASK_STATUSES[task.estado]}</Badge>{taskBucket(task, today) === "vencidas" && <Badge tone="red">Vencida</Badge>}<Badge>{TASK_PRIORITIES[task.prioridad]}</Badge></div>
      <h2 className="min-w-0 font-semibold"><Link className="flex min-h-11 min-w-0 items-center [overflow-wrap:anywhere] hover:underline" href={`/admin/tareas/${task.id}`}>{task.titulo}</Link></h2>
      {task.descripcion && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{task.descripcion}</p>}
      <p className="break-words text-sm">{asesores.find((a) => a.id === task.asesorId)?.nombre ?? (task.asesorId ? "Responsable no disponible" : "Sin asignar")} · {TASK_CATEGORIES[task.categoria]}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{task.vence ? `Fecha límite: ${task.vence}` : "Sin fecha límite"}</span><span>{task.pasos.filter((p) => p.hecho).length}/{task.pasos.length} pasos</span></div>
      <Link href={`/admin/tareas/${task.id}`} className={btnGhost}>Abrir tarea</Link>
    </article>)}</div> : <EmptyState title="No hay tareas con estos filtros." hint="Puedes cambiar los filtros o crear una tarea." />}
  </div>;
}
