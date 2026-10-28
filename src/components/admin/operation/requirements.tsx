"use client";
import * as React from "react";
import { AlertCircle, CheckCircle2, Circle, CircleDashed, MinusCircle, MoreHorizontal } from "@/components/admin/icons";
import { Button, Sheet, REVIEW_STATE_UI, type ReviewStateKey } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { formatoById } from "@/lib/formatos/catalog";
import { requirementPhase, reviewComplete, SALE_PROCESS, stageLabel, WORKFLOW_REQUIREMENTS, WORKFLOW_STAGES, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { allowsNotApplicable, encodeProblem, hasValidity, problemOf, requirementDetail, reviewState } from "@/lib/admin/operation-view";
import { requirementName, shortDate } from "@/lib/admin/today";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

/*
  Requisitos de la etapa con su estado: Pendiente · Lo tengo · Revisado · Hay un problema · No aplica
  (pendiente, recibido, revisado, observado y no_aplica). «No aplica» solo donde WORKFLOW_REQUIREMENTS lo admite.
  Al marcar «Revisado» se pide siempre el respaldo, quién lo revisó, la fecha y qué se encontró.
*/

type Review = NonNullable<OperationWorkflow["requisitos"][RequirementKey]>;
export type Evidence = { documents: Array<{ id: string; formato_id: string; version: number; updated_at?: string }>; interview?: { id: string; version: number } | null; reviewer: string };
type Change = (key: RequirementKey, review: Review | undefined) => Promise<void>;

const STATES: ReviewStateKey[] = ["pendiente", "recibido", "revisado", "observado", "no_aplica"];

export type SheetKind = "revisado" | "observado" | "no_aplica";
export type OpenSheet = { key: RequirementKey; kind: SheetKind } | null;

/** «Lo tengo» y «Pendiente» se guardan al momento y conservan lo escrito; un problema resuelto deja constancia en el soporte. */
export function quickReview(flow: OperationWorkflow, key: RequirementKey, state: "pendiente" | "recibido", today: string): Review {
  const current = flow.requisitos[key];
  const soporte = current?.estado === "observado" ? `Resuelto el ${shortDate(today)}: ${problemOf(current).title}` : current?.soporte ?? "";
  return { estado: state, soporte, ...(current?.vigenteHasta ? { vigenteHasta: current.vigenteHasta } : {}) };
}

/**
  Un requisito en «Para terminar la etapa»: su estado en palabras, «Marcar revisado» como acción
  normal y, en «Más», los demás estados. Un problema marcado muestra qué pasó y cómo resolverlo.
*/
export function RequirementRow({ requirement, earlier, flow, today, locked, busy, onQuick, onSheet }: {
  requirement: RequirementKey; earlier: boolean; flow: OperationWorkflow; today: string; locked: boolean; busy: boolean;
  onQuick: (key: RequirementKey, state: "pendiente" | "recibido") => void; onSheet: (sheet: NonNullable<OpenSheet>) => void;
}) {
  const [more, setMore] = React.useState(false);
  const state = reviewState(flow, requirement), review = flow.requisitos[requirement];
  const done = reviewComplete(flow, requirement, today);
  const expired = state === "revisado" && !done;
  const problem = state === "observado" ? problemOf(review) : null;
  const name = requirementName(requirement);
  const detail = expired ? (review?.vigenteHasta && review.vigenteHasta < today ? `Venció el ${shortDate(review.vigenteHasta)}. Vuelve a revisarlo.` : "Le falta su respaldo. Vuelve a marcarlo como revisado.")
    : problem ? problem.title : state === "recibido" ? "Ya tienes el documento · falta revisarlo" : requirementDetail(flow, requirement) || (state === "pendiente" ? "Pendiente" : "");
  const options = STATES.filter(st => st !== "no_aplica" || allowsNotApplicable(requirement) || state === "no_aplica");
  const disabled = busy || locked;
  function choose(st: ReviewStateKey) {
    setMore(false);
    if (st === "revisado" || st === "observado" || st === "no_aplica") onSheet({ key: requirement, kind: st });
    else onQuick(requirement, st);
  }
  const originKey = requirementPhase(requirement), origin = originKey ? SALE_PROCESS.find(p => p.key === originKey)?.label : undefined;
  return <li id={`req-${requirement}`} tabIndex={-1} className={s.item}>
    <div className={s.itemMain}>
      <StateIcon state={expired ? "observado" : state} done={done} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-2"><span className="font-semibold">{name}</span>{earlier && <span className={s.tag}>{origin ? `De la etapa ${origin}` : "Pendiente de antes"}</span>}</p>
        {detail && <p className={cn("text-sm [overflow-wrap:anywhere]", problem || expired ? "font-semibold text-[var(--warning)]" : "text-muted-foreground")}>{detail}</p>}
      </div>
      <div className={s.itemActions}>
        {problem ? <>
          <Button variant="ghost" disabled={disabled} onClick={() => onSheet({ key: requirement, kind: "observado" })}>Escribir qué pasó</Button>
          <Button disabled={disabled} onClick={() => onQuick(requirement, "recibido")}>Ya se resolvió</Button>
        </> : !done && <Button disabled={disabled} onClick={() => onSheet({ key: requirement, kind: "revisado" })}>Confirmar</Button>}
        <Button variant="ghost" iconOnly aria-label={`Más estados de ${name}`} aria-expanded={more} disabled={disabled} onClick={() => setMore(open => !open)}><MoreHorizontal size={18} aria-hidden="true" /></Button>
      </div>
    </div>
    {problem?.body && <p className={cn(s.itemExtra, "whitespace-pre-line text-sm")}>{problem.body}{review?.registradoEl ? ` · Desde el ${shortDate(review.registradoEl)}` : ""}</p>}
    {more && <div role="radiogroup" aria-label={`Estado de ${name}`} className={cn(s.states, s.itemExtra)}>
      {options.map(st => { const { icon: Icon, label } = REVIEW_STATE_UI[st]; return <button key={st} type="button" role="radio" aria-checked={st === state} disabled={disabled} className={cn(s.state, s[`st_${st}`])} onClick={() => choose(st)}><Icon size={15} aria-hidden="true" />{label.replace(" ✓", "")}</button>; })}
    </div>}
  </li>;
}

/** Círculo vacío, medio lleno, palomita o alerta: el estado se distingue por forma, no solo por color. */
export function StateIcon({ state, done }: { state: ReviewStateKey | "borrador"; done: boolean }) {
  if (done) return <CheckCircle2 size={20} aria-label="Listo" className={s.iconDone} />;
  if (state === "observado") return <AlertCircle size={20} aria-label="Hay un problema" className={s.iconWarn} />;
  if (state === "recibido" || state === "borrador") return <CircleDashed size={20} aria-label="En proceso" className={s.iconDone} />;
  if (state === "no_aplica") return <MinusCircle size={20} aria-label="No aplica" className={s.iconIdle} />;
  return <Circle size={20} aria-label="Pendiente" className={s.iconIdle} />;
}

/** El documento de la operación que respalda un punto: el de su formato (cualquier 04 para el levantamiento). */
function ownDocument(requirement: RequirementKey, documents: Evidence["documents"]) {
  const formato = String(WORKFLOW_REQUIREMENTS[requirement].formato);
  return documents.find(d => d.formato_id === formato || (/^04[A-G]$/.test(formato) && /^04[A-G]$/.test(d.formato_id)));
}

/** Los paneles «Confirmar», «Hay un problema» y «No aplica». */
export function RequirementSheets({ sheet, flow, today, evidence, onClose, onChange, onAddDocument }: {
  sheet: OpenSheet; flow: OperationWorkflow; today: string; evidence: Evidence; onClose: () => void; onChange: Change; onAddDocument: () => void;
}) {
  if (!sheet) return null;
  const save = (review: Review) => onChange(sheet.key, review).then(onClose);
  if (sheet.kind === "revisado") return <ReviewSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} today={today} evidence={evidence} onClose={onClose} onAddDocument={() => { onClose(); onAddDocument(); }} onSave={save} />;
  if (sheet.kind === "observado") return <ProblemSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} route={flow.ruta} onClose={onClose} onSave={save} />;
  return <NotApplicableSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} onClose={onClose} onSave={save} />;
}

