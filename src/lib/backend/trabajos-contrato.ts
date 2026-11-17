import type { Origen } from "@/lib/panel/documentos/diccionario";

/**
 * Trabajos: un formato que se llena por preguntas o una cuenta de Herramientas (etapa 6 de PLAN.md; SPEC.md, secciones 8 y 9).
 * Nace en un asunto o suelto; uno suelto se pasa a su asunto cuando el cliente contrata. Lo leen la pantalla y el servidor.
 */

export const CLASES_TRABAJO = ["formato", "herramienta"] as const;
export type ClaseTrabajo = (typeof CLASES_TRABAJO)[number];

/** Las cuentas de Herramientas. La opinión de valor no está aquí: es el formato 07. */
export const HERRAMIENTAS = ["isr", "compra", "venta", "credito", "comision"] as const;
export type Herramienta = (typeof HERRAMIENTAS)[number];
export const NOMBRE_HERRAMIENTA: Record<Herramienta, string> = {
  isr: "Cálculo de ISR", compra: "Gastos del comprador", venta: "Gastos del vendedor", credito: "Crédito", comision: "Comisión",
};

/** Los contratos: al cargar el firmado, el asunto propone pasar a En marcha. */
export const FORMATOS_CONTRATO = new Set(["09", "15", "20", "21", "24"]);

export type Trabajo = {
  id: string; asunto_id: string | null; clase: ClaseTrabajo; tipo: string; nombre: string; datos: Record<string, unknown>;
  resultado: string | null; documento_id: string | null; pdf_version: number | null; persona_id: string | null; inmueble_id: string | null;
  responsable_id: string; version: number; created_at: string; updated_at: string;
};

/** Un renglón de la lista de trabajos sueltos o de los del asunto. */
export type FilaTrabajo = Pick<Trabajo, "id" | "asunto_id" | "clase" | "tipo" | "nombre" | "resultado" | "documento_id" | "version" | "updated_at">;

export type ArchivoDelTrabajo = { id: string; nombre: string; created_at: string };

/** Lo que abre la ventana de un formato: el trabajo, su asunto y lo que el asunto ya sabe. */
export type TrabajoAbierto = {
  trabajo: Trabajo;
  asunto: { id: string; folio: string; nombre: string } | null;
  /** Lo que el asunto aporta a cada espacio y de dónde sale (la hoja lo muestra donde el documento no tiene nada). */
  del_asunto: Record<string, string | number>;
  origen: Record<string, Origen>;
  /** Quiénes dan los datos. Vacío si el asunto no tiene a nadie con ese papel. */
  quienes: { propietario: string | null; comprador: string | null; inmueble: string | null };
  documento: { id: string; paso: "borrador" | "revisado" | "firmado"; archivos: ArchivoDelTrabajo[] } | null;
};

/** Respuesta al guardar: dónde quedó guardado lo que vuelve a la persona o al inmueble, y lo que no se pudo. */
export type ResultadoGuardar = { trabajo: Trabajo; guardado_en: string[]; no_guardado: string[] };
