"use client";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TaskForm } from "@/components/admin/task-form";
import { Badge, Field, inputClass, selectClass } from "@/components/admin/ui";
import { Button, Card, EmptyBox } from "@/components/admin/kit";
import { stepDate } from "@/lib/admin/contacts-view";
import { shortDate } from "@/lib/admin/today";
import { db, useCollection, upsert } from "@/lib/admin/store";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, taskBucket } from "@/lib/tasks";
import { operationalDate } from "@/lib/admin/operational-date";

export default function TasksPage() { return <React.Suspense fallback={<p>Cargando tareas…</p>}><Tasks /></React.Suspense>; }

function Tasks() {
  const params = useSearchParams();
  const router = useRouter();
  const tareas = useCollection(db.tareas);
  const leads = useCollection(db.leads), clientes = useCollection(db.clientes), propiedades = useCollection(db.propiedades);
  const defaults = {expedienteId: params.get("expediente")?.toLowerCase() || undefined, leadId: leads.find(l=>l.id===params.get("leadId"))?.id, clienteId: clientes.find(c=>c.id===params.get("clienteId"))?.id, propiedadSlug: propiedades.find(p=>p.slug===params.get("propiedadSlug"))?.slug};
  const asesores = useCollection(db.asesores);
  const [creating, setCreating] = React.useState(params.get("nueva") === "1");
  useQuickCreate("tarea", () => setCreating(true));
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
  const renderTask = (task: (typeof filtered)[number]) => {
      const date = task.vence ? stepDate(task.vence, today) : null;
      const open = !["completada", "cancelada"].includes(task.estado);
      return <li key={task.id} className="flex min-w-0 flex-col gap-1.5 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 className="m-0 min-w-0 text-base font-semibold"><Link className="inline-flex min-h-11 items-center [overflow-wrap:anywhere] hover:underline" href={`/admin/tareas/${task.id}`}>{task.titulo}</Link></h3>
          <span className={"font-mono text-xs " + (open && date?.late ? "font-semibold text-primary-ink" : "text-muted-foreground")}>{!date ? "Sin fecha" : !date.late ? date.label : open ? date.label.replace("Vencido", "Vencida") : shortDate(task.vence!)}</span>
        </div>
        {task.descripcion && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{task.descripcion}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <Badge tone={task.estado === "completada" ? "green" : "neutral"}>{TASK_STATUSES[task.estado]}</Badge>
          {task.prioridad !== "normal" && <Badge tone={task.prioridad === "urgente" ? "red" : "neutral"}>Prioridad {TASK_PRIORITIES[task.prioridad].toLowerCase()}</Badge>}
          <span className="text-muted-foreground">{asesores.find((a) => a.id === task.asesorId)?.nombre ?? (task.asesorId ? "Responsable no disponible" : "Sin asignar")} · {TASK_CATEGORIES[task.categoria]}{task.pasos.length ? ` · ${task.pasos.filter((p) => p.hecho).length} de ${task.pasos.length} pasos` : ""}</span>
        </div>
      </li>;
    };
  const GROUPS: Array<{ id: string; title: string; buckets: string[] }> = [
    { id: "vencidas", title: "Vencidas", buckets: ["vencidas"] }, { id: "hoy", title: "Hoy", buckets: ["hoy"] },
    { id: "semana", title: "Esta semana", buckets: ["proximas"] }, { id: "despues", title: "Más adelante", buckets: ["futuras"] },
    { id: "sin-fecha", title: "Sin fecha", buckets: ["sin-fecha"] }, { id: "hechas", title: "Hechas y canceladas", buckets: ["cerradas"] },
  ];
  const options = (record: Record<string, string>) => Object.entries(record).map(([value, label]) => <option key={value} value={value}>{label}</option>);
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} {filtered.length === 1 ? "tarea" : "tareas"}</p>
      <Button variant={creating ? "secondary" : "primary"} aria-expanded={creating} onClick={() => setCreating(!creating)}>{creating ? "Cerrar captura" : "Nueva tarea"}</Button>
    </div>
    {creating && <section className="min-w-0" aria-label="Nueva tarea"><h2 className="mb-4 text-xl font-[600] tracking-[-0.015em]">Nueva tarea</h2><TaskForm defaults={defaults} onSave={async (task) => { const saved = await upsert(db.tareas, task, null); router.push(`/admin/tareas/${saved.id}`); return saved; }} /></section>}
    <section aria-label="Filtros de tareas" className="min-w-0 space-y-3">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <Field label="Buscar tareas" htmlFor="tasks-search"><input id="tasks-search" className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Título o descripción" /></Field>
      <Field label="Vencimiento" htmlFor="tasks-due"><select id="tasks-due" className={selectClass} value={due} onChange={(e) => { const next = new URLSearchParams(params.toString()); next.set("vence", e.target.value); next.set("tab", "tareas"); router.replace(`/admin/agenda?${next}`, { scroll: false }); }}><option value="todas">Todas las fechas</option><option value="vencidas">Vencidas</option><option value="hoy">Hoy</option><option value="proximas">Próximos 7 días</option><option value="sin-fecha">Sin fecha</option></select></Field>
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
    {filtered.length ? <div className="flex flex-col gap-6">{GROUPS.map(group => {
      const items = filtered.filter(task => group.buckets.includes(taskBucket(task, today)));
      if (!items.length) return null;
      return <section key={group.id} aria-labelledby={"grupo-tareas-" + group.id} className="flex flex-col gap-3">
        <h2 id={"grupo-tareas-" + group.id} className="m-0 flex items-baseline gap-2 px-1 text-lg font-semibold">{group.title}<span className="text-sm font-semibold text-muted-foreground">{items.length}</span></h2>
        <Card as="div" className="overflow-hidden"><ul aria-label={group.title}>{items.map(renderTask)}</ul></Card>
      </section>;
    })}</div> : <EmptyBox title="No hay tareas con estos filtros">Cambia los filtros o crea una tarea.</EmptyBox>}
  </div>;
}
