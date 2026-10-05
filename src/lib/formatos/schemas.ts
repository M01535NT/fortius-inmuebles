import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const version = z.number().int().positive();
const folio = z.string().trim().min(1).max(80);
const operation = z.enum(["venta", "renta", "administracion", "otra"]);
const row = z.record(z.string().max(120), z.union([z.string().max(2000), z.number().finite(), z.boolean()]))
  .refine((value) => Object.keys(value).length <= 24, "Fila demasiado grande");
const data = z.record(z.string().max(120), z.union([
  z.string().max(125000), z.number().finite(), z.boolean(),
  z.array(z.string().max(2000)).max(100), z.array(row).max(70),
])).refine((value) => Object.entries(value).every(([key, entry]) => typeof entry !== "string" || entry.length <= (key === "revisionDatos" ? 125000 : 30000)), "Campo de texto demasiado grande")
  .refine((value) => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 250000, "Documento demasiado grande");

export const expedienteCreate = z.object({
  clienteId: id, asesorId: id, folio, operacion: operation,
  propiedadSlug: id.optional(), unidad: z.string().max(160).default(""),
}).strict();
export const expedienteWrite = z.object({
  version,
  folio: folio.optional(), operacion: operation.optional(),
  propiedadSlug: id.nullable().optional(), unidad: z.string().max(160).optional(),
  clienteId: id.optional(), asesorId: id.optional(),
}).strict();
export const draftCreate = z.object({ formatoId: z.enum(["01","02","03","04A","04B","04C","04D","04E","04F","04G","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19"]), data: data.default({}) }).strict();
export const draftWrite = z.object({ version, data }).strict();
