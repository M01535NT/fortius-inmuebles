"use client";

import * as React from "react";
import { AsyncForm, Field, btnGhost, btnPrimary, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { db, uid, useCollection } from "@/lib/admin/store";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, TASK_TEMPLATES, taskSchema, type Task } from "@/lib/tasks";

export function TaskForm({ initial, defaults, onSave }: { initial?: Task; defaults?: Pick<Task,"leadId"|"clienteId"|"propiedadSlug">; onSave: (task: Task) => Promise<Task> }) {
  // The draft belongs to this editor session, never to a background refetch.
  const [draft, setDraft] = React.useState<Task>(() => initial ?? { id: uid(), titulo: "", descripcion: "", categoria: "administracion", estado: "pendiente", prioridad: "normal", pasos: [], ...defaults });
  const [saved, setSaved] = React.useState(false);
  const asesores = useCollection(db.asesores);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  function change<K extends keyof Task>(key: K, value: Task[K]) { setSaved(false); setDraft((old) => ({ ...old, [key]: value })); }
  function options(values: Record<string, string>) { return Object.entries(values).map(([value, label]) => <option key={value} value={value}>{label}</option>); }
  return <AsyncForm className="space-y-5" onSubmit={async (event) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const next = submitter?.name === "estado" ? { ...draft, estado: submitter.value as Task["estado"] } : draft;
    const result = taskSchema.safeParse(next);
    if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join(". "));
    const record = await onSave({ ...next, ...result.data });
    setDraft({ ...record, nuevaNota: "" }); setSaved(true);
  }}>
    {!initial && <Field label="Plantilla opcional" htmlFor="task-template" hint="Carga un borrador que puedes ajustar antes de guardar.">
      <select id="task-template" className={selectClass} defaultValue="" onChange={(event) => {
        const template = TASK_TEMPLATES.find((item) => item.id === event.target.value);
        if (template) { setDraft((old) => ({ ...old, titulo: template.titulo, descripcion: template.descripcion, categoria: template.categoria, pasos: template.pasos.map((texto) => ({ id: uid(), texto, hecho: false })) })); setSaved(false); }
      }}><option value="">Sin plantilla</option>{TASK_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
    </Field>}
    <Field label="Título" htmlFor="task-title"><input id="task-title" required maxLength={160} className={inputClass} value={draft.titulo} onChange={(e) => change("titulo", e.target.value)} /></Field>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Field label="Responsable" htmlFor="task-advisor"><select id="task-advisor" className={selectClass} value={draft.asesorId ?? ""} onChange={(e) => change("asesorId", e.target.value || undefined)}><option value="">Sin asignar</option>{draft.asesorId && !asesores.some((a) => a.id === draft.asesorId) && <option value={draft.asesorId}>Responsable no disponible</option>}{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
      <Field label="Fecha límite (opcional)" htmlFor="task-due"><input id="task-due" type="date" className={inputClass} value={draft.vence ?? ""} onChange={(e) => change("vence", e.target.value || undefined)} /></Field>
      <Field label="Estado" htmlFor="task-status"><select id="task-status" className={selectClass} value={draft.estado} onChange={(e) => change("estado", e.target.value as Task["estado"])}>{options(TASK_STATUSES)}</select></Field>
      <Field label="Prioridad" htmlFor="task-priority"><select id="task-priority" className={selectClass} value={draft.prioridad} onChange={(e) => change("prioridad", e.target.value as Task["prioridad"])}>{options(TASK_PRIORITIES)}</select></Field>
    </div>
    {draft.estado === "en-espera" && <Field label="Motivo de espera" htmlFor="task-wait"><input required maxLength={5000} id="task-wait" className={inputClass} value={draft.motivoEspera ?? ""} onChange={(e) => change("motivoEspera", e.target.value)} /></Field>}
    <details className="min-w-0 rounded-md border border-border p-3" open={initial ? true : undefined}>
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">Descripción, categoría y vínculos</summary>
      <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Descripción" htmlFor="task-description" className="sm:col-span-2"><textarea id="task-description" maxLength={20000} rows={3} className={textareaClass} value={draft.descripcion ?? ""} onChange={(e) => change("descripcion", e.target.value)} /></Field>
        <Field label="Categoría" htmlFor="task-category"><select id="task-category" className={selectClass} value={draft.categoria} onChange={(e) => change("categoria", e.target.value as Task["categoria"])}>{options(TASK_CATEGORIES)}</select></Field>
        <Field label="Prospecto relacionado" htmlFor="task-lead"><select id="task-lead" className={selectClass} value={draft.leadId ?? ""} onChange={(e) => change("leadId", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.leadId && !leads.some((l) => l.id === draft.leadId) && <option value={draft.leadId}>Prospecto no disponible</option>}{leads.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></Field>
        <Field label="Cliente relacionado" htmlFor="task-client"><select id="task-client" className={selectClass} value={draft.clienteId ?? ""} onChange={(e) => change("clienteId", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.clienteId && !clientes.some((c) => c.id === draft.clienteId) && <option value={draft.clienteId}>Cliente no disponible</option>}{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
        <Field label="Inmueble relacionado" htmlFor="task-property"><select id="task-property" className={selectClass} value={draft.propiedadSlug ?? ""} onChange={(e) => change("propiedadSlug", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.propiedadSlug && !propiedades.some((p) => p.slug === draft.propiedadSlug) && <option value={draft.propiedadSlug}>Inmueble no disponible</option>}{propiedades.map((p) => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}</select></Field>
      </div>
    </details>
    <section aria-label="Pasos de la tarea" className="space-y-3">
      <h2 className="text-sm font-semibold">Pasos</h2>
      {(draft.pasos ?? []).map((paso, index) => <div key={paso.id} className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" aria-label={`Completar paso ${index + 1}`} checked={paso.hecho} onChange={(e) => change("pasos", draft.pasos.map((p, i) => i === index ? { ...p, hecho: e.target.checked } : p))} /></label>
        <input className={inputClass + " flex-1 basis-32"} aria-label={`Paso ${index + 1}`} required maxLength={500} value={paso.texto} onChange={(e) => change("pasos", draft.pasos.map((p, i) => i === index ? { ...p, texto: e.target.value } : p))} />
        <button type="button" className={btnGhost} aria-label={`Quitar paso ${index + 1}`} onClick={() => change("pasos", draft.pasos.filter((_, i) => i !== index))}>Quitar</button>
      </div>)}
      <button type="button" className={btnGhost} disabled={draft.pasos.length >= 100} onClick={() => change("pasos", [...(draft.pasos ?? []), { id: uid(), texto: "", hecho: false }])}>Añadir paso</button>
    </section>
    {initial && <Field label="Añadir nota al historial" htmlFor="task-note"><textarea id="task-note" maxLength={5000} rows={2} className={textareaClass} value={draft.nuevaNota ?? ""} onChange={(e) => change("nuevaNota", e.target.value)} /></Field>}
    <div className="flex flex-wrap gap-2"><button type="submit" className={btnPrimary}>Guardar tarea</button>
    {initial && <>
      {draft.estado === "completada" || draft.estado === "cancelada" ? <button type="submit" name="estado" value="pendiente" className={btnGhost}>Reabrir tarea</button> : <button type="submit" name="estado" value="completada" className={btnGhost}>Completar tarea</button>}
      {draft.estado !== "cancelada" && <button type="submit" name="estado" value="cancelada" className={btnGhost}>Cancelar tarea</button>}
    </>}</div>
    {saved && <p role="status" className="text-sm text-primary-ink">Tarea guardada.</p>}
  </AsyncForm>;
}

