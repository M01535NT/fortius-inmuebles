export const STAGES = ["Por definir", "Prospección", "Calificación", "Preparación", "En comercialización", "Negociación", "Cerrado ganado", "Cerrado perdido", "Pausado"] as const;
export const PRIORITIES = ["Por definir", "Alta", "Media", "Baja"] as const;
export const TASKS = ["Abierto", "Completado", "Cancelado"] as const;
export const OPERATIONS = ["Por definir", "Venta", "Renta", "Otro"] as const;
export const PROPERTY_TYPES = ["Por definir", "Departamento", "Terreno", "Casa", "Local comercial", "Oficina", "Nave industrial", "Otro"] as const;
export const ACTIVITIES = ["Llamada", "Visita", "Oferta", "Seguimiento", "Cambio", "Cancelación", "Cierre", "Entrega", "Otro"] as const;
export const EVENT_STATES = ["Registrado", "Pendiente", "Aceptado", "Rechazado", "Cancelado"] as const;
export const BASES = ["Declarado", "Observado", "Comprobado"] as const;
export const DOCUMENT_STATES = ["Pendiente", "Solicitado", "Recibido", "Verificado", "Rechazado"] as const;
export const APPLICABILITY = ["Por definir", "Aplica", "No aplica"] as const;
export const CRITERIA_I = ["Ubicación", "Mercado", "Precio", "Valor agregado"];
export const CRITERIA_C = ["Lealtad", "Compatibilidad", "Motivación", "Mercado", "Respaldo", "Visitas"];
export type Segment = "Inmueble" | "Comprador";
type Currency = "" | "MXN" | "USD";
export interface Management {
 etapa: typeof STAGES[number]; responsable: string; registro: string; ultima: string; accion: string; compromiso: string;
 cierre: string; prioridad: typeof PRIORITIES[number]; tarea: typeof TASKS[number]; operacion: typeof OPERATIONS[number];
 unidad: string; expediente: string; relacionado: string; observaciones: string;
}
export interface Opportunity { id: string; segmento: Segment; nombre: string; tipo: typeof PROPERTY_TYPES[number]; valor: number|null; moneda: Currency; comision: number|null; niveles: (number|null)[]; fuente: string; gestion: Management }
export interface CommercialEvent { id: string; oportunidad: string; fecha: string; actividad: typeof ACTIVITIES[number]; detalle: string; importe: number|null; moneda: Currency; estado: typeof EVENT_STATES[number]; responsable: string; evidencia: string; base: typeof BASES[number]; anterior: string }
export interface CommercialDocument { id: string; oportunidad: string; nombre: string; aplicabilidad: typeof APPLICABILITY[number]; estado: typeof DOCUMENT_STATES[number]; fuente: string; fecha: string; responsable: string; observacion: string; anterior: string }
interface SourceControl { conteo: number|null; valor: number|null; potencial: number|null; priorizado: number|null }
export interface ComercialBookData {
 config: { modoCorte: "Fijo"|"Diario"; fechaCorte: string; umbral: number|null; diasAviso: number|null; pesosInmueble: (number|null)[]; pesosComprador: (number|null)[]; definicionesInmueble: string[]; definicionesComprador: string[]; tc: number|null; fechaTc: string; fuenteTc: string };
 oportunidades: Opportunity[]; eventos: CommercialEvent[]; documentos: CommercialDocument[];
 origen: { estado: "Sin configurar"|"Configurado"|"No aplica"; fuente: string; motivo: string; Inmueble: SourceControl; Comprador: SourceControl };
}
export function newOpportunity(id: string, segmento: Segment): Opportunity {
 return {id,segmento,nombre:"",tipo:"Por definir",valor:null,moneda:"",comision:null,niveles:Array(segmento === "Inmueble" ? 4 : 6).fill(null),fuente:"",gestion:{etapa:"Por definir",responsable:"",registro:"",ultima:"",accion:"",compromiso:"",cierre:"",prioridad:"Por definir",tarea:"Abierto",operacion:"Por definir",unidad:"",expediente:"",relacionado:"",observaciones:""}};
}
export function emptyComercialBook(): ComercialBookData {
 const source = (): SourceControl => ({conteo:null,valor:null,potencial:null,priorizado:null});
 return {config:{modoCorte:"Diario",fechaCorte:"",umbral:69,diasAviso:7,pesosInmueble:[20,20,50,10],pesosComprador:[50,10,10,10,10,10],
 definicionesInmueble:["La ubicación corresponde al uso, cliente y mercado objetivo.", "1 si el mercado favorece a propietarios; 0 si favorece a compradores.", "Precio respaldado por análisis de mercado o avalúo vigente. Se conserva el criterio original, no se verifica documentación.", "Diferenciadores objetivos respecto de inmuebles competidores."],
 definicionesComprador:["Compromiso del cliente con la asesoría; conservar evaluación y documentar sustento.", "Coherencia entre necesidades del cliente y presupuesto disponible.", "Disposición del cliente para avanzar hacia la adquisición.", "1 si el mercado favorece a compradores; 0 si favorece a propietarios.", "Disponibilidad o soporte de financiamiento documentado.", "El cliente ya visitó inmuebles."],tc:null,fechaTc:"",fuenteTc:""},oportunidades:[],eventos:[],documentos:[],origen:{estado:"Sin configurar",fuente:"",motivo:"",Inmueble:source(),Comprador:source()}};
}
export interface CommercialTotals { valor: number|null; potencial: number|null; ponderado: number|null; priorizado: number|null; abierto: number|null }
export interface CommercialRow { id: string; segmento: Segment; puntuacion: number|null; clasificacion: "Sin evaluar"|"Revisar"|"Prioritario"; tc: number|null; potencial: number|null; ponderado: number|null; priorizado: number|null; valorMXN: number|null; potencialMXN: number|null; ponderadoMXN: number|null; priorizadoMXN: number|null; abiertoMXN: number|null; participacion: number|null; dias: number|null; alerta: string; controles: string[] }
interface CommercialHistoryControl { id:string; controles:string[]; vigente:boolean; sustituidoPor:string|null }
export interface ComercialResult { corte: string; configuracionErrors: string[]; filas: CommercialRow[]; totals: CommercialTotals; segmentos: Record<Segment,CommercialTotals>; controles: string[]; eventos: CommercialHistoryControl[]; documentos: CommercialHistoryControl[] }
export interface CommercialBook { id:string; nombre:string; version:number; data:ComercialBookData; created_at:string; updated_at:string }
