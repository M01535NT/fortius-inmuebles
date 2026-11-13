import { isTaskOpen, type Task } from "@/lib/tasks";
import { COMPARABLES_HREF } from "@/lib/apps/catalog";
import { checklistCompleto } from "@/lib/formatos/checklist-documentos";
import { appraisalState, emptyWorkflow, exceptionKeys, isOwnerRoute, ownerProcess, verificationRequirements, nextWorkflowStage, phaseRequirements, processPhase, requiredReviews, requirementPhase, reviewComplete, stageLabel, verificationComplete, workflowBlockers, WORKFLOW_REQUIREMENTS, WORKFLOW_STATES, WORKFLOW_STAGES, type InitialInterviewStatus, type OperationWorkflow, type RequirementKey, type SalePhase, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { requirementName, shortDate } from "@/lib/admin/today";
import { isLawyerTask, type PropertyCondition } from "@/lib/intake/condition";

/*
  Operación guiada (encargo del panel guiado, sección 4): qué toca en la etapa,
  qué falta para pasar a la siguiente y cómo se ve cada operación en el tablero.
  Las reglas de avance siguen siendo las de operation-workflow.ts.
*/

export type OperationRecord = {
  id: string; folio: string; version: number; cliente_id: string; asesor_id: string; operacion: string; unidad?: string;
  propiedad_slug: string | null; etapa?: WorkflowStage; fecha_objetivo?: string | null; checklist?: Record<string, string>;
  flujo?: OperationWorkflow | null; created_at?: string; updated_at?: string; deleted_at?: string | null;
  /** No viene de la base: lo calcula la pantalla con los documentos de la operación (entrevista inicial 02). */
  inicial?: InitialInterviewStatus;
};
type Review = NonNullable<OperationWorkflow["requisitos"][RequirementKey]>;

export function operationHref(id: string, query?: Record<string, string>) {
  const search = query ? new URLSearchParams(query).toString() : "";
  return `/admin/operaciones/${encodeURIComponent(id)}${search ? `?${search}` : ""}`;
}
/** Venta, renta e inversión siguen la guía; administración y otras conservan el seguimiento simple. */
export const isGuided = (op: Pick<OperationRecord, "operacion">) => ["venta", "renta", "inversion"].includes(op.operacion);
export function defaultRoute(operacion?: string): OperationWorkflow["ruta"] { return operacion === "inversion" ? "inversion" : operacion === "renta" ? "arrendador" : "captacion"; }
export function flowOf(op: Pick<OperationRecord, "flujo" | "operacion">): OperationWorkflow { return op.flujo ?? emptyWorkflow(defaultRoute(op.operacion)); }
export const stageOf = (op: Pick<OperationRecord, "etapa">): WorkflowStage => op.etapa ?? "captacion";

/**
  Arranque del propietario con lo que sabe cada pantalla: por formato, si existe y si su versión
  actual está emitida (true), más la tarea del checklist. Hoy, Operaciones y la operación usan
  esta misma función para nombrar la etapa igual (COR-03).
*/
export function initialStatus(formats: ReadonlyMap<string, boolean> | undefined, checklist?: Pick<Task, "pasos">): InitialInterviewStatus {
  return {
    iniciada: !!formats?.has("02"), emitida: formats?.get("02") === true,
    levantamiento: formats?.has("04") ? (formats.get("04") ? "emitido" : "borrador") : undefined,
    documentos: checklist ? (checklistCompleto(checklist.pasos) ? "completo" : "pendiente") : undefined,
  };
}

/** Etapas del avance: las 10 del propietario, de venta o de renta (COR-04); las demás rutas usan sus propios pasos (sin «archivado»). */
export function routeStages(op: OperationRecord, today: string) {
  const flow = flowOf(op), stage = stageOf(op);
  if (isOwnerRoute(flow.ruta)) {
    const phase = processPhase(stage, op.flujo ?? flow, today, op.inicial), process = ownerProcess(flow.ruta);
    return { labels: process.map(p => p.label), current: process.findIndex(p => p.key === phase), phase };
  }
  const steps = WORKFLOW_STAGES.filter(s => s !== "cerrado");
  return { labels: steps.map(s => stageLabel(s, flow.ruta)), current: Math.min(WORKFLOW_STAGES.indexOf(stage), steps.length - 1), phase: undefined };
}

/** Formatos que deja cada etapa del propietario (decisión del titular, 16/10/2026). «04» es el levantamiento de cualquier tipo (04A–04G). */
export const PHASE_FORMATS: Partial<Record<SalePhase, readonly string[]>> = {
  captacion: ["02"], levantamiento: ["04"], dictamen: ["05", "06"], verificacion: ["07", "08"], contrato: ["09", "10"],
};
/** En la renta (MRP-01) la titularidad se revisa sin dictamen completo y la opinión de renta es el 07; la intermediación para renta aún no tiene plantilla. */
const RENT_PHASE_FORMATS: Partial<Record<SalePhase, readonly string[]>> = {
  captacion: ["02"], levantamiento: ["04"], verificacion: ["07"], contrato: ["10"],
};
export function phaseFormats(phase: SalePhase, ruta?: string | null): readonly string[] {
  return (ruta === "arrendador" ? RENT_PHASE_FORMATS : PHASE_FORMATS)[phase] ?? [];
}
/** Etapas del propietario que dejan documentos y se pueden consultar después. */
export const PHASES_WITH_DOCUMENTS: readonly SalePhase[] = ["captacion", "levantamiento", "documentos", "dictamen", "verificacion", "contrato"];
export type FormatStatus = "terminado" | "borrador" | undefined;

/** Nombre corto de cada documento de etapa con su artículo, para no mostrar números de formato en el texto (C15, C37). */
const DOC_NAMES: Record<string, readonly ["el" | "la", string]> = {
  "02": ["la", "entrevista inicial"], "04": ["el", "levantamiento"], "05": ["la", "revisión jurídica"], "06": ["la", "opinión jurídica"],
  "07": ["la", "opinión de valor"], "08": ["la", "estimación del neto"], "09": ["el", "contrato de servicio"], "10": ["el", "plan de comercialización"],
};
function missingDoc(formato: string, draft: boolean) {
  const [article, noun] = DOC_NAMES[formato] ?? ["el", "documento"];
  return draft ? `el PDF ${article === "el" ? "del" : "de la"} ${noun}` : `${article} ${noun}`;
}

/** Lo que dejó pendiente una etapa ya pasada («Falta la entrevista inicial»); vacío si está completa o no deja documentos. */
export function phaseGap(phase: SalePhase, status: (formato: string) => FormatStatus, checklist?: InitialInterviewStatus["documentos"], ruta?: string | null) {
  if (phase === "documentos") return checklist === "completo" ? "" : checklist ? "Faltan documentos" : "Falta la lista de documentos";
  const missing = phaseFormats(phase, ruta).filter(f => status(f) !== "terminado").map(f => missingDoc(f, !!status(f)));
  return missing.length ? `Falta ${missing.length > 1 ? `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}` : missing[0]}` : "";
}

