"use client";
import * as React from "react";
import { operationalDate } from "@/lib/admin/operational-date";
import type { OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { EXPEDIENTE_DOCUMENTOS, EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";
import { fetchJson as json } from "@/lib/admin/store";

export type ExpedienteOperativo = {
  id: string; version: number; asesor_id: string; etapa?: keyof typeof EXPEDIENTE_ETAPAS;
  fecha_objetivo?: string | null; checklist?: Partial<Record<keyof typeof EXPEDIENTE_DOCUMENTOS, "pendiente" | "recibido" | "no_aplica">>;
  created_at?: string; updated_at?: string; operacion?:string; propiedad_slug?:string|null; flujo?:OperationWorkflow|null;
};
type Activity = { id: string; tipo: "nota" | "cambio"; descripcion: string; created_by: string; created_at: string };
type Props<T extends ExpedienteOperativo> = {
  expediente: T; responsable: string; view?: "all"|"summary"|"activity"; onSaved: (value: T) => void; onDirtyChange: (value: boolean) => void;
};

function shownDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return value.includes("T") ? operationalDate(new Date(value)) : value.slice(0, 10);
}
function checklistKey(value: ExpedienteOperativo["checklist"]) {
  return Object.entries(value ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, status]) => `${key}:${status}`).join("|");
}

export function ExpedienteOperationPanel<T extends ExpedienteOperativo>({ expediente, responsable, onSaved, onDirtyChange, view="all" }: Props<T>) {
  const [etapa, setEtapa] = React.useState<keyof typeof EXPEDIENTE_ETAPAS>(expediente.etapa ?? "captacion");
  const [fecha, setFecha] = React.useState(expediente.fecha_objetivo ?? "");
  const [checklist, setChecklist] = React.useState<NonNullable<ExpedienteOperativo["checklist"]>>(expediente.checklist ?? {});
  const [activity, setActivity] = React.useState<Activity[]>([]);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const guided=["venta","renta","inversion"].includes(expediente.operacion ?? "");
  const operationDirty = !guided && (etapa !== (expediente.etapa ?? "captacion") || fecha !== (expediente.fecha_objetivo ?? "")
    || checklistKey(checklist) !== checklistKey(expediente.checklist));
  const dirty = operationDirty || !!note.trim();
  React.useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  React.useEffect(() => {
    let active = true;
    json<{ actividad: Activity[] }>(`/api/admin/expedientes/${expediente.id}/actividad`)
      .then(result => { if (active) setActivity(Array.isArray(result.actividad) ? result.actividad : []); })
      .catch(cause => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [expediente.id]);
  async function refreshActivity() {
    const result = await json<{ actividad: Activity[] }>(`/api/admin/expedientes/${expediente.id}/actividad`);
    setActivity(result.actividad);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!operationDirty || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await json<{ expediente: T }>(`/api/admin/expedientes/${expediente.id}/operacion`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: expediente.version, etapa, fechaObjetivo: fecha || null, checklist }),
      });
      onSaved(result.expediente);
      setNotice("Operación guardada.");
      await refreshActivity().catch(() => setError("La operación se guardó, pero no se pudo actualizar la actividad."));
    } catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }
  async function addNote(event: React.FormEvent) {
    event.preventDefault(); if (!note.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await json<{ actividad: Activity }>(`/api/admin/expedientes/${expediente.id}/actividad`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ descripcion: note.trim() }),
      });
      setActivity(items => [result.actividad, ...items]);
      setNote("");
      setNotice("Actividad registrada.");
    } catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }
  return <section className="rounded-lg border border-border bg-card p-5" aria-label="Seguimiento de la operación">
    <h3 className="display-soft text-xl">{guided?"Guía de operación":"Seguimiento de la operación"}</h3>
    <details open={!guided||view==="activity"?true:undefined} className="mt-3"><summary className="cursor-pointer text-sm text-muted-foreground">Datos de seguimiento</summary><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <p><strong>Responsable:</strong> {responsable}</p>
      <p><strong>Abierto:</strong> {shownDate(expediente.created_at)}</p>
      <p><strong>Última actualización:</strong> {shownDate(expediente.updated_at)}</p>
      <p><strong>Versión:</strong> {expediente.version}</p>
    </div></details>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    <form hidden={view==="activity"||guided} onSubmit={save} className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Etapa
          <select className={selectClass} value={etapa} disabled={busy} onChange={event => setEtapa(event.target.value as keyof typeof EXPEDIENTE_ETAPAS)}>
            {Object.entries(EXPEDIENTE_ETAPAS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm">Fecha objetivo
          <input type="date" className={inputClass} value={fecha} disabled={busy} onChange={event => setFecha(event.target.value)} />
        </label>
      </div>
      <div>
        <h4 className="font-semibold">Checklist documental</h4>
        <p className="text-sm text-muted-foreground">Coteja los documentos antes de marcar «Lo tengo».</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {Object.entries(EXPEDIENTE_DOCUMENTOS).map(([key, label]) => <label key={key} className="text-sm">{label}
            <select className={selectClass} disabled={busy} value={checklist[key as keyof typeof EXPEDIENTE_DOCUMENTOS] ?? "pendiente"}
              onChange={event => setChecklist(current => ({ ...current, [key]: event.target.value as "pendiente" | "recibido" | "no_aplica" }))}>
              <option value="pendiente">Pendiente</option><option value="recibido">Lo tengo</option><option value="no_aplica">No aplica</option>
            </select>
          </label>)}
        </div>
      </div>
      <button type="submit" disabled={!operationDirty || busy} className={btnPrimary}>Guardar seguimiento</button>
    </form>
    <div id="exp-actividad" hidden={view==="summary"} className="mt-6 scroll-mt-24 border-t border-border pt-5">
      <h4 className="font-semibold">Actividad y revisión documental</h4>
      <p className="mt-2 text-sm text-muted-foreground">«Lo tengo» solo dice que llegó. Anota aparte qué documento revisaste, de dónde viene y qué encontraste.</p>
      <div className="mt-3 flex flex-wrap gap-2">{Object.entries(EXPEDIENTE_DOCUMENTOS).filter(([key])=>checklist[key as keyof typeof EXPEDIENTE_DOCUMENTOS]==="recibido").map(([key,label])=><button key={key} type="button" className={btnGhost} disabled={busy || !!note.trim()} onClick={()=>{setNote("Revisión de "+label+": ");document.getElementById("exp-review-note")?.focus();}}>Revisar {label}</button>)}</div>
      <form onSubmit={addNote} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[240px] flex-1 text-sm">Nueva nota
          <textarea id="exp-review-note" className={inputClass} maxLength={1000} rows={2} value={note} disabled={busy}
            onChange={event => setNote(event.target.value)} />
        </label>
        <button type="submit" disabled={!note.trim() || busy} className={btnGhost}>Registrar nota</button>
      </form>
      {activity.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Sin actividad registrada.</p>
        : <ol className="mt-3 space-y-2 text-sm">{activity.map(item => <li key={item.id} className="rounded-md border border-border p-3">
          <p>{item.descripcion}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.tipo === "nota" ? "Nota" : "Cambio"} · Responsable {item.created_by} · {new Date(item.created_at).toLocaleString("es-MX")}</p>
        </li>)}</ol>}
    </div>
  </section>;
}
