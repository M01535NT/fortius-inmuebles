import { z } from "zod";
import type { Task } from "@/lib/tasks";

export const WORKFLOW_STAGES = ["captacion","documentacion","comercializacion","negociacion","cierre","entrega","postventa","cerrado"] as const;
export type WorkflowStage = typeof WORKFLOW_STAGES[number];
export const WORKFLOW_ROUTES = { captacion: "Propietario · captación y venta", compra: "Comprador · búsqueda y compra", arrendador: "Arrendador · captación y renta", arrendatario: "Arrendatario · búsqueda y renta", inversion: "Inversionista · evaluación y ejecución" } as const;
export const WORKFLOW_STATES = { activa: "Activa", pausada: "En pausa", regularizacion: "En regularización", descartada: "Descartada" } as const;
export const REVIEW_STATES = { pendiente: "Pendiente", recibido: "Recibido", revisado: "Revisado con soporte", observado: "Observado", no_aplica: "No aplica, justificado" } as const;
export const WORKFLOW_REQUIREMENTS = {
 arrendatario: { label: "Arrendatario identificado y capacidad comprobada", formato: "12" },
 contrato_renta: { label: "Contrato de arrendamiento y condiciones acordadas", formato: "Contrato externo" },
 garantias_renta: { label: "Depósito y garantías según acuerdo, o no aplicabilidad justificada", formato: "Contrato y evidencias", noAplica: true },
 inventario_entrega: { label: "Inventario, estado físico, llaves y entrega acordados", formato: "16" },
 termino_renta: { label: "Término del encargo y obligaciones de seguimiento definidos", formato: "17" },
 criterios_inversion: { label: "Mandato, criterios, horizonte y límites acordados", formato: "Entrevista y mandato" },
 escenarios_inversion: { label: "Escenarios, fuentes, supuestos y sensibilidad revisados", formato: "App Inversiones" },
 riesgos_inversion: { label: "Diligencia proporcional, limitaciones y riesgos documentados", formato: "05" },
 decision_inversion: { label: "Decisión informada y capital comprometido autorizados", formato: "Decisión de inversión" },
 ejecucion_inversion: { label: "Ejecución elegida y expediente correspondiente vinculados", formato: "Encargo de ejecución" },
 seguimiento_inversion: { label: "Seguimiento de escenarios y resultados acordado", formato: "11" },
 entrevista: { label: "Entrevista y objetivo del propietario", formato: "02" },
 titularidad: { label: "Identidad, representación y antecedente de propiedad", formato: "05" },
 perfil: { label: "Perfil, necesidades y participantes del encargo", formato: "Entrevista operativa / 12 para compra" },
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
 contraparte: { label: "Participantes y contraparte relacionados e identificados", formato: "14 o contrato aplicable" },
 firma: { label: "Firma e instrumento acreditados", formato: "15" },
 pago: { label: "Condiciones de pago para entrega cumplidas según acuerdo", formato: "18" },
 entrega: { label: "Entrega material y acta con pendientes asentados", formato: "16" },
 registro: { label: "Trámite registral y pendientes atendidos", formato: "17", noAplica: true },
 honorarios: { label: "Honorarios y cobros conforme al contrato", formato: "18", noAplica: true },
 archivo: { label: "Postventa, pendientes resueltos y expediente archivado", formato: "17" },
} as const;
export type RequirementKey = keyof typeof WORKFLOW_REQUIREMENTS;
const evidence = z.object({ tipo: z.enum(["entrevista","documento","emision","adjunto","externa"]), referencia: z.string().max(1000), version: z.number().int().positive().optional(), fecha: z.iso.date().optional(), responsable: z.string().max(160).optional(), resultado: z.string().max(1000).optional(), limites: z.string().max(1000).optional() }).strict();
const review = z.object({ estado: z.enum(["pendiente","recibido","revisado","observado","no_aplica"]), soporte: z.string().max(1000), evidencia: evidence.optional(), bloquea: z.array(z.enum(WORKFLOW_STAGES)).max(8).optional(), vigenteHasta: z.iso.date().optional(), registradoPor: z.uuid().optional(), registradoEl: z.string().max(80).optional() }).strict();
export const RESOLUTION_TYPES = { aceptada: "Aceptada", condicionada: "Aceptada con condiciones", pausada: "Pausada", rechazada: "Rechazada", referida: "Referida", cancelada: "Cancelada" } as const;
const resolution = z.object({ tipo: z.enum(["aceptada","condicionada","pausada","rechazada","referida","cancelada"]), fecha: z.iso.date(), motivo: z.string().trim().min(3).max(1000), condiciones: z.string().max(1000).optional(), permitidas: z.array(z.enum(WORKFLOW_STAGES)).max(8).optional(), siguienteAccion: z.string().trim().min(1).max(160), fechaSiguiente: z.iso.date() }).strict().refine(r=>r.tipo!=="condicionada" || !!r.condiciones?.trim(), "Describe las condiciones de aceptación");
export const operationWorkflowSchema = z.object({
 version: z.literal(1), ruta: z.enum(["captacion","compra","arrendador","arrendatario","inversion"]), estado: z.enum(["activa","pausada","regularizacion","descartada"]),
 motivo: z.string().max(1000).default(""),
 requisitos: z.partialRecord(z.enum(Object.keys(WORKFLOW_REQUIREMENTS) as [RequirementKey,...RequirementKey[]]), review),
 contraparteId: z.uuid().optional(), contraparteExterna: z.string().max(1000).optional(),
 resolucion: resolution.optional(),
}).strict();
export type OperationWorkflow = z.infer<typeof operationWorkflowSchema>;
export function emptyWorkflow(ruta: OperationWorkflow["ruta"] = "captacion"): OperationWorkflow { return {version:1,ruta,estado:"activa",motivo:"",requisitos:{}}; }
export function stageLabel(stage: WorkflowStage, route?: OperationWorkflow["ruta"]) {
 if (route === "inversion") return ["Mandato y criterios","Alternativas","Diligencia y riesgos","Escenarios","Decisión y capital","Ejecución vinculada","Seguimiento de resultados","Archivado"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 if (route === "arrendador") return ["Captación para renta","Revisión y preparación","Oferta de renta","Selección del arrendatario","Contrato y garantías","Firma y pagos","Entrega y seguimiento","Archivo del encargo"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 if (route === "arrendatario") return ["Necesidades de renta","Opciones","Visitas","Solicitud y condiciones","Contrato y garantías","Firma y pagos","Entrega y seguimiento","Archivo del encargo"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 const labels = route === "compra" ? ["Perfil y capacidad","Opciones","Visitas","Oferta y negociación","Firma y pago","Entrega","Postventa","Archivado"] : ["Captación inicial","Revisión y preparación","Comercialización","Oferta y negociación","Firma y pago","Entrega","Postventa","Archivado"];
 return labels[WORKFLOW_STAGES.indexOf(stage)] ?? stage;
}
export function nextWorkflowStage(stage: WorkflowStage) { return WORKFLOW_STAGES[WORKFLOW_STAGES.indexOf(stage)+1]; }
export function requiredReviews(route: OperationWorkflow["ruta"], target: WorkflowStage): RequirementKey[] {
 const n = WORKFLOW_STAGES.indexOf(target);
 if (n<=0) return [];
 if (route === "inversion") {
  const keys: RequirementKey[] = ["perfil","privacidad"];
  if(n>=2) keys.push("criterios_inversion");
  if(n>=3) keys.push("riesgos_inversion");
  if(n>=4) keys.push("escenarios_inversion","capacidad");
  if(n>=5) keys.push("decision_inversion","ejecucion_inversion");
  if(n>=6) keys.push("seguimiento_inversion");
  if(n>=7) keys.push("honorarios","archivo");
  return keys;
 }
 const owner = route === "captacion" || route === "arrendador", rent = route === "arrendador" || route === "arrendatario";
 const keys: RequirementKey[] = owner ? ["entrevista"] : ["perfil","privacidad"];
 if(n>=2) keys.push(...(owner ? ["titularidad","factibilidad","valor","precio","intermediacion","levantamiento","plan","publicacion"] as RequirementKey[] : ["opciones"] as RequirementKey[]));
 if(n>=3) keys.push(...(owner ? [rent ? "arrendatario" : "comprador"] as RequirementKey[] : ["visitas","capacidad"] as RequirementKey[]));
 if(n>=4) keys.push("oferta","revision_cierre",rent ? "contrato_renta" : "instrumento","contraparte",...(rent ? ["garantias_renta"] as RequirementKey[] : []));
 if(n>=5) keys.push("firma","pago");
 if(n>=6) keys.push("entrega",...(rent ? ["inventario_entrega"] as RequirementKey[] : []));
 if(n>=7) keys.push(rent ? "termino_renta" : "registro","honorarios","archivo");
 return keys;
}
export function reviewComplete(flow: OperationWorkflow, key: RequirementKey, today: string) {
 const r=flow.requisitos[key], definition=WORKFLOW_REQUIREMENTS[key];
 return !!r && (r.estado === "revisado" || ("noAplica" in definition && r.estado === "no_aplica")) && r.soporte.trim().length>=3
  && (r.estado === "no_aplica" || !!r.evidencia && (r.evidencia.tipo === "externa" ? r.evidencia.referencia.trim().length >= 10 && !!r.evidencia.fecha && (r.evidencia.responsable?.trim().length??0)>=3 && (r.evidencia.resultado?.trim().length??0)>=3 : z.uuid().safeParse(r.evidencia.referencia).success && (r.evidencia.tipo === "adjunto" || !!r.evidencia.version)))
  && (!("vigencia" in definition) || !!r.vigenteHasta && r.vigenteHasta>=today);
}
export function observationBlocks(flow: OperationWorkflow, target: WorkflowStage) {
 const required = requiredReviews(flow.ruta,target);
 return Object.entries(flow.requisitos).some(([key,r])=>r?.estado === "observado" && (required.includes(key as RequirementKey) || r.bloquea?.includes(target)));
}
function resolutionBlockers(flow: OperationWorkflow, target: WorkflowStage) {
 const r=flow.resolucion;
 if(r && !["aceptada","condicionada"].includes(r.tipo)) return ["Revisar la resolución y reactivar el encargo antes de avanzar."];
 if(r?.tipo==="condicionada" && !r.permitidas?.includes(target)) return ["La aceptación condicionada no autoriza esta actividad."];
 if(["captacion","arrendador"].includes(flow.ruta) && WORKFLOW_STAGES.indexOf(target)>=2 && !r) return ["Registrar la decisión de captación y sus condiciones antes de comercializar."];
 return [];
}
export function publicationBlockers(flow: OperationWorkflow | null | undefined, stage: WorkflowStage, today: string): string[] {
 if(!flow || !["captacion","arrendador"].includes(flow.ruta)) return ["Abrir y completar la guía de captación vinculada."];
 const result: string[] = requiredReviews(flow.ruta,"comercializacion").filter(k=>!reviewComplete(flow,k,today)).map(k=>WORKFLOW_REQUIREMENTS[k].label);
 if(flow.estado!=="activa") result.unshift("La captación debe estar activa.");
 if(!["comercializacion","negociacion","cierre"].includes(stage)) result.unshift("Llevar la captación a comercialización antes de publicar.");
 if(observationBlocks(flow,"comercializacion")) result.push("Resolver las observaciones que bloquean la publicación.");
 result.push(...resolutionBlockers(flow,"comercializacion"));
 return result;
}
export function workflowBlockers(flow: OperationWorkflow, target: WorkflowStage, context: { id:string; asesor_id:string; propiedad_slug?:string|null }, tasks: Task[], today:string): string[] {
 const result: string[] = requiredReviews(flow.ruta,target).filter(k=>!reviewComplete(flow,k,today)).map(k=>WORKFLOW_REQUIREMENTS[k].label);
 if(flow.estado!=="activa") result.unshift("Reactivar la operación antes de avanzar.");
 if(observationBlocks(flow,target)) result.push("Resolver las observaciones que bloquean esta actividad.");
 result.push(...resolutionBlockers(flow,target));
 const index=WORKFLOW_STAGES.indexOf(target);
 if(flow.ruta!=="inversion" && index>=3 && !context.propiedad_slug) result.push("Captura los datos del inmueble.");
 if(flow.ruta!=="inversion" && index>=4 && !flow.contraparteId && (flow.contraparteExterna?.trim().length??0)<3) result.push("Identificar la contraparte interna o externa.");
 const open=tasks.filter(t=>t.expedienteId===context.id && !["completada","cancelada"].includes(t.estado));
 if(target==="cerrado") { if(open.length) result.push("Resolver o descartar las tareas pendientes antes de archivar."); }
 else if(!open.some(t=>t.asesorId===context.asesor_id && !!t.vence)) result.push("Agendar una próxima tarea con fecha y responsable.");
 return result;
}