/*
  Las etapas se nombran por sí mismas (titular, 27/10/2026): se retiraron las cuatro fases
  del boceto C («Conocer», «Revisar», «Preparar y publicar», «Vender y cerrar») porque eran un
  segundo vocabulario que confundía; cada operación dice «Etapa 3 de 10 · Levantamiento».
*/
export type CloseStep = { stage: WorkflowStage; label: string; state: "done" | "now" | "next" };
export type TrackStage = { n: number; label: string; key?: SalePhase; pasos?: CloseStep[] };

/** Los cuatro pasos de «Cierre y entrega» (COR-09): firma y pago, entrega, postventa y archivo. */
const CLOSE_STAGES = ["cierre", "entrega", "postventa", "cerrado"] as const satisfies readonly WorkflowStage[];
export function closeSteps(op: OperationRecord): CloseStep[] {
  const flow = flowOf(op), at = CLOSE_STAGES.indexOf(stageOf(op) as typeof CLOSE_STAGES[number]);
  return CLOSE_STAGES.map((stage, i) => {
    const label = stageLabel(stage, flow.ruta === "arrendador" ? "arrendador" : "captacion").replace("Cierre y entrega · ", "").replace(/^./, c => c.toUpperCase());
    return { stage, label, state: at < 0 || i > at ? "next" : i < at || stage === "cerrado" ? "done" : "now" };
  });
}

/** Etapas de la operación con su número y su fase: las 10 del propietario o los pasos de su ruta. */
export function stageTrack(op: OperationRecord, today: string) {
  const flow = flowOf(op), owner = isOwnerRoute(flow.ruta);
  const { labels, current, phase } = routeStages(op, today);
  const stages: TrackStage[] = labels.map((label, i) => {
    if (!owner) return { n: i + 1, label };
    const key = ownerProcess(flow.ruta)[i].key;
    if (key !== "cierre") return { n: i + 1, label, key };
    // La etapa 10 dice en qué paso va: «Cierre y entrega · entrega».
    const pasos = closeSteps(op), actual = phase === "cierre" ? pasos.find(p => p.state === "now") ?? pasos.at(-1) : undefined;
    return { n: i + 1, label: actual ? `${label} · ${actual.label.charAt(0).toLowerCase()}${actual.label.slice(1)}` : label, key, pasos };
  });
  return { stages, current, phase };
}

