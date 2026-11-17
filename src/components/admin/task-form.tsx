"use client";

import * as React from "react";
import { ChevronDown, Plus, X } from "@/components/admin/icons";
import { Avatar, Button, ProgressBar } from "@/components/admin/kit";
import { AsyncForm, Field, inputClass, textareaClass } from "@/components/admin/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/controls";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/disclosure";
import { useNotify } from "@/components/admin/agenda/notify";
import { apiRequest, db, uid, useCollection } from "@/lib/admin/store";
import { LinkPicker, type LinkValue } from "@/components/admin/workspace/link-picker";
import { useLeaveGuard } from "@/components/admin/operation/use-operation";
import { useUnsavedDraft } from "@/components/admin/workspace/draft-registry";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, TASK_TEMPLATES, taskSchema, taskExpedienteContext, type Task, type TaskExpediente } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import s from "./form.module.css";

/*
  Captura y edición de una tarea. A la vista: título, fecha, «¿Con quién o sobre qué?» y
  responsable (quien captura, salvo que lo cambie); plantilla, estado, prioridad, categoría
  y descripción quedan en «Más detalles» (SIM-17, C51). Los pasos van como lista de
  verificación. Las reglas de guardado (vínculo con la operación, validación, versión) no cambian.
  Desde LV-10g las listas son selectores del kit (Radix), la fecha usa el calendario del kit, el
  responsable se elige por su cara y «Tarea guardada» sale en el apilado de avisos (DEC-52).
*/