function useSheetSave(onSave: (review: Review) => Promise<void>) {
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  async function run(review: Review | string) {
    if (typeof review === "string") { setError(review); return; }
    setBusy(true); setError("");
    try { await onSave(review); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setBusy(false); }
  }
  return { busy, error, run };
}

/** «Marcar como revisado»: con qué se comprobó, quién y cuándo lo revisó, la vigencia y qué se encontró. */
export function ReviewSheet({ requirement, review, today, evidence, onClose, onSave, onAddDocument }: { requirement: RequirementKey; review?: Review; today: string; evidence: Evidence; onClose: () => void; onSave: (review: Review) => Promise<void>; onAddDocument: () => void }) {
  const advisers = useCollection(db.asesores);
  const previous = review?.evidencia;
  // Ya viene elegido el documento que respalda este punto (el 02 para la entrevista, el 04 para el levantamiento…).
  const own = ownDocument(requirement, evidence.documents);
  const [source, setSource] = React.useState<string>(() => previous?.tipo === "externa" ? "externa" : previous?.tipo === "entrevista" ? "entrevista" : previous && ["documento", "emision", "adjunto"].includes(previous.tipo) ? `doc:${evidence.documents.find(d => d.id === previous.referencia)?.id ?? ""}` : own ? `doc:${own.id}` : evidence.documents[0] ? `doc:${evidence.documents[0].id}` : "externa");
  const [who, setWho] = React.useState(previous?.responsable ?? evidence.reviewer);
  const [date, setDate] = React.useState(previous?.fecha ?? today);
  const [until, setUntil] = React.useState(review?.vigenteHasta ?? "");
  const [found, setFound] = React.useState(previous?.resultado ?? (review?.estado === "revisado" ? review.soporte : ""));
  const [where, setWhere] = React.useState(previous?.tipo === "externa" ? previous.referencia : "");
  const [limits, setLimits] = React.useState(previous?.limites ?? "");
  const [kept, setKept] = React.useState<string>(previous && ["emision", "adjunto"].includes(previous.tipo) ? `${previous.tipo}:${previous.referencia}` : "");
  const [sources, setSources] = React.useState<{ emisiones: Array<{ id: string; draft_version: number }>; adjuntos: Array<{ id: string; caption: string }> } | null>(null);
  const documentId = source.startsWith("doc:") ? source.slice(4) : "";
  const document = evidence.documents.find(d => d.id === documentId);
  React.useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSources(null);
    if (!documentId) return;
    Promise.all([apiRequest<{ emisiones?: Array<{ id: string; draft_version: number }> }>(`/api/admin/formatos/${documentId}`), apiRequest<{ adjuntos?: Array<{ id: string; caption: string }> }>(`/api/admin/formatos/${documentId}/adjuntos`)])
      .then(([doc, assets]) => { if (alive) setSources({ emisiones: doc.emisiones ?? [], adjuntos: assets.adjuntos ?? [] }); }).catch(() => { if (alive) setSources({ emisiones: [], adjuntos: [] }); });
    return () => { alive = false; };
  }, [documentId]);
  const { busy, error, run } = useSheetSave(onSave);
  function build(): Review | string {
    if (found.trim().length < 3) return "Escribe qué encontraste.";
    if (who.trim().length < 3) return "Escribe quién lo revisó.";
    if (!date) return "Indica la fecha de revisión.";
    if (hasValidity(requirement) && !until) return "Indica hasta cuándo está vigente.";
    if (hasValidity(requirement) && until < today) return "La vigencia ya pasó. Revisa un documento actualizado.";
    let evidencia: NonNullable<Review["evidencia"]>;
    const common = { fecha: date, responsable: who.trim(), resultado: found.trim(), ...(limits.trim() ? { limites: limits.trim() } : {}) };
    if (source === "externa") {
      if (where.trim().length < 10) return "Escribe el folio o dónde está el documento (al menos 10 caracteres).";
      evidencia = { tipo: "externa", referencia: where.trim(), ...common };
    } else if (source === "entrevista" && evidence.interview) {
      evidencia = { tipo: "entrevista", referencia: evidence.interview.id, version: evidence.interview.version, ...common };
    } else if (document) {
      const [kind, ref] = kept.split(":");
      if (kind === "emision") evidencia = { tipo: "emision", referencia: ref, version: sources?.emisiones.find(e => e.id === ref)?.draft_version ?? document.version, ...common };
      else if (kind === "adjunto") evidencia = { tipo: "adjunto", referencia: ref, ...common };
      else evidencia = { tipo: "documento", referencia: document.id, version: document.version, ...common };
    } else return "Elige el documento que lo respalda.";
    const next: Review = { estado: "revisado", soporte: found.trim(), evidencia, ...(hasValidity(requirement) && until ? { vigenteHasta: until } : {}), ...(review?.bloquea ? { bloquea: review.bloquea } : {}) };
    return reviewComplete({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: { [requirement]: next } }, requirement, today) ? next : "Faltan datos del respaldo. Revisa el documento elegido y vuelve a intentar.";
  }
  const name = requirementName(requirement);
  return <Sheet open onClose={onClose} eyebrow="Confirmar" title={name} description="El documento, quién lo revisó y la fecha ya vienen llenos. Escribe qué encontraste y confirma; queda registrado." footer={<>
    <Button onClick={onClose} disabled={busy}>Cancelar</Button>
    <Button variant="primary" disabled={busy} onClick={() => void run(build())}>{busy ? "Guardando…" : "Confirmar"}</Button>
  </>}>
    <div>
      <label className="text-sm font-semibold">Qué encontraste<textarea className={textareaClass} rows={3} maxLength={1000} value={found} aria-describedby="encontraste-ayuda" onChange={e => setFound(e.target.value)} /></label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button disabled={busy} onClick={() => setFound("Todo coincide con lo que dijo el propietario y con el documento.")}>Todo coincide</Button>
        <p id="encontraste-ayuda" className="text-sm text-muted-foreground">O escríbelo como se lo contarías al propietario.</p>
      </div>
    </div>
    <fieldset className="flex flex-col gap-2.5" disabled={busy}>
      <legend className="mb-2 text-sm font-semibold">¿Con qué lo comprobaste?</legend>
      {evidence.documents.map(d => <label key={d.id} className={s.option}><input type="radio" name="respaldo" checked={source === `doc:${d.id}`} onChange={() => setSource(`doc:${d.id}`)} /><span className="flex min-w-0 flex-col"><strong className="[overflow-wrap:anywhere]">{formatoById(d.formato_id).title}</strong><small className={s.mono}>Versión {d.version}{d.updated_at ? ` · Actualizado el ${shortDate(d.updated_at)}` : ""}</small></span></label>)}
      {evidence.interview && <label className={s.option}><input type="radio" name="respaldo" checked={source === "entrevista"} onChange={() => setSource("entrevista")} /><span className="flex flex-col"><strong>Entrevista terminada</strong><small className="text-muted-foreground">Lo que declaró el cliente en la entrevista</small></span></label>}
      <label className={s.option}><input type="radio" name="respaldo" checked={source === "externa"} onChange={() => setSource("externa")} /><span className="flex flex-col"><strong>Documento fuera del sistema</strong><small className="text-muted-foreground">Lo revisaste en papel o en la notaría</small></span></label>
      <button type="button" className={s.linkButton} onClick={onAddDocument}>Agregar un documento a la operación</button>
    </fieldset>
    {source === "externa" && <label className="text-sm font-semibold">Folio o dónde está<input className={inputClass} maxLength={1000} value={where} onChange={e => setWhere(e.target.value)} placeholder="Ej. Escritura 1234, Notaría 5 de Tijuana" /></label>}
    <label className="text-sm font-semibold">Quién lo revisó<input className={inputClass} list="revisores" maxLength={160} value={who} onChange={e => setWho(e.target.value)} /><datalist id="revisores">{advisers.filter(a => a.activo !== false).map(a => <option key={a.id} value={a.nombre} />)}</datalist></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Fecha de revisión<input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} /></label>
      {hasValidity(requirement) && <label className="text-sm font-semibold">Vigente hasta<input type="date" className={inputClass} value={until} onChange={e => setUntil(e.target.value)} /></label>}
    </div>
    {hasValidity(requirement) && <p className="-mt-3 text-sm text-muted-foreground">Una semana antes de que venza aparece en Hoy, en «Próximos 7 días».</p>}
    <details className={s.more}><summary>Más detalles</summary><div className="mt-3 flex flex-col gap-4">
      {document && <label className="text-sm font-semibold">Usar el PDF generado o un archivo de este documento<select className={selectClass} value={kept} onChange={e => setKept(e.target.value)}><option value="">El documento en su versión {document.version}</option>{(sources?.emisiones ?? []).map(e => <option key={e.id} value={`emision:${e.id}`}>PDF generado · versión {e.draft_version}</option>)}{(sources?.adjuntos ?? []).map(a => <option key={a.id} value={`adjunto:${a.id}`}>Archivo · {a.caption}</option>)}</select></label>}
      <label className="text-sm font-semibold">Límites o condiciones<textarea className={textareaClass} rows={2} maxLength={1000} value={limits} onChange={e => setLimits(e.target.value)} /></label>
      <p className="text-sm text-muted-foreground">Formato relacionado: {WORKFLOW_REQUIREMENTS[requirement].formato}. La referencia se valida al guardar; el panel no certifica su contenido ni sustituye una revisión profesional.</p>
    </div></details>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Sheet>;
}

