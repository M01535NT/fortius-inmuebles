"use client";
import * as React from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, FileDown, FileText } from "@/components/admin/icons";
import { Button, ButtonLink, Card, Pill, Sheet } from "@/components/admin/kit";
import { flowOf, PHASE_FORMATS, pastGaps, stageDocuments, stageTrack, type OperationRecord, type TrackStage } from "@/lib/admin/operation-view";
import { checklistTaskId, pasoCompleto } from "@/lib/formatos/checklist-documentos";
import type { SalePhase } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";
import { formatTitle, draftProgress } from "./next-step";
import type { DocumentsController } from "./use-documents";
import { copiaEditable } from "@/lib/admin/download-word";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

/*
  Avance de la operación (boceto «Una operación, versión elegida»): línea de tiempo vertical con
  las etapas, la actual resaltada y un aviso cuando a una etapa anterior le falta su documento.
  Una etapa pasada se abre para ver sus documentos. «Ver etapas» abre el panel con las etapas
  en cuatro fases y los documentos de cada una, con PDF y Word.
*/

const two = (n: number) => String(n).padStart(2, "0");

/** Qué hacer con lo que le falta a una etapa anterior: abrir su documento o crear el checklist. */
function fixGap(key: SalePhase, docs: DocumentsController, checklist: Task | undefined, openStages: (key: SalePhase) => void) {
  if (key === "documentos") { if (!checklist) void docs.startChecklist(); else openStages(key); return; }
  const formato = (PHASE_FORMATS[key] ?? []).find(f => docs.status(f) !== "terminado");
  if (formato) void docs.start(formato);
}

export function StageCard({ op, today, docs, checklist, onOpenStages }: { op: OperationRecord; today: string; docs: DocumentsController; checklist?: Task; onOpenStages: (key?: SalePhase) => void }) {
  const { stages, current } = stageTrack(op, today);
  const gaps = pastGaps(op, today, docs.status);
  const gapAt = new Map(gaps.map(g => [g.n, g]));
  const here = stages[current];
  const first = gaps[0];
  return <Card className={s.track} aria-label="Avance de la operación">
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-sm font-semibold text-muted-foreground">Etapa {current + 1} de {stages.length}{here ? <> · <span className="text-foreground">{here.label}</span></> : null}</p>
    </div>
    <ol aria-label="Etapas" className={s.timeline}>{stages.map((stage, i) => {
      const gap = gapAt.get(stage.n), done = i < current, now = i === current;
      const state = now ? "now" : gap ? "warn" : done ? "done" : "next";
      const label = `${stage.n} · ${stage.label}: ${now ? "aquí vas" : gap ? gap.gap.toLowerCase() : done ? "lista" : "pendiente"}`;
      const dot = <span className={s.dot} data-state={state} aria-hidden="true">{now ? <span className={s.dotCore} /> : gap ? "!" : done ? <Check size={12} strokeWidth={3} /> : null}</span>;
      return <li key={stage.n} aria-current={now ? "step" : undefined} className={s.timelineItem} data-state={state}>
        {done && stage.key
          ? <button type="button" className={s.stageLink} title={label} aria-label={label} onClick={() => onOpenStages(stage.key)}>{dot}<span className={s.stageName}>{stage.label}</span>{gap && <AlertCircle size={15} aria-hidden="true" className={s.iconWarn} />}</button>
          : <span className={s.stageLink} title={label}>{dot}<span className={s.stageName}>{stage.label}</span><span className="sr-only">{label}</span></span>}
      </li>;
    })}</ol>
    {first && <div className={s.gapNotice} role="status">
      <AlertCircle size={18} aria-hidden="true" />
      <span className="min-w-0 flex-1">A la etapa {first.n}, {first.label.toLowerCase()}, le {first.gap.replace(/^Falta(n?)/, (_, n) => `falta${n}`)}.{gaps.length > 1 ? ` Hay ${gaps.length - 1} más en «Ver etapas».` : ""}</span>
      <button type="button" className={s.gapAction} disabled={docs.busy} onClick={() => fixGap(first.key, docs, checklist, onOpenStages)}>Hacerlo ahora</button>
    </div>}
    <Button className="w-full" onClick={() => onOpenStages()}>Ver etapas<ChevronRight size={16} aria-hidden="true" /></Button>
  </Card>;
}

