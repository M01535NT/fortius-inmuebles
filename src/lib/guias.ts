import { z } from "zod";
import { ACREEDORES, pasosDe, type Acreedor } from "@/lib/tramites";

/*
  FLX-03 parte B (DEC-55, titular 15/11/2026): cada tipo de asunto trae su guía y el riel dibuja sus
  etapas. Venta, renta, compra, búsqueda de renta e inversión son las rutas de siempre y conservan
  sus etapas; inspección, opinión de valor y cancelación de hipoteca son guías propias que guardan
  su paso en `flujo.guia` (la etapa de la base no se mueve). Cancelación de hipoteca usa los pasos de
  Trámites según el acreedor, para que el riel del asunto y el del trámite digan lo mismo.
  Ninguna guía frena: sugieren pasos y documentos (RP-100).
*/

export const GUIAS_PROPIAS = ["inspeccion", "opinion_valor", "cancelacion_hipoteca"] as const;
export type GuiaPropia = typeof GUIAS_PROPIAS[number];
export type GuiaClave = "venta" | "renta" | "compra" | "busqueda_renta" | "inversion" | GuiaPropia;

export const GUIA_NOMBRE: Record<GuiaClave, string> = {
  venta: "Venta", renta: "Renta", compra: "Compra", busqueda_renta: "Búsqueda de renta", inversion: "Inversión",
  inspeccion: "Inspección", opinion_valor: "Opinión de valor", cancelacion_hipoteca: "Cancelación de hipoteca",
};

/** Etapas de las guías propias (aprobadas por el titular el 15/11/2026). La cancelación sale de Trámites. */
const ETAPAS: Record<Exclude<GuiaPropia, "cancelacion_hipoteca">, readonly string[]> = {
  inspeccion: ["Solicitud y alcance", "Visita al inmueble", "Hallazgos con fotos", "Informe entregado"],
  opinion_valor: ["Entrevista", "Levantamiento", "Documentos", "Opinión entregada"],
};

export const guiaSchema = z.object({
  clave: z.enum(GUIAS_PROPIAS),
  paso: z.number().int().min(0).max(19),
  acreedor: z.enum(Object.keys(ACREEDORES) as [Acreedor, ...Acreedor[]]).optional(),
}).strict();
export type Guia = z.infer<typeof guiaSchema>;

export function etapasDeGuia(guia: Pick<Guia, "clave" | "acreedor">): readonly string[] {
  if (guia.clave === "cancelacion_hipoteca") return pasosDe(guia.acreedor ?? "banco").map(p => p.nombre);
  return ETAPAS[guia.clave];
}

/** El tipo de un asunto: su guía propia o, sin ella, el de su ruta. */
export function tipoDeAsunto(flow: { ruta: string; guia?: Pick<Guia, "clave"> } | null | undefined, operacion?: string): GuiaClave {
  if (flow?.guia) return flow.guia.clave;
  switch (flow?.ruta) {
    case "arrendador": return "renta";
    case "compra": return "compra";
    case "arrendatario": return "busqueda_renta";
    case "inversion": return "inversion";
    case "captacion": return "venta";
    default: return operacion === "renta" ? "renta" : operacion === "inversion" ? "inversion" : "venta";
  }
}

/** Tipos que se eligen al abrir un asunto o al cambiarlo. Compra y búsqueda de renta llegan con FLX-04 (RP-93). */
export const TIPOS_ELEGIBLES = ["venta", "renta", "inspeccion", "opinion_valor", "cancelacion_hipoteca"] as const satisfies readonly GuiaClave[];
export type TipoElegible = typeof TIPOS_ELEGIBLES[number];
export const esGuiaPropia = (tipo: GuiaClave): tipo is GuiaPropia => (GUIAS_PROPIAS as readonly string[]).includes(tipo);
