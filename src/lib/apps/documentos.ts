import { z } from "zod";
import { draftWrite } from "@/lib/formatos/schemas";
import { formatoById, type FormatoDefinition } from "@/lib/formatos/catalog";

/*
  Documentos sueltos (decisión del titular, 17/10/2026; HER-02): cualquier formato en blanco o
  lleno con los datos que dé el cliente, sin recorrer las etapas de una operación.
  Se guardan como trabajos de Herramientas (sin operación, con versiones y por usuario);
  el PDF se genera al momento y no se archiva en ningún expediente.
*/

export const DOCUMENTOS_APP = "documentos";
/** Todos los formatos con captura (HER-02); el 03 es la cartera de Control comercial, no un documento. */
export const FORMATOS_INDEPENDIENTES = ["01", "02", "04A", "04B", "04C", "04D", "04E", "04F", "04G", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"] as const;
/**
  Formatos llenos que no salen en Word: el aviso de privacidad (01) es un documento legal cotejado
  y la promesa (15) exige su revisión jurídica; los dos se descargan en PDF completo o como machote.
*/
export const WORD_LLENO_EXCLUIDOS: ReadonlySet<string> = new Set(["01", "15"]);
const ETAPAS: Record<FormatoDefinition["phase"], string> = { 1: "Captación", 2: "Revisión y valor", 3: "Comercialización", 4: "Compraventa y cierre" };
/** Los formatos de Documentos sueltos agrupados por la etapa en que se usan. */
export function gruposDeFormatos() {
  const formatos = FORMATOS_INDEPENDIENTES.map(formatoById);
  return ([1, 2, 3, 4] as const).map(phase => ({ titulo: ETAPAS[phase], formatos: formatos.filter(item => item.phase === phase) })).filter(grupo => grupo.formatos.length);
}
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
