import { z } from "zod";

export const EXPEDIENTE_ETAPAS = {
  captacion: "Captación",
  documentacion: "Documentación",
  comercializacion: "Comercialización",
  negociacion: "Negociación",
  cierre: "Cierre",
  cerrado: "Cerrado",
} as const;

export const EXPEDIENTE_DOCUMENTOS = {
  identidad: "Identificación del titular",
  titulo: "Título o antecedente de propiedad",
  gravamenes: "Situación de gravámenes",
  predial: "Predial",
  servicios: "Servicios",
  intermediacion: "Autorización de intermediación",
  avaluo: "Opinión de valor o avalúo",
} as const;

export const expedienteOperationWrite = z.object({
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
  etapa: z.enum(Object.keys(EXPEDIENTE_ETAPAS) as [keyof typeof EXPEDIENTE_ETAPAS, ...(keyof typeof EXPEDIENTE_ETAPAS)[]]),
  fechaObjetivo: z.iso.date().nullable(),
  checklist: z.partialRecord(
    z.enum(Object.keys(EXPEDIENTE_DOCUMENTOS) as [keyof typeof EXPEDIENTE_DOCUMENTOS, ...(keyof typeof EXPEDIENTE_DOCUMENTOS)[]]),
    z.enum(["pendiente", "recibido", "no_aplica"]),
  ),
}).strict();

export const expedienteNoteCreate = z.object({
  descripcion: z.string().trim().min(1).max(1000),
}).strict();
