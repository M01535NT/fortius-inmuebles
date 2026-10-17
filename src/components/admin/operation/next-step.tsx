"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Clock, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { Button, ButtonLink, Card, Eyebrow } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";
import { apiRequest, db, errorMessage, upsert, uid, useCollection } from "@/lib/admin/store";
import { isOwnerRoute, ownerReportApplies, ownerReportStatus, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { answerLabel, type OperationalInterview } from "@/lib/intake/interview";
import { isTaskOpen } from "@/lib/tasks";
import { advanceTarget, contractLocked, currentRequirements, flowOf, isGuided, missingItems, routeStages, stageGuide, stageOf, stageTools, type OperationRecord } from "@/lib/admin/operation-view";
import { shortDate, weekdayDate } from "@/lib/admin/today";
import { RequirementList, type Evidence } from "./requirements";
import { InitialInterviewCard, type IntakePhase } from "./initial-interview";
import type { Task } from "@/lib/tasks";
import type { Documento } from "./documents-tab";
import type { Emision } from "./formato-capture";
import { saveError } from "./use-operation";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage }) => Promise<unknown>;
/** Documentos de la entrevista inicial: los formatos de la operación y los PDF de la entrevista (02). */
export type InitialDocs = { documents: Documento[]; emissions: { entrevista: Emision[]; levantamiento: Emision[] }; checklist?: Task; onDocumentsChange: (update: (items: Documento[]) => Documento[]) => void; onEmitted: (kind: "entrevista" | "levantamiento", emision: Emision) => void; onOpenDocument: (id: string) => void };
type Run = { id: string; title: string; updatedAt: string; result?: unknown; context?: { expedienteId?: string } };

