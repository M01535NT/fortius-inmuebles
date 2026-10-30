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
 ejecucion_inversion: { label: "Ejecución elegida y operación correspondiente vinculada", formato: "Encargo de ejecución" },
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
 levantamiento: { label: "Levantamiento y material comercial verificados", formato: "04" },
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
 archivo: { label: "Postventa, pendientes resueltos y operación archivada", formato: "17" },
} as const;
export type RequirementKey = keyof typeof WORKFLOW_REQUIREMENTS;
const evidence = z.object({ tipo: z.enum(["entrevista","documento","emision","adjunto","externa"]), referencia: z.string().max(1000), version: z.number().int().positive().optional(), fecha: z.iso.date().optional(), responsable: z.string().max(160).optional(), resultado: z.string().max(1000).optional(), limites: z.string().max(1000).optional() }).strict();
const review = z.object({ estado: z.enum(["pendiente","recibido","revisado","observado","no_aplica"]), soporte: z.string().max(1000), evidencia: evidence.optional(), bloquea: z.array(z.enum(WORKFLOW_STAGES)).max(8).optional(), vigenteHasta: z.iso.date().optional(), registradoPor: z.uuid().optional(), registradoEl: z.string().max(80).optional() }).strict();
export const RESOLUTION_TYPES = { aceptada: "Aceptada", condicionada: "Aceptada con condiciones", pausada: "Pausada", rechazada: "Rechazada", referida: "Referida", cancelada: "Cancelada" } as const;
const resolution = z.object({ tipo: z.enum(["aceptada","condicionada","pausada","rechazada","referida","cancelada"]), fecha: z.iso.date(), motivo: z.string().trim().min(3).max(1000), condiciones: z.string().max(1000).optional(), permitidas: z.array(z.enum(WORKFLOW_STAGES)).max(8).optional(), siguienteAccion: z.string().trim().min(1).max(160), fechaSiguiente: z.iso.date() }).strict().refine(r=>r.tipo!=="condicionada" || !!r.condiciones?.trim(), "Describe las condiciones de aceptación");
/** Canales de entrega del informe al propietario (COR-08, RP-88): se capturan a mano. */
export const CANALES_INFORME = { whatsapp: "WhatsApp", correo: "Correo", en_persona: "En persona", telefono: "Teléfono", otro: "Otro" } as const;
const entregaInforme = z.object({ fecha: z.iso.date(), canal: z.enum(Object.keys(CANALES_INFORME) as [keyof typeof CANALES_INFORME, ...Array<keyof typeof CANALES_INFORME>]), responsable: z.string().trim().min(1).max(160), registradoEl: z.string().max(80).optional() }).strict();
export type EntregaInforme = z.infer<typeof entregaInforme>;
export const operationWorkflowSchema = z.object({
 version: z.literal(1), ruta: z.enum(["captacion","compra","arrendador","arrendatario","inversion"]), estado: z.enum(["activa","pausada","regularizacion","descartada"]),
 motivo: z.string().max(1000).default(""),
 requisitos: z.partialRecord(z.enum(Object.keys(WORKFLOW_REQUIREMENTS) as [RequirementKey,...RequirementKey[]]), review),
 contraparteId: z.uuid().optional(), contraparteExterna: z.string().max(1000).optional(),
 // Interesado (lead) que firma con el propietario: contraparte, nunca cliente (RP-93, COR-11).
 contraparteLeadId: z.string().min(1).max(200).optional(),
 resolucion: resolution.optional(),
 entregasInforme: z.array(entregaInforme).max(120).optional(),
}).strict();
export type OperationWorkflow = z.infer<typeof operationWorkflowSchema>;
export function emptyWorkflow(ruta: OperationWorkflow["ruta"] = "captacion"): OperationWorkflow { return {version:1,ruta,estado:"activa",motivo:"",requisitos:{}}; }
export function stageLabel(stage: WorkflowStage, route?: OperationWorkflow["ruta"]) {
 if (route === "inversion") return ["Mandato y criterios","Alternativas","Diligencia y riesgos","Escenarios","Decisión y capital","Ejecución vinculada","Seguimiento de resultados","Archivado"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 // Renta del propietario (COR-04, MRP-01): cada estado se nombra por lo que se trabaja en él.
 if (route === "arrendador") return ["Captación","Documentos, opinión de renta e intermediación","Publicación y seguimiento","Selección del arrendatario","Cierre y entrega · contrato, depósito y garantías","Cierre y entrega · entrega con inventario","Cierre y entrega · honorarios y seguimiento","Cierre y entrega · archivo"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 if (route === "arrendatario") return ["Necesidades de renta","Opciones","Visitas","Solicitud y condiciones","Contrato y garantías","Firma y pagos","Entrega y seguimiento","Archivo del encargo"][WORKFLOW_STAGES.indexOf(stage)] ?? stage;
 const labels = route === "compra" ? ["Perfil y capacidad","Opciones","Visitas","Oferta y negociación","Firma y pago","Entrega","Postventa","Archivado"] : ["Captación","Verificación y precio","Publicación y seguimiento","Visitas y ofertas","Cierre y entrega · firma y pago","Cierre y entrega · entrega","Cierre y entrega · postventa","Cierre y entrega · archivo"];
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
 if (route === "arrendador") {
  // Camino de renta aprobado (RP-97, MRP-01): sin dictamen completo ni plan de comercialización.
  const keys: RequirementKey[] = ["entrevista"];
  if(n>=2) keys.push("titularidad","valor","precio","intermediacion","levantamiento","publicacion");
  if(n>=3) keys.push("arrendatario");
  if(n>=4) keys.push("oferta","garantias_renta","contraparte");
  if(n>=5) keys.push("contrato_renta","firma","pago");
  if(n>=6) keys.push("entrega","inventario_entrega");
  if(n>=7) keys.push("termino_renta","honorarios","archivo");
  return keys;
 }
 const owner = route === "captacion", rent = route === "arrendatario";
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
function observationBlocks(flow: OperationWorkflow, target: WorkflowStage) {
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
 if(flow.ruta!=="inversion" && index>=4 && !flow.contraparteId && !flow.contraparteLeadId && (flow.contraparteExterna?.trim().length??0)<3) result.push("Identificar la contraparte interna o externa.");
 const open=tasks.filter(t=>t.expedienteId===context.id && !["completada","cancelada"].includes(t.estado));
 if(target==="cerrado") { if(open.length) result.push("Resolver o descartar las tareas pendientes antes de archivar."); }
 else if(!open.some(t=>t.asesorId===context.asesor_id && !!t.vence)) result.push("Agendar una próxima tarea con fecha y responsable.");
 return result;
}

/** Proceso de comercialización definido por el titular (PLAN_ERP_CRM.md, 15/10/2026). Se deriva de la etapa interna; no la sustituye. */
export const SALE_PROCESS = [
 { key: "prospecto", slug: "prospecto", label: "Prospecto", hace: "Registrar el primer contacto (llamada, mensaje, referido o redes): quién es, qué quiere, dónde está el inmueble y cuándo nos vemos.", para: "Atrapar rápido al prospecto y llegar preparados a la entrevista en persona.", etapas: ["captacion"] },
 { key: "captacion", slug: "entrevista-inicial", label: "Entrevista inicial", hace: "Entrevistar en persona al propietario con el formato 02: motivo, precio que desea, situación del inmueble; entregar el aviso de privacidad y pedir el checklist de documentos.", para: "Conocer a fondo al propietario y su inmueble antes de revisar documentos y valor.", etapas: ["captacion"] },
 { key: "levantamiento", slug: "levantamiento", label: "Levantamiento", hace: "Visitar el inmueble y capturar sus características con el levantamiento que corresponde a su tipo (04A–04G): superficies, niveles, espacios, instalaciones, fotografías y croquis.", para: "Tener los datos físicos comprobados para el dictamen, la opinión de valor y la publicación.", etapas: ["captacion"] },
 { key: "documentos", slug: "checklist-documentos", label: "Checklist de documentos", hace: "Entregar al propietario la lista de documentos que le corresponde y marcar cada uno al recibirlo.", para: "Reunir lo necesario para iniciar el dictamen jurídico.", etapas: ["captacion"] },
 { key: "dictamen", slug: "dictamen-juridico", label: "Dictamen jurídico", hace: "Revisar los documentos recibidos con la revisión jurídica (05) y emitir la opinión jurídica del inmueble (06): quién es dueño, quién firma y si se puede vender sin obstáculos.", para: "Detectar a tiempo lo que impediría o retrasaría la venta.", etapas: ["documentacion"] },
 { key: "verificacion", slug: "opinion-valor", label: "Opinión de valor y precio", hace: "Comparar propiedades similares con la opinión de valor (07), estimar el neto del propietario (08) y acordar el precio de salida; registrar si tomamos el encargo.", para: "Vender con un precio sustentado que el propietario entiende.", etapas: ["documentacion"] },
 { key: "contrato", slug: "contrato-preparacion", label: "Contrato y preparación", hace: "Formalizar el servicio, honorarios y autorizaciones; preparar ficha, fotografías y plan de publicación.", para: "Dejar claras las responsabilidades y presentar el inmueble con información respaldada.", etapas: ["documentacion"] },
 { key: "publicacion", slug: "publicacion-seguimiento", label: "Publicación y seguimiento", hace: "Publicar en los canales acordados, mantener los datos actualizados e informar al propietario sobre consultas y avance.", para: "Generar interesados y evaluar cómo está funcionando la comercialización.", etapas: ["comercializacion"] },
 { key: "visitas", slug: "visitas-ofertas", label: "Visitas y ofertas", hace: "Coordinar visitas con prospectos compatibles y revisar cada oferta: precio, forma de pago, plazos y condiciones.", para: "Convertir el interés en una propuesta viable que el propietario pueda decidir informado.", etapas: ["negociacion"] },
 { key: "cierre", slug: "cierre-entrega", label: "Cierre y entrega", hace: "Coordinar la firma con las partes y la notaría, verificar pagos, documentar llaves e inventario y seguir los pendientes.", para: "La operación no termina al aceptar una oferta: debe concretarse y entregarse correctamente.", etapas: ["cierre","entrega","postventa","cerrado"] },
] as const satisfies ReadonlyArray<{ key: string; slug: string; label: string; hace: string; para: string; etapas: readonly WorkflowStage[] }>;
export type SalePhase = typeof SALE_PROCESS[number]["key"];
type ProcessStep = { key: SalePhase; slug: string; label: string; hace: string; para: string; etapas: readonly WorkflowStage[] };
/**
  Renta del propietario (COR-04, MRP-01 aprobada el 26/10/2026, RP-97): diez etapas con las
  mismas claves que la venta para compartir la pantalla, pero con sus propios nombres, textos
  y requisitos. Sin dictamen jurídico completo ni plan de comercialización.
*/
export const RENT_PROCESS: readonly ProcessStep[] = [
 { key: "prospecto", slug: "prospecto", label: "Prospecto", hace: "Registrar el primer contacto: quién es, qué inmueble quiere rentar, dónde está y cuándo nos vemos.", para: "Atrapar rápido al prospecto y llegar preparados a la entrevista en persona.", etapas: ["captacion"] },
 { key: "captacion", slug: "entrevista-inicial", label: "Entrevista inicial", hace: "Entrevistar en persona al propietario con el formato 02: qué renta espera, condiciones y situación del inmueble; entregar el aviso de privacidad.", para: "Conocer al propietario y su inmueble antes de revisar documentos y renta.", etapas: ["captacion"] },
 { key: "levantamiento", slug: "levantamiento", label: "Levantamiento", hace: "En la misma visita, capturar el inmueble con el levantamiento de su tipo (04A–04G): espacios, estado, fotografías e inventario básico.", para: "Tener los datos físicos para la opinión de renta y la publicación.", etapas: ["captacion"] },
 { key: "documentos", slug: "checklist-documentos", label: "Documentos básicos", hace: "Pedir y marcar la identificación del propietario, la prueba de propiedad y el predial al corriente.", para: "Saber que quien renta es el dueño o puede rentar.", etapas: ["captacion"] },
 { key: "dictamen", slug: "titularidad", label: "Revisión de titularidad", hace: "Revisar que la identificación y la prueba de propiedad correspondan a quien firma. Un dictamen completo solo se agrega si el caso lo pide.", para: "No captar un inmueble que el propietario no puede rentar.", etapas: ["documentacion"] },
 { key: "verificacion", slug: "opinion-renta", label: "Opinión de renta", hace: "Comparar rentas de inmuebles parecidos con el formato 07 en «Renta», acordar la renta con el propietario y registrar si tomamos el encargo.", para: "Rentar con una renta sustentada que el propietario entiende.", etapas: ["documentacion"] },
 { key: "contrato", slug: "intermediacion-renta", label: "Intermediación para renta", hace: "Firmar el contrato de intermediación para renta y autorizar la información y la publicación.", para: "Dejar claras las responsabilidades y los honorarios antes de publicar.", etapas: ["documentacion"] },
 { key: "publicacion", slug: "publicacion-seguimiento", label: "Publicación y seguimiento", hace: "Publicar en los canales acordados, atender a los interesados e informar cada mes al propietario.", para: "Encontrar un arrendatario adecuado y que el propietario sepa cómo va.", etapas: ["comercializacion"] },
 { key: "visitas", slug: "seleccion-arrendatario", label: "Selección del arrendatario", hace: "Coordinar visitas, recibir solicitudes e investigar al interesado (identificación, ingresos y referencias) y acordar su garantía: fiador con inmueble, póliza jurídica o depósito doble.", para: "Elegir a un arrendatario que pueda pagar y cumpla, con una garantía real.", etapas: ["negociacion"] },
 { key: "cierre", slug: "cierre-entrega", label: "Cierre y entrega", hace: "Firmar el contrato de arrendamiento, recibir el depósito y la garantía, entregar con acta e inventario, cobrar los honorarios y archivar.", para: "La renta no termina al elegir arrendatario: se firma, se cobra y se entrega bien.", etapas: ["cierre","entrega","postventa","cerrado"] },
];
/** Etapas del propietario según su ruta: venta o renta (COR-04). */
export function ownerProcess(route?: string | null): readonly ProcessStep[] { return route === "arrendador" ? RENT_PROCESS : SALE_PROCESS; }
function salePhase(key: SalePhase, route?: string | null) { return ownerProcess(route).find(phase => phase.key === key)!; }
export function isOwnerRoute(route?: string | null) { return route === "captacion" || route === "arrendador"; }

/** Requisitos que cierran cada etapa del propietario. Los de verificación deben completarse antes de capturar los de contrato. */
const OWNER_PHASE_REQUIREMENTS: Record<SalePhase, readonly RequirementKey[]> = {
 prospecto: [],
 captacion: ["entrevista"],
 levantamiento: ["levantamiento"],
 documentos: [],
 dictamen: ["titularidad","factibilidad"],
 verificacion: ["valor","precio"],
 contrato: ["intermediacion","plan","publicacion"],
 publicacion: ["comprador","arrendatario"],
 visitas: ["oferta","revision_cierre","instrumento","contraparte","contrato_renta","garantias_renta"],
 cierre: ["firma","pago","entrega","inventario_entrega","registro","termino_renta","honorarios","archivo"],
};
/** Requisitos que cierran cada etapa de la renta del propietario (MRP-01). */
const RENT_PHASE_REQUIREMENTS: Record<SalePhase, readonly RequirementKey[]> = {
 prospecto: [],
 captacion: ["entrevista"],
 levantamiento: ["levantamiento"],
 documentos: [],
 dictamen: ["titularidad"],
 verificacion: ["valor","precio"],
 contrato: ["intermediacion","publicacion"],
 publicacion: ["arrendatario"],
 visitas: ["oferta","garantias_renta","contraparte"],
 cierre: ["contrato_renta","firma","pago","entrega","inventario_entrega","termino_renta","honorarios","archivo"],
};
const phaseTable = (route?: string | null) => route === "arrendador" ? RENT_PHASE_REQUIREMENTS : OWNER_PHASE_REQUIREMENTS;
/** La verificación de la venta reúne el dictamen jurídico y la opinión de valor con el precio. */
export const VERIFICATION_REQUIREMENTS = [...OWNER_PHASE_REQUIREMENTS.dictamen, ...OWNER_PHASE_REQUIREMENTS.verificacion] as readonly RequirementKey[];
/** Verificación según la ruta: en la renta, titularidad, opinión de renta y renta acordada. */
export function verificationRequirements(route?: string | null): readonly RequirementKey[] {
 const table = phaseTable(route);
 return [...table.dictamen, ...table.verificacion];
}
/** Requisitos que cierran una etapa del propietario. */
export function phaseRequirements(phase: SalePhase, route?: string | null): readonly RequirementKey[] { return phaseTable(route)[phase]; }
export function requirementPhase(key: RequirementKey, route?: string | null): SalePhase | undefined {
 const table = phaseTable(route);
 return (Object.keys(table) as SalePhase[]).find(phase => table[phase].includes(key));
}
/** Verificación terminada: revisiones de la etapa 1 completas y decisión de captación registrada. */
export function verificationComplete(flow: OperationWorkflow | null | undefined, today: string) {
 return !!flow && verificationRequirements(flow.ruta).every(key => reviewComplete(flow, key, today)) && !!flow.resolucion && ["aceptada","condicionada"].includes(flow.resolucion.tipo);
}
/** Etapa del proceso para cualquier expediente. Compradores y arrendatarios se integran en «Visitas y ofertas»; inversión se agrupa por analogía. */
/**
  Avance del propietario antes de verificación: entrevista inicial (02), levantamiento (04) y
  checklist de documentos. Lo conoce quien consulta los documentos y tareas de la operación.
*/
export type InitialInterviewStatus = { iniciada?: boolean; emitida?: boolean; levantamiento?: "borrador" | "emitido"; documentos?: "pendiente" | "completo" };
export function processPhase(etapa: WorkflowStage | null | undefined, flow: OperationWorkflow | null | undefined, today: string, initial?: InitialInterviewStatus): SalePhase {
 const stage = etapa ?? "captacion";
 if (["cierre","entrega","postventa","cerrado"].includes(stage)) return "cierre";
 // El propietario es «Prospecto» hasta que se inicia su entrevista inicial (02); compradores y demás siguen su ruta.
 if (stage === "captacion") {
  if (flow && !isOwnerRoute(flow.ruta)) return "captacion";
  if (!initial?.iniciada) return "prospecto";
  return initial.documentos ? "documentos" : initial.levantamiento ? "levantamiento" : "captacion";
 }
 if (flow && (flow.ruta === "compra" || flow.ruta === "arrendatario")) return "visitas";
 if (flow?.ruta === "inversion") return "verificacion";
 if (stage === "documentacion") return verificationComplete(flow, today) ? "contrato" : flow && phaseTable(flow.ruta).dictamen.every(key => reviewComplete(flow, key, today)) ? "verificacion" : "dictamen";
 return stage === "comercializacion" ? "publicacion" : "visitas";
}
/** Texto de la etapa actual: el proceso del propietario (venta o renta); la etiqueta propia para las demás rutas. Hoy y la operación usan el mismo (COR-04). */
export function processStageText(etapa: WorkflowStage | null | undefined, flow: OperationWorkflow | null | undefined, today: string, initial?: InitialInterviewStatus) {
 const stage = etapa ?? "captacion";
 if (flow && !isOwnerRoute(flow.ruta)) return stageLabel(stage, flow.ruta);
 const route = flow?.ruta ?? "captacion";
 if (stage === "documentacion" || stage === "captacion") return salePhase(processPhase(stage, flow, today, initial), route).label;
 return stageLabel(stage, route);
}

/** Informe al propietario: periodicidad mensual (decisión del titular, 15/10/2026). */
export function addMonths(date: string, months: number) {
 const [y, m, d] = date.split("-").map(Number);
 const target = new Date(Date.UTC(y, m - 1 + months, 1));
 const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
 target.setUTCDate(Math.min(d, last));
 return target.toISOString().slice(0, 10);
}
/** Última entrega registrada del informe; si no hay, cuenta el último preparado (RP-88: preparado no es entregado). */
export function lastOwnerReport(flow: Pick<OperationWorkflow, "entregasInforme"> | null | undefined, prepared?: string | null): string | undefined {
 const delivered = (flow?.entregasInforme ?? []).map(e => e.fecha).sort().at(-1);
 return delivered ?? prepared?.slice(0, 10) ?? undefined;
}
export function ownerReportStatus(lastReport: string | null | undefined, today: string): { estado: "al_dia" | "vencido" | "sin_informe"; proximo?: string } {
 if (!lastReport) return { estado: "sin_informe" };
 const proximo = addMonths(lastReport.slice(0, 10), 1);
 return { estado: proximo < today ? "vencido" : "al_dia", proximo };
}
/** El informe aplica mientras el inmueble se promueve o negocia. */
export function ownerReportApplies(etapa: WorkflowStage | null | undefined, flow: OperationWorkflow | null | undefined) {
 return (!flow || isOwnerRoute(flow.ruta)) && (etapa === "comercializacion" || etapa === "negociacion");
}
