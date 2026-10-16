import { isTaskOpen, type Task } from "@/lib/tasks";
import { emptyWorkflow, isOwnerRoute, nextWorkflowStage, phaseRequirements, processPhase, requiredReviews, requirementPhase, reviewComplete, SALE_PROCESS, stageLabel, verificationComplete, workflowBlockers, WORKFLOW_REQUIREMENTS, WORKFLOW_STAGES, type OperationWorkflow, type RequirementKey, type SalePhase, type WorkflowStage } from "@/lib/formatos/operation-workflow";
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

/** Etapas del avance: las 6 del propietario; las demás rutas usan sus propios pasos (sin «archivado»). */
export function routeStages(op: OperationRecord, today: string) {
  const flow = flowOf(op), stage = stageOf(op);
  if (isOwnerRoute(flow.ruta)) {
    const phase = processPhase(stage, op.flujo ?? flow, today);
    return { labels: SALE_PROCESS.map(p => p.label), current: SALE_PROCESS.findIndex(p => p.key === phase), phase };
  }
  const steps = WORKFLOW_STAGES.filter(s => s !== "cerrado");
  return { labels: steps.map(s => stageLabel(s, flow.ruta)), current: Math.min(WORKFLOW_STAGES.indexOf(stage), steps.length - 1), phase: undefined };
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
    const index = SALE_PROCESS.findIndex(p => p.key === processPhase(stage, op.flujo ?? flow, today));
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

/** Destino del botón «Pasar a». En «Verificación y precio» no hay cambio de etapa: se abre «Contrato» al completar la verificación. */
export function advanceTarget(op: OperationRecord, today: string): { target?: WorkflowStage; label: string } | null {
  const flow = flowOf(op), stage = stageOf(op), next = nextWorkflowStage(stage);
  if (!next) return null;
  if (!isOwnerRoute(flow.ruta)) return { target: next, label: stageLabel(next, flow.ruta) };
  const phase = processPhase(stage, op.flujo ?? flow, today);
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
  if (!target.target) {
    const items: Missing[] = phaseRequirements("verificacion").filter(k => !reviewComplete(flow, k, today)).map(key => ({ text: requirementName(key), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" }));
    if (!flow.resolucion || !["aceptada", "condicionada"].includes(flow.resolucion.tipo)) items.push({ text: "Registrar si tomas el encargo", why: "se decide en Ajustes", place: "ajustes" });
    return items;
  }
  const labels = new Map(Object.entries(WORKFLOW_REQUIREMENTS).map(([key, value]) => [value.label as string, key as RequirementKey]));
  return workflowBlockers(flow, target.target, { id: op.id, asesor_id: op.asesor_id, propiedad_slug: propertySlug }, tasks, today).map(blocker => {
    const key = labels.get(blocker);
    if (key) return { text: requirementName(key), why: requirementWhy(flow.requisitos[key]), requirement: key, place: "requisito" as const };
    return BLOCKER_TEXT[blocker] ?? { text: blocker, why: "", place: "operacion" as const };
  });
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
  const column = SALE_PROCESS.findIndex(p => p.key === processPhase(stage, op.flujo, today));
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