/** «Lo que sigue»: la etapa, sus requisitos, la próxima tarea y lo que falta para pasar a la siguiente. */
export function NextStepTab({ op, today, evidence, interview, initial, cliente, onSave, onSavedLegacy, onGoTo, onDirtyChange }: {
  op: OperationRecord; today: string; evidence: Evidence; interview: OperationalInterview | null; initial: InitialDocs; cliente?: string; onSave: Save;
  onSavedLegacy: (value: OperationRecord) => void; onGoTo: (tab: "documentos" | "ajustes" | "tareas") => void; onDirtyChange: (dirty: boolean) => void;
}) {
  const tasks = useCollection(db.tareas);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const flow = flowOf(op), stage = stageOf(op), owner = isOwnerRoute(flow.ruta);
  const { labels, current, phase } = routeStages(op, today);
  const guide = stageGuide(op, today);
  React.useEffect(() => { onDirtyChange(busy); }, [busy, onDirtyChange]);
  if (!isGuided(op)) return <div className="flex flex-col gap-5">
    <ExpedienteOperationPanel expediente={op} responsable="" view="summary" onDirtyChange={onDirtyChange} onSaved={value => onSavedLegacy(value as OperationRecord)} />
    <NextTask op={op} today={today} />
  </div>;

  async function changeRequirement(key: RequirementKey, review: OperationWorkflow["requisitos"][RequirementKey]) {
    setBusy(true); setError(""); setNotice("");
    try {
      const requisitos = { ...flow.requisitos };
      if (review) requisitos[key] = review; else delete requisitos[key];
      const saved = await onSave({ flujo: { ...flow, requisitos } }) as OperationRecord;
      // «Contrato y preparación» se abre sola al terminar la verificación: se avisa para que no pase inadvertido.
      setNotice(phase === "verificacion" && routeStages(saved, today).phase === "contrato" ? "Verificación terminada. Ya puedes trabajar el contrato y la preparación." : "Guardado");
    } catch (cause) { const message = saveError(cause); setError(`No se pudo guardar: ${message}`); throw new Error(message); }
    finally { setBusy(false); }
  }
  const target = advanceTarget(op, today);
  const missing = missingItems(op, tasks, today);
  async function advance() {
    if (!target?.target || missing.length) return;
    setBusy(true); setError(""); setNotice("");
    try { await onSave({ etapa: target.target }); setNotice(`Listo: la operación pasó a «${target.label}».`); window.scrollTo({ top: 0, behavior: "instant" }); }
    catch (cause) { setError(`No se pudo avanzar: ${saveError(cause)}`); } finally { setBusy(false); }
  }
  function goToMissing(item: (typeof missing)[number]) {
    if (item.place === "ajustes") onGoTo("ajustes");
    else if (item.place === "tarea") document.getElementById("proxima-tarea")?.scrollIntoView({ block: "center" });
    else if (item.requirement) { const el = document.getElementById(`req-${item.requirement}`); el?.scrollIntoView({ block: "center" }); el?.focus({ preventScroll: true }); }
  }
  const items = currentRequirements(op, today);
  const intake = !!phase && ["prospecto", "captacion", "levantamiento", "documentos"].includes(phase);
  return <div className={s.layout}>
    <div className="flex min-w-0 flex-col gap-5">
      <Card className="flex flex-col gap-5 p-5 sm:p-7" aria-label="Lo que sigue">
        <div className="flex flex-col gap-2">
          <Eyebrow>Lo que sigue · Etapa {current + 1} de {labels.length}</Eyebrow>
          <h2 className="m-0 text-2xl">{guide.title}</h2>
          {flow.estado !== "activa" && <p className="font-semibold text-[var(--warning)]">Operación {flow.estado === "pausada" ? "en pausa" : flow.estado === "regularizacion" ? "en regularización" : "descartada"}{flow.motivo ? `: ${flow.motivo}` : ""}</p>}
          {guide.que && <dl className={s.guide}><dt>Qué hacemos</dt><dd>{guide.que}</dd><dt>Para qué</dt><dd>{guide.para}</dd></dl>}
        </div>
        {owner && intake && <InitialInterviewCard op={op} phase={phase as IntakePhase} cliente={cliente} interview={interview} disabled={busy} {...initial} />}
        {phase === "prospecto" && <InterviewAccess key={op.id} expedienteId={op.id} clienteId={op.cliente_id} intencion={flow.ruta === "arrendador" ? "arrendar" : "vender"} disabled={busy} />}
        {!(intake && phase !== "captacion" && items.length === 0) && <RequirementList flow={flow} items={items} today={today} locked={contractLocked(op, today) && items.some(i => !i.earlier && ["intermediacion", "levantamiento", "plan", "publicacion"].includes(i.key))} busy={busy} evidence={evidence} onChange={changeRequirement} onAddDocument={() => onGoTo("documentos")} />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      </Card>
      {owner && interview && (phase === "captacion" || phase === "verificacion" || phase === "contrato") && <Declared op={op} interview={interview} />}
      {owner && ownerReportApplies(stage, op.flujo ?? flow) && <OwnerReport op={op} today={today} />}
      {owner && (phase === "publicacion" || phase === "visitas") && <VisitsAndOffers op={op} today={today} documents={evidence.documents} />}
      <NextTask op={op} today={today} />
      {target && <div className={s.advance} aria-live="polite">
        <div className="min-w-0 text-sm">{missing.length ? <><strong>Te falta: </strong>{(showAll ? missing : missing.slice(0, 2)).map((item, i) => <React.Fragment key={i}>{i > 0 && " · "}<button type="button" className={s.missingLink} onClick={() => goToMissing(item)}>{item.text}</button>{item.why && <span className="text-muted-foreground"> ({item.why})</span>}</React.Fragment>)}{!showAll && missing.length > 2 && <> · <button type="button" className={s.missingLink} onClick={() => setShowAll(true)}>y {missing.length - 2} más</button></>}</> : <strong>Todo listo para pasar a la siguiente etapa.</strong>}</div>
        {target.target ? <Button variant="primary" className="shrink-0" disabled={busy || missing.length > 0} onClick={() => void advance()}>Pasar a: {target.label}<ArrowRight size={16} aria-hidden="true" /></Button>
          : <p className="shrink-0 text-sm text-muted-foreground md:max-w-[16rem]">Al completarlo se abre «{target.label}» sola.</p>}
      </div>}
    </div>
    <Side op={op} today={today} interview={interview} />
  </div>;
}

/** Próxima tarea con fecha; se cambia la fecha o se agenda una nueva sin salir de la operación. */
function NextTask({ op, today }: { op: OperationRecord; today: string }) {
  const tasks = useCollection(db.tareas);
  const next = tasks.filter(t => t.expedienteId === op.id && isTaskOpen(t)).sort((a, b) => (a.vence || "9999").localeCompare(b.vence || "9999"))[0];
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(""), [date, setDate] = React.useState(next?.vence ?? "");
  const [busy, setBusy] = React.useState(false), [message, setMessage] = React.useState("");
  async function changeDate() {
    if (!next || !date) return;
    setBusy(true); setMessage("");
    try { await upsert(db.tareas, { ...next, vence: date }, db.tareas.version(next)); setEditing(false); setMessage("Guardado"); }
    catch (cause) { setMessage(`No se pudo guardar: ${errorMessage(cause)}`); } finally { setBusy(false); }
  }
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (!title.trim() || !date) return;
    setBusy(true); setMessage("");
    try {
      await upsert(db.tareas, { id: uid(), titulo: title.trim(), descripcion: "Próxima acción de la operación", categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [], asesorId: op.asesor_id, expedienteId: op.id, clienteId: op.cliente_id, propiedadSlug: op.propiedad_slug ?? "", vence: date }, null);
      setTitle(""); setDate(""); setMessage("Guardado");
    } catch (cause) { setMessage(`No se pudo guardar: ${errorMessage(cause)}`); } finally { setBusy(false); }
  }
  const late = !!next?.vence && next.vence < today;
  return <Card id="proxima-tarea" className={cn(s.nextTask, "p-5")} aria-label="Próxima tarea">
    <Clock size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Eyebrow>Próxima tarea</Eyebrow>
      {next ? <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(next.id)}`} className="font-semibold text-foreground [overflow-wrap:anywhere]">{next.titulo}</Link><span className={cn(s.mono, late && s.lateText)}>{next.vence ? `${late ? "Vencida · " : ""}${weekdayDate(next.vence)} ${shortDate(next.vence).split(" ")[1]}` : "Sin fecha"}</span></span>
          {!editing && <button type="button" className={s.linkButton} onClick={() => { setDate(next.vence ?? ""); setEditing(true); }}>Cambiar fecha</button>}
        </div>
        {editing && <div className="flex flex-wrap items-end gap-2"><label className="text-sm">Nueva fecha<input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} /></label><Button variant="primary" disabled={busy || !date} onClick={() => void changeDate()}>Guardar fecha</Button><Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancelar</Button></div>}
      </> : <form onSubmit={create} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{stageOf(op) === "cerrado" ? "Operación archivada: no necesita próxima tarea." : "Esta operación no tiene una próxima tarea con fecha. Agenda el siguiente paso para no perderlo de vista."}</p>
        {stageOf(op) !== "cerrado" && <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="text-sm">Qué sigue<input className={inputClass} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="text-sm">Fecha<input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} /></label>
          <Button type="submit" variant="primary" disabled={busy || !title.trim() || !date}>Agendar</Button>
        </div>}
      </form>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  </Card>;
}

/** Columna lateral: herramientas de la etapa, propietario y «¿Qué significa?». */
function Side({ op, today, interview }: { op: OperationRecord; today: string; interview: OperationalInterview | null }) {
  const clients = useCollection(db.clientes);
  const client = clients.find(c => c.id === op.cliente_id);
  const flow = flowOf(op);
  const tools = stageTools(op, today);
  const digits = (client?.telefono ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  const wants = [interview?.respuestas?.objetivo, interview?.respuestas?.plazo && `Plazo: ${answerLabel(interview.respuestas.plazo)}`].filter(Boolean).join(" · ");
  const role = isOwnerRoute(flow.ruta) ? "Propietario" : flow.ruta === "inversion" ? "Inversionista" : flow.ruta === "arrendatario" ? "Arrendatario" : "Comprador";
  return <aside className="flex min-w-0 flex-col gap-5" aria-label="Apoyo de la etapa">
    {tools.length > 0 && <Card className="p-5"><Eyebrow as="h2">Herramientas de esta etapa</Eyebrow><ul className="mt-2 flex flex-col">{tools.map(tool => <li key={tool.slug}><Link href={tool.href} className={s.toolLink}><FileText size={18} aria-hidden="true" /><span className="flex-1">{tool.label}</span><ChevronRight size={18} aria-hidden="true" /></Link></li>)}</ul></Card>}
    {client && <Card className="flex flex-col gap-3 p-5"><Eyebrow as="h2">{role}</Eyebrow>
      <Link href={`/admin/clientes/${encodeURIComponent(client.id)}`} className="text-lg font-bold text-foreground">{client.nombre}</Link>
      <dl className={s.facts}>
        {client.telefono && <><dt>Teléfono</dt><dd>{digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : client.telefono}</dd></>}
        {client.email && <><dt>Correo</dt><dd className="[overflow-wrap:anywhere]">{client.email}</dd></>}
        {wants && <><dt>Lo que quiere</dt><dd>{wants}</dd></>}
      </dl>
      {digits && <div className="flex flex-wrap gap-2"><ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden="true" />Llamar</ButtonLink><ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink></div>}
      {!digits && client.email && <ButtonLink href={`mailto:${client.email}`}><Mail size={16} aria-hidden="true" />Escribir correo</ButtonLink>}
    </Card>}
    <Card className="p-5"><details className={s.meaning}><summary>¿Qué significa?</summary><ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
      <li><strong className="text-foreground">Lo tengo</strong> quiere decir que ya llegó el documento; todavía no se revisa. <strong className="text-foreground">Revisado</strong> exige decir con qué se comprobó, quién y cuándo.</li>
      <li>El panel guarda el registro de cada revisión, pero no emite dictámenes ni sustituye la revisión de un profesional.</li>
      <li>Lo que el propietario espera, la opinión de valor y el precio de salida son datos distintos: cada uno se registra por separado.</li>
      <li>Una oferta comparada en la herramienta no es una oferta aceptada; la aceptación se registra en sus requisitos.</li>
      <li>El resultado de una herramienta debe revisarse antes de usarlo como respaldo.</li>
    </ul></details></Card>
  </aside>;
}

/** Lo que dijo el propietario en la entrevista frente a lo que dice la ficha del inmueble. */
function Declared({ op, interview }: { op: OperationRecord; interview: OperationalInterview }) {
  const properties = useCollection(db.propiedades);
  const property = properties.find(p => p.slug === op.propiedad_slug);
  return <Card className="p-5"><details><summary className="cursor-pointer font-semibold">Lo que dijo el propietario y lo que dice la ficha</summary>
    <dl className={cn(s.facts, "mt-3")}>
      <dt>Ubicación que dio</dt><dd>{interview.respuestas.ubicacion || "No la dio"}</dd>
      <dt>Ubicación en la ficha</dt><dd>{property?.direccionAproximada || "Sin inmueble vinculado"}</dd>
      <dt>Precio que espera</dt><dd>{interview.respuestas.presupuestoEstado === "conocido" ? `${interview.respuestas.importe} ${interview.respuestas.moneda}` : "Por definir"}</dd>
      <dt>Precio en la ficha</dt><dd>{property?.precio.modalidad === "publico" ? `${property.precio.monto} ${property.precio.moneda}` : "A consultar"}</dd>
    </dl>
    <p className="mt-3 text-sm text-muted-foreground">Si no coinciden, corrige la ficha y registra el acuerdo. Corregir no cambia los documentos ya generados.</p>
    {op.propiedad_slug && <Link className="mt-2 inline-block text-sm font-semibold underline underline-offset-4" href={`/admin/propiedades/${encodeURIComponent(op.propiedad_slug)}/editar`}>Revisar la ficha del inmueble</Link>}
  </details></Card>;
}

function useRuns(slug: string, ids: string[]) {
  const [runs, setRuns] = React.useState<Run[] | null | undefined>(undefined);
  const key = ids.join(",");
  React.useEffect(() => {
    let alive = true;
    Promise.all(key.split(",").map(id => apiRequest<{ runs?: Run[] }>(`/api/admin/apps/runs?slug=${slug}&expedienteId=${encodeURIComponent(id)}`)))
      .then(pages => { if (alive) setRuns(pages.flatMap(p => p.runs ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); })
      .catch(() => { if (alive) setRuns(null); });
    return () => { alive = false; };
  }, [slug, key]);
  return runs;
}

/** Informe mensual al propietario mientras el inmueble se promueve o negocia. */
function OwnerReport({ op, today }: { op: OperationRecord; today: string }) {
  const runs = useRuns("informe-propietario", [op.id]);
  const prepared = runs?.filter(run => run.result != null);
  const status = prepared ? ownerReportStatus(prepared[0]?.updatedAt, today) : undefined;
  return <Card className="flex flex-col gap-2 p-5" aria-label="Informe al propietario">
    <h2 className="m-0 flex items-center gap-2 text-base"><FileText size={18} aria-hidden="true" />Informe mensual al propietario</h2>
    <p className={cn("text-sm", status?.estado !== "al_dia" && prepared && s.lateText)}>{runs === undefined ? "Consultando informes…" : runs === null ? "No se pudieron consultar los informes. Recarga la página para reintentar." : !prepared?.length ? "Todavía no hay un informe preparado para esta operación." : status?.estado === "vencido" ? `Vencido desde el ${shortDate(status.proximo!)}. El último se preparó el ${shortDate(prepared[0].updatedAt)}.` : `Al día. El último se preparó el ${shortDate(prepared[0].updatedAt)}; el siguiente toca el ${shortDate(status?.proximo ?? today)}.`}</p>
    <p className="text-sm text-muted-foreground">Cada mes le contamos al propietario las consultas, visitas, ofertas y lo que sigue. Cuenta la fecha del último informe preparado en la herramienta.</p>
    <ButtonLink className="self-start" href={`/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(op.id)}`}>Preparar informe del mes</ButtonLink>
  </Card>;
}

/** Visitas de la agenda y ofertas comparadas del inmueble. */
function VisitsAndOffers({ op, today, documents }: { op: OperationRecord; today: string; documents: Evidence["documents"] }) {
  const events = useCollection(db.eventos);
  const counterpart = op.flujo?.contraparteId;
  const offers = useRuns("ofertas", counterpart ? [op.id, counterpart] : [op.id]);
  const visits = events.filter(e => e.tipo === "visita" && (e.expedienteId === op.id || !!op.propiedad_slug && e.propiedadSlug === op.propiedad_slug)).sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const upcoming = visits.filter(e => e.fecha >= today), past = visits.filter(e => e.fecha < today);
  const offerDocs = documents.filter(d => d.formato_id === "14").length;
  return <Card className="flex flex-col gap-4 p-5" aria-label="Visitas y ofertas del inmueble">
    <h2 className="m-0 flex items-center gap-2 text-base"><CalendarDays size={18} aria-hidden="true" />Visitas y ofertas del inmueble</h2>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 text-sm"><p className="font-semibold">Próximas visitas</p>
        {upcoming.length ? <ul className="flex flex-col gap-1">{upcoming.slice(0, 5).map(e => <li key={e.id}><Link className="underline" href={`/admin/agenda?fecha=${e.fecha}&evento=${encodeURIComponent(e.id)}`}>{e.titulo}</Link> · {shortDate(e.fecha)}{e.hora ? ` ${e.hora}` : ""}</li>)}</ul> : <p className="text-muted-foreground">{op.propiedad_slug ? "Sin visitas próximas en la agenda." : "Vincula el inmueble para ver sus visitas."}</p>}
        <p className="text-muted-foreground">{past.length ? `${past.length} ${past.length === 1 ? "visita anterior" : "visitas anteriores"}; la última el ${shortDate(past[past.length - 1].fecha)}. Registra el resultado de cada una en el formato 13.` : "Sin visitas anteriores."}</p>
        <Link className="font-semibold underline underline-offset-4" href={`/admin/agenda?expediente=${encodeURIComponent(op.id)}`}>Agendar una visita</Link>
      </div>
      <div className="flex flex-col gap-2 text-sm"><p className="font-semibold">Ofertas comparadas</p>
        {offers === undefined ? <p className="text-muted-foreground">Consultando ofertas…</p> : offers === null ? <p className="text-muted-foreground">No se pudieron consultar las ofertas.</p> : offers.length ? <ul className="flex flex-col gap-1">{offers.slice(0, 5).map(run => <li key={run.id}>{run.title} · {shortDate(run.updatedAt)}{run.context?.expedienteId && run.context.expedienteId !== op.id ? " · del comprador" : ""}</li>)}</ul> : <p className="text-muted-foreground">Sin ofertas comparadas.</p>}
        <p className="text-muted-foreground">{offerDocs ? `${offerDocs} ${offerDocs === 1 ? "oferta por escrito" : "ofertas por escrito"} (formato 14) en Documentos.` : "Sin oferta por escrito (formato 14) en Documentos."}</p>
        <Link className="font-semibold underline underline-offset-4" href={`/admin/apps/ofertas?expedienteId=${encodeURIComponent(op.id)}`}>Comparar una oferta</Link>
      </div>
    </div>
  </Card>;
}
