"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, FileDown, FileText, House, PlayCircle, Trash2 } from "@/components/admin/icons";
import Image from "next/image";
import { Button, ButtonLink, Card, Notice } from "@/components/admin/kit";
import { TIPO_LABELS, type Property as Propiedad } from "@/data/propiedades";
import { inputClass, selectClass } from "@/components/admin/ui";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";
import { apiRequest, db, errorMessage, upsert, uid, useCollection } from "@/lib/admin/store";
import { CANALES_INFORME, isOwnerRoute, lastOwnerReport, ownerReportApplies, ownerReportStatus, type EntregaInforme, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { answerLabel, type OperationalInterview } from "@/lib/intake/interview";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { actualizarChecklist, checklistCompleto, checklistDesactualizado, checklistFor, CODIGOS_POR_TIPO_DOCUMENTO, levantamientoFor, motivoNoAplica, pasoCompleto, type PasoChecklist } from "@/lib/formatos/checklist-documentos";
import { LEVANTAMIENTO_TITLES, type LevantamientoId } from "@/lib/formatos/levantamiento";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { advanceTarget, contractLocked, flowOf, isGuided, itemCounted, itemDone, missingItems, nowItem, routeStages, stageItems, stageOf, type OperationRecord, type StageItem } from "@/lib/admin/operation-view";
import { requirementName, shortDate, weekdayDate } from "@/lib/admin/today";
import { problemOf } from "@/lib/admin/operation-view";
import { quickReview, RequirementRow, RequirementSheets, StateIcon, type Evidence, type OpenSheet } from "./requirements";
import type { DocumentsController } from "./use-documents";
import type { Documento } from "./documents-tab";
import type { ArchivoCliente } from "./client-documents-tab";
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
const CONTRACT_KEYS: RequirementKey[] = ["intermediacion", "plan", "publicacion"];
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

export function NextStepTab({ op, today, evidence, interview, docs, checklist, property, onSave, onSavedLegacy, onGoTo, onDirtyChange }: {
  op: OperationRecord; today: string; property?: Propiedad; evidence: Evidence; interview: OperationalInterview | null; docs: DocumentsController; checklist?: Task; onSave: Save;
  onSavedLegacy: (value: OperationRecord) => void; onGoTo: (tab: "documentos" | "ajustes" | "tareas" | "cliente") => void; onDirtyChange: (dirty: boolean) => void;
}) {
  const tasks = useCollection(db.tareas);
  // CSR-02: datos del expediente que esperan revisión (llegaron de una ficha, un documento o un texto).
  const [porConfirmar, setPorConfirmar] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ datos?: Record<string, { estado: string }> }>(`/api/admin/expedientes/${op.id}/datos`).then(r => { if (alive) setPorConfirmar(Object.values(r.datos ?? {}).filter(dato => dato.estado === "propuesto").length); }).catch(() => undefined);
    return () => { alive = false; };
  }, [op.id, op.version]);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [sheet, setSheet] = React.useState<OpenSheet>(null);
  const flow = flowOf(op), owner = isOwnerRoute(flow.ruta);
  const { phase } = routeStages(op, today);
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

  /** La barra flotante: lo que toca en una línea y un solo botón; «Pasar a» con los mismos candados de siempre. */
  function floatingBar() {
    const pass = target?.target ? <Button variant={now ? "secondary" : "primary"} disabled={lock || blockers.length > 0} onClick={() => void advance()}>Pasar a: {target.label}</Button> : null;
    let title = "", text = "", action: React.ReactNode = null;
    if (!now) {
      title = target?.target ? "Todo lo de esta etapa está listo" : stageOf(op) === "cerrado" ? "Operación archivada" : "Todo listo en esta etapa";
      text = target?.target ? `Pasa a ${target.label} cuando quieras.` : target ? `La siguiente etapa, «${target.label}», se abre sola.` : "No hay más pasos en esta operación.";
      action = pass;
    } else if (now.kind === "inicio") {
      title = now.step === "levantamiento" ? "Iniciar el levantamiento" : "Iniciar el checklist de documentos";
      text = now.step === "levantamiento" ? "Elige el tipo de levantamiento en la lista de documentos; se captura en la visita." : "La lista de documentos del propietario. Marca cada uno al recibirlo.";
      action = now.step === "levantamiento"
        ? <Button variant="primary" disabled={lock} onClick={() => void docs.start("04", survey)}><PlayCircle size={18} aria-hidden="true" />Iniciar levantamiento</Button>
        : <Button variant="primary" disabled={lock} onClick={() => void docs.startChecklist()}>Iniciar checklist<ArrowRight size={18} aria-hidden="true" /></Button>;
    } else if (now.kind === "documento") {
      const doc = docs.latest(now.formato), name = formatTitle(now.formato, doc);
      const plain = name.split(" · ").slice(1).join(" · ");
      title = phase === "prospecto" ? "Hacer la entrevista inicial" : `${doc ? "Terminar" : "Iniciar"} ${plain.charAt(0).toLowerCase()}${plain.slice(1)}`;
      text = doc ? draftText(doc, !!docs.pdfOf(doc)) : phase === "prospecto" ? "Ya trae sus preguntas: solo capturas las respuestas." : "Se abre en su propia ventana.";
      action = <Button variant="primary" disabled={lock} onClick={() => void docs.start(now.formato, survey)}><PlayCircle size={18} aria-hidden="true" />{phase === "prospecto" ? "Iniciar entrevista" : doc ? "Continuar" : "Iniciar"}</Button>;
    } else if (now.kind === "checklist") {
      title = checklist ? "Reunir los documentos del propietario" : "Crear el checklist de documentos";
      text = checklist ? `${checklist.pasos.filter(pasoCompleto).length} de ${checklist.pasos.length} listos. Márcalos en la lista al recibirlos.` : "Se arma con lo que contestó en la entrevista.";
      action = checklist ? <Button disabled={lock} onClick={() => docs.checklistFile("pdf")}><FileDown size={16} aria-hidden="true" />Checklist PDF</Button> : <Button variant="primary" disabled={lock} onClick={() => void docs.startChecklist()}>Crear checklist</Button>;
    } else if (now.kind === "requisito") {
      const name = requirementName(now.key, flow.ruta);
      const held = lock || (locked && CONTRACT_KEYS.includes(now.key));
      if (now.state === "observado") {
        title = `Resolver: ${name}`; text = problemOf(flow.requisitos[now.key]).title;
        action = <><Button disabled={held} onClick={() => setSheet({ key: now.key, kind: "observado" })}>Escribir qué pasó</Button><Button variant="primary" disabled={held} onClick={() => quick(now.key, "recibido")}>Ya se resolvió</Button></>;
      } else {
        title = `Confirmar: ${name}`; text = now.state === "recibido" ? "Ya tienes el documento; escribe qué encontraste." : "Su documento ya viene elegido; escribe qué encontraste.";
        action = <Button variant="primary" disabled={held} onClick={() => setSheet({ key: now.key, kind: "revisado" })}>Confirmar</Button>;
      }
    } else {
      title = now.text; text = now.why ? now.why.replace(/^./, c => c.toUpperCase()) + "." : "";
      action = <Button variant="primary" disabled={lock} onClick={() => goToPending(now)}>{now.place === "ajustes" ? "Ir a Ajustes" : now.place === "tarea" ? "Agendar la próxima tarea" : "Hacerlo ahora"}</Button>;
    }
    const ratio = counted.length ? done / counted.length : 1;
    const sub = now && target ? (target.target ? `${done} de ${counted.length} para pasar a ${target.label}` : `Con todo listo se abre sola ${target.label}.`) : "";
    return <div role="region" aria-label="Siguiente acción" className={s.float}>
      <span className={s.ring} aria-hidden="true"><svg width="44" height="44" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="var(--track)" strokeWidth="5" /><circle cx="24" cy="24" r="20" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.round(ratio * 125.66)} 125.66`} transform="rotate(-90 24 24)" /></svg><span className={s.ringText}>{counted.length ? `${done}/${counted.length}` : "✓"}</span></span>
      <span className="flex min-w-0 flex-1 flex-col">
        <h2 className={s.floatTitle}>{title}</h2>
        {(sub || text) && <span className={s.floatSub}>{sub && <span>{sub}</span>}{text && <span>{sub ? " · " : ""}{text}</span>}</span>}
      </span>
      <span className={s.floatActions}>{now && pass}{action}</span>
    </div>;
  }

  return <section aria-label="Esta etapa" className={s.grid}>
    {flow.estado !== "activa" && <p className={cn(s.span6, "font-semibold text-[var(--warning)]")}>Operación {flow.estado === "pausada" ? "en pausa" : flow.estado === "regularizacion" ? "en regularización" : "descartada"}{flow.motivo ? `: ${flow.motivo}` : ""}</p>}
    {locked && reviewsGroup.some(i => !i.earlier && CONTRACT_KEYS.includes(i.key)) && <div className={s.span6}><Notice tone="info">Primero dictamen jurídico, opinión de valor y decisión del encargo. Luego, contrato y preparación.</Notice></div>}
    {porConfirmar > 0 && <div className={s.span6}><Notice tone="info" title={porConfirmar === 1 ? "Hay 1 dato por confirmar en el expediente" : `Hay ${porConfirmar} datos por confirmar en el expediente`} actions={<Button onClick={() => onGoTo("cliente")}>Revisar los datos</Button>}>Llegaron de una ficha, un documento o un texto. Al confirmarlos llenan los formatos.</Notice></div>}

    {documentsGroup.length > 0 && <section aria-labelledby="docs-etapa" className={cn(s.piece, s.span4)}>
      <div className={s.pieceHead}><h2 id="docs-etapa" className={s.pieceTitle}>Documentos de la etapa</h2><span className={s.pieceCount}>{documentsGroup.filter(itemDone).length} de {documentsGroup.filter(itemCounted).length}</span></div>
      <ul className={s.docList}>{documentsGroup.map(item => item.kind === "inicio"
        ? <li key={item.step} className={s.docWait}>
          <ArrowRight size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5"><strong>{item.step === "levantamiento" ? "Siguiente: levantamiento del inmueble" : "Siguiente: checklist de documentos"}</strong><span className="text-sm text-muted-foreground">Al iniciarlo pasa a la siguiente etapa.</span></span>
          {item.step === "levantamiento" && surveySelect}
        </li>
        : item.kind === "checklist"
        ? <li key="checklist" className={s.docChecklist}>{checklist ? <Checklist task={checklist} answers={docs.checklistAnswers} expedienteId={op.id} disabled={lock} onError={setError} /> : <span className="text-sm text-muted-foreground">Checklist de documentos · todavía no se crea.</span>}</li>
        : <DocRow key={item.formato} item={item} now={item === now} docs={docs} disabled={lock} survey={survey} surveySelect={item.formato === "04" && !docs.latest("04") ? surveySelect : null} />)}</ul>
      {(error || docs.error) && <p role="alert" className="text-sm text-destructive">{error || docs.error}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </section>}

    <NextTask op={op} today={today} className={documentsGroup.length ? s.span2 : s.span6} />

    {(reviewsGroup.length > 0 || otherGroup.length > 0) && <section aria-labelledby="confirma-etapa" className={cn(s.piece, s.span3)}>
      <div className={s.pieceHead}><h2 id="confirma-etapa" className={s.pieceTitle}>Antes de seguir, confirma</h2>{reviewsGroup.length > 0 && <span className={s.pieceCount}>{reviewsGroup.filter(i => !i.earlier && i.done).length} de {reviewsGroup.filter(i => !i.earlier).length}</span>}</div>
      <ul className={s.items}>
        {reviewsGroup.map(item => <RequirementRow key={item.key} requirement={item.key} earlier={item.earlier} flow={flow} today={today} locked={locked && CONTRACT_KEYS.includes(item.key) && !item.earlier} busy={lock} onQuick={quick} onSheet={setSheet} />)}
        {otherGroup.map(item => <li key={item.text} className={s.item}><div className={s.itemMain}>
          <StateIcon state="pendiente" done={false} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-semibold">{item.text}</span>{item.why && <span className="text-sm text-muted-foreground">{item.why.replace(/^./, c => c.toUpperCase())}</span>}</div>
          <div className={s.itemActions}><Button disabled={lock} onClick={() => goToPending(item)}>{item.place === "ajustes" ? "Ir a Ajustes" : item.place === "tarea" ? "Ir a la próxima tarea" : "Hacerlo ahora"}</Button></div>
        </div></li>)}
      </ul>
      <details className={s.meaning}><summary>¿Qué significa cada estado?</summary><ul className="mb-2 mt-1 flex flex-col gap-2 text-sm text-muted-foreground">
        <li><strong className="text-foreground">Lo tengo</strong>: ya llegó el documento; todavía no se revisa. <strong className="text-foreground">Revisado</strong> exige decir con qué se comprobó, quién y cuándo.</li>
        <li>El panel guarda cada revisión, pero no emite dictámenes ni sustituye la revisión de un profesional.</li>
      </ul></details>
    </section>}

    <PropertyPiece op={op} property={property} interview={interview} className={reviewsGroup.length || otherGroup.length ? s.span3 : s.span6} onLink={() => onGoTo("ajustes")} />

    {phase === "prospecto" && owner && <div className={cn(s.piece, s.span6)}><FirstContact interview={interview} op={op} disabled={lock} /></div>}
    {owner && interview && (phase === "captacion" || phase === "verificacion" || phase === "contrato") && <div className={s.span6}><Declared op={op} interview={interview} /></div>}
    {owner && ownerReportApplies(stageOf(op), op.flujo ?? flow) && <div className={s.span6}><OwnerReport op={op} today={today} disabled={lock} onSave={onSave} /></div>}
    {owner && (phase === "publicacion" || phase === "visitas") && <div className={s.span6}><VisitsAndOffers op={op} today={today} documents={evidence.documents} /></div>}
    {floatingBar()}
    <RequirementSheets sheet={sheet} flow={flow} today={today} evidence={evidence} onClose={() => setSheet(null)} onChange={changeRequirement} onAddDocument={() => onGoTo("documentos")} />
  </section>;
}

/** Un documento de la etapa: número grande, nombre y avance. El que toca va resaltado; el que espera a otro, punteado. */
function DocRow({ item, now, docs, disabled, survey, surveySelect }: { item: Extract<StageItem, { kind: "documento" }>; now: boolean; docs: DocumentsController; disabled: boolean; survey: LevantamientoId; surveySelect: React.ReactNode }) {
  const doc = docs.latest(item.formato), pdf = docs.pdfOf(doc);
  const [code, ...rest] = formatTitle(item.formato, doc).split(" · ");
  const waits = item.formato === "06" && !doc && docs.status("05") !== "terminado";
  const text = doc ? draftText(doc, !!pdf) : waits ? "Se abre al terminar el 05" : item.optional ? "Se entrega en la entrevista; guarda la copia firmada en su ventana." : "Todavía no empieza";
  return <li className="flex flex-col gap-2">
    <div className={s.docRowWrap}>
      <button type="button" className={cn(s.docRow, waits && s.docRowWait)} data-now={now || undefined} disabled={disabled || waits} aria-label={`${doc ? "Abrir" : "Iniciar"} ${rest.join(" · ")}`} onClick={() => void docs.start(item.formato, survey)}>
        <span className={s.docNum} aria-hidden="true">{code}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{rest.join(" · ")}</strong><span className="text-sm text-muted-foreground">{text}</span></span>
        {item.status === "terminado" ? <Check size={20} aria-hidden="true" className="shrink-0 text-[var(--primary-text)]" /> : !waits && <ArrowRight size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />}
      </button>
      {pdf && <ButtonLink variant="ghost" prefetch={false} href={`/api/admin/emisiones/${pdf.id}/descargar`} aria-label={`PDF de ${rest.join(" · ")}`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
    </div>
    {now && surveySelect && <div className="px-4">{surveySelect}</div>}
  </li>;
}

/** El inmueble: su primera foto a sangre con tipo y precio; sin foto, la ubicación; sin inmueble, cómo vincularlo. */
function PropertyPiece({ op, property, interview, className, onLink }: { op: OperationRecord; property?: Propiedad; interview: OperationalInterview | null; className?: string; onLink: () => void }) {
  const flow = flowOf(op);
  const photo = property?.galeria?.[0]?.src;
  const expected = interview?.respuestas.presupuestoEstado === "conocido" && interview.respuestas.importe ? `${isOwnerRoute(flow.ruta) ? "espera" : "presupuesto"} $${Math.round(Number(interview.respuestas.importe)).toLocaleString("en-US")} ${interview.respuestas.moneda ?? ""}`.trim() : "";
  const price = property?.precio.modalidad === "publico" && property.precio.monto ? `$${Math.round(property.precio.monto).toLocaleString("en-US")} ${property.precio.moneda}` : expected || "Precio por definir";
  if (!property) return <section aria-label="Inmueble" className={cn(s.piece, className)}>
    <div className={s.pieceHead}><h2 className={s.pieceTitle}>Inmueble</h2></div>
    <p className="text-sm text-muted-foreground">{op.propiedad_slug ? "El inmueble vinculado no está disponible." : "Sin inmueble vinculado."}{expected ? ` ${expected.charAt(0).toUpperCase()}${expected.slice(1)}.` : ""}</p>
    <span><Button onClick={onLink}>Vincular inmueble</Button></span>
  </section>;
  return <section aria-label="Inmueble" className={cn(s.photoPiece, className)} data-photo={photo ? "true" : "false"}>
    {photo ? <><Image unoptimized fill sizes="(max-width: 899px) 100vw, 50vw" src={photo} alt="" className={s.photoImg} /><span className={s.photoScrim} aria-hidden="true" /></> : <House size={40} aria-hidden="true" className={s.photoIcon} />}
    <span className={s.photoChip}>{TIPO_LABELS[property.tipo] ?? "Inmueble"} · {price}</span>
    <span className="relative flex min-w-0 flex-col gap-0.5">
      <strong className={s.photoTitle}>{property.titulo}</strong>
      <span className={s.photoMeta}>{property.direccionAproximada || property.zona}{property.galeria?.length ? ` · ${property.galeria.length === 1 ? "1 foto" : `${property.galeria.length} fotos`}` : ""}</span>
      <Link href={`/admin/propiedades/${encodeURIComponent(property.slug)}/editar`} className={s.photoLink}>Ver ficha</Link>
    </span>
  </section>;
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

/**
  Lista de documentos guardada como pasos de la tarea de la operación (COR-06). Cada renglón se
  recibe, no aplica con su motivo o, si depende de algo que la entrevista no pregunta, se resuelve
  respondiendo su pregunta. Si ya está en «Documentos del cliente», se marca recibido con un clic.
  Al quedar todos listos, la tarea se completa.
*/
function Checklist({ task, answers, expedienteId, disabled, onError }: { task: Task; answers: Record<string, unknown>; expedienteId: string; disabled: boolean; onError: (message: string) => void }) {
  const [busy, setBusy] = React.useState(false), [extra, setExtra] = React.useState("");
  const [motivo, setMotivo] = React.useState<{ id: string; texto: string } | null>(null);
  const [archivos, setArchivos] = React.useState<ArchivoCliente[]>([]);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ archivos?: ArchivoCliente[] }>(`/api/admin/expedientes/${expedienteId}/archivos`).then(r => { if (alive) setArchivos(r.archivos ?? []); }).catch(() => undefined);
    return () => { alive = false; };
  }, [expedienteId]);
  const pasos = task.pasos as PasoChecklist[];
  const listos = pasos.filter(pasoCompleto).length, total = pasos.length;
  const sugeridos = React.useMemo(() => checklistFor(answers), [answers]);
  const desactualizado = checklistDesactualizado(pasos, sugeridos);
  async function save(next: PasoChecklist[]) {
    setBusy(true); onError("");
    try {
      const complete = checklistCompleto(next);
      await upsert(db.tareas, { ...task, pasos: next, estado: complete ? "completada" : task.estado === "completada" ? "en-curso" : task.estado }, db.tareas.version(task));
      return true;
    } catch (cause) { onError(`No se pudo guardar: ${errorMessage(cause)}`); return false; } finally { setBusy(false); }
  }
  /** Cambia un renglón; un valor `undefined` quita ese dato del renglón. */
  const cambiar = (id: string, patch: Partial<PasoChecklist>) => save(pasos.map(p => {
    if (p.id !== id) return p;
    const next = { ...p, ...patch } as Record<string, unknown>;
    for (const key of Object.keys(next)) if (next[key] === undefined) delete next[key];
    return next as PasoChecklist;
  }));
  function add(event: React.FormEvent) {
    event.preventDefault();
    const texto = extra.trim(); if (!texto) return;
    let n = 1; while (pasos.some(p => p.id === `X${n}`)) n++;
    void save([...pasos, { id: `X${n}`, texto: `D22 · ${texto}`, hecho: false }]).then(ok => { if (ok) setExtra(""); });
  }
  function guardarMotivo(event: React.FormEvent) {
    event.preventDefault();
    if (!motivo?.texto.trim()) return;
    void cambiar(motivo.id, { noAplica: motivo.texto.trim().slice(0, 500), hecho: false, porConfirmar: undefined, archivoId: undefined }).then(ok => { if (ok) setMotivo(null); });
  }
  // Un documento del cliente ya leído que corresponde al renglón.
  const enDocumentos = (paso: PasoChecklist) => archivos.find(a => !a.deleted_at && a.tipo_documento && CODIGOS_POR_TIPO_DOCUMENTO[a.tipo_documento]?.includes(paso.id));
  const lock = disabled || busy;
  return <div className="flex w-full flex-col gap-1">
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-semibold">Documentos del propietario</p>
      <span className="text-sm text-muted-foreground">{listos} de {total} listos</span>
    </div>
    {desactualizado && <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-border p-3 text-sm">
      <span className="min-w-0 flex-1">La entrevista cambió. Se conserva lo recibido y lo que no aplica.</span>
      <Button disabled={lock} onClick={() => void save(actualizarChecklist(pasos, sugeridos))}>Actualizar la lista</Button>
    </div>}
    <ul className="flex flex-col">{pasos.map(paso => {
      const archivo = !paso.hecho && !paso.noAplica ? enDocumentos(paso) : undefined;
      const agregado = !/^D\d{2}$/.test(paso.id);
      const pregunta = !pasoCompleto(paso) && paso.porConfirmar;
      return <li key={paso.id} className="flex flex-col gap-1 border-b border-border py-1.5 last:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {paso.noAplica || pregunta
            ? <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
              <span className={paso.noAplica ? "text-muted-foreground line-through" : ""}>{paso.texto}</span>
              {paso.noAplica ? <span className="text-sm text-muted-foreground">No aplica: {paso.noAplica}</span> : <span className="text-sm text-[var(--warning)]">Por confirmar: {paso.porConfirmar}</span>}
            </div>
            : <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-5 shrink-0" checked={paso.hecho} disabled={lock} onChange={e => void cambiar(paso.id, { hecho: e.target.checked, ...(e.target.checked ? {} : { archivoId: undefined }) })} />
              <span className={paso.hecho ? "text-muted-foreground" : ""}>{paso.texto}</span>
            </label>}
          <span className="flex flex-wrap gap-1">
            {pregunta ? <>
              <Button variant="ghost" disabled={lock} aria-label={`Sí aplica: ${paso.texto}`} onClick={() => void cambiar(paso.id, { aplica: true, porConfirmar: undefined })}>Sí aplica</Button>
              <Button variant="ghost" disabled={lock} aria-label={`No aplica: ${paso.texto}`} onClick={() => void cambiar(paso.id, { noAplica: motivoNoAplica(answers, paso.id), porConfirmar: undefined })}>No aplica</Button>
            </> : paso.noAplica ? <Button variant="ghost" disabled={lock} aria-label={`Sí aplica: ${paso.texto}`} onClick={() => void cambiar(paso.id, { noAplica: undefined, aplica: true })}>Sí aplica</Button>
              : !paso.hecho && <Button variant="ghost" disabled={lock} aria-label={`No aplica: ${paso.texto}`} onClick={() => setMotivo({ id: paso.id, texto: "" })}>No aplica</Button>}
            {agregado && <Button variant="ghost" iconOnly aria-label={`Quitar ${paso.texto}`} disabled={lock} onClick={() => void save(pasos.filter(p => p.id !== paso.id))}><Trash2 size={16} aria-hidden="true" /></Button>}
          </span>
        </div>
        {archivo && <div className="flex flex-wrap items-center gap-2 pl-8 text-sm">
          <span className="min-w-0 flex-1 text-muted-foreground">Ya está en «Documentos del cliente»: «{archivo.titulo}».</span>
          <Button disabled={lock} onClick={() => void cambiar(paso.id, { hecho: true, archivoId: archivo.id, porConfirmar: undefined })}>Marcar recibido</Button>
        </div>}
        {paso.hecho && paso.archivoId && <a className="pl-8 text-sm underline" href={`/api/admin/archivos-cliente/${paso.archivoId}/descargar`} target="_blank" rel="noopener">Ver el documento</a>}
        {motivo?.id === paso.id && <form onSubmit={guardarMotivo} className="flex flex-wrap items-end gap-2 pl-8">
          <label className="min-w-0 flex-1 text-sm">Por qué no aplica<input className={inputClass} autoFocus maxLength={500} value={motivo.texto} disabled={lock} onChange={e => setMotivo({ id: paso.id, texto: e.target.value })} onKeyDown={e => { if (e.key === "Escape") setMotivo(null); }} placeholder="Ej. El inmueble no tiene toma de agua" /></label>
          <Button type="submit" variant="primary" disabled={lock || !motivo.texto.trim()}>Guardar</Button>
          <Button disabled={lock} onClick={() => setMotivo(null)}>Cancelar</Button>
        </form>}
      </li>;
    })}</ul>
    <form onSubmit={add} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">Agregar otro documento<input className={inputClass} maxLength={200} value={extra} disabled={lock} onChange={e => setExtra(e.target.value)} placeholder="Ej. Constancia de no adeudo de mantenimiento" /></label>
      <Button type="submit" disabled={lock || !extra.trim()}>Agregar</Button>
    </form>
    <p className="mt-1 text-sm text-muted-foreground">{listos === total && total > 0 ? "Todos los documentos están listos." : "Si no aplica, márcalo y di por qué. «Recibido» no es revisado: eso va en el dictamen jurídico."}</p>
  </div>;
}

/** Próxima tarea con fecha; se cambia la fecha o se agenda una nueva sin salir de la operación. */
function NextTask({ op, today, className }: { op: OperationRecord; today: string; className?: string }) {
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
  return <Card id="proxima-tarea" className={cn(s.piece, s.taskPiece, className)} aria-label="Próxima tarea" data-late={late || undefined}>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <h2 className={s.pieceTitle}>Próxima tarea</h2>
      {next ? <>
        <span className="flex min-w-0 flex-col gap-0.5"><span className={cn("text-sm", late ? s.lateText : "text-muted-foreground")}>{next.vence ? `${late ? "Venció el " : next.vence === today ? "Hoy · " : ""}${weekdayDate(next.vence)} ${shortDate(next.vence).split(" ")[1]}` : "Sin fecha"}</span><Link href={`/admin/tareas/${encodeURIComponent(next.id)}`} className={s.taskTitle}>{next.titulo}</Link></span>
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
    <p className="mt-3 text-sm text-muted-foreground">Si no coinciden, corrige la ficha y registra el acuerdo. Los documentos generados no cambian.</p>
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

/**
  Informe mensual al propietario mientras el inmueble se promueve o negocia. Preparado no es
  entregado (RP-88, COR-08): la entrega se registra aparte, a mano, con fecha, canal y quién lo
  entregó; el aviso de vencido cuenta desde la última entrega y, si no hay, desde el preparado.
*/
function OwnerReport({ op, today, disabled, onSave }: { op: OperationRecord; today: string; disabled: boolean; onSave: Save }) {
  const runs = useRuns("informe-propietario", [op.id]);
  const advisers = useCollection(db.asesores);
  const flow = flowOf(op);
  const prepared = runs?.filter(run => run.result != null);
  const entregas = [...(flow.entregasInforme ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultima = entregas[0];
  const status = prepared || ultima ? ownerReportStatus(lastOwnerReport(flow, prepared?.[0]?.updatedAt), today) : undefined;
  const [form, setForm] = React.useState<{ fecha: string; canal: EntregaInforme["canal"] | ""; responsable: string } | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const abrir = () => { setNotice(""); setError(""); setForm({ fecha: today, canal: "", responsable: advisers.find(a => a.id === op.asesor_id)?.nombre ?? "" }); };
  async function registrar(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !form.canal || !form.responsable.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const entrega: EntregaInforme = { fecha: form.fecha, canal: form.canal, responsable: form.responsable.trim().slice(0, 160), registradoEl: new Date().toISOString() };
      await onSave({ flujo: { ...flow, entregasInforme: [...(flow.entregasInforme ?? []), entrega].slice(-120) } });
      setForm(null); setNotice("Entrega registrada.");
    } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  const lock = disabled || busy;
  const preparado = prepared?.[0]?.updatedAt;
  return <Card className="flex flex-col gap-2 p-5" aria-label="Informe al propietario">
    <h2 className="m-0 flex items-center gap-2 text-base"><FileText size={18} aria-hidden="true" />Informe mensual al propietario</h2>
    <p className={cn("text-sm", status && status.estado !== "al_dia" && s.lateText)}>{runs === undefined ? "Consultando informes…" : runs === null && !ultima ? "No se pudieron consultar los informes. Recarga la página para reintentar." : !status ? "Todavía no hay un informe preparado para esta operación."
      : status.estado === "vencido" ? `Vencido desde el ${shortDate(status.proximo!)}.` : `Al día; el siguiente toca el ${shortDate(status.proximo ?? today)}.`}</p>
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Último preparado</dt><dd>{preparado ? shortDate(preparado) : "Ninguno"}</dd>
      <dt className="text-muted-foreground">Última entrega</dt><dd>{ultima ? `${shortDate(ultima.fecha)} · ${CANALES_INFORME[ultima.canal]} · ${ultima.responsable}` : "Sin registrar"}</dd>
    </dl>
    {preparado && (!ultima || ultima.fecha < preparado.slice(0, 10)) && !form && <p className="text-sm text-[var(--warning)]">El último informe preparado todavía no se registra como entregado.</p>}
    {form ? <form onSubmit={registrar} className="mt-1 grid gap-2 sm:grid-cols-3" aria-label="Registrar entrega del informe">
      <label className="text-sm">Fecha de entrega<input type="date" className={inputClass} required max={today} value={form.fecha} disabled={lock} onChange={e => setForm({ ...form, fecha: e.target.value })} /></label>
      <label className="text-sm">Canal<select className={selectClass} required value={form.canal} disabled={lock} onChange={e => setForm({ ...form, canal: e.target.value as EntregaInforme["canal"] })}>
        <option value="">Elige…</option>{Object.entries(CANALES_INFORME).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="text-sm">Quién lo entregó<input className={inputClass} required maxLength={160} value={form.responsable} disabled={lock} onChange={e => setForm({ ...form, responsable: e.target.value })} /></label>
      <span className="flex flex-wrap gap-2 sm:col-span-3">
        <Button type="submit" variant="primary" disabled={lock || !form.fecha || !form.canal || !form.responsable.trim()}>Guardar entrega</Button>
        <Button disabled={lock} onClick={() => setForm(null)}>Cancelar</Button>
      </span>
    </form> : <span className="flex flex-wrap gap-2">
      <ButtonLink href={`/admin/apps/informe-propietario?expedienteId=${encodeURIComponent(op.id)}`}>Preparar informe del mes</ButtonLink>
      <Button disabled={lock} onClick={abrir}>Registrar entrega</Button>
    </span>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {entregas.length > 1 && <details className="text-sm"><summary className="cursor-pointer">Entregas anteriores</summary>
      <ul className="mt-1 flex flex-col gap-0.5">{entregas.slice(1).map(e => <li key={`${e.fecha}-${e.registradoEl ?? e.responsable}`}>{shortDate(e.fecha)} · {CANALES_INFORME[e.canal]} · {e.responsable}</li>)}</ul>
    </details>}
    <p className="text-sm text-muted-foreground">Informe mensual al propietario. Prepararlo no es entregarlo: registra cuándo, por dónde y quién.</p>
  </Card>;
}

/** Visitas de la agenda y ofertas comparadas del inmueble. */
function VisitsAndOffers({ op, today, documents }: { op: OperationRecord; today: string; documents: Evidence["documents"] }) {
  const events = useCollection(db.eventos), leads = useCollection(db.leads);
  const counterpart = op.flujo?.contraparteId;
  // El interesado (lead) de cada visita y el que firma: contraparte del propietario (RP-93, COR-11).
  const who = (leadId?: string) => leads.find(l => l.id === leadId)?.nombre;
  const signer = who(op.flujo?.contraparteLeadId);
  const offers = useRuns("ofertas", counterpart ? [op.id, counterpart] : [op.id]);
  const visits = events.filter(e => e.tipo === "visita" && (e.expedienteId === op.id || !!op.propiedad_slug && e.propiedadSlug === op.propiedad_slug)).sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const upcoming = visits.filter(e => e.fecha >= today), past = visits.filter(e => e.fecha < today);
  const offerDocs = documents.filter(d => d.formato_id === "14").length;
  return <Card className="flex flex-col gap-4 p-5" aria-label="Visitas y ofertas del inmueble">
    <h2 className="m-0 flex items-center gap-2 text-base"><CalendarDays size={18} aria-hidden="true" />Visitas y ofertas del inmueble</h2>
    {signer && <p className="text-sm">Contraparte: <Link className="font-semibold underline underline-offset-4" href={`/admin/leads/${encodeURIComponent(op.flujo!.contraparteLeadId!)}`}>{signer}</Link> (interesado que firma con el propietario).</p>}
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 text-sm"><p className="font-semibold">Próximas visitas</p>
        {upcoming.length ? <ul className="flex flex-col gap-1">{upcoming.slice(0, 5).map(e => <li key={e.id}><Link className="underline" href={`/admin/agenda?fecha=${e.fecha}&evento=${encodeURIComponent(e.id)}`}>{e.titulo}</Link> · {shortDate(e.fecha)}{e.hora ? ` ${e.hora}` : ""}{who(e.leadId) ? ` · ${who(e.leadId)}` : ""}</li>)}</ul> : <p className="text-muted-foreground">{op.propiedad_slug ? "Sin visitas próximas en la agenda." : "Vincula el inmueble para ver sus visitas."}</p>}
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
