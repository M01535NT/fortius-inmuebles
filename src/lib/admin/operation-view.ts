import { isTaskOpen, type Task } from "@/lib/tasks";
import { emptyWorkflow, isOwnerRoute, VERIFICATION_REQUIREMENTS, nextWorkflowStage, phaseRequirements, processPhase, requiredReviews, requirementPhase, reviewComplete, SALE_PROCESS, stageLabel, verificationComplete, workflowBlockers, WORKFLOW_REQUIREMENTS, WORKFLOW_STAGES, type InitialInterviewStatus, type OperationWorkflow, type RequirementKey, type SalePhase, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { requirementName, shortDate } from "@/lib/admin/today";

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
    documentos: checklist ? (checklist.pasos.length > 0 && checklist.pasos.every(p => p.hecho) ? "completo" : "pendiente") : undefined,
  };
}

/** Etapas del avance: las 6 del propietario; las demás rutas usan sus propios pasos (sin «archivado»). */
export function routeStages(op: OperationRecord, today: string) {
  const flow = flowOf(op), stage = stageOf(op);
  if (isOwnerRoute(flow.ruta)) {
    const phase = processPhase(stage, op.flujo ?? flow, today, op.inicial);
    return { labels: SALE_PROCESS.map(p => p.label), current: SALE_PROCESS.findIndex(p => p.key === phase), phase };
  }
  const steps = WORKFLOW_STAGES.filter(s => s !== "cerrado");
  return { labels: steps.map(s => stageLabel(s, flow.ruta)), current: Math.min(WORKFLOW_STAGES.indexOf(stage), steps.length - 1), phase: undefined };
}

/** Formatos que deja cada etapa del propietario (decisión del titular, 16/10/2026). «04» es el levantamiento de cualquier tipo (04A–04G). */
export const PHASE_FORMATS: Partial<Record<SalePhase, readonly string[]>> = {
  captacion: ["02"], levantamiento: ["04"], dictamen: ["05", "06"], verificacion: ["07", "08"], contrato: ["09", "10"],
};
/** Etapas del propietario que dejan documentos y se pueden consultar después. */
export const PHASES_WITH_DOCUMENTS: readonly SalePhase[] = ["captacion", "levantamiento", "documentos", "dictamen", "verificacion", "contrato"];
export type FormatStatus = "terminado" | "borrador" | undefined;

/** Lo que dejó pendiente una etapa ya pasada («Falta el 02»); vacío si está completa o no deja documentos. */
export function phaseGap(phase: SalePhase, status: (formato: string) => FormatStatus, checklist?: InitialInterviewStatus["documentos"]) {
  if (phase === "documentos") return checklist === "completo" ? "" : checklist ? "Faltan documentos" : "Falta el checklist";
  const missing = (PHASE_FORMATS[phase] ?? []).filter(f => status(f) !== "terminado").map(f => status(f) ? `el PDF del ${f}` : `el ${f}`);
  return missing.length ? `Falta ${missing.length > 1 ? `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}` : missing[0]}` : "";
}

/*
  Las etapas se nombran por sí mismas (titular, 27/10/2026): se retiraron las cuatro fases
  del boceto C («Conocer», «Revisar», «Preparar y publicar», «Vender y cerrar») porque eran un
  segundo vocabulario que confundía; cada operación dice «Etapa 3 de 10 · Levantamiento».
*/
export type TrackStage = { n: number; label: string; key?: SalePhase };

/** Etapas de la operación con su número y su fase: las 10 del propietario o los pasos de su ruta. */
export function stageTrack(op: OperationRecord, today: string) {
  const flow = flowOf(op), owner = isOwnerRoute(flow.ruta);
  const { labels, current, phase } = routeStages(op, today);
  const stages: TrackStage[] = labels.map((label, i) => owner
    ? { n: i + 1, label, key: SALE_PROCESS[i].key }
    : { n: i + 1, label });
  return { stages, current, phase };
}

/** Etapas ya pasadas a las que les falta su documento, en orden («Falta el 04»). */
export function pastGaps(op: OperationRecord, today: string, status: (formato: string) => FormatStatus) {
  const { stages, current } = stageTrack(op, today);
  return stages.slice(0, current).flatMap(stage => {
    if (!stage.key || !PHASES_WITH_DOCUMENTS.includes(stage.key)) return [];
    const gap = phaseGap(stage.key, status, op.inicial?.documentos);
    return gap ? [{ ...stage, key: stage.key, gap }] : [];
  });
}

