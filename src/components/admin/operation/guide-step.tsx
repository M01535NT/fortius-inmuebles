"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "@/components/admin/icons";
import { Button, ButtonLink, Card } from "@/components/admin/kit";
import { selectClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { db, uid, upsert, useCollection } from "@/lib/admin/store";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { etapasDeGuia, GUIA_NOMBRE } from "@/lib/guias";
import { nuevoTramite } from "@/lib/tramites";
import type { OperationWorkflow, WorkflowStage } from "@/lib/formatos/operation-workflow";
import { saveError } from "./use-operation";

/*
  FLX-03 B (DEC-55): «Lo que sigue» de un asunto con guía propia (inspección, opinión de valor o
  cancelación de hipoteca). La guía sugiere; no frena: se puede pasar a la siguiente etapa o a
  cualquier otra, y saltar etapas queda como aviso en el historial. La cancelación de hipoteca
  avanza en su trámite (sus pasos tienen pendientes y documentos); el asunto sigue el mismo riel.
*/

type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage }) => Promise<unknown>;

export function GuideStepTab({ op, onSave, clientName }: { op: OperationRecord; onSave: Save; clientName?: string }) {
  const router = useRouter();
  const flow = flowOf(op), guia = flow.guia!;
  const etapas = etapasDeGuia(guia), paso = Math.min(guia.paso, etapas.length - 1);
  const tramites = useCollection(db.tramites).filter(t => t.expedienteId === op.id);
  const [chosen, setChosen] = React.useState(String(Math.min(paso + 1, etapas.length - 1)));
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const id = React.useId();
  const last = paso >= etapas.length - 1;

  async function moveTo(target: number) {
    if (target === paso || busy) return;
    const skipped = target > paso + 1 ? etapas.slice(paso + 1, target) : [];
    if (skipped.length && !await confirmAction(`Quedan atrás: ${skipped.join(", ")}. Puedes pasar igual; quedará anotado en el historial del asunto.`, { title: `¿Pasar a «${etapas[target]}»?`, confirmLabel: "Pasar igual" })) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await onSave({ flujo: { ...flow, guia: { ...guia, paso: target } } });
      setNotice(`Pasó a «${etapas[target]}».${skipped.length ? " Lo que quedó atrás está anotado en el historial." : ""}`);
      setChosen(String(Math.min(target + 1, etapas.length - 1)));
    } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  async function archive() {
    if (busy || !await confirmAction("El asunto pasa a «Archivadas» con sus documentos y su historial.", { title: "¿Archivar el asunto?", confirmLabel: "Archivar" })) return;
    setBusy(true); setError(""); setNotice("");
    try { await onSave({ flujo: flow, etapa: "cerrado" }); setNotice("Asunto archivado."); }
    catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  async function openTramite() {
    setBusy(true); setError("");
    try {
      const tramiteId = uid();
      await upsert(db.tramites, nuevoTramite({ id: tramiteId, acreedor: guia.acreedor ?? "banco", titulo: clientName ? `Cancelación · ${clientName}` : `Cancelación · ${op.folio}`,
        clienteId: op.cliente_id, asesorId: op.asesor_id, propiedadSlug: op.propiedad_slug ?? undefined, expedienteId: op.id }), null);
      router.push(`/admin/tramites?id=${encodeURIComponent(tramiteId)}`);
    } catch (cause) { setError(saveError(cause)); setBusy(false); }
  }

  return <Card className="flex flex-col gap-4 p-5" aria-labelledby={`${id}-titulo`}>
    <div className="flex flex-col gap-1">
      <p className="m-0 text-sm text-muted-foreground">{GUIA_NOMBRE[guia.clave]} · etapa {paso + 1} de {etapas.length}</p>
      <h2 id={`${id}-titulo`} className="m-0 text-xl">{etapas[paso]}</h2>
    </div>
    <ol className="m-0 flex list-none flex-col gap-1 p-0" aria-label={`Etapas de ${GUIA_NOMBRE[guia.clave].toLowerCase()}`}>
      {etapas.map((nombre, i) => <li key={nombre} className="flex items-center gap-2 text-sm" aria-current={i === paso ? "step" : undefined}>
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs tabular-nums" data-state={i < paso ? "done" : i === paso ? "now" : undefined}>
          {i < paso ? <Check size={13} aria-hidden="true" /> : i + 1}
        </span>
        <span className={i === paso ? "font-semibold" : i < paso ? "text-muted-foreground" : undefined}>{nombre}</span>
      </li>)}
    </ol>
    {guia.clave === "cancelacion_hipoteca" ? <div className="flex flex-col gap-2">
      <p className="m-0 text-sm">Los pasos se cierran en el trámite, con sus pendientes y documentos; este riel lo sigue solo.</p>
      {tramites.length
        ? tramites.map(t => <ButtonLink key={t.id} variant="primary" className="self-start" href={`/admin/tramites?id=${encodeURIComponent(t.id)}`}>Abrir el trámite</ButtonLink>)
        : <Button variant="primary" className="self-start" disabled={busy} onClick={() => void openTramite()}>{busy ? "Abriendo…" : "Empezar el trámite"}</Button>}
    </div> : <div className="flex flex-wrap items-end gap-2">
      {!last && <Button variant="primary" disabled={busy} onClick={() => void moveTo(paso + 1)}>{busy ? "Guardando…" : `Pasar a «${etapas[paso + 1]}»`}</Button>}
      <label className="flex flex-col gap-1 text-sm" htmlFor={`${id}-otra`}>Pasar a otra etapa
        <span className="flex gap-2">
          <select id={`${id}-otra`} className={selectClass} value={chosen} disabled={busy} onChange={event => setChosen(event.target.value)}>
            {etapas.map((nombre, i) => i === paso ? null : <option key={nombre} value={i}>{i + 1} · {nombre}</option>)}
          </select>
          <Button disabled={busy || Number(chosen) === paso} onClick={() => void moveTo(Number(chosen))}>Pasar</Button>
        </span>
      </label>
    </div>}
    {last && op.etapa !== "cerrado" && <div className="flex flex-wrap items-center gap-3"><p className="m-0 text-sm">Es la última etapa de la guía.</p><Button disabled={busy} onClick={() => void archive()}>Archivar el asunto</Button></div>}
    {op.etapa === "cerrado" && <p className="m-0 text-sm text-muted-foreground">Asunto archivado.</p>}
    {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
  </Card>;
}
