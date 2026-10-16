"use client";
import * as React from "react";
import { Button, Notice, Sheet, REVIEW_STATE_UI, type ReviewStateKey } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { formatoById } from "@/lib/formatos/catalog";
import { reviewComplete, stageLabel, WORKFLOW_REQUIREMENTS, WORKFLOW_STAGES, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { allowsNotApplicable, encodeProblem, hasValidity, problemOf, requirementDetail, reviewState } from "@/lib/admin/operation-view";
import { requirementName, shortDate } from "@/lib/admin/today";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

/*
  Requisitos de la etapa con su estado: Pendiente · Lo tengo · Revisado · Hay un problema · No aplica
  (pendiente, recibido, revisado, observado y no_aplica). «No aplica» solo donde WORKFLOW_REQUIREMENTS lo admite.
*/

type Review = NonNullable<OperationWorkflow["requisitos"][RequirementKey]>;
export type Evidence = { documents: Array<{ id: string; formato_id: string; version: number; updated_at?: string }>; interview?: { id: string; version: number } | null; reviewer: string };
type Change = (key: RequirementKey, review: Review | undefined) => Promise<void>;

const STATES: ReviewStateKey[] = ["pendiente", "recibido", "revisado", "observado", "no_aplica"];

export function RequirementList({ flow, items, today, locked, busy, evidence, onChange, onAddDocument }: {
  flow: OperationWorkflow; items: Array<{ key: RequirementKey; earlier: boolean }>; today: string; locked: boolean; busy: boolean;
  evidence: Evidence; onChange: Change; onAddDocument: () => void;
}) {
  const [sheet, setSheet] = React.useState<{ key: RequirementKey; kind: "revisado" | "observado" | "no_aplica" } | null>(null);
  const reviewed = items.filter(i => !i.earlier && reviewComplete(flow, i.key, today)).length, total = items.filter(i => !i.earlier).length;
  async function choose(key: RequirementKey, state: ReviewStateKey) {
    if (state === "revisado" || state === "observado" || state === "no_aplica") { setSheet({ key, kind: state }); return; }
    const current = flow.requisitos[key];
    // «Lo tengo» y «Pendiente» conservan lo escrito; un problema resuelto deja constancia en el soporte.
    const soporte = current?.estado === "observado" ? `Resuelto el ${shortDate(today)}: ${problemOf(current).title}` : current?.soporte ?? "";
    // El error ya se muestra en la tarjeta; aquí solo se evita una promesa sin atender.
    await onChange(key, { estado: state, soporte, ...(current?.vigenteHasta ? { vigenteHasta: current.vigenteHasta } : {}) }).catch(() => undefined);
  }
  return <div className="flex flex-col gap-1">
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
      <h3 className="m-0 text-base font-bold">Requisitos de esta etapa</h3>
      {total > 0 && <span className={s.mono}>{reviewed} de {total} revisados</span>}
    </div>
    {locked && <Notice tone="info" className="mt-3">Primero termina «Verificación y precio» y registra si tomas el encargo. Después se capturan el contrato y la preparación.</Notice>}
    {items.length === 0 && <p className="py-4 text-sm text-muted-foreground">Esta etapa no pide requisitos nuevos. Revisa «Te falta» abajo para pasar a la siguiente.</p>}
    <ul className="flex flex-col">{items.map(({ key, earlier }) => {
      const state = reviewState(flow, key), review = flow.requisitos[key];
      const options = STATES.filter(st => st !== "no_aplica" || allowsNotApplicable(key) || state === "no_aplica");
      const detail = requirementDetail(flow, key);
      const problem = state === "observado" ? problemOf(review) : null;
      const expired = state === "revisado" && !reviewComplete(flow, key, today);
      return <li key={key} id={`req-${key}`} className={s.requirement} tabIndex={-1}>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2"><strong className="text-base">{requirementName(key)}</strong>{earlier && <span className={s.tag}>De una etapa anterior</span>}</p>
          {detail && <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{detail}</p>}
          {expired && <p className="text-sm font-semibold text-[var(--primary-text)]">{review?.vigenteHasta && review.vigenteHasta < today ? `Venció el ${shortDate(review.vigenteHasta)}. Vuelve a revisarlo.` : "Le falta su respaldo. Vuelve a marcarlo como revisado."}</p>}
        </div>
        <div role="radiogroup" aria-label={`Estado de ${requirementName(key)}`} className={s.states}>
          {options.map(st => { const { icon: Icon, label } = REVIEW_STATE_UI[st]; return <button key={st} type="button" role="radio" aria-checked={st === state} disabled={busy || locked} className={cn(s.state, s[`st_${st}`])} onClick={() => void choose(key, st)}><Icon size={15} aria-hidden="true" />{label.replace(" ✓", "")}</button>; })}
        </div>
        {problem && <Notice title={problem.title} className="mt-1" actions={<>
          <Button disabled={busy || locked} onClick={() => setSheet({ key, kind: "observado" })}>Escribir qué pasó</Button>
          <Button variant="ghost" disabled={busy || locked} onClick={() => void choose(key, "recibido")}>Ya se resolvió</Button>
        </>}>
          {problem.body && <p className="whitespace-pre-line">{problem.body}</p>}
          <p className={cn(s.mono, "mt-1")}>{review?.registradoEl ? `Desde el ${shortDate(review.registradoEl)}` : "Marcado sin fecha"}</p>
        </Notice>}
        {state === "pendiente" && !earlier && <p className={cn(s.hint)}>Al marcar «Revisado» te pedimos el documento que lo respalda.</p>}
      </li>;
    })}</ul>
    {sheet?.kind === "revisado" && <ReviewSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} today={today} evidence={evidence} onClose={() => setSheet(null)} onAddDocument={() => { setSheet(null); onAddDocument(); }} onSave={review => onChange(sheet.key, review).then(() => setSheet(null))} />}
    {sheet?.kind === "observado" && <ProblemSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} route={flow.ruta} onClose={() => setSheet(null)} onSave={review => onChange(sheet.key, review).then(() => setSheet(null))} />}
    {sheet?.kind === "no_aplica" && <NotApplicableSheet requirement={sheet.key} review={flow.requisitos[sheet.key]} onClose={() => setSheet(null)} onSave={review => onChange(sheet.key, review).then(() => setSheet(null))} />}
  </div>;
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
  const [source, setSource] = React.useState<string>(() => previous?.tipo === "externa" ? "externa" : previous?.tipo === "entrevista" ? "entrevista" : previous && ["documento", "emision", "adjunto"].includes(previous.tipo) ? `doc:${evidence.documents.find(d => d.id === previous.referencia)?.id ?? ""}` : evidence.documents[0] ? `doc:${evidence.documents[0].id}` : "externa");
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
  return <Sheet open onClose={onClose} eyebrow="Marcar como revisado" title={name} description="Dinos con qué lo comprobaste. Así cualquiera del equipo puede verlo después." footer={<>
    <Button onClick={onClose} disabled={busy}>Cancelar</Button>
    <Button variant="primary" disabled={busy} onClick={() => void run(build())}>{busy ? "Guardando…" : "Guardar como revisado"}</Button>
  </>}>
    <fieldset className="flex flex-col gap-2.5" disabled={busy}>
      <legend className="mb-2 text-sm font-semibold">Documento que lo respalda</legend>
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
    <div><label className="text-sm font-semibold">Qué encontraste<textarea className={textareaClass} rows={3} maxLength={1000} value={found} aria-describedby="encontraste-ayuda" onChange={e => setFound(e.target.value)} /></label><p id="encontraste-ayuda" className="mt-1 text-sm text-muted-foreground">Escríbelo como se lo contarías al propietario.</p></div>
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
