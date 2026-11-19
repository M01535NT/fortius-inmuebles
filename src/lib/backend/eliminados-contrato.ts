/**
 * Eliminados (SPEC.md: nada se borra, se manda a Eliminados y se recupera). Lo que comparten la pantalla y el servidor.
 */

/** Lo que hoy se puede mandar a Eliminados en el panel. */
export const CLASES_ELIMINADO = ["asunto", "persona", "inmueble", "guia", "trabajo"] as const;
export type ClaseEliminado = (typeof CLASES_ELIMINADO)[number];

export const NOMBRE_CLASE_ELIMINADO: Record<ClaseEliminado, string> = {
  asunto: "Asuntos", persona: "Personas", inmueble: "Inmuebles", guia: "Guías de la Biblioteca", trabajo: "Documentos y herramientas",
};

export type Eliminado = {
  clase: ClaseEliminado; id: string;
  nombre: string;
  /** El folio, la clase de guía o el asunto del que era. */
  detalle: string | null;
  /** Cuándo se mandó a Eliminados (ISO). */
  eliminado_el: string;
  version: number;
  /** Si quien mira lo puede recuperar: asuntos, personas e inmuebles solo el director; una guía, quien la hizo o el director. */
  recuperable: boolean;
  /** Por qué no se puede recuperar todavía (p. ej. su asunto sigue en Eliminados); null si nada lo impide. */
  aviso: string | null;
};

/** Lo que responde la lista: lo eliminado y las clases que llegaron al tope (hay más que no se muestran). */
export type ListaEliminados = { eliminados: Eliminado[]; hayMas: ClaseEliminado[] };

export const AVISO_ASUNTO_ELIMINADO = "Su asunto también está en Eliminados: primero recupera el asunto.";