export type Attention = { label: string; rank: number; late: boolean };
/**
  Por qué una operación «espera algo de ti», en pocas palabras: hay un problema, tarea vencida,
  documento de una etapa anterior, documento por revisar, vence hoy o sin próxima tarea.
*/
export function attentionOf(op: OperationRecord, tasks: Task[], today: string, gap?: string): Attention | null {
  const flow = flowOf(op);
  if (stageOf(op) === "cerrado" || flow.estado === "descartada") return null;
  const reviews = Object.values(flow.requisitos);
  const open = tasks.filter(t => t.expedienteId === op.id && isTaskOpen(t));
  if (reviews.some(r => r?.estado === "observado")) return { label: "Hay un problema", rank: 0, late: true };
  if (open.some(t => !!t.vence && t.vence < today)) return { label: "Tarea vencida", rank: 1, late: true };
  if (gap) return { label: gap, rank: 2, late: false };
  if (reviews.some(r => r?.estado === "recibido")) return { label: "Documento por revisar", rank: 3, late: false };
  if (open.some(t => t.vence === today)) return { label: "Vence hoy", rank: 4, late: false };
  if (flow.estado !== "pausada" && !open.some(t => !!t.vence)) return { label: "Sin próxima tarea", rank: 5, late: false };
  return null;
}

/** Formatos que se trabajan en cada etapa del propietario; el aviso (01) se entrega en la entrevista y no detiene el avance. */
/*
  Una etapa, sus documentos (titular, 27/10/2026): cada etapa abre su formato en vivo. De la
  publicación al cierre los documentos se ofrecen sin detener la etapa (RP-82), porque el avance
  lo marcan sus confirmaciones; «venta» los deja fuera de la renta del propietario (perfil del
  comprador, oferta de compra y promesa de compraventa).
*/
const PHASE_ITEMS: Partial<Record<SalePhase, ReadonlyArray<{ formato: string; optional?: true; venta?: true }>>> = {
  prospecto: [{ formato: "02" }], captacion: [{ formato: "02" }, { formato: "01", optional: true }], levantamiento: [{ formato: "04" }],
  dictamen: [{ formato: "05" }, { formato: "06" }], verificacion: [{ formato: "07" }, { formato: "08" }], contrato: [{ formato: "09" }, { formato: "10" }],
  publicacion: [{ formato: "11", optional: true }],
  visitas: [{ formato: "12", optional: true, venta: true }, { formato: "13", optional: true }, { formato: "14", optional: true, venta: true }],
  cierre: [{ formato: "15", optional: true, venta: true }, { formato: "16", optional: true }, { formato: "17", optional: true }, { formato: "18", optional: true }],
};
/** Formatos de una etapa del propietario según su ruta (la renta no usa los de compraventa). */
export function stageDocuments(phase: SalePhase, ruta: OperationWorkflow["ruta"]) {
  return (PHASE_ITEMS[phase] ?? []).filter(item => !(item.venta && ruta === "arrendador"));
}
export type StageItem =
  | { kind: "documento"; formato: string; status: FormatStatus; optional?: true }
  | { kind: "checklist"; status: InitialInterviewStatus["documentos"] }
  /** El paso que abre la siguiente etapa del propietario: iniciar el levantamiento o el checklist. */
  | { kind: "inicio"; step: "levantamiento" | "checklist" }
  | { kind: "requisito"; key: RequirementKey; earlier: boolean; state: ReturnType<typeof reviewState>; done: boolean }
  | { kind: "pendiente"; text: string; why: string; place: Missing["place"] };

