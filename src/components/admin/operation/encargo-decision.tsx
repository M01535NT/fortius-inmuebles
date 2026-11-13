"use client";
import * as React from "react";
import { Button, Card } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { db, useCollection } from "@/lib/admin/store";
import { RESOLUTION_TYPES, stageLabel, WORKFLOW_STAGES, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { saveError } from "./use-operation";

type Resolution = NonNullable<OperationWorkflow["resolucion"]>;
type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage }) => Promise<unknown>;

/** El encargo está tomado (aceptado, con o sin condiciones). */
export const encargoTomado = (flow: Pick<OperationWorkflow, "resolucion">) => !!flow.resolucion && ["aceptada", "condicionada"].includes(flow.resolucion.tipo);

/**
  «Decisión del encargo» en el panel de la etapa (COR-14 y DEC-38, 12/11/2026): antes vivía en la
  pestaña Ajustes. Registra si Fortius toma el encargo, con qué motivo y, si es con condiciones,
  qué etapas se permiten mientras se cumplen. Guarda solo la decisión; el resto del flujo no cambia.
*/
export function EncargoDecisionCard({ op, today, disabled, onSave, onDirtyChange }: { op: OperationRecord; today: string; disabled: boolean; onSave: Save; onDirtyChange: (dirty: boolean) => void }) {
  const tasks = useCollection(db.tareas);
  const flow = flowOf(op);
  const [draft, setDraft] = React.useState<Resolution | undefined>(flow.resolucion);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const dirty = JSON.stringify(draft ?? null) !== JSON.stringify(flow.resolucion ?? null);
  React.useEffect(() => { onDirtyChange(dirty || busy); }, [dirty, busy, onDirtyChange]);
  React.useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const openTask = tasks.find(t => t.expedienteId === op.id && !["completada", "cancelada"].includes(t.estado));
  const change = (patch: Partial<Resolution>) => setDraft(old => ({ tipo: "aceptada", fecha: today, motivo: "", siguienteAccion: openTask?.titulo ?? "", fechaSiguiente: openTask?.vence || today, ...old, ...patch }));
  const intro = flow.ruta === "inversion" ? "Registra las condiciones del mandato de inversión. No acredita por sí sola una compra ni un rendimiento."
    : ["compra", "arrendatario"].includes(flow.ruta) ? "Registra si aceptas buscarle inmueble al cliente y en qué condiciones."
    : "Evaluar un inmueble no significa aceptarlo para venderlo. Registra si tomas el encargo.";

  async function save() {
    setError(""); setNotice("");
    if (draft && draft.motivo.trim().length < 3) { setError("Escribe el motivo de la decisión."); return; }
    if (draft?.tipo === "condicionada" && !draft.condiciones?.trim()) { setError("Escribe las condiciones pendientes."); return; }
    if (draft && !draft.siguienteAccion.trim()) { setError("Escribe la siguiente acción."); return; }
    setBusy(true);
    try {
      const flujo = { ...flow };
      if (draft) flujo.resolucion = draft; else delete flujo.resolucion;
      await onSave({ flujo });
      setNotice("Decisión guardada");
    } catch (cause) { setError(`No se pudo guardar: ${saveError(cause)}`); } finally { setBusy(false); }
  }

  const lock = disabled || busy;
  return <Card id="decision-encargo" className="flex flex-col gap-4 p-5" aria-label="Decisión del encargo">
    <div><h2 className="m-0 text-lg">Decisión del encargo</h2><p className="mt-1 text-sm text-muted-foreground">{intro} Pausar, rechazar, referir o cancelar conserva los documentos y el historial.</p></div>
    <label className="text-sm font-semibold">Decisión<select className={selectClass} disabled={lock} value={draft?.tipo ?? ""} onChange={e => e.target.value ? change({ tipo: e.target.value as Resolution["tipo"] }) : setDraft(undefined)}><option value="">Todavía en evaluación</option>{Object.entries(RESOLUTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {draft && <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Fecha de la decisión<input type="date" disabled={lock} className={inputClass} value={draft.fecha} onChange={e => change({ fecha: e.target.value })} /></label>
      <label className="text-sm font-semibold sm:col-span-2">Motivo y alcance<textarea disabled={lock} className={textareaClass} maxLength={1000} value={draft.motivo} onChange={e => change({ motivo: e.target.value })} /></label>
      {draft.tipo === "condicionada" && <>
        <label className="text-sm font-semibold sm:col-span-2">Condiciones pendientes<textarea disabled={lock} className={textareaClass} maxLength={1000} value={draft.condiciones ?? ""} onChange={e => change({ condiciones: e.target.value })} /></label>
        <fieldset className="sm:col-span-2" disabled={lock}><legend className="text-sm font-semibold">Mientras se cumplen las condiciones, se permite:</legend>{WORKFLOW_STAGES.filter(st => st !== "captacion").map(st => <label key={st} className="mr-4 inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.permitidas?.includes(st) ?? false} onChange={e => change({ permitidas: e.target.checked ? [...(draft.permitidas ?? []), st] : (draft.permitidas ?? []).filter(v => v !== st) })} />{stageLabel(st, flow.ruta)}</label>)}</fieldset>
      </>}
      <label className="text-sm font-semibold">Siguiente acción<input disabled={lock} maxLength={160} className={inputClass} value={draft.siguienteAccion} onChange={e => change({ siguienteAccion: e.target.value })} /></label>
      <label className="text-sm font-semibold">Fecha de la siguiente acción<input type="date" disabled={lock} className={inputClass} value={draft.fechaSiguiente} onChange={e => change({ fechaSiguiente: e.target.value })} /></label>
    </div>}
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled={!dirty || lock} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar decisión"}</Button>
      {dirty && <Button variant="ghost" disabled={lock} onClick={() => { setDraft(flow.resolucion); setError(""); }}>Descartar cambios</Button>}
      {notice && !dirty && <span role="status" className="text-sm text-muted-foreground">{notice}</span>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Card>;
}
