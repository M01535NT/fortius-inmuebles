import type { ClasePersona, Encargo, EnQueVa } from "./asuntos-contrato";

/** Directorio (etapa 7 de PLAN.md; SPEC.md, sección 6): cada persona una sola vez, con todos sus asuntos. */
export type AsuntoDePersona = {
  id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa | null;
  cerrado: boolean; papeles: string[];
};

export const MONEDAS = ["MXN", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];
/** En qué va el aviso de privacidad con esa persona. La fecha la pone la base al cambiarlo. */
export const AVISOS_PRIVACIDAD = ["pendiente", "enviado", "aceptado", "no_acepto"] as const;
export type AvisoPrivacidad = (typeof AVISOS_PRIVACIDAD)[number];
export const MEDIOS_CONTACTO = ["llamada", "whatsapp", "correo", "en_persona", "otro"] as const;
export type MedioContacto = (typeof MEDIOS_CONTACTO)[number];
/** «¿Cómo te fue?» después de llamarle o escribirle. */
export const RESULTADOS_CONTACTO = ["contesto", "no_contesto", "pidio_llamar_despues", "le_interesa", "no_le_interesa", "cita", "otro"] as const;
export type ResultadoContacto = (typeof RESULTADOS_CONTACTO)[number];

/** Qué busca y qué ofrece la persona, con su presupuesto y su zona. Texto vacío: nada anotado. */
export type Interes = { que_busca: string; que_ofrece: string; presupuesto: number | null; moneda: Moneda; zona: string };

/** Lo que muestra «Qué ver» en el Directorio. Por omisión, las activas (no archivadas). */
export const VISTAS_DIRECTORIO = ["activas", "archivadas", "sin_seguimiento", "todas"] as const;
export type VistaDirectorio = (typeof VISTAS_DIRECTORIO)[number];

export type ContactoPersona = {
  id: string; cuando: string; medio: MedioContacto; resultado: ResultadoContacto; nota: string;
  quien_id: string; quien_nombre: string | null;
};

export type PersonaDirectorio = {
  id: string; clase: ClasePersona; nombre: string; fallecida: boolean;
  telefonos: { pais: string; numero: string }[]; correo: string | null; no_contactar: boolean;
  volver_a_llamar: string | null; nota: string; es_ejemplo: boolean; version: number;
  /** Lo que sigue con esa persona; "" si nada. */
  lo_que_sigue: string;
  /** Fecha y hora en que se archivó; null si está activa. Archivar no es mandar a Eliminados. */
  archivada_el: string | null;
  /** Quién del equipo la lleva. */
  responsable_id: string;
  /** Por dónde prefiere que le contacten. */
  canal: string | null;
  aviso_privacidad: AvisoPrivacidad;
  interes: Interes;
  ultimo_contacto: Pick<ContactoPersona, "cuando" | "medio" | "resultado"> | null;
  /** Activa, sin asunto abierto, sin «lo que sigue» y sin fecha de volver a llamar (o ya pasó). */
  sin_seguimiento: boolean;
  asuntos: AsuntoDePersona[];
};

export type CambioPersonaDirectorio = {
  volver_a_llamar?: string | null; no_contactar?: boolean; nota?: string; lo_que_sigue?: string; archivada?: boolean;
};

/** Anotar una llamada o un mensaje; en el mismo paso puede cambiar «volver a llamar» y «lo que sigue». */
export type NuevoContacto = {
  version: number; medio: MedioContacto; resultado: ResultadoContacto; nota?: string; cuando?: string;
  volver_a_llamar?: string | null; lo_que_sigue?: string;
};

/** Lo que responde «Crear persona» desde una consulta del sitio. */
export type LeadADirectorio = { persona_id: string; creada: boolean; lead_version: number };

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
  volver_a_llamar: string | null; lo_que_sigue: string; archivada_el: string | null; responsable_id: string;
  canal: string | null; aviso_privacidad: AvisoPrivacidad; aviso_privacidad_el: string | null; interes: Interes;
  datos: DatosDePersona;
  asuntos: AsuntoDePersona[];
  /** Los 50 contactos más nuevos. */
  contactos: ContactoPersona[];
};

export type CambioFicha = {
  persona?: {
    version: number; nombre?: string; correo?: string | null; telefono?: { pais: string; numero: string } | null; fallecida?: boolean;
    lo_que_sigue?: string; canal?: string | null; aviso_privacidad?: AvisoPrivacidad; interes?: Partial<Interes>; archivada?: boolean;
  };
  datos?: { version: number | null } & Partial<Record<CampoDato, string | null>>;
};
