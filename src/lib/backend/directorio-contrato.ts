import type { ClasePersona, Encargo, EnQueVa } from "./asuntos-contrato";

/** Directorio (etapa 7 de PLAN.md; SPEC.md, sección 6): cada persona una sola vez, con todos sus asuntos. */
export type AsuntoDePersona = {
  id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa | null;
  cerrado: boolean; papeles: string[];
};

export type PersonaDirectorio = {
  id: string; clase: ClasePersona; nombre: string; fallecida: boolean;
  telefonos: { pais: string; numero: string }[]; correo: string | null; no_contactar: boolean;
  volver_a_llamar: string | null; nota: string; es_ejemplo: boolean; version: number;
  asuntos: AsuntoDePersona[];
};

export type CambioPersonaDirectorio = { volver_a_llamar?: string | null; no_contactar?: boolean; nota?: string };

/** Los datos de la ficha de una persona (SPEC.md, sección 6). Ninguno es obligatorio: no todas van a un contrato. */
export const CAMPOS_DATOS = [
  "nombre_completo", "nacionalidad", "ocupacion", "estado_civil", "identificacion_tipo", "identificacion_numero", "curp", "rfc", "domicilio",
] as const;
export type CampoDato = (typeof CAMPOS_DATOS)[number];
/** `version` es null mientras la persona no tenga datos guardados. */
export type DatosDePersona = Record<CampoDato, string | null> & { version: number | null };

/** La ficha completa, como se abre desde Personas de un asunto. */
export type FichaPersona = {
  id: string; clase: ClasePersona; nombre: string; fallecida: boolean;
  telefonos: { pais: string; numero: string }[]; correo: string | null; no_contactar: boolean; version: number;
  datos: DatosDePersona;
  asuntos: AsuntoDePersona[];
};

export type CambioFicha = {
  persona?: { version: number; nombre?: string; correo?: string | null; telefono?: { pais: string; numero: string } | null; fallecida?: boolean };
  datos?: { version: number | null } & Partial<Record<CampoDato, string | null>>;
};