/** Etapas ya pasadas a las que les falta su documento, en orden («Falta el levantamiento»). */
export function pastGaps(op: OperationRecord, today: string, status: (formato: string) => FormatStatus) {
  const { stages, current } = stageTrack(op, today);
  return stages.slice(0, current).flatMap(stage => {
    if (!stage.key || !PHASES_WITH_DOCUMENTS.includes(stage.key)) return [];
    // COR-17: si el propietario trajo avalúo, a la etapa del valor no le falta la opinión de valor.
    const covered = stage.key === "verificacion" && op.flujo?.ruta === "captacion" && !!op.flujo.avaluo;
    const gap = phaseGap(stage.key, covered ? f => f === "07" ? "terminado" : status(f) : status, op.inicial?.documentos, op.flujo?.ruta);
    return gap ? [{ ...stage, key: stage.key, gap }] : [];
  });
}

/** El motivo de RP-84, del más urgente (0) al menos urgente (6). */
export type AttentionKind = "problema" | "vencida" | "falta" | "revisar" | "hoy" | "oferta" | "agendar";
export const ATTENTION_ORDER: readonly AttentionKind[] = ["problema", "vencida", "falta", "revisar", "hoy", "oferta", "agendar"];
export type Attention = { kind: AttentionKind; label: string; rank: number; late: boolean };
type AttentionInput = Pick<OperationRecord, "id" | "etapa" | "flujo"> & Partial<Pick<OperationRecord, "operacion">>;
/**
  Por qué una operación «espera algo de ti» (RP-84, COR-05). Es la única definición: la usan
  Operaciones, la cola de Hoy y el número del menú, con este orden: 1) hay un problema;
  2) tarea vencida; 3) falta un documento de una etapa anterior; 4) documento por revisar;
  5) vence hoy; 6) oferta nueva (últimos 3 días); 7) sin próxima tarea con fecha.
*/
export function attentionOf(op: AttentionInput, tasks: Task[], today: string, gap?: string, recentOffer = false): Attention | null {
  const flow = flowOf({ flujo: op.flujo, operacion: op.operacion ?? "" });
  if (stageOf(op) === "cerrado" || flow.estado === "descartada") return null;
  const reviews = Object.values(flow.requisitos);
  const open = tasks.filter(t => t.expedienteId === op.id && isTaskOpen(t));
  const at = (kind: AttentionKind, label: string, late = false): Attention => ({ kind, label, rank: ATTENTION_ORDER.indexOf(kind), late });
  if (reviews.some(r => r?.estado === "observado")) return at("problema", "Hay un problema", true);
  if (open.some(t => !!t.vence && t.vence < today)) return at("vencida", "Tarea vencida", true);
  if (gap) return at("falta", gap);
  if (reviews.some(r => r?.estado === "recibido")) return at("revisar", "Documento por revisar");
  if (open.some(t => t.vence === today)) return at("hoy", "Vence hoy");
  if (recentOffer) return at("oferta", "Oferta nueva");
  if (flow.estado !== "pausada" && !open.some(t => !!t.vence)) return at("agendar", "Sin próxima tarea");
  return null;
}
/** Una oferta registrada en los últimos 3 días para esta operación. */
export function recentOfferOf(operationId: string, offers: ReadonlyArray<{ updatedAt: string; context?: { expedienteId?: string } }> | null | undefined, today: string) {
  const from = shiftDay(today, -3);
  return offers?.filter(o => o.context?.expedienteId === operationId && o.updatedAt.slice(0, 10) >= from).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}
