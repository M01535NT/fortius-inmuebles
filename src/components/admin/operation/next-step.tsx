"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, FileDown, FileText, Mail, MessageCircle, Phone, PlayCircle, Trash2 } from "@/components/admin/icons";
import { Button, ButtonLink, Card, Eyebrow, Notice, Pill } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";
import { apiRequest, db, errorMessage, upsert, uid, useCollection } from "@/lib/admin/store";
import { isOwnerRoute, ownerReportApplies, ownerReportStatus, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { answerLabel, type OperationalInterview } from "@/lib/intake/interview";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { levantamientoFor } from "@/lib/formatos/checklist-documentos";
import { LEVANTAMIENTO_TITLES, type LevantamientoId } from "@/lib/formatos/levantamiento";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { advanceTarget, contractLocked, flowOf, isGuided, itemCounted, itemDone, missingItems, nowItem, routeStages, stageGuide, stageItems, stageOf, type OperationRecord, type StageItem } from "@/lib/admin/operation-view";
import { requirementName, shortDate, weekdayDate } from "@/lib/admin/today";
import { problemOf } from "@/lib/admin/operation-view";
import { quickReview, RequirementRow, RequirementSheets, StateIcon, type Evidence, type OpenSheet } from "./requirements";
import type { DocumentsController } from "./use-documents";
import type { Documento } from "./documents-tab";
import { saveError } from "./use-operation";
import { cn } from "@/lib/utils";
import s from "./operation.module.css";

/*
  «Esta etapa» (boceto C, aprobado el 17/10/2026): arriba «Ahora toca» con una sola acción
  principal; debajo «Para terminar la etapa» reúne los documentos que se llenan, lo que se
  confirma y lo demás que impide avanzar. A un lado, la próxima tarea y el propietario.
  Las reglas de avance siguen siendo las de operation-workflow.ts.
*/

/** Requisitos del contrato y la preparación: se capturan después de terminar la verificación. */
const CONTRACT_KEYS: RequirementKey[] = ["intermediacion", "levantamiento", "plan", "publicacion"];
type Save = (changes: { flujo?: OperationWorkflow; etapa?: WorkflowStage }) => Promise<unknown>;
type Run = { id: string; title: string; updatedAt: string; result?: unknown; context?: { expedienteId?: string } };

/** Título del formato en la etapa: el levantamiento toma el tipo que se eligió. */
export function formatTitle(formato: string, doc?: Documento) {
  if (formato === "04") return doc ? `${doc.formato_id} · ${LEVANTAMIENTO_TITLES[doc.formato_id as LevantamientoId] ?? "Levantamiento"}` : "04 · Levantamiento";
  return `${formato} · ${formatoById(formato).title}`;
}
/** Cuántas secciones de un borrador tienen datos obligatorios por llenar. */
export function draftProgress(doc: Documento) {
  const definition = formatoById(doc.formato_id);
  const sections = [...new Set(definition.fields.map(f => f.section ?? "Datos"))];
  const sectionOf = new Map(definition.fields.map(f => [f.label, f.section ?? "Datos"]));
  const missing = validateFormato(doc.formato_id, doc.data);
  const pending = new Set(missing.map(label => sectionOf.get(label)).filter(Boolean)).size;
  return { sections: sections.length, pending, missing: missing.length };
}
function draftText(doc: Documento, hasPdf: boolean) {
  if (hasPdf) return `Terminado · PDF de la versión ${doc.version}`;
  const { sections, pending, missing } = draftProgress(doc);
  if (!formatoById(doc.formato_id).readyForEmission) return `Versión ${doc.version} · actualizado el ${shortDate(doc.updated_at)}. Su PDF sigue bloqueado: descarga el Word.`;
  return missing ? `Faltan datos en ${pending} de ${sections} secciones · versión ${doc.version}` : "Captura completa: falta generar el PDF";
}

export function NextStepTab({ op, today, evidence, interview, docs, checklist, onSave, onSavedLegacy, onGoTo, onDirtyChange }: {
  op: OperationRecord; today: string; evidence: Evidence; interview: OperationalInterview | null; docs: DocumentsController; checklist?: Task; onSave: Save;
  onSavedLegacy: (value: OperationRecord) => void; onGoTo: (tab: "documentos" | "ajustes" | "tareas") => void; onDirtyChange: (dirty: boolean) => void;
}) {
  const tasks = useCollection(db.tareas);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [sheet, setSheet] = React.useState<OpenSheet>(null);
  const flow = flowOf(op), owner = isOwnerRoute(flow.ruta);
  const { phase } = routeStages(op, today);
  const guide = stageGuide(op, today);
  const answers = (docs.latest("02")?.data ?? interview?.respuestas ?? {}) as Record<string, unknown>;
  // El tipo sugerido sale de la entrevista; se calcula hasta que el asesor elige otro.
  const [surveyChoice, setSurvey] = React.useState<LevantamientoId | null>(null);
  const survey = surveyChoice ?? levantamientoFor(answers.tipoInmueble);
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
      // Las etapas que se abren solas lo avisan para que no pase inadvertido.
      const after = routeStages({ ...saved, inicial: op.inicial }, today).phase;
      setNotice(phase === "verificacion" && after === "contrato" ? "Verificación terminada. Ya puedes trabajar el contrato y la preparación." : phase === "dictamen" && after === "verificacion" ? "Dictamen jurídico terminado. Sigue la opinión de valor y el precio." : "Guardado");
    } catch (cause) { const message = saveError(cause); setError(`No se pudo guardar: ${message}`); throw new Error(message); }
    finally { setBusy(false); }
  }
  const quick = (key: RequirementKey, state: "pendiente" | "recibido") => void changeRequirement(key, quickReview(flow, key, state, today)).catch(() => undefined);
  const target = advanceTarget(op, today);
  const blockers = missingItems(op, tasks, today);
  async function advance() {
    if (!target?.target || blockers.length) return;
    setBusy(true); setError(""); setNotice("");
    try { await onSave({ etapa: target.target }); setNotice(`Listo: la operación pasó a «${target.label}».`); window.scrollTo({ top: 0, behavior: "instant" }); }
    catch (cause) { setError(`No se pudo avanzar: ${saveError(cause)}`); } finally { setBusy(false); }
  }
  function goToPending(item: Extract<StageItem, { kind: "pendiente" }>) {
    if (item.place === "ajustes") onGoTo("ajustes");
    else if (item.place === "tarea") { const card = document.getElementById("proxima-tarea"); card?.scrollIntoView({ block: "center" }); card?.querySelector<HTMLElement>("input, button")?.focus(); }
    else void docs.start(item.text.includes("(02)") ? "02" : "04", survey);
  }

  const items = stageItems(op, tasks, today, docs.status);
  const counted = items.filter(itemCounted), done = counted.filter(itemDone).length;
  const now = nowItem(items);
  const locked = contractLocked(op, today);
  const documentsGroup = items.filter(i => i.kind === "documento" || i.kind === "checklist" || i.kind === "inicio");
  const reviewsGroup = items.filter((i): i is Extract<StageItem, { kind: "requisito" }> => i.kind === "requisito");
  const otherGroup = items.filter((i): i is Extract<StageItem, { kind: "pendiente" }> => i.kind === "pendiente");
  const lock = busy || docs.busy;
  const surveySelect = <label className="text-sm">Tipo de levantamiento<select className={selectClass} value={survey} disabled={lock} onChange={e => setSurvey(e.target.value as LevantamientoId)}>{(Object.keys(LEVANTAMIENTO_TITLES) as LevantamientoId[]).map(id => <option key={id} value={id}>{id} · {LEVANTAMIENTO_TITLES[id]}</option>)}</select></label>;

  /** «Ahora toca»: una sola acción principal, la del primer pendiente. */
  function nowBlock() {
    if (!now) {
      if (target?.target) return <NowCard title={`Pasar a: ${target.label}`} text="Todo lo de esta etapa está listo.">
        <Button variant="primary" size="lg" disabled={lock} onClick={() => void advance()}>Pasar a: {target.label}<ArrowRight size={18} aria-hidden="true" /></Button>
      </NowCard>;
      return <NowCard title={stageOf(op) === "cerrado" ? "Operación archivada" : "Todo listo en esta etapa"} text={target ? `La siguiente etapa, «${target.label}», se abre sola.` : "No hay más pasos en esta operación."} />;
    }
    if (now.kind === "inicio") return now.step === "levantamiento"
      ? <NowCard title="Iniciar el levantamiento" text="La entrevista está terminada. Elige el levantamiento según el tipo de inmueble; se captura en la visita, con fotografías y croquis.">
        <div className="flex flex-wrap items-end gap-2">{surveySelect}<Button variant="primary" size="lg" disabled={lock} onClick={() => void docs.start("04", survey)}><PlayCircle size={18} aria-hidden="true" />Iniciar levantamiento</Button></div>
      </NowCard>
      : <NowCard title="Iniciar el checklist de documentos" text="Se arma la lista de documentos que le corresponde al propietario. Ahí marcas cada uno al recibirlo.">
        <Button variant="primary" size="lg" disabled={lock} onClick={() => void docs.startChecklist()}>Iniciar checklist<ArrowRight size={18} aria-hidden="true" /></Button>
      </NowCard>;
    if (now.kind === "documento") {
      const doc = docs.latest(now.formato), name = formatTitle(now.formato, doc);
      const startLabel = phase === "prospecto" ? "Iniciar entrevista" : doc ? "Continuar" : "Iniciar";
      const [code, ...rest] = name.split(" · "), plain = rest.join(" · ");
      return <NowCard title={phase === "prospecto" ? "Hacer la entrevista inicial (02)" : `${doc ? "Terminar" : "Iniciar"} ${plain.charAt(0).toLowerCase()}${plain.slice(1)} (${code})`} text={doc ? draftText(doc, !!docs.pdfOf(doc)) : phase === "prospecto" ? "La entrevista inicial (02) ya trae sus preguntas: solo capturas las respuestas. Lo del primer contacto aparece ya llenado para confirmarlo." : "Se abre en su propia ventana, por secciones."}>
        <div className="flex flex-wrap items-end gap-2">
          {now.formato === "04" && !doc && surveySelect}
          <Button variant="primary" size="lg" disabled={lock} onClick={() => void docs.start(now.formato, survey)}><PlayCircle size={18} aria-hidden="true" />{startLabel}</Button>
          {doc && <Button size="lg" disabled={lock} onClick={() => docs.word(doc)}><FileText size={18} aria-hidden="true" />Word</Button>}
        </div>
      </NowCard>;
    }
    if (now.kind === "checklist") return checklist
      ? <NowCard title="Reunir los documentos del propietario" text={`${checklist.pasos.filter(p => p.hecho).length} de ${checklist.pasos.length} recibidos. Márcalos abajo al recibirlos.`}>
        <div className="flex flex-wrap gap-2"><Button disabled={lock} onClick={() => docs.checklistFile("pdf")}><FileDown size={16} aria-hidden="true" />Checklist PDF</Button><Button variant="ghost" disabled={lock} onClick={() => docs.checklistFile("docx")}><FileText size={16} aria-hidden="true" />Word</Button></div>
      </NowCard>
      : <NowCard title="Crear el checklist de documentos" text="Se arma con lo que contestó en la entrevista: estado civil, crédito, tipo de inmueble…">
        <Button variant="primary" size="lg" disabled={lock} onClick={() => void docs.startChecklist()}>Crear checklist</Button>
      </NowCard>;
    if (now.kind === "requisito") {
      const name = requirementName(now.key);
      if (now.state === "observado") return <NowCard title={`Resolver: ${name}`} text={problemOf(flow.requisitos[now.key]).title}>
        <div className="flex flex-wrap gap-2"><Button variant="primary" size="lg" disabled={lock || locked} onClick={() => quick(now.key, "recibido")}>Ya se resolvió</Button><Button size="lg" disabled={lock || locked} onClick={() => setSheet({ key: now.key, kind: "observado" })}>Escribir qué pasó</Button></div>
      </NowCard>;
      return <NowCard title={`Confirmar: ${name}`} text={now.state === "recibido" ? "Ya tienes el documento. Márcalo como revisado con su respaldo." : "Al marcarlo como revisado te pedimos con qué lo comprobaste."}>
        <Button variant="primary" size="lg" disabled={lock || locked} onClick={() => setSheet({ key: now.key, kind: "revisado" })}>Marcar revisado</Button>
      </NowCard>;
    }
    return <NowCard title={now.text} text={now.why ? now.why.replace(/^./, c => c.toUpperCase()) + "." : ""}>
      <Button variant="primary" size="lg" disabled={lock} onClick={() => goToPending(now)}>{now.place === "ajustes" ? "Ir a Ajustes" : now.place === "tarea" ? "Agendar la próxima tarea" : "Hacerlo ahora"}</Button>
    </NowCard>;
  }

  return <div className={s.layout}>
    <div className="flex min-w-0 flex-col gap-5">
      <Card className={s.stageCard} aria-label="Esta etapa">
        {flow.estado !== "activa" && <p className="mb-3 font-semibold text-[var(--warning)]">Operación {flow.estado === "pausada" ? "en pausa" : flow.estado === "regularizacion" ? "en regularización" : "descartada"}{flow.motivo ? `: ${flow.motivo}` : ""}</p>}
        {nowBlock()}
        {phase === "prospecto" && owner && <FirstContact interview={interview} op={op} disabled={lock} />}

        {items.length > 0 && <section aria-labelledby="terminar-etapa" className={s.finish}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="terminar-etapa" className="m-0 text-lg font-bold">Para terminar la etapa</h2>
            {counted.length > 0 && <span className="text-sm font-semibold text-muted-foreground">{done} de {counted.length}</span>}
          </div>
          {guide.que && <details className={s.why}><summary>Qué hacemos y para qué</summary><p className="mt-2 text-sm text-muted-foreground">{guide.que} {guide.para}</p></details>}
          {locked && reviewsGroup.some(i => !i.earlier && CONTRACT_KEYS.includes(i.key)) && <Notice tone="info">Primero termina el dictamen jurídico y la opinión de valor y registra si tomas el encargo. Después se capturan el contrato y la preparación.</Notice>}
          {documentsGroup.length > 0 && <>
            <h3 className={s.group}>1 · Llena los documentos</h3>
            <ul className={s.items}>{documentsGroup.map(item => item.kind === "inicio"
              ? <li key={item.step} className={s.item}><div className={s.itemMain}><ArrowRight size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" /><div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-semibold">{item.step === "levantamiento" ? "Siguiente: levantamiento del inmueble" : "Siguiente: checklist de documentos"}</span><span className="text-sm text-muted-foreground">Al iniciarlo pasa a la siguiente etapa.</span></div><div className={s.itemActions}>{item === now ? <span className={s.nowTag}>Ahora</span> : null}</div></div></li>
              : item.kind === "checklist"
              ? <li key="checklist" className={s.item}>{checklist ? <Checklist task={checklist} disabled={lock} onError={setError} /> : <div className={s.itemMain}><StateIcon state="pendiente" done={false} /><div className="flex-1"><p className="font-semibold">Checklist de documentos</p><p className="text-sm text-muted-foreground">Todavía no se crea.</p></div></div>}</li>
              : <DocumentRow key={item.formato} item={item} now={item === now} docs={docs} disabled={lock} survey={survey} />)}</ul>
          </>}
          {reviewsGroup.length > 0 && <>
            <h3 className={s.group}>{documentsGroup.length ? "2 · " : ""}Confirma lo que revisaste</h3>
            <ul className={s.items}>{reviewsGroup.map(item => <RequirementRow key={item.key} requirement={item.key} earlier={item.earlier} flow={flow} today={today} locked={locked && CONTRACT_KEYS.includes(item.key) && !item.earlier} busy={lock} onQuick={quick} onSheet={setSheet} />)}</ul>
          </>}
          {otherGroup.length > 0 && <>
            <h3 className={s.group}>También falta</h3>
            <ul className={s.items}>{otherGroup.map(item => <li key={item.text} className={s.item}><div className={s.itemMain}>
              <StateIcon state="pendiente" done={false} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-semibold">{item.text}</span>{item.why && <span className="text-sm text-muted-foreground">{item.why.replace(/^./, c => c.toUpperCase())}</span>}</div>
              <div className={s.itemActions}><Button disabled={lock} onClick={() => goToPending(item)}>{item.place === "ajustes" ? "Ir a Ajustes" : item.place === "tarea" ? "Ir a la próxima tarea" : "Hacerlo ahora"}</Button></div>
            </div></li>)}</ul>
          </>}
          {target && now && <div className={s.advance} aria-live="polite">
            <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            {target.target ? <>
              <p className="min-w-0 flex-1 text-sm">{blockers.length ? <>Cuando esté todo, pasa a <strong>{target.label}</strong>.</> : <>Todo listo para pasar a <strong>{target.label}</strong>.</>}</p>
              <Button variant={blockers.length ? "secondary" : "primary"} className="shrink-0" disabled={lock || blockers.length > 0} onClick={() => void advance()}>Pasar a: {target.label}</Button>
            </> : <p className="min-w-0 flex-1 text-sm">Con todo listo se abre sola <strong>{target.label}</strong>.</p>}
          </div>}
        </section>}
        {(error || docs.error) && <p role="alert" className="mt-4 text-sm text-destructive">{error || docs.error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-muted-foreground">{notice}</p>}
      </Card>
      {owner && interview && (phase === "captacion" || phase === "verificacion" || phase === "contrato") && <Declared op={op} interview={interview} />}
      {owner && ownerReportApplies(stageOf(op), op.flujo ?? flow) && <OwnerReport op={op} today={today} />}
      {owner && (phase === "publicacion" || phase === "visitas") && <VisitsAndOffers op={op} today={today} documents={evidence.documents} />}
    </div>
    <aside className="flex min-w-0 flex-col gap-5" aria-label="Apoyo de la etapa">
      <NextTask op={op} today={today} />
      <OwnerCard op={op} interview={interview} />
      <Card className="px-5 py-1"><details className={s.meaning}><summary>¿Qué significa cada estado?</summary><ul className="mb-4 mt-1 flex flex-col gap-2.5 text-sm text-muted-foreground">
        <li><strong className="text-foreground">Lo tengo</strong>: ya llegó el documento; todavía no se revisa. <strong className="text-foreground">Revisado</strong> exige decir con qué se comprobó, quién y cuándo.</li>
        <li>El panel guarda el registro de cada revisión, pero no emite dictámenes ni sustituye la revisión de un profesional.</li>
        <li>Lo que el propietario espera, la opinión de valor y el precio de salida son datos distintos: cada uno se registra por separado.</li>
        <li>Una oferta comparada en la herramienta no es una oferta aceptada; la aceptación se registra en sus requisitos.</li>
      </ul></details></Card>
    </aside>
    <RequirementSheets sheet={sheet} flow={flow} today={today} evidence={evidence} onClose={() => setSheet(null)} onChange={changeRequirement} onAddDocument={() => onGoTo("documentos")} />
  </div>;
}

function NowCard({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return <div className="flex flex-col gap-2">
    <span className="self-start"><Pill tone="brand">Ahora toca</Pill></span>
    <h2 className={s.nowTitle}>{title}</h2>
    {text && <p className="text-muted-foreground">{text}</p>}
    {children && <div className="mt-3">{children}</div>}
  </div>;
}

/** Un documento de la etapa: su estado y, salvo el que toca ahora, sus acciones. Abrirlo lleva a su ventana. */
function DocumentRow({ item, now, docs, disabled, survey }: { item: Extract<StageItem, { kind: "documento" }>; now: boolean; docs: DocumentsController; disabled: boolean; survey: LevantamientoId }) {
  const doc = docs.latest(item.formato), pdf = docs.pdfOf(doc);
  const text = doc ? draftText(doc, !!pdf) : item.optional ? "Se entrega en la entrevista. Guarda la copia firmada en su ventana." : item.formato === "06" ? "Después del 05" : "Todavía no empieza";
  return <li className={s.item}><div className={s.itemMain}>
    <StateIcon state={doc ? "borrador" : "pendiente"} done={item.status === "terminado"} />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-semibold [overflow-wrap:anywhere]">{formatTitle(item.formato, doc)}</span><span className="text-sm text-muted-foreground">{text}</span></div>
    <div className={s.itemActions}>
      {now ? <span className={s.nowTag}>Ahora</span> : <Button disabled={disabled} onClick={() => void docs.start(item.formato, survey)}>{doc ? "Abrir" : "Iniciar"}</Button>}
      {pdf && <ButtonLink variant="ghost" prefetch={false} href={`/api/admin/emisiones/${pdf.id}/descargar`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
    </div>
  </div></li>;
}

/** Lo que dijo en el primer contacto, antes de la entrevista en persona. */
function FirstContact({ interview, op, disabled }: { interview: OperationalInterview | null; op: OperationRecord; disabled: boolean }) {
  const a = interview?.respuestas ?? {};
  const flow = flowOf(op);
  return <details className={cn(s.why, "mt-5")}><summary>Lo que dijo en el primer contacto</summary><div className="mt-3 flex flex-col gap-4">
    {interview ? <dl className={s.facts}>
      {a.ubicacion && <><dt>Inmueble</dt><dd>{a.ubicacion}{a.zona ? ` · ${a.zona}` : ""}</dd></>}
      {a.tipoInmueble && <><dt>Tipo</dt><dd>{answerLabel(a.tipoInmueble)}</dd></>}
      {a.objetivo && <><dt>Qué quiere</dt><dd>{a.objetivo}{a.plazo ? ` · ${a.plazo}` : ""}</dd></>}
      {a.presupuestoEstado === "conocido" && a.importe && <><dt>Precio que mencionó</dt><dd>${Math.round(Number(a.importe)).toLocaleString("en-US")} {a.moneda}</dd></>}
      {a.siguienteFecha && <><dt>{a.siguienteAccion || "Lo que sigue"}</dt><dd>{shortDate(a.siguienteFecha)}</dd></>}
      {a.condiciones && <><dt>Notas</dt><dd className="whitespace-pre-line">{a.condiciones}</dd></>}
    </dl> : <p className="text-sm text-muted-foreground">Todavía no hay entrevista del primer contacto.</p>}
    <InterviewAccess key={op.id} expedienteId={op.id} clienteId={op.cliente_id} intencion={flow.ruta === "arrendador" ? "arrendar" : "vender"} disabled={disabled} />
  </div></details>;
}

/** Lista de documentos guardada como pasos de la tarea de la operación; al recibir todos, la tarea se completa. */
function Checklist({ task, disabled, onError }: { task: Task; disabled: boolean; onError: (message: string) => void }) {
  const [busy, setBusy] = React.useState(false), [extra, setExtra] = React.useState("");
  const received = task.pasos.filter(p => p.hecho).length, total = task.pasos.length;
  async function save(pasos: Task["pasos"]) {
    setBusy(true); onError("");
    try {
      const complete = pasos.length > 0 && pasos.every(p => p.hecho);
      await upsert(db.tareas, { ...task, pasos, estado: complete ? "completada" : task.estado === "completada" ? "en-curso" : task.estado }, db.tareas.version(task));
    } catch (cause) { onError(`No se pudo guardar: ${errorMessage(cause)}`); } finally { setBusy(false); }
  }
  function add(event: React.FormEvent) {
    event.preventDefault();
    const texto = extra.trim(); if (!texto) return;
    let n = 1; while (task.pasos.some(p => p.id === `X${n}`)) n++;
    void save([...task.pasos, { id: `X${n}`, texto: `D22 · ${texto}`, hecho: false }]).then(() => setExtra(""));
  }
  const lock = disabled || busy;
  return <div className="flex w-full flex-col gap-1">
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-semibold">Documentos del propietario</p>
      <span className="text-sm text-muted-foreground">{received} de {total} recibidos</span>
    </div>
    <ul className="flex flex-col">{task.pasos.map(paso => <li key={paso.id} className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-b-0">
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-5 shrink-0" checked={paso.hecho} disabled={lock} onChange={e => void save(task.pasos.map(p => p.id === paso.id ? { ...p, hecho: e.target.checked } : p))} />
        <span className={paso.hecho ? "text-muted-foreground" : ""}>{paso.texto}</span>
      </label>
      <Button variant="ghost" iconOnly aria-label={`Quitar ${paso.texto} (no aplica)`} disabled={lock} onClick={() => void save(task.pasos.filter(p => p.id !== paso.id))}><Trash2 size={16} aria-hidden="true" /></Button>
    </li>)}</ul>
    <form onSubmit={add} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">Agregar otro documento<input className={inputClass} maxLength={200} value={extra} disabled={lock} onChange={e => setExtra(e.target.value)} placeholder="Ej. Constancia de no adeudo de mantenimiento" /></label>
      <Button type="submit" disabled={lock || !extra.trim()}>Agregar</Button>
    </form>
    <p className="mt-1 text-sm text-muted-foreground">{received === total && total > 0 ? "Todos los documentos están recibidos." : "Si uno no aplica, quítalo de la lista. «Recibido» no quiere decir revisado: eso se hace en el dictamen jurídico."}</p>
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
    <Clock size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Eyebrow>Próxima tarea</Eyebrow>
      {next ? <>
        <span className="flex min-w-0 flex-col gap-0.5"><Link href={`/admin/tareas/${encodeURIComponent(next.id)}`} className="font-semibold text-foreground [overflow-wrap:anywhere]">{next.titulo}</Link><span className={cn("text-sm", late ? s.lateText : "text-muted-foreground")}>{next.vence ? `${late ? "Vencida · " : next.vence === today ? "Hoy · " : ""}${weekdayDate(next.vence)} ${shortDate(next.vence).split(" ")[1]}` : "Sin fecha"}</span></span>
        {!editing && <button type="button" className={s.linkButton} onClick={() => { setDate(next.vence ?? ""); setEditing(true); }}>Cambiar fecha</button>}
        {editing && <div className="flex flex-col gap-2"><label className="text-sm">Nueva fecha<input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} /></label><div className="flex gap-2"><Button variant="primary" disabled={busy || !date} onClick={() => void changeDate()}>Guardar fecha</Button><Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancelar</Button></div></div>}
      </> : <form onSubmit={create} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{stageOf(op) === "cerrado" ? "Operación archivada: no necesita próxima tarea." : "Esta operación no tiene una próxima tarea con fecha. Agenda el siguiente paso para no perderlo de vista."}</p>
        {stageOf(op) !== "cerrado" && <>
          <label className="text-sm">Qué sigue<input className={inputClass} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="text-sm">Fecha<input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} /></label>
          <Button type="submit" variant="primary" disabled={busy || !title.trim() || !date}>Agendar</Button>
        </>}
      </form>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  </Card>;
}

/** Propietario (o comprador, inversionista…) con lo que quiere y cómo contactarlo. */
function OwnerCard({ op, interview }: { op: OperationRecord; interview: OperationalInterview | null }) {
  const clients = useCollection(db.clientes);
  const client = clients.find(c => c.id === op.cliente_id);
  if (!client) return null;
  const flow = flowOf(op);
  const digits = (client.telefono ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  const wants = [interview?.respuestas?.objetivo, interview?.respuestas?.plazo && `Plazo: ${answerLabel(interview.respuestas.plazo)}`].filter(Boolean).join(" · ");
  const role = isOwnerRoute(flow.ruta) ? "Propietario" : flow.ruta === "inversion" ? "Inversionista" : flow.ruta === "arrendatario" ? "Arrendatario" : "Comprador";
  const initials = client.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return <Card className="flex flex-col gap-3 p-5" aria-label={role}>
    <Eyebrow as="h2">{role}</Eyebrow>
    <div className="flex items-center gap-3">
      <span className={s.avatar} aria-hidden="true">{initials}</span>
      <span className="flex min-w-0 flex-col"><strong className="[overflow-wrap:anywhere]">{client.nombre}</strong><Link href={`/admin/clientes/${encodeURIComponent(client.id)}`} className="text-sm font-semibold text-[var(--primary-text)] underline underline-offset-4">Ver ficha</Link></span>
    </div>
    {wants && <p className="text-sm text-muted-foreground">{wants}</p>}
    {client.email && !digits && <p className="text-sm [overflow-wrap:anywhere]">{client.email}</p>}
    {digits && <div className="grid grid-cols-2 gap-2"><ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden="true" />Llamar</ButtonLink><ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink></div>}
    {!digits && client.email && <ButtonLink href={`mailto:${client.email}`}><Mail size={16} aria-hidden="true" />Escribir correo</ButtonLink>}
  </Card>;
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
        <p className="text-muted-foreground">{offerDocs ? `${offerDocs} ${offerDocs === 1 ? "oferta por escrito" : "ofertas por escrito"} (formato 14) en el expediente.` : "Sin oferta por escrito (formato 14) en el expediente."}</p>
        <Link className="font-semibold underline underline-offset-4" href={`/admin/apps/ofertas?expedienteId=${encodeURIComponent(op.id)}`}>Comparar una oferta</Link>
      </div>
    </div>
  </Card>;
}