/** En celular: una tarjeta que abre el panel de etapas. */
export function StageCardCompact({ op, today, docs, onOpenStages }: { op: OperationRecord; today: string; docs: DocumentsController; onOpenStages: () => void }) {
  const { stages, current } = stageTrack(op, today);
  const gaps = pastGaps(op, today, docs.status);
  return <button type="button" className={cn(s.track, s.trackCompact)} aria-label={`Ver etapas. Etapa ${current + 1} de ${stages.length}, ${stages[current]?.label ?? ""}${gaps.length ? `. ${gaps.length === 1 ? `A la etapa ${gaps[0].n} le falta algo` : `A ${gaps.length} etapas les falta algo`}` : ""}`} onClick={onOpenStages}>
    <span className={s.stageBadge} aria-hidden="true">{two(current + 1)}</span>
    <span className="flex min-w-0 flex-1 flex-col text-left">
      <strong className="text-base leading-tight">{stages[current]?.label}</strong>
      <span className="text-sm text-muted-foreground">Etapa {current + 1} de {stages.length}{gaps.length ? <> · <span className="font-semibold text-[var(--warning)]">{gaps.length === 1 ? `a la ${gaps[0].n} le falta algo` : `a ${gaps.length} etapas les falta algo`}</span></> : ""}</span>
    </span>
    <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
  </button>;
}

/** Panel «Ver etapas»: las etapas en cuatro fases; las pasadas y la actual con sus documentos. */
export function StagesSheet({ op, today, docs, checklist, focus, onClose }: { op: OperationRecord; today: string; docs: DocumentsController; checklist?: Task; focus?: SalePhase; onClose: () => void }) {
  const { stages, current } = stageTrack(op, today);
  const gaps = new Map(pastGaps(op, today, docs.status).map(g => [g.n, g.gap]));
  React.useEffect(() => {
    if (!focus) return;
    const heading = document.querySelector<HTMLElement>(`[data-stage="${focus}"]`);
    heading?.scrollIntoView?.({ block: "start" }); heading?.focus({ preventScroll: true });
  }, [focus]);
  function open(action: () => unknown) { onClose(); action(); }
  function stageDocs(stage: TrackStage) {
    if (!stage.key || stage.n - 1 > current) return null;
    if (stage.key === "documentos") {
      const received = checklist?.pasos.filter(pasoCompleto).length ?? 0, total = checklist?.pasos.length ?? 0;
      return <ul className={s.stageDocs}><li className={s.stageDoc}>
        <span className="min-w-0 flex-1">{checklist ? `Checklist · ${received} de ${total} listos` : <span className="font-semibold text-[var(--warning)]">Falta el checklist</span>}</span>
        {checklist ? <><Link className={s.docLink} href={`/admin/tareas/${encodeURIComponent(checklistTaskId(op.id))}`}>Ver</Link><button type="button" className={s.docLink} onClick={() => docs.checklistFile("pdf")}>PDF</button></>
          : <button type="button" className={s.docLink} disabled={docs.busy} onClick={() => open(() => docs.startChecklist())}>Crear</button>}
      </li></ul>;
    }
    // La 02 se muestra en «Entrevista inicial»; el prospecto no repite documentos.
    const formats = stage.key === "captacion" ? ["02", "01"] : stage.key && stage.key !== "prospecto" ? stageDocuments(stage.key, flowOf(op).ruta).map(item => item.formato) : [];
    if (!formats.length) return null;
    return <ul className={s.stageDocs}>{formats.map(formato => {
      const doc = docs.latest(formato), pdf = docs.pdfOf(doc);
      const faltan = doc ? draftProgress(doc).missing : 0;
      const text = !doc ? "No se generó" : faltan ? (pdf ? "PDF incompleto" : "En captura") : pdf ? "Terminado" : "Falta su PDF";
      return <li key={formato} className={s.stageDoc}>
        <span className="flex min-w-0 flex-1 flex-col"><span className="[overflow-wrap:anywhere]">{formatTitle(formato, doc)}</span><span className={cn("text-xs", doc ? "text-muted-foreground" : "font-semibold text-[var(--warning)]")}>{text}</span></span>
        <button type="button" className={s.docLink} disabled={docs.busy} onClick={() => open(() => docs.start(formato))}>{doc ? "Abrir" : "Iniciar"}</button>
        {pdf && <a className={s.docLink} href={`/api/admin/emisiones/${pdf.id}/descargar`}>PDF</a>}
        {doc && copiaEditable(doc.formato_id) && <button type="button" className={s.docLink} disabled={docs.busy} onClick={() => docs.word(doc)}>{copiaEditable(doc.formato_id)}</button>}
      </li>;
    })}</ul>;
  }
  return <Sheet open onClose={onClose} title="Etapas" description="Toca Abrir para ver o completar el documento de una etapa.">
    {(() => {
      return <section aria-label="Etapas de la operación" className="flex flex-col gap-1">
        <ol className="flex flex-col gap-1">{stages.map(stage => {
          const i = stage.n - 1, gap = gaps.get(stage.n), now = i === current, done = i < current;
          return <li key={stage.n}>
            <p tabIndex={-1} data-stage={stage.key} className={s.stageRow} data-state={now ? "now" : gap ? "warn" : done ? "done" : "next"}>
              <span className={s.dot} data-state={now ? "now" : gap ? "warn" : done ? "done" : "next"} aria-hidden="true">{now ? stage.n : gap ? "!" : done ? <Check size={13} strokeWidth={3} /> : stage.n}</span>
              <span className="min-w-0 flex-1">{stage.n} · {stage.label}</span>
              {now && <Pill tone="brand" size="sm">Aquí vas</Pill>}
              {gap && <Pill tone="warn" size="sm">{gap}</Pill>}
            </p>
            {stageDocs(stage)}
          </li>;
        })}</ol>
      </section>;
    })()}
  </Sheet>;
}