/** «Para terminar la etapa»: los documentos que se llenan, lo que se confirma y lo demás que impide avanzar. */
export function stageItems(op: OperationRecord, tasks: Task[], today: string, status: (formato: string) => FormatStatus): StageItem[] {
  const flow = flowOf(op), { phase } = routeStages(op, today);
  const items: StageItem[] = [];
  if (isOwnerRoute(flow.ruta) && phase) {
    for (const item of stageDocuments(phase, flow.ruta)) items.push({ kind: "documento", formato: item.formato, status: status(item.formato), ...(item.optional ? { optional: true as const } : {}) });
    if (phase === "documentos") items.push({ kind: "checklist", status: op.inicial?.documentos });
    if (phase === "captacion" && status("02") === "terminado") items.push({ kind: "inicio", step: "levantamiento" });
    if (phase === "levantamiento" && status("04") === "terminado") items.push({ kind: "inicio", step: "checklist" });
  }
  for (const { key, earlier } of currentRequirements(op, today)) items.push({ kind: "requisito", key, earlier, state: reviewState(flow, key), done: reviewComplete(flow, key, today) });
  for (const m of missingItems(op, tasks, today)) {
    // Lo de documentos ya está arriba; en el checklist también cuentan la entrevista y el levantamiento sin terminar.
    if (m.place === "ajustes" || m.place === "tarea" || (phase === "documentos" && m.place === "operacion" && !m.text.startsWith("Recibir"))) items.push({ kind: "pendiente", text: m.text, why: m.why, place: m.place });
  }
  return items;
}
export function itemDone(item: StageItem) {
  return item.kind === "documento" ? item.status === "terminado" : item.kind === "checklist" ? item.status === "completo" : item.kind === "requisito" ? item.done : false;
}
/** Cuenta para «N de M»: no el aviso opcional ni lo que quedó abierto de una etapa anterior. */
export const itemCounted = (item: StageItem) => item.kind !== "inicio" && !(item.kind === "documento" && item.optional) && !(item.kind === "requisito" && item.earlier);
/** «Ahora toca»: primero un problema marcado; después lo primero sin terminar, en orden. */
export function nowItem(items: StageItem[]) {
  return items.find(i => i.kind === "requisito" && i.state === "observado") ?? items.find(i => !itemDone(i) && !(i.kind === "documento" && i.optional));
}

/** Qué hacemos y para qué en la etapa actual. */
export function stageGuide(op: OperationRecord, today: string) {
  const { phase, labels, current } = routeStages(op, today);
  const sale = phase ? SALE_PROCESS.find(p => p.key === phase) : undefined;
  return { title: labels[current], que: sale?.hace, para: sale?.para };
}