/** «Hay un problema»: título, qué pasó y, si hace falta, qué otras etapas detiene. */
function ProblemSheet({ requirement, review, route, onClose, onSave }: { requirement: RequirementKey; review?: Review; route: OperationWorkflow["ruta"]; onClose: () => void; onSave: (review: Review) => Promise<void> }) {
  const current = review?.estado === "observado" ? problemOf(review) : { title: "", body: "" };
  const [title, setTitle] = React.useState(current.title === "Hay un problema" ? "" : current.title);
  const [body, setBody] = React.useState(current.body);
  const [blocks, setBlocks] = React.useState<WorkflowStage[]>(review?.bloquea ?? []);
  const { busy, error, run } = useSheetSave(onSave);
  function build(): Review | string {
    if (title.trim().length < 3) return "Escribe en pocas palabras cuál es el problema.";
    return { estado: "observado", soporte: encodeProblem(title, body), ...(blocks.length ? { bloquea: blocks } : {}), ...(review?.vigenteHasta ? { vigenteHasta: review.vigenteHasta } : {}) };
  }
  return <Sheet open onClose={onClose} eyebrow="Hay un problema" title={requirementName(requirement)} description="Escribe qué pasó para que el equipo sepa por qué está detenida." footer={<>
    <Button onClick={onClose} disabled={busy}>Cancelar</Button>
    <Button variant="primary" disabled={busy} onClick={() => void run(build())}>{busy ? "Guardando…" : "Guardar"}</Button>
  </>}>
    <label className="text-sm font-semibold">Cuál es el problema<input className={inputClass} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Falta la firma del copropietario" /></label>
    <label className="text-sm font-semibold">Qué pasó y cómo se puede resolver<textarea className={textareaClass} rows={4} maxLength={800} value={body} onChange={e => setBody(e.target.value)} /></label>
    <details className={s.more}><summary>Más detalles</summary><fieldset className="mt-3 flex flex-col gap-1"><legend className="mb-1 text-sm">Además de esta etapa, también detiene:</legend>{WORKFLOW_STAGES.filter(st => st !== "captacion").map(st => <label key={st} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={blocks.includes(st)} onChange={e => setBlocks(old => e.target.checked ? [...old, st] : old.filter(v => v !== st))} />{stageLabel(st, route)}</label>)}</fieldset></details>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Sheet>;
}

function NotApplicableSheet({ requirement, review, onClose, onSave }: { requirement: RequirementKey; review?: Review; onClose: () => void; onSave: (review: Review) => Promise<void> }) {
  const [why, setWhy] = React.useState(review?.estado === "no_aplica" ? review.soporte : "");
  const { busy, error, run } = useSheetSave(onSave);
  return <Sheet open onClose={onClose} eyebrow="No aplica" title={requirementName(requirement)} description="Explica por qué esta operación no lo necesita." footer={<>
    <Button onClick={onClose} disabled={busy}>Cancelar</Button>
    <Button variant="primary" disabled={busy} onClick={() => void run(why.trim().length < 3 ? "Escribe por qué no aplica." : { estado: "no_aplica", soporte: why.trim() })}>{busy ? "Guardando…" : "Guardar"}</Button>
  </>}>
    <label className="text-sm font-semibold">Por qué no aplica<textarea className={textareaClass} rows={3} maxLength={1000} value={why} onChange={e => setWhy(e.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Sheet>;
}
