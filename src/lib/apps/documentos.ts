import { z } from "zod";
import { draftWrite } from "@/lib/formatos/schemas";

/*
  Documentos sin expediente (decisión del titular, 17/10/2026): acceso directo para preparar
  una opinión, un contrato u otro entregable sin recorrer las etapas de una operación.
  Se guardan como trabajos de Herramientas (sin operación, con versiones y por usuario);
  el PDF se genera al momento y no se archiva en ningún expediente.
*/

export const DOCUMENTOS_APP = "documentos";
export const FORMATOS_INDEPENDIENTES = ["06", "07", "08", "09", "10", "12", "14", "15", "19"] as const;
/** Lo que el documento muestra donde normalmente va el folio de la operación. */
export const FOLIO_INDEPENDIENTE = "Sin expediente";

const adjunto = z.object({
  id: z.uuid(), kind: z.enum(["foto", "croquis", "soporte"]),
  caption: z.string().trim().min(1).max(240), source: z.string().trim().min(1).max(240),
  observed_on: z.iso.date().nullable(),
}).strict();
export type AdjuntoIndependiente = z.infer<typeof adjunto>;

/** Imágenes del documento (opinión de valor 07): archivos privados del usuario con su descripción, en data.adjuntos. */
export const adjuntosIndependientes = z.array(adjunto).max(40);
export const documentoIndependienteInput = z.object({
  formatoId: z.enum(FORMATOS_INDEPENDIENTES),
  // Mismos límites que un borrador de expediente, más la lista de imágenes del propio documento.
  data: z.record(z.string(), z.unknown()).refine(({ adjuntos, ...rest }) => draftWrite.shape.data.safeParse(rest).success && (adjuntos === undefined || adjuntosIndependientes.safeParse(adjuntos).success), "Revisa la captura del documento"),
}).strict();
export const adjuntosDe = (data: Record<string, unknown>): AdjuntoIndependiente[] => adjuntosIndependientes.safeParse(data.adjuntos).data ?? [];
export type DocumentoIndependiente = z.infer<typeof documentoIndependienteInput>;
