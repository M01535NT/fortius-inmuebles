"use client";
import * as React from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileDown, FileText, Mail, MessageCircle, MoreHorizontal, Phone, Trash2 } from "@/components/admin/icons";
import { Button, ButtonLink, Pill, Sheet } from "@/components/admin/kit";
import { flowOf, isGuided, phaseFormats, pastGaps, stageDocuments, stageTrack, type OperationRecord, type TrackStage } from "@/lib/admin/operation-view";
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

/** Los cuatro pasos de «Cierre y entrega», con el actual marcado (COR-09). */
function CloseSteps({ stage, onDark }: { stage: TrackStage; onDark?: boolean }) {
  if (!stage.pasos) return null;
  return <ol aria-label={`Pasos de ${stage.label.split(" · ")[0].toLowerCase()}`} className={cn("mb-1 mt-0.5 flex flex-col gap-0.5 text-sm", onDark ? s.closeStepsDark : "ml-11")}>{stage.pasos.map(paso =>
    <li key={paso.stage} aria-current={paso.state === "now" ? "step" : undefined} className={cn("flex min-h-8 items-center gap-2", paso.state === "now" ? "font-semibold text-foreground" : "text-muted-foreground")}>
      <span aria-hidden="true" className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-full border", paso.state === "done" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : paso.state === "now" ? "border-2 border-[var(--primary)] bg-[var(--card)]" : "border-[var(--edge-soft)] bg-[var(--card)]")}>{paso.state === "done" && <Check size={10} strokeWidth={3} />}</span>
      <span>{paso.label}</span>
      <span className="sr-only">{paso.state === "now" ? ": aquí vas" : paso.state === "done" ? ": listo" : ": pendiente"}</span>
    </li>)}</ol>;
}

/** Qué hacer con lo que le falta a una etapa anterior: abrir su documento o crear el checklist. */
function fixGap(key: SalePhase, docs: DocumentsController, checklist: Task | undefined, openStages: (key: SalePhase) => void, ruta?: string | null) {
  if (key === "documentos") { if (!checklist) void docs.startChecklist(); else openStages(key); return; }
  const formato = phaseFormats(key, ruta).find(f => docs.status(f) !== "terminado");
  if (formato) void docs.start(formato);
}

/** Las iniciales de una persona, para su círculo. */
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase();

