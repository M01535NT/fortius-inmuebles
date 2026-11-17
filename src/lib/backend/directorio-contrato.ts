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
