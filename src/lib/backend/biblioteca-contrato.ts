import type { Columna } from "./apartados-contrato";
import type { Quien, Vista } from "./asuntos-contrato";

/** Biblioteca (etapa 7 de PLAN.md; SPEC.md, sección 10): guías que se copian a un asunto y ahí se cambian. */
export const CLASES_BIBLIOTECA = ["que_pedir", "que_hacer", "apartado_propio"] as const;
export type ClaseBiblioteca = (typeof CLASES_BIBLIOTECA)[number];
export const NOMBRE_CLASE_BIBLIOTECA: Record<ClaseBiblioteca, string> = {
  que_pedir: "Qué pedir", que_hacer: "Qué hacer", apartado_propio: "Apartados",
};

export type DocumentoGuia = { nombre: string; grupo?: string; entrega_papel?: string };
export type TareaGuia = { titulo: string; quien: Quien; dias?: number | null };
export type EtapaGuia = { nombre: string; tareas: TareaGuia[] };

export type ContenidoBiblioteca =
  | { documentos: DocumentoGuia[] }
  | { etapas: EtapaGuia[] }
  | { vista: Vista; columnas: Columna[] };

export type Guia = {
  id: string; clase: ClaseBiblioteca; nombre: string; descripcion: string;
  contenido: { documentos?: DocumentoGuia[]; etapas?: EtapaGuia[]; vista?: Vista; columnas?: Columna[] };
  revisado_abogado: boolean; es_ejemplo: boolean; version: number; creado_por: string | null; updated_at: string;
  /** Quien entró la puede cambiar (la hizo él, o es el director). */
  editable: boolean;
};

/** Cuántas cosas trae una guía: documentos, tareas o columnas. */
export function cuantasTrae(g: Pick<Guia, "contenido">): number {
  const c = g.contenido;
  return c.documentos?.length ?? c.etapas?.reduce((n, e) => n + e.tareas.length, 0) ?? c.columnas?.length ?? 0;
}

export type ResultadoCopia = { agregados: number; repetidos: number; nombre: string };