function Choice({ id, value, onChange, items, disabled }: { id: string; value: string; onChange: (value: string) => void; items: Record<string, string>; disabled?: boolean }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger id={id}><SelectValue /></SelectTrigger>
    <SelectContent>{Object.entries(items).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
  </Select>;
}

export function TaskForm({ initial, defaults, onSave }: { initial?: Task; defaults?: Pick<Task,"leadId"|"clienteId"|"propiedadSlug"|"expedienteId">; onSave: (task: Task) => Promise<Task> }) {
  // The draft belongs to this editor session, never to a background refetch.
  const [draft, setDraft] = React.useState<Task>(() => initial ?? { id: uid(), titulo: "", descripcion: "", categoria: "administracion", estado: "pendiente", prioridad: "normal", pasos: [], ...defaults });
  const { notify, node: savedNotice } = useNotify();
  const [template, setTemplate] = React.useState("");
  // C-08: lo capturado sin guardar no se pierde al cerrar, recargar o salir por un enlace.
  const [dirty, setDirty] = React.useState(false);
  useLeaveGuard(dirty, "Esta tarea tiene cambios sin guardar. ¿Descartarlos y salir?");
  useUnsavedDraft(dirty);
  const asesores = useCollection(db.asesores);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  // El responsable por omisión es quien captura (si es asesor); solo en una tarea nueva y sin tocar.
  const advisorTouched = React.useRef(!!initial || !!defaults?.expedienteId);
  React.useEffect(() => {
    if (advisorTouched.current) return;
    let alive = true;
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then((r) => {
      if (!alive || advisorTouched.current || !r?.asesorId) return;
      advisorTouched.current = true;
      setDraft((old) => old.asesorId || old.expedienteId ? old : { ...old, asesorId: r.asesorId! });
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
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
      .catch(() => { if (active) setExpedienteError("No se pudieron consultar los asuntos. Puedes guardar la tarea sin vincularla."); });
    apiRequest<{ expedienteLinks: boolean }>("/api/admin/tareas/capacidades")
      .then((result) => { if (active) setExpedienteLinks(result.expedienteLinks); })
      .catch(() => { if (active) setCapabilityError("No se pudo comprobar el vínculo con asuntos. Puedes guardar la tarea sin vincularla."); });
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
    setDirty(true);
    setDraft((old) => selected ? { ...old, ...taskExpedienteContext(selected) } : { ...old, expedienteId: "" });
  }
  function change<K extends keyof Task>(key: K, value: Task[K]) { if (key === "asesorId") advisorTouched.current = true; setDirty(true); setDraft((old) => ({ ...old, [key]: value })); }
  function changeLinks(next: LinkValue, operation?: TaskExpediente) {
    setDirty(true);
    setDraft((old) => operation ? { ...old, ...taskExpedienteContext(operation), leadId: undefined }
      : { ...old, leadId: next.leadId, clienteId: next.clienteId, propiedadSlug: next.propiedadSlug, expedienteId: next.expedienteId ?? "" });
  }
  const steps = draft.pasos ?? [], doneSteps = steps.filter((p) => p.hecho).length;
  const closed = draft.estado === "completada" || draft.estado === "cancelada";
  const detailsOpen = !!initial;
  const picker = <LinkPicker id="task-link" value={{ leadId: draft.leadId, clienteId: draft.clienteId, propiedadSlug: draft.propiedadSlug, expedienteId: draft.expedienteId || undefined }}
    onChange={(next, operation) => changeLinks(next, operation as TaskExpediente | undefined)} leads={leads} clientes={clientes} propiedades={propiedades}
    operations={expedienteLinks ? expedientes : expedientes.filter((item) => item.id === draft.expedienteId)}
    unavailable={{ expediente: expedientesLoaded || expedienteError ? "Asunto no disponible" : "Cargando…" }}
    status={<>
      {!expedientesLoaded && !expedienteError && <p role="status" className="text-sm text-muted-foreground">Cargando asuntos…</p>}
      {expedienteLinks === false && <p role="status" className="text-sm text-muted-foreground">Vincular tareas con asuntos todavía no está disponible. Puedes guardar la tarea sin vincularla.</p>}
      {capabilityError && <p role="status" className="text-sm text-muted-foreground">{capabilityError}</p>}
      {expedienteError && <p role="status" className="text-sm text-muted-foreground">{expedienteError}</p>}
      {expedientesLoaded && draft.expedienteId && !expediente && <p className="text-sm text-muted-foreground">Ese asunto ya no está disponible. Elige otra o quita el vínculo.</p>}
      {expediente && !contextMatches && <Button className="self-start" onClick={() => selectExpediente(expediente.id)}>Usar los datos actuales del asunto</Button>}
    </>} />;
  const details = <div className={s.grid}>
    {!initial && <Field label="Plantilla opcional" htmlFor="task-template" className={s.span2} hint="Carga un borrador que puedes ajustar antes de guardar.">
      <Choice id="task-template" value={template || "ninguna"} items={{ ninguna: "Sin plantilla", ...Object.fromEntries(TASK_TEMPLATES.map((item) => [item.id, item.nombre])) }} onChange={(value) => {
        const chosen = TASK_TEMPLATES.find((item) => item.id === value);
        setTemplate(chosen ? value : "");
        if (chosen) { setDraft((old) => ({ ...old, titulo: chosen.titulo, descripcion: chosen.descripcion, categoria: chosen.categoria, pasos: chosen.pasos.map((texto) => ({ id: uid(), texto, hecho: false })) })); setDirty(true); }
      }} />
    </Field>}
    <Field label="Estado" htmlFor="task-status"><Choice id="task-status" value={draft.estado} items={TASK_STATUSES} onChange={(value) => change("estado", value as Task["estado"])} /></Field>
    <Field label="Prioridad" htmlFor="task-priority"><Choice id="task-priority" value={draft.prioridad} items={TASK_PRIORITIES} onChange={(value) => change("prioridad", value as Task["prioridad"])} /></Field>
    {draft.estado === "en-espera" && <Field label="Motivo de espera" htmlFor="task-wait" className={s.span2}><input required maxLength={5000} id="task-wait" className={inputClass} value={draft.motivoEspera ?? ""} onChange={(e) => change("motivoEspera", e.target.value)} /></Field>}
    <Field label="Categoría" htmlFor="task-category"><Choice id="task-category" value={draft.categoria} items={TASK_CATEGORIES} onChange={(value) => change("categoria", value as Task["categoria"])} /></Field>
    <Field label="Descripción" htmlFor="task-description" className={s.span2}><textarea id="task-description" maxLength={20000} rows={3} className={textareaClass} value={draft.descripcion ?? ""} onChange={(e) => change("descripcion", e.target.value)} /></Field>
  </div>;
  return <AsyncForm className="flex flex-col gap-5" onSubmit={async (event) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const next = submitter?.name === "estado" ? { ...draft, estado: submitter.value as Task["estado"] } : draft;
    if (next.expedienteId) {
      if (!expedienteLinks) throw new Error(expedienteLinks === false ? "Vincular tareas con asuntos todavía no está disponible. Puedes guardar la tarea sin vincularla." : "No se pudo comprobar el vínculo. Reintenta o guarda sin él.");
      if (!expedientesLoaded || !expediente) throw new Error("Elige un asunto en curso o quita el vínculo.");
      if (!contextMatches) throw new Error("Actualiza cliente, inmueble y responsable con los del asunto.");
    }
    const result = taskSchema.safeParse(next);
    if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join(". "));
    const record = await onSave({ ...next, ...result.data });
    setDraft({ ...record, nuevaNota: "" }); setDirty(false);
    notify("Tarea guardada.");
  }}>
    {/* C44: en la ficha, completar es la acción principal y va antes de los campos. */}
    {initial && <div className={s.actions}>
      {closed ? <Button type="submit" name="estado" value="pendiente">Reabrir tarea</Button> : <Button type="submit" variant="primary" name="estado" value="completada">Completar tarea</Button>}
    </div>}
    <section className={s.group} aria-label="Lo básico">
      <div className={s.groupHead}><h2>Lo básico</h2></div>
      <div className={s.grid}>
        <Field label="Título" htmlFor="task-title" className={s.span2}><input id="task-title" required maxLength={160} className={inputClass} value={draft.titulo} onChange={(e) => change("titulo", e.target.value)} /></Field>
        <Field label="Fecha límite (opcional)" htmlFor="task-due"><DateField id="task-due" name="vence" value={draft.vence ?? ""} placeholder="Sin fecha" onChange={(value) => change("vence", value || undefined)} /></Field>
        <Field label="Responsable" htmlFor="task-advisor" hint={draft.expedienteId ? "Lo pone el asunto." : undefined}>
          <Combobox disabled={!!draft.expedienteId} id="task-advisor" name="asesorId" value={draft.asesorId ?? ""} onChange={(value) => change("asesorId", value || undefined)} placeholder="Sin asignar" searchPlaceholder="Buscar responsable…"
            options={[{ value: "", label: "Sin asignar" },
              ...(draft.asesorId && !asesores.some((a) => a.id === draft.asesorId) ? [{ value: draft.asesorId, label: "Responsable no disponible" }] : []),
              ...asesores.filter((a) => a.activo || a.id === draft.asesorId).map((a) => ({ value: a.id, label: a.nombre, media: <Avatar name={a.nombre} src={a.perfilPublico?.foto} size={24} /> }))]} />
        </Field>
        <div className={s.span2}>{picker}</div>
      </div>
    </section>
    {detailsOpen
      ? <section className={s.group} aria-label="Más detalles"><div className={s.groupHead}><h2>Más detalles</h2></div>{details}</section>
      : <Collapsible className={s.group}>
        <CollapsibleTrigger className="group/more -my-1 flex min-h-11 w-full items-center justify-between gap-4 rounded-[6px] text-left font-semibold focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--focus-color)]">Más detalles<ChevronDown size={18} aria-hidden="true" className="flex-none text-muted-foreground transition-transform duration-150 group-data-[state=open]/more:rotate-180 motion-reduce:transition-none" /></CollapsibleTrigger>
        <CollapsibleContent forceMount className="data-[state=closed]:hidden">{details}</CollapsibleContent>
      </Collapsible>}
    <section className={s.group} aria-label="Pasos de la tarea">
      <div className={s.groupHead}><h2>Pasos</h2>{steps.length > 0 && <p>{doneSteps} de {steps.length} {steps.length === 1 ? "hecho" : "hechos"}</p>}</div>
      {steps.length > 0 && <div className={s.progressRow}><ProgressBar value={doneSteps} max={steps.length} label={`${doneSteps} de ${steps.length} pasos hechos`} /></div>}
      {steps.length > 0 && <ul className={s.steps}>{steps.map((paso, index) => <li key={paso.id} className={s.step} data-done={paso.hecho || undefined}>
        <label className={s.stepCheck}><Checkbox aria-label={`Completar paso ${index + 1}`} checked={paso.hecho} onCheckedChange={(checked) => change("pasos", steps.map((p, i) => i === index ? { ...p, hecho: checked === true } : p))} /></label>
        <input type="text" className={cn(inputClass, "flex-1")} aria-label={`Paso ${index + 1}`} required maxLength={500} placeholder="Qué hay que hacer" value={paso.texto} onChange={(e) => change("pasos", steps.map((p, i) => i === index ? { ...p, texto: e.target.value } : p))} />
        <Button variant="ghost" iconOnly className={s.stepRemove} aria-label={`Quitar paso ${index + 1}`} onClick={() => change("pasos", steps.filter((_, i) => i !== index))}><X size={18} aria-hidden="true" /></Button>
      </li>)}</ul>}
      <Button className="self-start" disabled={steps.length >= 100} onClick={() => change("pasos", [...steps, { id: uid(), texto: "", hecho: false }])}><Plus size={16} aria-hidden="true" />Añadir paso</Button>
    </section>
    {initial && <section className={s.group} aria-label="Nota al historial">
      <Field label="Añadir nota al historial" htmlFor="task-note" hint="Queda en el historial con tu nombre y la fecha."><textarea id="task-note" maxLength={5000} rows={2} className={textareaClass} placeholder="Qué pasó o qué se acordó" value={draft.nuevaNota ?? ""} onChange={(e) => change("nuevaNota", e.target.value)} /></Field>
    </section>}
    <div className={s.actions}>
      <Button type="submit" variant={initial ? "secondary" : "primary"}>Guardar tarea</Button>
      {initial && draft.estado !== "cancelada" && <Button type="submit" variant="ghost" name="estado" value="cancelada">Cancelar tarea</Button>}
    </div>
    {savedNotice}
  </AsyncForm>;
}
