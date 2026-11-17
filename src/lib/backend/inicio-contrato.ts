import type { ClaseTarea, Quien } from "./asuntos-contrato";

/** Inicio (etapa 8 de PLAN.md; SPEC.md, sección 3): lo que hay que atender hoy, la semana y lo que falta cobrar. */
export type Moneda = "MXN" | "USD";
export type Contacto = { nombre: string; telefono: string | null };

export type SolicitudInicio = {
  id: string; nombre: string; telefono: string; correo: string | null; mensaje: string; recibida_el: string;
  asignada_a: string | null; asunto_id: string | null; interesado_id: string | null; consulta_id: string | null;
  inmueble: { id: string; nombre: string; folio: string } | null; version: number;
};

export type TareaInicio = {
  id: string; asunto_id: string; asunto: { folio: string; nombre: string };
  titulo: string; quien: Quien; clase: ClaseTarea; fecha: string | null; hora: string | null;
  volver_a_preguntar: string | null; recordada_el: string | null; responsable_id: string; version: number;
  /** A quién escribirle para recordarle (si le toca a otro). */
  para: Contacto | null;
  /** En una visita: quién viene y a qué inmueble. */
  interesado: string | null; inmueble: string | null;
};

export type ContactoInicio = { id: string; nombre: string; telefono: string | null; nota: string; volver_a_llamar: string; version: number };
export type CobrarInicio = { asunto_id: string; folio: string; nombre: string; falta: Partial<Record<Moneda, number>> };
export type VenceInicio = { id: string; asunto_id: string; asunto: string; nombre: string; vence_el: string };

export type Inicio = {
  hoy: string;
  solicitudes: SolicitudInicio[];
  tareas: TareaInicio[];
  contactos: ContactoInicio[];
  cobrar: CobrarInicio[];
  vencen: VenceInicio[];
};