/** Requisitos que se trabajan ahora. Los de etapas anteriores que siguen abiertos se agregan al final. */
export function currentRequirements(op: OperationRecord, today: string): Array<{ key: RequirementKey; earlier: boolean }> {
  const flow = flowOf(op), stage = stageOf(op), next = nextWorkflowStage(stage);
  const routeKeys = new Set(requiredReviews(flow.ruta, "cerrado"));
  let own: RequirementKey[], before: RequirementKey[];
  if (isOwnerRoute(flow.ruta)) {
    const index = SALE_PROCESS.findIndex(p => p.key === processPhase(stage, op.flujo ?? flow, today, op.inicial));
    own = phaseRequirements(SALE_PROCESS[index].key).filter(k => routeKeys.has(k));
    before = [...routeKeys].filter(k => { const phase = requirementPhase(k); return !!phase && SALE_PROCESS.findIndex(p => p.key === phase) < index; });
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
  const phase = processPhase(stage, op.flujo ?? flow, today, op.inicial);
  if (phase === "prospecto") return { label: "Entrevista inicial" };
  if (phase === "captacion" && isOwnerRoute(flow.ruta)) return { label: "Levantamiento" };
  if (phase === "levantamiento") return { label: "Checklist de documentos" };
  if (phase === "dictamen") return { label: "Opinión de valor y precio" };
  if (phase === "verificacion") return { label: "Contrato y preparación" };
  if (phase === "cierre") return { target: next, label: next === "cerrado" ? "Archivar la operación" : stageLabel(next, "captacion").replace("Cierre y entrega · ", "").replace(/^./, c => c.toUpperCase()) };
  const following = SALE_PROCESS[SALE_PROCESS.findIndex(p => p.key === phase) + 1];
  return { target: next, label: following?.label ?? stageLabel(next, flow.ruta) };
}

export type Missing = { text: string; why: string; requirement?: RequirementKey; place: "requisito" | "ajustes" | "tarea" | "operacion" };
const BLOCKER_TEXT: Record<string, Omit<Missing, "requirement">> = {
  "Reactivar la operación antes de avanzar.": { text: "Reactivar la operación", why: "está en pausa, en regularización o descartada", place: "ajustes" },
  "Resolver las observaciones que bloquean esta actividad.": { text: "Resolver los problemas marcados", why: "un requisito dice «Hay un problema»", place: "requisito" },
  "Revisar la resolución y reactivar el encargo antes de avanzar.": { text: "Revisar la decisión del encargo", why: "está en pausa, rechazada, referida o cancelada", place: "ajustes" },
  "La aceptación condicionada no autoriza esta actividad.": { text: "Revisar las condiciones del encargo", why: "la decisión con condiciones no permite este paso", place: "ajustes" },
  "Registrar la decisión de captación y sus condiciones antes de comercializar.": { text: "Registrar si tomas el encargo", why: "se decide en Ajustes", place: "ajustes" },
  "Captura los datos del inmueble.": { text: "Vincular el inmueble", why: "se hace en Ajustes", place: "ajustes" },
  "Identificar la contraparte interna o externa.": { text: "Identificar al comprador o contraparte", why: "se hace en Ajustes", place: "ajustes" },
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
  if (phase === "levantamiento") return [inicial.levantamiento === "emitido" ? { text: "Iniciar el checklist de documentos", why: "con el botón «Iniciar checklist»", place: "operacion" } : { text: "Terminar el levantamiento (04)", why: "y generar su PDF", place: "operacion" }];
  if (!target.target) {
    const items: Missing[] = (phase === "dictamen" ? phaseRequirements("dictamen") : VERIFICATION_REQUIREMENTS).filter(k => !reviewComplete(flow, k, today)).map(key => ({ text: requirementName(key), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" }));
    if (phase !== "dictamen" && (!flow.resolucion || !["aceptada", "condicionada"].includes(flow.resolucion.tipo))) items.push({ text: "Registrar si tomas el encargo", why: "se decide en Ajustes", place: "ajustes" });
    return items;
  }
  const labels = new Map(Object.entries(WORKFLOW_REQUIREMENTS).map(([key, value]) => [value.label as string, key as RequirementKey]));
  const initial: Missing[] = phase !== "documentos" ? [] : [
    ...(inicial.documentos !== "completo" ? [{ text: "Recibir los documentos del checklist", why: "márcalos al recibirlos", place: "operacion" as const }] : []),
    ...(!inicial.emitida ? [{ text: "Terminar la entrevista inicial (02)", why: "y generar su PDF", place: "operacion" as const }] : []),
    ...(inicial.levantamiento !== "emitido" ? [{ text: "Terminar el levantamiento (04)", why: "y generar su PDF", place: "operacion" as const }] : []),
  ];
  return initial.concat(workflowBlockers(flow, target.target, { id: op.id, asesor_id: op.asesor_id, propiedad_slug: propertySlug }, tasks, today).map(blocker => {
    const key = labels.get(blocker);
    if (key) return { text: requirementName(key), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" as const };
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
  const column = SALE_PROCESS.findIndex(p => p.key === processPhase(stage, op.flujo, today, op.inicial));
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
  prospecto: [["comparables", "Comparar casas parecidas"]],
  levantamiento: [["fotografias", "Fotografías"], ["ficha-comercial", "Ficha del inmueble"]],
  documentos: [["revisor-expediente", "Pendientes documentales"]],
  dictamen: [["revisor-expediente", "Pendientes documentales"]],
  captacion: [["revisor-expediente", "Pendientes documentales"], ["comparables", "Comparar casas parecidas"]],
  verificacion: [["comparables", "Comparar casas parecidas"], ["neto-propietario", "Neto del propietario"], ["revisor-expediente", "Pendientes documentales"]],
  contrato: [["ficha-comercial", "Ficha del inmueble"], ["fotografias", "Fotografías"], ["cotizador", "Cotizador de servicios"]],
  publicacion: [["informe-propietario", "Preparar informe"], ["ficha-comercial", "Ficha del inmueble"], ["qr", "Enlaces y QR"]],
  visitas: [["ofertas", "Comparar ofertas"], ["hipoteca", "Hipoteca"], ["informe-propietario", "Preparar informe"]],
  cierre: [["neto-propietario", "Neto del propietario"], ["comisiones", "Comisiones y reparto"], ["revisor-expediente", "Pendientes documentales"]],
};
const ROUTE_TOOLS: Partial<Record<OperationWorkflow["ruta"], Array<[string, string]>>> = {
  compra: [["comparables", "Comparar casas parecidas"], ["hipoteca", "Hipoteca"], ["ofertas", "Comparar ofertas"]],
  arrendatario: [["comparables", "Comparar opciones"], ["ofertas", "Comparar ofertas"]],
  inversion: [["inversiones", "Escenarios de inversión"], ["rehabilitacion", "Rehabilitación"], ["comparables", "Comparar casas parecidas"]],
};
export function stageTools(op: OperationRecord, today: string) {
  const flow = flowOf(op), { phase } = routeStages(op, today);
  const tools = phase ? PHASE_TOOLS[phase] : ROUTE_TOOLS[flow.ruta] ?? [];
  return tools.map(([slug, label]) => ({ slug, label, href: `/admin/apps/${slug}?expedienteId=${encodeURIComponent(op.id)}` }));
}

/** El contrato se captura después de terminar la verificación (decisión del titular, 15/10/2026). */
export function contractLocked(op: OperationRecord, today: string) {
  const flow = flowOf(op);
  return isOwnerRoute(flow.ruta) && stageOf(op) === "documentacion" && !verificationComplete(flow, today);
}
