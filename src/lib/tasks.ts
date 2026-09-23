import { z } from "zod";

export const TASK_STATUSES = { pendiente: "Pendiente", "en-curso": "En curso", "en-espera": "En espera", completada: "Completada", cancelada: "Cancelada" } as const;
export const TASK_PRIORITIES = { baja: "Baja", normal: "Normal", alta: "Alta", urgente: "Urgente" } as const;
export const TASK_CATEGORIES = { captacion: "Captación", leads: "Seguimiento de leads", visitas: "Visitas", documentacion: "Documentación", comercializacion: "Comercialización", negociacion: "Negociación", cierre: "Cierre", arrendamientos: "Arrendamientos", mantenimiento: "Mantenimiento", administracion: "Administración" } as const;
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const reference = id.or(z.literal("")).optional();
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const date = new Date(value + "T00:00:00.000Z"); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value && value.slice(0,4) !== "0000"; }, "Fecha inválida");
export type TaskHistory = { fecha: string; actorId: string; actorEmail?: string; accion: string; texto?: string };
export const taskSchema = z.object({
  id, titulo: z.string().trim().min(1).max(160), descripcion: z.string().max(20000).default(""),
  categoria: z.enum(Object.keys(TASK_CATEGORIES) as [keyof typeof TASK_CATEGORIES, ...Array<keyof typeof TASK_CATEGORIES>]),
  estado: z.enum(Object.keys(TASK_STATUSES) as [keyof typeof TASK_STATUSES, ...Array<keyof typeof TASK_STATUSES>]),
  prioridad: z.enum(Object.keys(TASK_PRIORITIES) as [keyof typeof TASK_PRIORITIES, ...Array<keyof typeof TASK_PRIORITIES>]),
  vence: calendarDate.or(z.literal("")).optional(), asesorId: reference, leadId: reference, clienteId: reference, propiedadSlug: reference,
  pasos: z.array(z.object({ id, texto: z.string().trim().min(1).max(500), hecho: z.boolean() })).max(100).default([]),
  motivoEspera: z.string().max(5000).optional(), nuevaNota: z.string().max(5000).optional(),
  creadoEl: z.string().optional(), actualizadoEl: z.string().optional(), completadoEl: z.string().optional(), completadoPor: z.string().optional(),
  historial: z.array(z.object({fecha:z.string(),actorId:z.string(),actorEmail:z.string().optional(),accion:z.string(),texto:z.string().optional()})).optional(),
}).refine(t => t.estado !== "en-espera" || !!t.motivoEspera?.trim(), {message:"Indica el motivo de espera",path:["motivoEspera"]}).refine(t=>new Set(t.pasos.map(p=>p.id)).size===t.pasos.length,{message:"Los pasos deben tener identificadores únicos",path:["pasos"]});
export type Task = z.infer<typeof taskSchema>;
export function isTaskOpen(task: Pick<Task,"estado">) { return task.estado !== "completada" && task.estado !== "cancelada"; }
export function taskBucket(task: Pick<Task,"estado"|"vence">, today: string): "vencidas"|"hoy"|"proximas"|"sin-fecha"|"futuras"|"cerradas" {
  if (!isTaskOpen(task)) return "cerradas";
  if (!task.vence) return "sin-fecha";
  if (task.vence < today) return "vencidas";
  if (task.vence === today) return "hoy";
  const end = new Date(today + "T00:00:00.000Z"); end.setUTCDate(end.getUTCDate()+7);
  return task.vence <= end.toISOString().slice(0,10) ? "proximas" : "futuras";
}
export const TASK_TEMPLATES: Array<{id:string;nombre:string;categoria:Task["categoria"];titulo:string;descripcion:string;pasos:string[]}> = [
  {id:"captacion",nombre:"Captación de inmueble",categoria:"captacion",titulo:"Preparar captación",descripcion:"Revisar información y acordar los siguientes pasos con el propietario.",pasos:["Confirmar datos del propietario","Recabar documentos disponibles","Programar visita al inmueble"]},
  {id:"seguimiento",nombre:"Seguimiento de lead",categoria:"leads",titulo:"Dar seguimiento al lead",descripcion:"Confirmar necesidades y registrar el resultado del contacto.",pasos:["Revisar solicitud","Contactar al interesado","Acordar siguiente acción"]},
  {id:"comercializacion",nombre:"Comercialización",categoria:"comercializacion",titulo:"Preparar comercialización",descripcion:"Revisar materiales y autorización antes de publicar.",pasos:["Verificar información del inmueble","Preparar fotografías y descripción","Confirmar autorización de publicación"]},
  {id:"cierre",nombre:"Preparación de cierre",categoria:"cierre",titulo:"Coordinar cierre",descripcion:"Dar seguimiento a documentos y acuerdos pendientes.",pasos:["Confirmar documentos requeridos","Revisar pendientes con las partes","Confirmar cita de firma"]},
  {id:"arrendamiento",nombre:"Arrendamiento",categoria:"arrendamientos",titulo:"Coordinar arrendamiento",descripcion:"Revisar expediente y preparar entrega.",pasos:["Revisar expediente","Confirmar contrato y condiciones","Preparar inventario de entrega"]},
  {id:"mantenimiento",nombre:"Mantenimiento",categoria:"mantenimiento",titulo:"Coordinar mantenimiento",descripcion:"Documentar la incidencia y verificar su atención.",pasos:["Registrar incidencia","Solicitar presupuesto y autorización","Verificar trabajo realizado"]},
];
