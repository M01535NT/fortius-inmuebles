"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Card, Notice } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { confirmAction, confirmDeleteOperation } from "@/components/admin/workspace/confirm";
import { db, useCollection, useSession } from "@/lib/admin/store";
import { RESOLUTION_TYPES, stageLabel, WORKFLOW_ROUTES, WORKFLOW_STAGES, WORKFLOW_STATES, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { flowOf, isGuided, routeStages, stageOf, type OperationRecord } from "@/lib/admin/operation-view";
import { saveError } from "./use-operation";

type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage; propiedadSlug?: string | null; fechaObjetivo?: string | null }) => Promise<unknown>;
const ROLE: Record<string, string> = { captacion: "Propietario vendedor", compra: "Comprador", arrendador: "Propietario arrendador", arrendatario: "Arrendatario", inversion: "Inversionista" };
const OPPOSITE: Record<string, string> = { captacion: "compra", compra: "captacion", arrendador: "arrendatario", arrendatario: "arrendador", inversion: "" };

/**
  Ajustes: la decisión del encargo, la ruta y situación, el inmueble, la fecha objetivo,
  la contraparte, corregir la etapa con motivo y eliminar (se puede restaurar).
*/
export function SettingsTab({ op, all, today, onSave, onRemove, onDirtyChange }: { op: OperationRecord; all: OperationRecord[]; today: string; onSave: Save; onRemove: () => Promise<void>; onDirtyChange: (dirty: boolean) => void }) {
  const session = useSession();
  const properties = useCollection(db.propiedades), tasks = useCollection(db.tareas), leads = useCollection(db.leads);
  const original = flowOf(op), stage = stageOf(op);
  const [flow, setFlow] = React.useState(original);
  const [property, setProperty] = React.useState(op.propiedad_slug ?? "");
  const [date, setDate] = React.useState(op.fecha_objetivo ?? "");
  const [back, setBack] = React.useState<WorkflowStage | "">("");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const dirty = JSON.stringify(flow) !== JSON.stringify(original) || property !== (op.propiedad_slug ?? "") || date !== (op.fecha_objetivo ?? "");
  React.useEffect(() => { onDirtyChange(dirty || busy); }, [dirty, busy, onDirtyChange]);
  const guided = isGuided(op);
  const openTasks = tasks.filter(t => t.expedienteId === op.id && !["completada", "cancelada"].includes(t.estado));
  const routes = Object.entries(WORKFLOW_ROUTES).filter(([k]) => op.operacion === "inversion" ? k === "inversion" : op.operacion === "renta" ? ["arrendador", "arrendatario"].includes(k) : ["captacion", "compra"].includes(k));
  const available = properties.filter(p => ["compra", "arrendatario", "inversion"].includes(flow.ruta) || session?.role === "admin" || p.asesorId === op.asesor_id);
  // Interesados que buscan esta operación: contraparte del propietario, nunca clientes (RP-93, COR-11).
  const interested = leads.filter(l => l.perfil?.operacion === (op.operacion === "renta" ? "rentar" : "comprar") && l.estado !== "descartado");
  const historical = ["compra", "arrendatario"].includes(original.ruta);
  const routeChoices = routes.filter(([k]) => historical ? k === original.ruta || !["compra", "arrendatario"].includes(k) : !["compra", "arrendatario"].includes(k));
  const compatible = all.filter(e => e.id !== op.id && e.propiedad_slug === property && e.operacion === op.operacion && e.flujo?.ruta === OPPOSITE[flow.ruta] && e.flujo?.estado === "activa" && e.cliente_id !== op.cliente_id);
  function resolution(patch: Partial<NonNullable<OperationWorkflow["resolucion"]>>) {
    setFlow(old => ({ ...old, resolucion: { tipo: "aceptada", fecha: today, motivo: "", siguienteAccion: openTasks[0]?.titulo ?? "", fechaSiguiente: openTasks[0]?.vence || today, ...old.resolucion, ...patch } }));
  }
  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(done); } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (flow.estado !== "activa" && flow.motivo.trim().length < 3) { setError("Escribe el motivo de la pausa, la regularización o el descarte."); return; }
    if (flow.resolucion && flow.resolucion.motivo.trim().length < 3) { setError("Escribe el motivo de la decisión del encargo."); return; }
    const before = routeStages(op, today).phase;
    let opened = false;
    await run(() => onSave({ flujo: flow, propiedadSlug: property || null, fechaObjetivo: date || null }).then(saved => { opened = before === "verificacion" && routeStages(saved as OperationRecord, today).phase === "contrato"; }), "Guardado");
    if (opened) setNotice("Guardado. Verificación terminada: ya puedes trabajar el contrato en «Lo que sigue».");
  }
  async function goBack() {
    if (!back || flow.motivo.trim().length < 3) { setError("Elige la etapa y escribe el motivo de la corrección."); return; }
    if (!await confirmAction(`¿Regresar la operación a «${stageLabel(back, flow.ruta)}»? Queda registrado con tu motivo.`)) return;
    await run(() => onSave({ flujo: flow, etapa: back, propiedadSlug: property || null, fechaObjetivo: date || null }).then(() => setBack("")), "Etapa corregida");
  }
  async function remove() {
    if (!await confirmDeleteOperation(op.folio)) return;
    await run(onRemove, "");
  }
  return <form onSubmit={save} className="flex max-w-[56rem] flex-col gap-5">
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5">
      {guided && <Card className="flex flex-col gap-4 p-5" aria-label="Decisión del encargo">
        <div><h2 className="m-0 text-lg">Decisión del encargo</h2><p className="mt-1 text-sm text-muted-foreground">{flow.ruta === "inversion" ? "Registra las condiciones del mandato de inversión. No acredita por sí sola una compra ni un rendimiento." : ["compra", "arrendatario"].includes(flow.ruta) ? "Registra si aceptas buscarle inmueble al cliente y en qué condiciones." : "Evaluar un inmueble no significa aceptarlo para venderlo. Registra si tomas el encargo."} Pausar, rechazar, referir o cancelar conserva los documentos y el historial.</p></div>
        <label className="text-sm font-semibold">Decisión<select className={selectClass} value={flow.resolucion?.tipo ?? ""} onChange={e => e.target.value ? resolution({ tipo: e.target.value as NonNullable<OperationWorkflow["resolucion"]>["tipo"] }) : setFlow(old => ({ ...old, resolucion: undefined }))}><option value="">Todavía en evaluación</option>{Object.entries(RESOLUTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {flow.resolucion && <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">Fecha de la decisión<input type="date" className={inputClass} value={flow.resolucion.fecha} onChange={e => resolution({ fecha: e.target.value })} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Motivo y alcance<textarea className={textareaClass} maxLength={1000} value={flow.resolucion.motivo} onChange={e => resolution({ motivo: e.target.value })} /></label>
          {flow.resolucion.tipo === "condicionada" && <>
            <label className="text-sm font-semibold sm:col-span-2">Condiciones pendientes<textarea className={textareaClass} maxLength={1000} value={flow.resolucion.condiciones ?? ""} onChange={e => resolution({ condiciones: e.target.value })} /></label>
            <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">Mientras se cumplen las condiciones, se permite:</legend>{WORKFLOW_STAGES.filter(st => st !== "captacion").map(st => <label key={st} className="mr-4 inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={flow.resolucion?.permitidas?.includes(st) ?? false} onChange={e => resolution({ permitidas: e.target.checked ? [...(flow.resolucion?.permitidas ?? []), st] : (flow.resolucion?.permitidas ?? []).filter(v => v !== st) })} />{stageLabel(st, flow.ruta)}</label>)}</fieldset>
          </>}
          <label className="text-sm font-semibold">Siguiente acción<input maxLength={160} className={inputClass} value={flow.resolucion.siguienteAccion} onChange={e => resolution({ siguienteAccion: e.target.value })} /></label>
          <label className="text-sm font-semibold">Fecha de la siguiente acción<input type="date" className={inputClass} value={flow.resolucion.fechaSiguiente} onChange={e => resolution({ fechaSiguiente: e.target.value })} /></label>
        </div>}
      </Card>}

      <Card className="grid gap-4 p-5 sm:grid-cols-2" aria-label="Datos de la operación">
        <h2 className="m-0 text-lg sm:col-span-2">Datos de la operación</h2>
        {guided && <label className="text-sm font-semibold">Ruta<select className={selectClass} value={flow.ruta} onChange={e => setFlow(old => ({ ...old, ruta: e.target.value as OperationWorkflow["ruta"] }))}>{routeChoices.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
        {guided && <label className="text-sm font-semibold">Situación<select className={selectClass} value={flow.estado} onChange={e => setFlow(old => ({ ...old, estado: e.target.value as OperationWorkflow["estado"] }))}>{Object.entries(WORKFLOW_STATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
        <label className="text-sm font-semibold">Inmueble<select className={selectClass} value={property} onChange={e => setProperty(e.target.value)}><option value="">Sin vincular todavía</option>{property && !available.some(p => p.slug === property) && <option value={property}>Inmueble vinculado no disponible</option>}{available.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select></label>
        <label className="text-sm font-semibold">Fecha objetivo<input type="date" value={date} className={inputClass} onChange={e => setDate(e.target.value)} /></label>
        {guided && <label className="text-sm font-semibold sm:col-span-2">Motivo de pausa, regularización, descarte o corrección<textarea rows={2} maxLength={1000} className={textareaClass} value={flow.motivo} onChange={e => setFlow(old => ({ ...old, motivo: e.target.value }))} /></label>}
      </Card>

      {guided && flow.ruta !== "inversion" && <Card className="flex flex-col gap-4 p-5" aria-label="Contraparte">
        <div><h2 className="m-0 text-lg">Contraparte</h2><p className="mt-1 text-sm text-muted-foreground">Elige al interesado que firma la promesa, la compraventa o el arrendamiento con el propietario, o describe a la contraparte externa y su respaldo. El interesado queda como contraparte, no como cliente de Fortius.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {!historical && <label className="text-sm font-semibold">Interesado que firma<select className={selectClass} value={flow.contraparteLeadId ?? ""} onChange={e => setFlow(old => ({ ...old, contraparteLeadId: e.target.value || undefined, contraparteId: undefined, contraparteExterna: e.target.value ? undefined : old.contraparteExterna }))}><option value="">Ninguno del panel</option>{flow.contraparteLeadId && !interested.some(l => l.id === flow.contraparteLeadId) && <option value={flow.contraparteLeadId}>{leads.find(l => l.id === flow.contraparteLeadId)?.nombre ?? "Interesado vinculado"}</option>}{interested.map(l => <option key={l.id} value={l.id}>{l.nombre}{l.telefono ? ` · ${l.telefono}` : ""}</option>)}</select></label>}
          {(historical || flow.contraparteId) && <label className="text-sm font-semibold">Operación de la contraparte<select className={selectClass} value={flow.contraparteId ?? ""} onChange={e => setFlow(old => ({ ...old, contraparteId: e.target.value || undefined, contraparteLeadId: undefined, contraparteExterna: undefined }))}><option value="">Ninguna del panel</option>{flow.contraparteId && !compatible.some(e => e.id === flow.contraparteId) && <option value={flow.contraparteId}>Vínculo actual · comprobar</option>}{compatible.map(e => <option key={e.id} value={e.id}>{e.folio} · {ROLE[e.flujo?.ruta ?? ""]}</option>)}</select></label>}
          <label className="text-sm font-semibold">Contraparte externa y respaldo<textarea rows={2} maxLength={1000} disabled={!!flow.contraparteId || !!flow.contraparteLeadId} className={textareaClass} value={flow.contraparteExterna ?? ""} onChange={e => setFlow(old => ({ ...old, contraparteExterna: e.target.value || undefined }))} /></label>
        </div>
      </Card>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={!dirty || busy}>{busy ? "Guardando…" : "Guardar ajustes"}</Button>
        {dirty && <Button variant="ghost" disabled={busy} onClick={() => { setFlow(original); setProperty(op.propiedad_slug ?? ""); setDate(op.fecha_objetivo ?? ""); setError(""); }}>Descartar cambios</Button>}
        <Link href={`/admin/agenda?expediente=${encodeURIComponent(op.id)}`} className="text-sm font-semibold underline underline-offset-4">Programar una cita</Link>
        {notice && <span role="status" className="text-sm text-muted-foreground">{notice}</span>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {guided && WORKFLOW_STAGES.indexOf(stage) > 0 && <Card className="flex flex-col gap-3 p-5" aria-label="Corregir etapa">
        <div><h2 className="m-0 text-lg">Corregir etapa</h2><p className="mt-1 text-sm text-muted-foreground">Si la operación avanzó por error o hay que repetir algo, regrésala a una etapa anterior. Escribe el motivo arriba, en «Datos de la operación».</p></div>
        <label className="text-sm font-semibold">Regresar a<select className={selectClass} value={back} onChange={e => setBack(e.target.value as WorkflowStage | "")}><option value="">Elige la etapa</option>{WORKFLOW_STAGES.slice(0, WORKFLOW_STAGES.indexOf(stage)).map(st => <option key={st} value={st}>{stageLabel(st, flow.ruta)}</option>)}</select></label>
        <Button className="self-start" disabled={!back || flow.motivo.trim().length < 3 || busy} onClick={() => void goBack()}>Regresar con este motivo</Button>
      </Card>}

      <Card className="flex flex-col gap-3 p-5" aria-label="Eliminar operación">
        <div><h2 className="m-0 text-lg">Eliminar operación</h2><p className="mt-1 text-sm text-muted-foreground">Se mueve a «Operaciones eliminadas» con sus documentos, PDF y tareas. Puedes restaurarla desde ahí cuando quieras.</p></div>
        {dirty && <Notice tone="info">Guarda o descarta los cambios antes de eliminar.</Notice>}
        <Button variant="danger" className="self-start" disabled={busy || dirty} onClick={() => void remove()}>Eliminar operación</Button>
      </Card>
    </fieldset>
  </form>;
}