/** Documentos de toda la operación, por etapa, para la pestaña Expediente. */
export function DocumentsByStage({ docs, folio }: { docs: DocumentsController; folio: string }) {
  if (docs.documents === undefined) return <p role="status" className="text-sm text-muted-foreground">Consultando documentos…</p>;
  if (!docs.list.length) return <p className="text-sm text-muted-foreground">Todavía no hay documentos en esta operación ({folio}).</p>;
  const sorted = [...docs.list].sort((a, b) => a.formato_id.localeCompare(b.formato_id) || b.updated_at.localeCompare(a.updated_at));
  return <ul className={s.items}>{sorted.map(doc => {
    const pdf = docs.pdfOf(doc), latest = docs.latest(doc.formato_id.startsWith("04") ? "04" : doc.formato_id)?.id === doc.id;
    return <li key={doc.id} className={s.item}><div className={s.itemMain}>
      <FileText size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold [overflow-wrap:anywhere]">{formatTitle(doc.formato_id.startsWith("04") ? "04" : doc.formato_id, doc)}</span>
        <span className="text-sm text-muted-foreground">Versión {doc.version}{pdf ? " · con PDF" : ""}{latest ? "" : " · borrador anterior"}</span>
      </div>
      <div className={s.itemActions}>
        <Button disabled={docs.busy} onClick={() => docs.openDocument(doc)}>Abrir</Button>
        {pdf && <ButtonLink variant="ghost" prefetch={false} href={`/api/admin/emisiones/${pdf.id}/descargar`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
        {copiaEditable(doc.formato_id) && <Button variant="ghost" disabled={docs.busy} onClick={() => docs.word(doc)}><FileText size={16} aria-hidden="true" />{copiaEditable(doc.formato_id)}</Button>}
      </div>
    </div></li>;
  })}</ul>;
}