/**
  Panel azul de la operación (LV-06 «Moderno», 31/10/2026): regreso y folio, quién y qué quiere, el
  número de etapa grande, las diez etapas como barras (cada una conserva su nombre accesible y, si ya
  pasó, abre «Ver etapas» en ella), lo que quedó pendiente de etapas anteriores y, al pie, la persona
  con Llamar y WhatsApp. En las demás pestañas va compacto, con las partes de la operación.
*/
export function StagePanel({ op, today, docs, checklist, compact, back, who, person, onOpenStages, onRemove, children }: {
  op: OperationRecord; today: string; docs: DocumentsController; checklist?: Task; compact: boolean;
  /** A dónde vuelve el círculo de regreso. */
  back: string;
  /** «Iliana Tonala vende su casa»: el nombre (h1) y lo que quiere. */
  who: { name: string; wants: string; href?: string };
  person?: { name: string; role: string; digits: string; email?: string; href: string };
  onOpenStages: (focus?: SalePhase) => void;
  onRemove?: () => void;
  /** Las partes de la operación (pestañas), en el panel compacto. */
  children?: React.ReactNode;
}) {
  const [menu, setMenu] = React.useState(false);
  const guided = isGuided(op);
  const { stages, current } = stageTrack(op, today);
  const gaps = pastGaps(op, today, docs.status);
  const gapAt = new Map(gaps.map(g => [g.n, g]));
  const here = stages[current];
  const first = gaps[0];
  return <section className={cn(s.navy, compact && s.navyCompact)} aria-label="Avance de la operación">
    <div className={s.navyTop}>
      <Link href={back} className={s.round} aria-label="Volver a Operaciones"><ChevronLeft size={20} aria-hidden="true" /></Link>
      <span className={s.onNavyMuted}>{op.folio}</span>
      <span className="flex-1" />
      {onRemove && <span className="relative">
        <button type="button" className={s.round} aria-label="Más opciones" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(open => !open)}><MoreHorizontal size={20} aria-hidden="true" /></button>
        {menu && <div role="menu" className={s.menu}><button type="button" role="menuitem" className={s.menuItem} onClick={() => { setMenu(false); onRemove(); }}><Trash2 size={16} aria-hidden="true" />Eliminar operación</button></div>}
      </span>}
    </div>
    <div className={s.who}>
      <h1 className={s.whoName}>{who.href ? <Link href={who.href} className={s.whoLink}>{who.name}</Link> : who.name}</h1>
      {who.wants && <span className={s.onNavyMuted}> {who.wants}</span>}
    </div>
    {guided && here && <div className={s.stageHead}>
      <div className={s.bigRow}><span className={s.bigNum}>{two(current + 1)}</span><span className={s.ofTen}>/{stages.length}</span></div>
      <p className={s.stageTitle}>{here.label}</p>
      <p className={cn(s.onNavyMuted, "text-sm")}>Etapa {current + 1} de {stages.length}</p>
    </div>}
    {guided && !compact && <ol aria-label="Etapas" className={s.stages}>{stages.map((stage, i) => {
      const gap = gapAt.get(stage.n), done = i < current, now = i === current;
      const state = now ? "now" : gap ? "warn" : done ? "done" : "next";
      const label = `${stage.n} · ${stage.label}: ${now ? "aquí vas" : gap ? gap.gap.toLowerCase() : done ? "lista" : "pendiente"}`;
      const inner = <><span className={s.stageNum} aria-hidden="true">{two(stage.n)}</span><span className={s.stageLine}><span className={s.stageBar} aria-hidden="true" /><span className={s.stageLabel}>{stage.label}</span>{gap && <span className={s.stageWarn} aria-hidden="true">!</span>}</span></>;
      return <li key={stage.n} aria-current={now ? "step" : undefined} className={s.stage} data-state={state}>
        {done && stage.key
          ? <button type="button" className={s.stageBtn} title={label} aria-label={label} onClick={() => onOpenStages(stage.key)}>{inner}</button>
          : <span className={s.stageBtn} title={label}>{inner}<span className="sr-only">{label}</span></span>}
        {now && <CloseSteps stage={stage} onDark />}
      </li>;
    })}</ol>}
    {guided && !compact && first && <div className={s.gapNotice} role="status">
      <AlertCircle size={18} aria-hidden="true" />
      <span className="min-w-0 flex-1">A la etapa {first.n}, {first.label.toLowerCase()}, le {first.gap.replace(/^Falta(n?)/, (_, n) => `falta${n}`)}.{gaps.length > 1 ? ` Hay ${gaps.length - 1} más en «Ver etapas».` : ""}</span>
      <button type="button" className={s.gapAction} disabled={docs.busy} onClick={() => fixGap(first.key, docs, checklist, onOpenStages, op.flujo?.ruta)}>Hacerlo ahora</button>
    </div>}
    {guided && !compact && <button type="button" className={s.navyLink} onClick={() => onOpenStages()}>Ver etapas<ChevronRight size={16} aria-hidden="true" /></button>}
    {children}
    {person && <div className={s.owner}>
      <span className={s.ownerAvatar} aria-hidden="true">{initialsOf(person.name)}</span>
      <span className="flex min-w-0 flex-1 flex-col"><Link href={person.href} className={s.ownerName}>{person.name}</Link><span className={cn(s.onNavyMuted, "text-sm")}>{person.role}</span></span>
      {person.digits ? <>
        <a href={`tel:${person.digits}`} className={s.round} aria-label={`Llamar a ${person.name}`}><Phone size={18} aria-hidden="true" /></a>
        <a href={`https://wa.me/${person.digits.length === 10 ? `52${person.digits}` : person.digits}`} target="_blank" rel="noreferrer" className={s.round} aria-label={`WhatsApp a ${person.name}`}><MessageCircle size={18} aria-hidden="true" /></a>
      </> : person.email ? <a href={`mailto:${person.email}`} className={s.round} aria-label={`Escribir a ${person.name}`}><Mail size={18} aria-hidden="true" /></a> : null}
    </div>}
  </section>;
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
  return <Sheet open onClose={onClose} title="Etapas" description="Abre el documento de cada etapa.">
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
            {(now || done) && <CloseSteps stage={stage} />}
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