function shiftDay(date: string, days: number) { const d = new Date(date.slice(0, 10) + "T12:00:00.000Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }

/** Formatos que se trabajan en cada etapa del propietario; el aviso (01) se entrega en la entrevista y no detiene el avance. */
/*
  Una etapa, sus documentos (titular, 27/10/2026): cada etapa abre su formato en vivo. De la
  publicación al cierre los documentos se ofrecen sin detener la etapa (RP-82), porque el avance
  lo marcan sus confirmaciones; «venta» los deja fuera de la renta del propietario (perfil del
  comprador, oferta de compra y promesa de compraventa); «soloRenta», al revés, deja el contrato
  de arrendamiento (20, DOC-14) solo en la renta del propietario.
*/
const PHASE_ITEMS: Partial<Record<SalePhase, ReadonlyArray<{ formato: string; optional?: true; venta?: true; soloRenta?: true; renta?: "opcional" }>>> = {
  prospecto: [{ formato: "02" }], captacion: [{ formato: "02" }, { formato: "01", optional: true }], levantamiento: [{ formato: "04" }, { formato: "19", optional: true }],
  dictamen: [{ formato: "05", renta: "opcional" }, { formato: "06", venta: true }], verificacion: [{ formato: "07" }, { formato: "08", venta: true }], contrato: [{ formato: "09", renta: "opcional" }, { formato: "10" }],
  publicacion: [{ formato: "11", optional: true }],
  visitas: [{ formato: "12", optional: true, venta: true }, { formato: "13", optional: true }, { formato: "14", optional: true, venta: true }],
  cierre: [{ formato: "15", optional: true, venta: true }, { formato: "16", optional: true }, { formato: "17", optional: true }, { formato: "18", optional: true }, { formato: "20", optional: true, soloRenta: true }],
};
/** Formatos de una etapa del propietario según su ruta (la renta no usa los de compraventa). */
export function stageDocuments(phase: SalePhase, ruta: OperationWorkflow["ruta"]) {
  const rent = ruta === "arrendador";
  // En la renta: sin dictamen (06) ni neto de venta (08); la revisión (05) y el 09 se ofrecen sin detener la etapa.
  return (PHASE_ITEMS[phase] ?? []).filter(item => !(item.venta && rent) && !(item.soloRenta && !rent)).map(({ formato, optional, renta }) => ({ formato, ...(optional || (rent && renta) ? { optional: true as const } : {}) }));
}
export type StageItem =
  | { kind: "documento"; formato: string; status: FormatStatus; optional?: true }
  | { kind: "checklist"; status: InitialInterviewStatus["documentos"] }
  /** El paso que abre la siguiente etapa del propietario: iniciar el levantamiento o el checklist. */
  | { kind: "inicio"; step: "levantamiento" | "checklist" }
  | { kind: "requisito"; key: RequirementKey; earlier: boolean; state: ReturnType<typeof reviewState>; done: boolean }
  | { kind: "pendiente"; text: string; why: string; place: Missing["place"] }
  /** COR-14: con una condición declarada (o «Evaluar la operación» en la 02), el abogado revisa antes del levantamiento. */
  | { kind: "abogado"; condition?: string; task?: Task; done: boolean }
  /** COR-14: la 02 terminó con «Pausar» o «Referir»; un clic lo aplica. */
  | { kind: "decision02"; action: "pausa" | "referir" };

/** Lo que la etapa necesita saber de la llamada y de la 02. */
export type StageContext = { condition?: PropertyCondition | null; next02?: string };

/** Chips de la situación y la condición: se muestran igual en la operación, Operaciones, Hoy y Contactos. */
export function operationTags(op: { flujo?: OperationWorkflow | null }, condition?: PropertyCondition | null): string[] {
  const estado = op.flujo?.estado ?? "activa";
  // DEC-41: mientras no se firme la intermediación, la visita autorizada antes de la firma se ve.
  const priorVisit = (op.flujo?.visitasPrevias?.length ?? 0) > 0 && op.flujo?.requisitos?.intermediacion?.estado !== "revisado";
  return [...(estado !== "activa" ? [WORKFLOW_STATES[estado]] : []), ...(condition ? [condition.text] : []), ...(op.flujo?.heredado ? [INHERITED_TAG] : []), ...(exceptionKeys(op.flujo).length ? [EXCEPTION_TAG] : []), ...(priorVisit ? ["Visita autorizada antes de la firma"] : [])];
}
/** COR-24: inmueble que el asesor trajo con contrato firmado. */
export const INHERITED_TAG = "Inventario heredado";
/** COR-20: la operación avanza con algún requisito cubierto por excepción del director. */
export const EXCEPTION_TAG = "Con excepción autorizada";

/** «Para terminar la etapa»: los documentos que se llenan, lo que se confirma y lo demás que impide avanzar. */
export function stageItems(op: OperationRecord, tasks: Task[], today: string, status: (formato: string) => FormatStatus, context: StageContext = {}): StageItem[] {
  const flow = flowOf(op), { phase } = routeStages(op, today);
  const items: StageItem[] = [];
  const active = flow.estado === "activa", interviewed = status("02") === "terminado";
  if (isOwnerRoute(flow.ruta) && phase === "captacion" && active && interviewed && (context.next02 === "pausa" || context.next02 === "referir")) items.push({ kind: "decision02", action: context.next02 });
  if (isOwnerRoute(flow.ruta) && phase) {
    // COR-17: con el avalúo del propietario vigente, la opinión de valor (07) ya no se pide.
    const appraised = flow.ruta === "captacion" && appraisalState(flow, today) === "vigente";
    for (const item of stageDocuments(phase, flow.ruta)) items.push({ kind: "documento", formato: item.formato, status: status(item.formato), ...(item.optional || (appraised && item.formato === "07") ? { optional: true as const } : {}) });
    if (phase === "documentos") items.push({ kind: "checklist", status: op.inicial?.documentos });
    if (phase === "captacion" && active && (context.condition || (interviewed && context.next02 === "evaluacion"))) {
      const task = tasks.filter(t => t.expedienteId === op.id && isLawyerTask(t.titulo) && t.estado !== "cancelada").sort((a, b) => Number(isTaskOpen(b)) - Number(isTaskOpen(a)))[0];
      items.push({ kind: "abogado", ...(context.condition ? { condition: context.condition.text } : {}), ...(task ? { task } : {}), done: task?.estado === "completada" });
    }
    if (phase === "captacion" && interviewed) items.push({ kind: "inicio", step: "levantamiento" });
    if (phase === "levantamiento" && status("04") === "terminado") items.push({ kind: "inicio", step: "checklist" });
  }
  for (const { key, earlier } of currentRequirements(op, today)) items.push({ kind: "requisito", key, earlier, state: reviewState(flow, key), done: reviewComplete(flow, key, today) });
  for (const m of missingItems(op, tasks, today)) {
    // Lo de documentos ya está arriba; en el checklist también cuentan la entrevista y el levantamiento sin terminar.
    if (m.place === "ajustes" || m.place === "encargo" || m.place === "tarea" || m.place === "firma" || m.place === "cierre" || (phase === "documentos" && m.place === "operacion" && !m.text.startsWith("Recibir"))) items.push({ kind: "pendiente", text: m.text, why: m.why, place: m.place });
  }
  return items;
}
export function itemDone(item: StageItem) {
  return item.kind === "documento" ? item.status === "terminado" : item.kind === "checklist" ? item.status === "completo" : item.kind === "requisito" || item.kind === "abogado" ? item.done : false;
}
/** Cuenta para «N de M»: no el aviso opcional ni lo que quedó abierto de una etapa anterior. */
export const itemCounted = (item: StageItem) => item.kind !== "inicio" && item.kind !== "decision02" && !(item.kind === "documento" && item.optional) && !(item.kind === "requisito" && item.earlier);
/** «Ahora toca»: primero un problema marcado; después lo primero sin terminar, en orden. */
export function nowItem(items: StageItem[]) {
  return items.find(i => i.kind === "requisito" && i.state === "observado") ?? items.find(i => !itemDone(i) && !(i.kind === "documento" && i.optional));
}

/** Qué hacemos y para qué en la etapa actual. */
export function stageGuide(op: OperationRecord, today: string) {
  const { phase, labels, current } = routeStages(op, today);
  const sale = phase ? ownerProcess(flowOf(op).ruta).find(p => p.key === phase) : undefined;
  return { title: labels[current], que: sale?.hace, para: sale?.para };
}

/** Requisitos que se trabajan ahora. Los de etapas anteriores que siguen abiertos se agregan al final. */
export function currentRequirements(op: OperationRecord, today: string): Array<{ key: RequirementKey; earlier: boolean }> {
  const flow = flowOf(op), stage = stageOf(op), next = nextWorkflowStage(stage);
  const routeKeys = new Set(requiredReviews(flow.ruta, "cerrado"));
  let own: RequirementKey[], before: RequirementKey[];
  if (isOwnerRoute(flow.ruta)) {
    const process = ownerProcess(flow.ruta);
    const index = process.findIndex(p => p.key === processPhase(stage, op.flujo ?? flow, today, op.inicial));
    own = phaseRequirements(process[index].key, flow.ruta).filter(k => routeKeys.has(k));
    before = [...routeKeys].filter(k => { const phase = requirementPhase(k, flow.ruta); return !!phase && process.findIndex(p => p.key === phase) < index; });
  } else {
    before = requiredReviews(flow.ruta, stage);
    own = next ? requiredReviews(flow.ruta, next).filter(k => !before.includes(k)) : [];
  }
  const ownSet = new Set(own);
  const earlier = before.filter(k => !ownSet.has(k) && !reviewComplete(flow, k, today));
  const flagged = (Object.keys(flow.requisitos) as RequirementKey[]).filter(k => flow.requisitos[k]?.estado === "observado" && !ownSet.has(k) && !earlier.includes(k));
  return [...own.map(key => ({ key, earlier: false })), ...[...earlier, ...flagged].map(key => ({ key, earlier: true }))];
}
export const reviewState = (flow: OperationWorkflow, key: RequirementKey) => flow.requisitos[key]?.estado ?? "pendiente";
export const allowsNotApplicable = (key: RequirementKey) => "noAplica" in WORKFLOW_REQUIREMENTS[key];
export const hasValidity = (key: RequirementKey) => "vigencia" in WORKFLOW_REQUIREMENTS[key];

/** Destino del botón «Pasar a». Del prospecto a la verificación las etapas se abren solas al completar lo anterior; solo cambia la etapa interna al pasar a «Dictamen jurídico» y a «Publicación». */
export function advanceTarget(op: OperationRecord, today: string): { target?: WorkflowStage; label: string } | null {
  const flow = flowOf(op), stage = stageOf(op), next = nextWorkflowStage(stage);
  if (!next) return null;
  if (!isOwnerRoute(flow.ruta)) return { target: next, label: stageLabel(next, flow.ruta) };
  const phase = processPhase(stage, op.flujo ?? flow, today, op.inicial), process = ownerProcess(flow.ruta);
  const label = (key: SalePhase) => process.find(p => p.key === key)!.label;
  if (phase === "prospecto") return { label: label("captacion") };
  if (phase === "captacion") return { label: label("levantamiento") };
  if (phase === "levantamiento") return { label: label("documentos") };
  if (phase === "dictamen") return { label: label("verificacion") };
  if (phase === "verificacion") return { label: label("contrato") };
  if (phase === "cierre") return { target: next, label: next === "cerrado" ? "Archivar la operación" : stageLabel(next, flow.ruta).replace("Cierre y entrega · ", "").replace(/^./, c => c.toUpperCase()) };
  const following = process[process.findIndex(p => p.key === phase) + 1];
  return { target: next, label: following?.label ?? stageLabel(next, flow.ruta) };
}

export type Missing = { text: string; why: string; requirement?: RequirementKey; place: "requisito" | "ajustes" | "encargo" | "tarea" | "operacion" | "firma" | "cierre" };
const BLOCKER_TEXT: Record<string, Omit<Missing, "requirement">> = {
  "Reactivar la operación antes de avanzar.": { text: "Reactivar la operación", why: "está en pausa, en regularización o descartada", place: "ajustes" },
  "Resolver las observaciones que bloquean esta actividad.": { text: "Resolver los problemas marcados", why: "un requisito dice «Hay un problema»", place: "requisito" },
  "Revisar la resolución y reactivar el encargo antes de avanzar.": { text: "Revisar la decisión del encargo", why: "está en pausa, rechazada, referida o cancelada", place: "encargo" },
  "La aceptación condicionada no autoriza esta actividad.": { text: "Revisar las condiciones del encargo", why: "la decisión con condiciones no permite este paso", place: "encargo" },
  "Registrar la decisión de captación y sus condiciones antes de comercializar.": { text: "Registrar si tomas el encargo", why: "en «Decisión del encargo» de esta etapa", place: "encargo" },
  // COR-10: la firma del contrato se registra y se revisa en la tarjeta «Firma del contrato».
  "Registrar la firma del contrato de intermediación.": { text: "Registrar la firma del contrato", why: "con el contrato firmado, la fecha y quién firmó", place: "firma" },
  "Completar la firma del contrato: faltan firmantes.": { text: "Completar la firma del contrato", why: "faltan firmantes", place: "firma" },
  "El director debe revisar la firma del contrato.": { text: "Revisión de la firma por el director", why: "sin ella no se publica", place: "firma" },
  "El contrato de intermediación terminó: registra uno nuevo para seguir.": { text: "Registrar un contrato nuevo", why: "el anterior terminó", place: "firma" },
  "Registrar quién captó y quién vendió antes de archivar.": { text: "Registrar quién captó y quién vendió", why: "para el reparto de la comisión", place: "cierre" },
  "Captura los datos del inmueble.": { text: "Vincular el inmueble", why: "se hace en los datos de la operación", place: "ajustes" },
  "Identificar la contraparte interna o externa.": { text: "Identificar al comprador o contraparte", why: "se hace en los datos de la operación", place: "ajustes" },
  "Resolver o descartar las tareas pendientes antes de archivar.": { text: "Cerrar las tareas pendientes", why: "antes de archivar", place: "tarea" },
  "Agendar una próxima tarea con fecha y responsable.": { text: "Agendar la próxima tarea", why: "con fecha y responsable", place: "tarea" },
};
function requirementWhy(r: Review | undefined) {
  if (!r || r.estado === "pendiente") return "pendiente";
  if (r.estado === "recibido") return "falta revisarlo";
  if (r.estado === "observado") return "hay un problema";
  return "falta su respaldo o ya no está vigente";
}

/** «Te falta»: lo que impide pasar a la siguiente etapa, en palabras sencillas. */
export function missingItems(op: OperationRecord, tasks: Task[], today: string, propertySlug = op.propiedad_slug): Missing[] {
  const flow = flowOf(op), target = advanceTarget(op, today);
  if (!target) return [];
  const phase = isOwnerRoute(flow.ruta) ? processPhase(stageOf(op), op.flujo ?? flow, today, op.inicial) : undefined;
  const inicial = op.inicial ?? {};
  if (phase === "prospecto") return [{ text: "Iniciar la entrevista inicial", why: "con el botón «Iniciar entrevista inicial»", place: "operacion" }];
  if (phase === "captacion" && !target.target) return [inicial.emitida ? { text: "Iniciar el levantamiento", why: "con el botón «Iniciar levantamiento»", place: "operacion" } : { text: "Terminar la entrevista inicial (02)", why: "y generar su PDF", place: "operacion" }];
  if (phase === "levantamiento") return [inicial.levantamiento === "emitido" ? { text: "Iniciar la lista de documentos", why: "con el botón «Iniciar lista»", place: "operacion" } : { text: "Terminar el levantamiento (04)", why: "y generar su PDF", place: "operacion" }];
  if (!target.target) {
    const items: Missing[] = (phase === "dictamen" ? phaseRequirements("dictamen", flow.ruta) : verificationRequirements(flow.ruta)).filter(k => !reviewComplete(flow, k, today)).map(key => ({ text: requirementName(key, flow.ruta), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" }));
    if (phase !== "dictamen" && (!flow.resolucion || !["aceptada", "condicionada"].includes(flow.resolucion.tipo))) items.push({ text: "Registrar si tomas el encargo", why: "en «Decisión del encargo» de esta etapa", place: "encargo" });
    return items;
  }
  const labels = new Map(Object.entries(WORKFLOW_REQUIREMENTS).map(([key, value]) => [value.label as string, key as RequirementKey]));
  const initial: Missing[] = phase !== "documentos" ? [] : [
    ...(inicial.documentos !== "completo" ? [{ text: "Recibir los documentos de la lista", why: "márcalos al recibirlos", place: "operacion" as const }] : []),
    ...(!inicial.emitida ? [{ text: "Terminar la entrevista inicial (02)", why: "y generar su PDF", place: "operacion" as const }] : []),
    ...(inicial.levantamiento !== "emitido" ? [{ text: "Terminar el levantamiento (04)", why: "y generar su PDF", place: "operacion" as const }] : []),
  ];
  return initial.concat(workflowBlockers(flow, target.target, { id: op.id, asesor_id: op.asesor_id, propiedad_slug: propertySlug }, tasks, today).map(blocker => {
    const key = labels.get(blocker);
    if (key) return { text: requirementName(key, flow.ruta), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" as const };
    return BLOCKER_TEXT[blocker] ?? { text: blocker, why: "", place: "operacion" as const };
  }));
}

/** Una línea bajo cada requisito: quién lo revisó y qué encontró, o qué falta. */
export function requirementDetail(flow: OperationWorkflow, key: RequirementKey) {
  const r = flow.requisitos[key];
  if (!r) return "";
  if (r.estado === "revisado") {
    const e = r.evidencia;
    const who = e?.responsable ? ` · Revisó ${e.responsable}${e.fecha ? ` el ${shortDate(e.fecha)}` : ""}` : "";
    const until = r.vigenteHasta ? ` · Vigente hasta el ${shortDate(r.vigenteHasta)}` : "";
    return `${e?.resultado?.trim() || r.soporte.trim()}${who}${until}`;
  }
  if (r.estado === "observado") return "";
  if (r.estado === "recibido") return r.soporte.trim() || "Ya lo tienes. Falta revisarlo.";
  return r.soporte.trim();
}

/** «Hay un problema» se guarda en el soporte: la primera línea es el título; el resto, la explicación. */
export function problemOf(r: Review | undefined) {
  const [title = "", ...rest] = (r?.soporte ?? "").split("\n");
  return { title: title.trim() || "Hay un problema", body: rest.join("\n").trim() };
}
export function encodeProblem(title: string, body: string) { return `${title.trim()}\n${body.trim()}`.slice(0, 1000); }

export type BoardCard = { id: string; who: string; property: string; next: string; date?: string; late: boolean; mine: boolean; column: number; href: string };

/** Tarjeta del tablero: cliente, inmueble, la próxima tarea («Sigue») y su fecha. */
export function boardCard(op: OperationRecord, tasks: Task[], today: string, names: { client: (id?: string) => string | undefined; property: (slug?: string | null) => string | undefined }, me?: string): BoardCard {
  const next = tasks.filter(t => t.expedienteId === op.id && isTaskOpen(t)).sort((a, b) => (a.vence || "9999").localeCompare(b.vence || "9999"))[0];
  const stage = stageOf(op);
  const column = ownerProcess(op.flujo?.ruta).findIndex(p => p.key === processPhase(stage, op.flujo, today, op.inicial));
  return {
    id: op.id, who: names.client(op.cliente_id) ?? op.folio,
    property: names.property(op.propiedad_slug) ?? (op.propiedad_slug ? "Inmueble no disponible" : "Sin inmueble vinculado"),
    next: next?.titulo ?? "Agendar la próxima tarea", date: next?.vence || undefined, late: !!next?.vence && next.vence < today,
    mine: !!me && op.asesor_id === me, column, href: operationHref(op.id),
  };
}
export function dueLabel(date: string | undefined, today: string) {
  if (!date) return "Sin fecha";
  if (date < today) return `Vencido · ${shortDate(date)}`;
  return date === today ? "Hoy" : shortDate(date);
}

/** Herramientas de cada etapa; se abren con el contexto de la operación. */
const PHASE_TOOLS: Record<SalePhase, Array<[string, string]>> = {
  // Revisión del catálogo (12/11/2026): en la ruta del propietario los comparables se capturan en su 07
  // y el reparto en el cierre; el propietario pregunta su neto desde la primera llamada.
  prospecto: [["neto-propietario", "ISR y neto del vendedor"]],
  levantamiento: [["fotografias", "Fotografías"], ["ficha-comercial", "Ficha del inmueble"]],
  documentos: [["revisor-expediente", "Pendientes documentales"]],
  dictamen: [["revisor-expediente", "Pendientes documentales"]],
  captacion: [["revisor-expediente", "Pendientes documentales"]],
  verificacion: [["neto-propietario", "ISR y neto del vendedor"], ["revisor-expediente", "Pendientes documentales"]],
  contrato: [["ficha-comercial", "Ficha del inmueble"], ["fotografias", "Fotografías"], ["cotizador", "Cotizador de servicios"]],
  publicacion: [["informe-propietario", "Preparar informe"], ["ficha-comercial", "Ficha del inmueble"], ["qr", "Enlaces y QR"]],
  visitas: [["ofertas", "Comparar ofertas"], ["hipoteca", "Hipoteca"], ["informe-propietario", "Preparar informe"]],
  cierre: [["neto-propietario", "ISR y neto del vendedor"], ["revisor-expediente", "Pendientes documentales"]],
};
const ROUTE_TOOLS: Partial<Record<OperationWorkflow["ruta"], Array<[string, string]>>> = {
  compra: [["comparables", "Comparar casas parecidas"], ["hipoteca", "Hipoteca"], ["gastos-compra", "Gastos de compra"], ["ofertas", "Comparar ofertas"]],
  arrendatario: [["comparables", "Comparar opciones"], ["ofertas", "Comparar ofertas"]],
  inversion: [["inversiones", "Escenarios de inversión"], ["rehabilitacion", "Rehabilitación"], ["comparables", "Comparar casas parecidas"]],
};
export function stageTools(op: OperationRecord, today: string) {
  const flow = flowOf(op), { phase } = routeStages(op, today);
  const tools = phase ? PHASE_TOOLS[phase] : ROUTE_TOOLS[flow.ruta] ?? [];
  // Comparables es la opinión de valor suelta (07): no se liga a la operación.
  return tools.map(([slug, label]) => ({ slug, label, href: slug === "comparables" ? COMPARABLES_HREF : `/admin/apps/${slug}?expedienteId=${encodeURIComponent(op.id)}` }));
}

/** El contrato se captura después de terminar la verificación (decisión del titular, 15/10/2026). */
export function contractLocked(op: OperationRecord, today: string) {
  const flow = flowOf(op);
  return isOwnerRoute(flow.ruta) && stageOf(op) === "documentacion" && !verificationComplete(flow, today);
}
