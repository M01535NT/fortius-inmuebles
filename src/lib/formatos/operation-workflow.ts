import { z } from "zod";
import type { Task } from "@/lib/tasks";

export const WORKFLOW_STAGES = ["captacion","documentacion","comercializacion","negociacion","cierre","entrega","postventa","cerrado"] as const;
export type WorkflowStage = typeof WORKFLOW_STAGES[number];
export const WORKFLOW_ROUTES = { captacion: "Propietario · captación y venta", compra: "Comprador · búsqueda y compra" } as const;
export const WORKFLOW_STATES = { activa: "Activa", pausada: "En pausa", regularizacion: "En regularización", descartada: "Descartada" } as const;
export const REVIEW_STATES = { pendiente: "Pendiente", recibido: "Recibido", revisado: "Revisado con soporte", observado: "Observado", no_aplica: "No aplica, justificado" } as const;
export const WORKFLOW_REQUIREMENTS = {
 entrevista: { label: "Entrevista y objetivo del propietario", formato: "02" },
 titularidad: { label: "Identidad, representación y antecedente de propiedad", formato: "05" },
 perfil: { label: "Perfil, necesidades y participantes de la compra", formato: "12" },
 capacidad: { label: "Presupuesto, recursos y crédito comprobados", formato: "12" },
 privacidad: { label: "Aviso de privacidad y controles aplicables", formato: "01" },
 factibilidad: { label: "Factibilidad documentada y condiciones resueltas", formato: "06", vigencia: true },
 valor: { label: "Opinión de valor y fuentes", formato: "07" },
 precio: { label: "Precio y condiciones acordados con el propietario", formato: "08" },
 intermediacion: { label: "Intermediación formalizada y autorización", formato: "09" },
 levantamiento: { label: "Levantamiento y material comercial verificados", formato: "04B" },
 plan: { label: "Plan de comercialización aprobado", formato: "10" },
 publicacion: { label: "Información y publicación autorizadas", formato: "10" },
 opciones: { label: "Opciones acordes al perfil y disponibilidad", formato: "12" },
 comprador: { label: "Comprador identificado y capacidad comprobada", formato: "12" },
 visitas: { label: "Visitas, resultados y elección del inmueble", formato: "13" },
 oferta: { label: "Oferta y condiciones aceptadas", formato: "14" },
 revision_cierre: { label: "Revisión actualizada para contratar y cerrar", formato: "06", vigencia: true },
 instrumento: { label: "Instrumento, anticipos, custodia y devoluciones definidos", formato: "15" },
 contraparte: { label: "Vendedor y comprador relacionados e identificados", formato: "14" },
 firma: { label: "Firma e instrumento acreditados", formato: "15" },
 pago: { label: "Condiciones de pago para entrega cumplidas según acuerdo", formato: "18" },
 entrega: { label: "Entrega material y acta con pendientes asentados", formato: "16" },
 registro: { label: "Trámite registral y pendientes atendidos", formato: "17", noAplica: true },
 honorarios: { label: "Honorarios y cobros conforme al contrato", formato: "18", noAplica: true },
 archivo: { label: "Postventa, pendientes resueltos y expediente archivado", formato: "17" },
} as const;
export type RequirementKey = keyof typeof WORKFLOW_REQUIREMENTS;
const review = z.object({ estado: z.enum(["pendiente","recibido","revisado","observado","no_aplica"]), soporte: z.string().max(1000), vigenteHasta: z.iso.date().optional(), registradoPor: z.uuid().optional(), registradoEl: z.string().max(80).optional() }).strict();
export const operationWorkflowSchema = z.object({
 version: z.literal(1), ruta: z.enum(["captacion","compra"]), estado: z.enum(["activa","pausada","regularizacion","descartada"]),
 motivo: z.string().max(1000).default(""),
 requisitos: z.partialRecord(z.enum(Object.keys(WORKFLOW_REQUIREMENTS) as [RequirementKey,...RequirementKey[]]), review),
 contraparteId: z.uuid().optional(), contraparteExterna: z.string().max(1000).optional(),
}).strict();
export type OperationWorkflow = z.infer<typeof operationWorkflowSchema>;
export function emptyWorkflow(ruta: OperationWorkflow["ruta"] = "captacion"): OperationWorkflow { return {version:1,ruta,estado:"activa",motivo:"",requisitos:{}}; }
export function stageLabel(stage: WorkflowStage, route?: OperationWorkflow["ruta"]) {
 const labels = route === "compra" ? ["Perfil y capacidad","Opciones","Visitas","Oferta y negociación","Firma y pago","Entrega","Postventa","Archivado"] : ["Captación inicial","Revisión y preparación","Comercialización","Oferta y negociación","Firma y pago","Entrega","Postventa","Archivado"];
 return labels[WORKFLOW_STAGES.indexOf(stage)] ?? stage;
}
export function nextWorkflowStage(stage: WorkflowStage) { return WORKFLOW_STAGES[WORKFLOW_STAGES.indexOf(stage)+1]; }
export function requiredReviews(route: OperationWorkflow["ruta"], target: WorkflowStage): RequirementKey[] {
 const n = WORKFLOW_STAGES.indexOf(target);
 if (n<=0) return [];
 const keys: RequirementKey[] = route === "captacion" ? ["entrevista","titularidad"] : ["perfil","capacidad","privacidad"];
 if(n>=2) keys.push(...(route === "captacion" ? ["factibilidad","valor","precio","intermediacion","levantamiento","plan","publicacion"] as RequirementKey[] : ["opciones"] as RequirementKey[]));
 if(n>=3) keys.push(route === "captacion" ? "comprador" : "visitas");
 if(n>=4) keys.push("oferta","revision_cierre","instrumento","contraparte");
 if(n>=5) keys.push("firma","pago");
 if(n>=6) keys.push("entrega");
 if(n>=7) keys.push("registro","honorarios","archivo");
 return keys;
}
export function reviewComplete(flow: OperationWorkflow, key: RequirementKey, today: string) {
 const r=flow.requisitos[key], definition=WORKFLOW_REQUIREMENTS[key];
 return !!r && (r.estado === "revisado" || ("noAplica" in definition && r.estado === "no_aplica")) && r.soporte.trim().length>=3
  && (!("vigencia" in definition) || !!r.vigenteHasta && r.vigenteHasta>=today);
}
export function publicationBlockers(flow: OperationWorkflow | null | undefined, stage: WorkflowStage, today: string): string[] {
 if(!flow || flow.ruta!=="captacion") return ["Abrir y completar la guía de captación vinculada."];
 const result: string[] = requiredReviews("captacion","comercializacion").filter(k=>!reviewComplete(flow,k,today)).map(k=>WORKFLOW_REQUIREMENTS[k].label);
 if(flow.estado!=="activa") result.unshift("La captación debe estar activa.");
 if(!["comercializacion","negociacion","cierre"].includes(stage)) result.unshift("Llevar la captación a comercialización antes de publicar.");
 if(Object.values(flow.requisitos).some(r=>r?.estado==="observado")) result.push("Resolver las observaciones abiertas.");
 return result;
}
export function workflowBlockers(flow: OperationWorkflow, target: WorkflowStage, context: { id:string; asesor_id:string; propiedad_slug?:string|null }, tasks: Task[], today:string): string[] {
 const result: string[] = requiredReviews(flow.ruta,target).filter(k=>!reviewComplete(flow,k,today)).map(k=>WORKFLOW_REQUIREMENTS[k].label);
 if(flow.estado!=="activa") result.unshift("Reactivar la operación antes de avanzar.");
 if(Object.values(flow.requisitos).some(r=>r?.estado==="observado")) result.push("Resolver las observaciones abiertas.");
 const index=WORKFLOW_STAGES.indexOf(target);
 if(index>=3 && !context.propiedad_slug) result.push("Vincular el inmueble.");
 if(index>=4 && !flow.contraparteId && (flow.contraparteExterna?.trim().length??0)<3) result.push("Identificar la contraparte interna o externa.");
 const open=tasks.filter(t=>t.expedienteId===context.id && !["completada","cancelada"].includes(t.estado));
 if(target==="cerrado") { if(open.length) result.push("Resolver o descartar las tareas pendientes antes de archivar."); }
 else if(!open.some(t=>t.asesorId===context.asesor_id && !!t.vence)) result.push("Agendar una próxima tarea con fecha y responsable.");
 return result;
}
