import type { Cliente } from "@/lib/backend/contracts";
import type { Expediente, FilaAsunto } from "@/lib/panel/datos/asuntos";
import { pendientesDeCobro, porCobrar, sumaFalta, type Cobro } from "@/lib/panel/datos/dinero";
import { filaTramite, grupoDe, type FilaTramite } from "@/lib/panel/datos/tramites";
import type { Tramite } from "@/lib/tramites";

/**
 * Lo que Hoy toma de Trámites y de Dinero (AUD-05). Funciones puras.
 * Trámites: los que esperan una respuesta que ya tocaba pedir (hoy o antes), lo más atrasado primero.
 * Dinero: lo que falta por cobrar con comisión anotada, solo si no es cero.
 */

export const rutaTramite = (id: string) => `/panel/tramites?ver=${encodeURIComponent(id)}`;

export function tramitesDeHoy(tramites: readonly Tramite[], personas: readonly Cliente[], hoy: string): FilaTramite[] {
  return tramites
    .filter((t) => grupoDe(t, hoy) === "hoy")
    .sort((a, b) => (a.espera?.volver ?? "").localeCompare(b.espera?.volver ?? "") || a.titulo.localeCompare(b.titulo))
    .map((t) => filaTramite(t, personas, hoy));
}

/** Tono de la fila: rojo si la respuesta tocaba antes de hoy, aviso si toca hoy. */
export const tonoTramite = (t: Pick<Tramite, "espera">, hoy: string): "error" | "aviso" => (t.espera && t.espera.volver < hoy ? "error" : "aviso");

export type ResumenTeDeben = { total: number; asuntos: number };

export function teDeben(expedientes: readonly Expediente[], asuntos: readonly FilaAsunto[], cobros: readonly Cobro[]): ResumenTeDeben | null {
  const pendientes = pendientesDeCobro(porCobrar(expedientes, asuntos, cobros));
  const total = sumaFalta(pendientes);
  return total > 0 ? { total, asuntos: pendientes.length } : null;
}
