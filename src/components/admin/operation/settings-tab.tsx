"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Card } from "@/components/admin/kit";
import { selectClass, textareaClass } from "@/components/admin/ui";
import { DateField } from "@/components/ui/date-field";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { db, useCollection, useSession } from "@/lib/admin/store";
import { discardReasonOf, DISCARD_REASONS, stageLabel, WORKFLOW_ROUTES, WORKFLOW_STAGES, WORKFLOW_STATES, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { flowOf, isGuided, routeStages, stageOf, type OperationRecord } from "@/lib/admin/operation-view";
import { saveError } from "./use-operation";
import { Combobox, faceOption, OptionSelect, photoOption } from "./pickers";
import { TypeCard } from "./type-card";

type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage; propiedadSlug?: string | null; fechaObjetivo?: string | null }) => Promise<unknown>;
const ROLE: Record<string, string> = { captacion: "Propietario vendedor", compra: "Comprador", arrendador: "Propietario arrendador", arrendatario: "Arrendatario", inversion: "Inversionista" };
/** Color de la situación: activa en verde, en pausa y en regularización en ámbar, descartada en rojo. */
const STATE_TONE: Record<OperationWorkflow["estado"], string> = { activa: "var(--success)", pausada: "var(--warning)", regularizacion: "var(--warning)", descartada: "var(--alert)" };
const OPPOSITE: Record<string, string> = { captacion: "compra", compra: "captacion", arrendador: "arrendatario", arrendatario: "arrendador", inversion: "" };

