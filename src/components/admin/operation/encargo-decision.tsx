"use client";
import * as React from "react";
import { Button, Card } from "@/components/admin/kit";
import { inputClass, textareaClass } from "@/components/admin/ui";
import { DateField } from "@/components/ui/date-field";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, useCollection } from "@/lib/admin/store";
import { RESOLUTION_TYPES, stageLabel, WORKFLOW_STAGES, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { saveError } from "./use-operation";
import { CheckField } from "./pickers";
import { useIsDirector } from "@/lib/admin/staff-scope";

type Resolution = NonNullable<OperationWorkflow["resolucion"]>;
/** Color de cada decisión en el selector: aceptar en verde, esperar en ámbar, cerrar en rojo, referir neutro. */
const DECISION_TONE: Record<Resolution["tipo"], string> = { aceptada: "var(--success)", condicionada: "var(--success)", pausada: "var(--warning)", rechazada: "var(--alert)", referida: "var(--muted-foreground)", cancelada: "var(--alert)" };
const EVALUANDO = "evaluacion";
const Dot = ({ color }: { color: string }) => <span aria-hidden="true" className="mr-2.5 inline-block size-2.5 shrink-0 rounded-full" style={{ background: color }} />;
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
  // COR-23: tomar el encargo (aceptarlo, con o sin condiciones) lo decide el director.
  const director = useIsDirector();
  const taken = (tipo?: string) => tipo === "aceptada" || tipo === "condicionada";
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

  // C-94 (titular, 13/11/2026): el asesor puede pausar, rechazar o referir un encargo ya aceptado. El selector
  // solo se bloquea al guardar; los demás campos, mientras el borrador siga en una decisión que solo toma el director.
  const choiceLock = disabled || busy;
  const lock = choiceLock || (!director && taken(draft?.tipo));
  return <Card id="decision-encargo" className="flex flex-col gap-4 p-5" aria-label="Decisión del encargo">
    <div><h2 className="m-0 text-lg">Decisión del encargo</h2><p className="mt-1 text-sm text-muted-foreground">{intro} Pausar, rechazar, referir o cancelar conserva los documentos y el historial.</p></div>
    <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Decisión</span>
      <Select disabled={choiceLock} value={draft?.tipo ?? EVALUANDO} onValueChange={value => value !== EVALUANDO ? change({ tipo: value as Resolution["tipo"] }) : setDraft(undefined)}>
        <SelectTrigger aria-label="Decisión" className="font-normal"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={EVALUANDO}><Dot color="var(--edge-soft)" />Todavía en evaluación</SelectItem>
          <SelectSeparator />
          {(Object.entries(RESOLUTION_TYPES) as Array<[Resolution["tipo"], string]>).map(([value, label]) => <SelectItem key={value} value={value} disabled={!director && taken(value) && value !== flow.resolucion?.tipo}><Dot color={DECISION_TONE[value]} />{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </span>
    {!director && <p className="-mt-2 text-sm text-muted-foreground">Tomar el encargo lo decide el director; tú puedes registrar si se pausa, se rechaza o se refiere.</p>}
    {draft && <div className="grid gap-3 sm:grid-cols-2">
      <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Fecha de la decisión</span><DateField aria-label="Fecha de la decisión" required disabled={lock} className="font-normal" value={draft.fecha} onChange={fecha => change({ fecha })} /></span>
      <label className="text-sm font-semibold sm:col-span-2">Motivo y alcance<textarea disabled={lock} className={textareaClass} maxLength={1000} value={draft.motivo} onChange={e => change({ motivo: e.target.value })} /></label>
      {draft.tipo === "condicionada" && <>
        <label className="text-sm font-semibold sm:col-span-2">Condiciones pendientes<textarea disabled={lock} className={textareaClass} maxLength={1000} value={draft.condiciones ?? ""} onChange={e => change({ condiciones: e.target.value })} /></label>
        <fieldset className="sm:col-span-2" disabled={lock}><legend className="text-sm font-semibold">Mientras se cumplen las condiciones, se permite:</legend><div className="flex flex-wrap gap-x-5">{WORKFLOW_STAGES.filter(st => st !== "captacion").map(st => <CheckField key={st} disabled={lock} checked={draft.permitidas?.includes(st) ?? false} onChange={on => change({ permitidas: on ? [...(draft.permitidas ?? []), st] : (draft.permitidas ?? []).filter(v => v !== st) })}>{stageLabel(st, flow.ruta)}</CheckField>)}</div></fieldset>
      </>}
      <label className="text-sm font-semibold">Siguiente acción<input disabled={lock} maxLength={160} className={inputClass} value={draft.siguienteAccion} onChange={e => change({ siguienteAccion: e.target.value })} /></label>
      <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Fecha de la siguiente acción</span><DateField aria-label="Fecha de la siguiente acción" required disabled={lock} className="font-normal" value={draft.fechaSiguiente} onChange={fechaSiguiente => change({ fechaSiguiente })} /></span>
    </div>}
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled={!dirty || choiceLock || (!director && taken(draft?.tipo))} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar decisión"}</Button>
      {dirty && <Button variant="ghost" disabled={choiceLock} onClick={() => { setDraft(flow.resolucion); setError(""); }}>Descartar cambios</Button>}
      {notice && !dirty && <span role="status" className="text-sm text-muted-foreground">{notice}</span>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Card>;
}
