import { PASO_CLAVES, type Tramite } from "@/lib/tramites";

/*
  TRA-01 · freno de la firma en la pantalla: el mismo criterio que la base
  (fortius_inmuebles_tramites_que_frenan_firma). Un trámite ligado a una venta la frena mientras
  el paso del Registro Público no se cierre y el director no haya decidido firmar sin él.
  Un trámite cancelado sigue frenando: la hipoteca no se canceló.
*/
export const PASO_REGISTRO = PASO_CLAVES.indexOf("registro");

/** El Registro Público ya inscribió la cancelación (su paso quedó cerrado). */
export const cancelacionInscrita = (t: Pick<Tramite, "pasoActual">) => t.pasoActual > PASO_REGISTRO;

/** El trámite frena la firma de la venta a la que está ligado. */
export const frenaFirma = (t: Pick<Tramite, "pasoActual" | "firmaSinCancelacion">) => !cancelacionInscrita(t) && !t.firmaSinCancelacion;

/** El 409 del servidor al pasar a la firma por la cancelación pendiente. */
export const esFrenoDeFirma = (message: string) => /^Antes de la firma: la cancelación de hipoteca/.test(message);

export const MOTIVO_MINIMO = 10;