/**
  Datos del asunto (antes pestaña «Ajustes»; desde SIM-18 se abren en «Más opciones»): la
  ruta y situación, el inmueble, la fecha objetivo, la contraparte y corregir la etapa con motivo.
  Eliminar está en el mismo menú. La decisión del encargo pasó al panel de la etapa (COR-14, DEC-38).
*/
export function SettingsTab({ op, all, today, onSave, onReplaced, onDirtyChange }: { op: OperationRecord; all: OperationRecord[]; today: string; onSave: Save; onReplaced?: (op: OperationRecord) => void; onDirtyChange: (dirty: boolean) => void }) {
  const session = useSession();
  const properties = useCollection(db.propiedades), leads = useCollection(db.leads);
  const original = flowOf(op), stage = stageOf(op);
  const [flow, setFlow] = React.useState(original);
  const [property, setProperty] = React.useState(op.propiedad_slug ?? "");
  const [date, setDate] = React.useState(op.fecha_objetivo ?? "");
  const [back, setBack] = React.useState<WorkflowStage | "">("");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const dirty = JSON.stringify(flow) !== JSON.stringify(original) || property !== (op.propiedad_slug ?? "") || date !== (op.fecha_objetivo ?? "");
  React.useEffect(() => { onDirtyChange(dirty || busy); }, [dirty, busy, onDirtyChange]);
  const guided = isGuided(op);
  const routes = Object.entries(WORKFLOW_ROUTES).filter(([k]) => op.operacion === "inversion" ? k === "inversion" : op.operacion === "renta" ? ["arrendador", "arrendatario"].includes(k) : ["captacion", "compra"].includes(k));
  const available = properties.filter(p => ["compra", "arrendatario", "inversion"].includes(flow.ruta) || session?.role === "admin" || p.asesorId === op.asesor_id);
  // Interesados que buscan esta operación: contraparte del propietario, nunca clientes (RP-93, COR-11).
  const interested = leads.filter(l => l.perfil?.operacion === (op.operacion === "renta" ? "rentar" : "comprar") && l.estado !== "descartado");
  const historical = ["compra", "arrendatario"].includes(original.ruta);
  const routeChoices = routes.filter(([k]) => historical ? k === original.ruta || !["compra", "arrendatario"].includes(k) : !["compra", "arrendatario"].includes(k));
  const compatible = all.filter(e => e.id !== op.id && e.propiedad_slug === property && e.operacion === op.operacion && e.flujo?.ruta === OPPOSITE[flow.ruta] && e.flujo?.estado === "activa" && e.cliente_id !== op.cliente_id);
  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(done); } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (flow.estado === "descartada" && original.estado !== "descartada" && !discardReasonOf(flow.motivo.trim())) { setError("Elige el motivo del descarte de la lista."); return; }
    if (flow.estado !== "activa" && flow.motivo.trim().length < 3) { setError("Escribe el motivo de la pausa, la regularización o el descarte."); return; }
    const before = routeStages(op, today).phase;
    let opened = false;
    await run(() => onSave({ flujo: flow, propiedadSlug: property || null, fechaObjetivo: date || null }).then(saved => { opened = before === "verificacion" && routeStages(saved as OperationRecord, today).phase === "contrato"; }), "Guardado");
    if (opened) setNotice("Guardado. Verificación terminada: ya puedes trabajar el contrato en la etapa.");
  }
  async function goBack() {
    if (!back || flow.motivo.trim().length < 3) { setError("Elige la etapa y escribe el motivo de la corrección."); return; }
    if (!await confirmAction(`¿Regresar el asunto a «${stageLabel(back, flow.ruta)}»? Queda registrado con tu motivo.`)) return;
    await run(() => onSave({ flujo: flow, etapa: back, propiedadSlug: property || null, fechaObjetivo: date || null }).then(() => setBack("")), "Etapa corregida");
  }
  return <form onSubmit={save} className="flex max-w-[56rem] flex-col gap-5">
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5">
      <Card className="grid gap-4 p-5 sm:grid-cols-2" aria-label="Datos del asunto">
        <h2 className="m-0 text-lg sm:col-span-2">Datos del asunto</h2>
        {guided && !flow.guia && <label className="text-sm font-semibold">Ruta<select className={selectClass} value={flow.ruta} onChange={e => setFlow(old => ({ ...old, ruta: e.target.value as OperationWorkflow["ruta"] }))}>{routeChoices.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
        {guided && <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Situación</span><OptionSelect aria-label="Situación" className="font-normal" value={flow.estado} onChange={estado => setFlow(old => ({ ...old, estado }))}
          options={(Object.entries(WORKFLOW_STATES) as Array<[OperationWorkflow["estado"], string]>).map(([k, v]) => ({ value: k, label: v, icon: <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: STATE_TONE[k] }} /> }))} /></span>}
        <span className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2"><span>Inmueble</span><Combobox aria-label="Inmueble" className="font-normal" placeholder="Sin vincular todavía" searchPlaceholder="Buscar inmueble…" value={property} onChange={setProperty}
          options={[{ value: "", label: "Sin vincular todavía" }, ...(property && !available.some(p => p.slug === property) ? [{ value: property, label: "Inmueble vinculado no disponible" }] : []), ...available.map(p => photoOption(p.slug, p.titulo, p.galeria[0]?.src))]} /></span>
        <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Fecha objetivo</span><DateField aria-label="Fecha objetivo" className="font-normal" value={date} onChange={setDate} disabled={busy} /></span>
        {guided && flow.estado === "descartada" && <label className="text-sm font-semibold sm:col-span-2">Motivo del descarte<select className={selectClass} value={discardReasonOf(flow.motivo) ?? ""} onChange={e => setFlow(old => { const detail = discardReasonOf(old.motivo) ? old.motivo.slice(discardReasonOf(old.motivo)!.length).replace(/^:\s*/, "") : old.motivo; return { ...old, motivo: e.target.value ? `${e.target.value}${detail.trim() ? `: ${detail.trim()}` : ""}` : detail }; })}><option value="">Elige el motivo</option>{DISCARD_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select></label>}
        {guided && <label className="text-sm font-semibold sm:col-span-2">Motivo de pausa, regularización, descarte o corrección<textarea rows={2} maxLength={1000} className={textareaClass} value={flow.motivo} onChange={e => setFlow(old => ({ ...old, motivo: e.target.value }))} /></label>}
      </Card>

      {guided && flow.ruta !== "inversion" && <Card className="flex flex-col gap-4 p-5" aria-label="Contraparte">
        <div><h2 className="m-0 text-lg">Contraparte</h2><p className="mt-1 text-sm text-muted-foreground">Quién firma con el propietario: un interesado o una contraparte externa con su respaldo. No es cliente de Fortius.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {!historical && <span className="flex flex-col gap-1.5 text-sm font-semibold"><span>Interesado que firma</span><Combobox aria-label="Interesado que firma" className="font-normal" placeholder="Ninguno del panel" searchPlaceholder="Buscar interesado…" value={flow.contraparteLeadId ?? ""}
            onChange={id => setFlow(old => ({ ...old, contraparteLeadId: id || undefined, contraparteId: undefined, contraparteExterna: id ? undefined : old.contraparteExterna }))}
            options={[{ value: "", label: "Ninguno del panel" }, ...(flow.contraparteLeadId && !interested.some(l => l.id === flow.contraparteLeadId) ? [faceOption(flow.contraparteLeadId, leads.find(l => l.id === flow.contraparteLeadId)?.nombre ?? "Interesado vinculado")] : []), ...interested.map(l => faceOption(l.id, l.nombre, l.telefono || undefined, l.telefono ? [l.telefono] : undefined))]} /></span>}
          {(historical || flow.contraparteId) && <label className="text-sm font-semibold">Asunto de la contraparte<select className={selectClass} value={flow.contraparteId ?? ""} onChange={e => setFlow(old => ({ ...old, contraparteId: e.target.value || undefined, contraparteLeadId: undefined, contraparteExterna: undefined }))}><option value="">Ninguno del panel</option>{flow.contraparteId && !compatible.some(e => e.id === flow.contraparteId) && <option value={flow.contraparteId}>Vínculo actual · comprobar</option>}{compatible.map(e => <option key={e.id} value={e.id}>{e.folio} · {ROLE[e.flujo?.ruta ?? ""]}</option>)}</select></label>}
          <label className="text-sm font-semibold">Contraparte externa y respaldo<textarea rows={2} maxLength={1000} disabled={!!flow.contraparteId || !!flow.contraparteLeadId} className={textareaClass} value={flow.contraparteExterna ?? ""} onChange={e => setFlow(old => ({ ...old, contraparteExterna: e.target.value || undefined }))} /></label>
        </div>
      </Card>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={!dirty || busy}>{busy ? "Guardando…" : "Guardar ajustes"}</Button>
        {dirty && <Button variant="ghost" disabled={busy} onClick={() => { setFlow(original); setProperty(op.propiedad_slug ?? ""); setDate(op.fecha_objetivo ?? ""); setError(""); }}>Descartar cambios</Button>}
        <Link href={`/admin-anterior/agenda?expediente=${encodeURIComponent(op.id)}`} className="text-sm font-semibold underline underline-offset-4">Programar una cita</Link>
        {notice && <span role="status" className="text-sm text-muted-foreground">{notice}</span>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {/* FLX-03 B: cambiar el tipo no espera a «Guardar ajustes»; con cambios sin guardar se pide guardarlos antes. */}
      {guided && onReplaced && (dirty ? <p className="m-0 text-sm text-muted-foreground">Guarda o descarta los cambios para cambiar el tipo del asunto.</p> : <TypeCard op={op} disabled={busy} onReplaced={onReplaced} />)}

      {guided && !flow.guia && WORKFLOW_STAGES.indexOf(stage) > 0 && <Card className="flex flex-col gap-3 p-5" aria-label="Corregir etapa">
        <div><h2 className="m-0 text-lg">Corregir etapa</h2><p className="mt-1 text-sm text-muted-foreground">Regresa a una etapa anterior si avanzó por error. El motivo va en «Datos del asunto».</p></div>
        <label className="text-sm font-semibold">Regresar a<select className={selectClass} value={back} onChange={e => setBack(e.target.value as WorkflowStage | "")}><option value="">Elige la etapa</option>{WORKFLOW_STAGES.slice(0, WORKFLOW_STAGES.indexOf(stage)).map(st => <option key={st} value={st}>{stageLabel(st, flow.ruta)}</option>)}</select></label>
        <Button className="self-start" disabled={!back || flow.motivo.trim().length < 3 || busy} onClick={() => void goBack()}>Regresar con este motivo</Button>
      </Card>}

    </fieldset>
  </form>;
}
