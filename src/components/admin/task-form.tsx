"use client";

import * as React from "react";
import { ChevronDown, Plus, X } from "@/components/admin/icons";
import { Button, ProgressBar } from "@/components/admin/kit";
import { AsyncForm, Field, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, uid, useCollection } from "@/lib/admin/store";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, TASK_TEMPLATES, taskSchema, taskExpedienteContext, type Task, type TaskExpediente } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import s from "./form.module.css";

/*
  Captura y edición de una tarea (rediseño del 18/10/2026). Los campos van en tres grupos:
  lo básico, descripción y vínculos, y los pasos como lista de verificación con su avance.
  Las reglas de guardado (vínculo con la operación, validación, versión) no cambian.
*/

export function TaskForm({ initial, defaults, onSave }: { initial?: Task; defaults?: Pick<Task,"leadId"|"clienteId"|"propiedadSlug"|"expedienteId">; onSave: (task: Task) => Promise<Task> }) {
  // The draft belongs to this editor session, never to a background refetch.
  const [draft, setDraft] = React.useState<Task>(() => initial ?? { id: uid(), titulo: "", descripcion: "", categoria: "administracion", estado: "pendiente", prioridad: "normal", pasos: [], ...defaults });
  const [saved, setSaved] = React.useState(false);
  const asesores = useCollection(db.asesores);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const [expedientes, setExpedientes] = React.useState<TaskExpediente[]>([]);
  const [expedientesLoaded, setExpedientesLoaded] = React.useState(false);
  const [expedienteLinks, setExpedienteLinks] = React.useState<boolean | null>(null);
  const [expedienteError, setExpedienteError] = React.useState("");
  const [capabilityError, setCapabilityError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    apiRequest<{ expedientes: TaskExpediente[] }>("/api/admin/expedientes")
      .then((result) => {
        if (!active) return;
        const authorized = result.expedientes.filter((item) => !item.deleted_at);
        setExpedientes(authorized); setExpedientesLoaded(true);
        // Resolve a URL context after authorization arrives without replacing edits.
        if (!initial) setDraft((old) => {
          const linked = authorized.find((item) => item.id === old.expedienteId);
          return linked ? { ...old, ...taskExpedienteContext(linked) } : old;
        });
      })
      .catch(() => { if (active) setExpedienteError("No se pudieron consultar las operaciones. Puedes guardar la tarea sin vincularla."); });
    apiRequest<{ expedienteLinks: boolean }>("/api/admin/tareas/capacidades")
      .then((result) => { if (active) setExpedienteLinks(result.expedienteLinks); })
      .catch(() => { if (active) setCapabilityError("No se pudo comprobar el vínculo con operaciones. Puedes guardar la tarea sin vincularla."); });
    return () => { active = false; };
  // This context belongs to the editor session, as does its draft.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const expediente = expedientes.find((item) => item.id === draft.expedienteId);
  const contextMatches = expediente && draft.clienteId === expediente.cliente_id
    && draft.asesorId === expediente.asesor_id
    && (draft.propiedadSlug || "") === (expediente.propiedad_slug || "");
  function selectExpediente(value: string) {
    const selected = expedientes.find((item) => item.id === value);
    setSaved(false);
    setDraft((old) => selected ? { ...old, ...taskExpedienteContext(selected) } : { ...old, expedienteId: "" });
  }
  function change<K extends keyof Task>(key: K, value: Task[K]) { setSaved(false); setDraft((old) => ({ ...old, [key]: value })); }
  function options(values: Record<string, string>) { return Object.entries(values).map(([value, label]) => <option key={value} value={value}>{label}</option>); }
  const steps = draft.pasos ?? [], doneSteps = steps.filter((p) => p.hecho).length;
  const closed = draft.estado === "completada" || draft.estado === "cancelada";
  const linksOpen = !!(initial || draft.expedienteId);
  const links = <>
    <Field label="Descripción" htmlFor="task-description" className={s.span2}><textarea id="task-description" maxLength={20000} rows={3} className={textareaClass} value={draft.descripcion ?? ""} onChange={(e) => change("descripcion", e.target.value)} /></Field>
    <Field label="Operación relacionada" htmlFor="task-dossier" className={s.span2} hint="Al vincularla, cliente, inmueble y responsable corresponden a esa operación.">
      <select id="task-dossier" className={selectClass} value={draft.expedienteId ?? ""} onChange={(e) => selectExpediente(e.target.value)}>
        <option value="">Sin operación vinculada</option>
        {draft.expedienteId && !expediente && <option value={draft.expedienteId}>Operación no disponible</option>}
        {expedientes.map((item) => <option key={item.id} value={item.id} disabled={!expedienteLinks}>{item.folio}</option>)}
      </select>
      {!expedientesLoaded && !expedienteError && <p role="status" className="text-sm text-muted-foreground">Cargando operaciones…</p>}
      {expedienteLinks === false && <p role="status" className="text-sm text-muted-foreground">Vincular tareas con operaciones todavía no está disponible. Puedes guardar la tarea sin vincularla.</p>}
      {capabilityError && <p role="status" className="text-sm text-muted-foreground">{capabilityError}</p>}
      {expedienteError && <p role="status" className="text-sm text-muted-foreground">{expedienteError}</p>}
      {expedientesLoaded && draft.expedienteId && !expediente && <p className="text-sm text-muted-foreground">Esa operación ya no está disponible. Elige otra o quita el vínculo.</p>}
      {expediente && !contextMatches && <Button className="self-start" onClick={() => selectExpediente(expediente.id)}>Usar los datos actuales de la operación</Button>}
    </Field>
    <Field label="Categoría" htmlFor="task-category"><select id="task-category" className={selectClass} value={draft.categoria} onChange={(e) => change("categoria", e.target.value as Task["categoria"])}>{options(TASK_CATEGORIES)}</select></Field>
    <Field label="Prospecto relacionado" htmlFor="task-lead"><select id="task-lead" className={selectClass} value={draft.leadId ?? ""} onChange={(e) => change("leadId", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.leadId && !leads.some((l) => l.id === draft.leadId) && <option value={draft.leadId}>Prospecto no disponible</option>}{leads.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></Field>
    <Field label="Cliente relacionado" htmlFor="task-client"><select disabled={!!draft.expedienteId} id="task-client" className={selectClass} value={draft.clienteId ?? ""} onChange={(e) => change("clienteId", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.clienteId && !clientes.some((c) => c.id === draft.clienteId) && <option value={draft.clienteId}>Cliente no disponible</option>}{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
    <Field label="Inmueble relacionado" htmlFor="task-property"><select disabled={!!draft.expedienteId} id="task-property" className={selectClass} value={draft.propiedadSlug ?? ""} onChange={(e) => change("propiedadSlug", e.target.value || undefined)}><option value="">Sin vínculo</option>{draft.propiedadSlug && !propiedades.some((p) => p.slug === draft.propiedadSlug) && <option value={draft.propiedadSlug}>Inmueble no disponible</option>}{propiedades.map((p) => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}</select></Field>
  </>;
  return <AsyncForm className="flex flex-col gap-5" onSubmit={async (event) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const next = submitter?.name === "estado" ? { ...draft, estado: submitter.value as Task["estado"] } : draft;
    if (next.expedienteId) {
      if (!expedienteLinks) throw new Error(expedienteLinks === false ? "Vincular tareas con operaciones todavía no está disponible. Puedes guardar la tarea sin vincularla." : "No se pudo comprobar el vínculo. Reintenta o guarda sin él.");
      if (!expedientesLoaded || !expediente) throw new Error("Elige una operación en curso o quita el vínculo.");
      if (!contextMatches) throw new Error("Actualiza cliente, inmueble y responsable con los de la operación.");
    }
    const result = taskSchema.safeParse(next);
    if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join(". "));
    const record = await onSave({ ...next, ...result.data });
    setDraft({ ...record, nuevaNota: "" }); setSaved(true);
  }}>
    <section className={s.group} aria-label="Lo básico">
      <div className={s.groupHead}><h2>Lo básico</h2><p>La fecha límite se interpreta con la fecha de Tijuana.</p></div>
      <div className={s.grid}>
        {!initial && <Field label="Plantilla opcional" htmlFor="task-template" className={s.span2} hint="Carga un borrador que puedes ajustar antes de guardar.">
          <select id="task-template" className={selectClass} defaultValue="" onChange={(event) => {
            const template = TASK_TEMPLATES.find((item) => item.id === event.target.value);
            if (template) { setDraft((old) => ({ ...old, titulo: template.titulo, descripcion: template.descripcion, categoria: template.categoria, pasos: template.pasos.map((texto) => ({ id: uid(), texto, hecho: false })) })); setSaved(false); }
          }}><option value="">Sin plantilla</option>{TASK_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>
        </Field>}
        <Field label="Título" htmlFor="task-title" className={s.span2}><input id="task-title" required maxLength={160} className={inputClass} value={draft.titulo} onChange={(e) => change("titulo", e.target.value)} /></Field>
        <Field label="Responsable" htmlFor="task-advisor"><select disabled={!!draft.expedienteId} id="task-advisor" className={selectClass} value={draft.asesorId ?? ""} onChange={(e) => change("asesorId", e.target.value || undefined)}><option value="">Sin asignar</option>{draft.asesorId && !asesores.some((a) => a.id === draft.asesorId) && <option value={draft.asesorId}>Responsable no disponible</option>}{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
        <Field label="Fecha límite (opcional)" htmlFor="task-due"><input id="task-due" type="date" className={inputClass} value={draft.vence ?? ""} onChange={(e) => change("vence", e.target.value || undefined)} /></Field>
        <Field label="Estado" htmlFor="task-status"><select id="task-status" className={selectClass} value={draft.estado} onChange={(e) => change("estado", e.target.value as Task["estado"])}>{options(TASK_STATUSES)}</select></Field>
        <Field label="Prioridad" htmlFor="task-priority"><select id="task-priority" className={selectClass} value={draft.prioridad} onChange={(e) => change("prioridad", e.target.value as Task["prioridad"])}>{options(TASK_PRIORITIES)}</select></Field>
        {draft.estado === "en-espera" && <Field label="Motivo de espera" htmlFor="task-wait" className={s.span2}><input required maxLength={5000} id="task-wait" className={inputClass} value={draft.motivoEspera ?? ""} onChange={(e) => change("motivoEspera", e.target.value)} /></Field>}
      </div>
    </section>
    {linksOpen
      ? <section className={s.group} aria-label="Descripción y vínculos"><div className={s.groupHead}><h2>Descripción y vínculos</h2><p>Con quién y con qué se relaciona.</p></div><div className={s.grid}>{links}</div></section>
      : <details className={s.group}><summary>Descripción y vínculos<ChevronDown size={18} aria-hidden="true" /></summary><div className={s.grid}>{links}</div></details>}
    <section className={s.group} aria-label="Pasos de la tarea">
      <div className={s.groupHead}><h2>Pasos</h2>{steps.length > 0 && <p>{doneSteps} de {steps.length} {steps.length === 1 ? "hecho" : "hechos"}</p>}</div>
      {steps.length > 0 && <div className={s.progressRow}><ProgressBar value={doneSteps} max={steps.length} label={`${doneSteps} de ${steps.length} pasos hechos`} /></div>}
      {steps.length > 0 && <ul className={s.steps}>{steps.map((paso, index) => <li key={paso.id} className={s.step} data-done={paso.hecho || undefined}>
        <label className={s.stepCheck}><input type="checkbox" aria-label={`Completar paso ${index + 1}`} checked={paso.hecho} onChange={(e) => change("pasos", steps.map((p, i) => i === index ? { ...p, hecho: e.target.checked } : p))} /></label>
        <input type="text" className={cn(inputClass, "flex-1")} aria-label={`Paso ${index + 1}`} required maxLength={500} placeholder="Qué hay que hacer" value={paso.texto} onChange={(e) => change("pasos", steps.map((p, i) => i === index ? { ...p, texto: e.target.value } : p))} />
        <Button variant="ghost" iconOnly className={s.stepRemove} aria-label={`Quitar paso ${index + 1}`} onClick={() => change("pasos", steps.filter((_, i) => i !== index))}><X size={18} aria-hidden="true" /></Button>
      </li>)}</ul>}
      <Button className="self-start" disabled={steps.length >= 100} onClick={() => change("pasos", [...steps, { id: uid(), texto: "", hecho: false }])}><Plus size={16} aria-hidden="true" />Añadir paso</Button>
    </section>
    {initial && <section className={s.group} aria-label="Nota al historial">
      <Field label="Añadir nota al historial" htmlFor="task-note" hint="Queda en el historial con tu nombre y la fecha."><textarea id="task-note" maxLength={5000} rows={2} className={textareaClass} placeholder="Qué pasó o qué se acordó" value={draft.nuevaNota ?? ""} onChange={(e) => change("nuevaNota", e.target.value)} /></Field>
    </section>}
    <div className={s.actions}>
      <Button type="submit" variant="primary">Guardar tarea</Button>
      {initial && <>
        {closed ? <Button type="submit" name="estado" value="pendiente">Reabrir tarea</Button> : <Button type="submit" name="estado" value="completada">Completar tarea</Button>}
        {draft.estado !== "cancelada" && <Button type="submit" variant="ghost" name="estado" value="cancelada">Cancelar tarea</Button>}
      </>}
    </div>
    {saved && <p role="status" className="text-sm text-primary-ink">Tarea guardada.</p>}
  </AsyncForm>;
}
