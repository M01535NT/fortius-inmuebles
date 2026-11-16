import type { Lead } from "@/lib/domain/records";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { diaLargo, diasDesde } from "@/lib/panel/calendario";
import { esperaDesde, pestanaDe, tiempo, urgencia, type Urgencia } from "@/lib/panel/datos/consultas";

/**
 * Hoy (PN-04, primer corte de solo lectura). Junta lo que ya existe en el servidor:
 * lo vencido arriba, después las consultas sin responder (línea ámbar), las citas de hoy y lo que vence pronto.
 * Las tareas y los vencimientos de los asuntos llegan con el modelo base (PN-02).
 */

export type ContratoServidor = {
  expedienteId: string; folio: string; emitido: boolean; inicio?: string; fin?: string; exclusiva: boolean;
  licencia?: { numero?: string; vigencia?: string };
};

export type Vence = { id: string; titulo: string; detalle: string; dias: number; tono: "error" | "aviso" | "normal" };

/** Cuántos días antes empieza a avisar. */
export const AVISO_DIAS = 30;

const cuando = (dias: number, fecha: string) =>
  dias < 0 ? `Venció hace ${-dias} ${dias === -1 ? "día" : "días"}` : dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence el ${diaLargo(fecha)} (en ${dias} días)`;

const tono = (dias: number): Vence["tono"] => (dias < 0 ? "error" : dias <= 7 ? "aviso" : "normal");

/**
 * Fin del encargo de cada contrato y vigencia de la licencia estatal, de lo vencido a lo más lejano, solo dentro del aviso.
 * La licencia es de la inmobiliaria, no del contrato: se avisa una sola vez por número de licencia (AUD-03, H2).
 */
export function vencimientosDeContratos(contratos: readonly ContratoServidor[], hoy: Date): Vence[] {
  const lista: Vence[] = [];
  const licencias = new Map<string, { numero?: string; vigencia: string; contratos: number }>();
  for (const c of contratos) {
    if (c.fin) {
      const dias = diasDesde(hoy, c.fin);
      if (dias !== null && dias <= AVISO_DIAS) {
        lista.push({
          id: `${c.expedienteId}:fin`,
          titulo: `Fin del encargo · ${c.folio}`,
          detalle: cuando(dias, c.fin) + (c.emitido ? "" : " · contrato sin emitir"),
          dias,
          tono: tono(dias),
        });
      }
    }
    const vigencia = c.licencia?.vigencia;
    if (vigencia) {
      const clave = c.licencia?.numero?.trim() || `vigencia:${vigencia}`;
      const previa = licencias.get(clave);
      licencias.set(clave, { numero: c.licencia?.numero?.trim() || undefined, vigencia, contratos: (previa?.contratos ?? 0) + 1 });
    }
  }
  for (const [clave, l] of licencias) {
    const dias = diasDesde(hoy, l.vigencia);
    if (dias === null || dias > AVISO_DIAS) continue;
    lista.push({
      id: `licencia:${clave}`,
      titulo: l.numero ? `Licencia estatal ${l.numero}` : "Licencia estatal",
      detalle: `${cuando(dias, l.vigencia)} · ${l.contratos === 1 ? "la usa 1 contrato" : `la usan ${l.contratos} contratos`}`,
      dias,
      tono: tono(dias),
    });
  }
  return lista.sort((a, b) => a.dias - b.dias);
}

export type Espera = { cuantas: number; peor: string | null; urgencia: Urgencia };

/** Cuántas consultas esperan respuesta y cuánto lleva la que más espera (AUD-03, H3). */
export function resumenEspera(leads: readonly Lead[], ahora: number): Espera {
  let cuantas = 0;
  let mayor = -1;
  for (const l of leads) {
    if (pestanaDe(l) !== "por_atender") continue;
    cuantas += 1;
    const desde = Date.parse(esperaDesde(l));
    if (!Number.isNaN(desde)) mayor = Math.max(mayor, ahora - desde);
  }
  return { cuantas, peor: mayor >= 0 ? tiempo(Math.max(0, mayor)) : null, urgencia: mayor >= 0 ? urgencia(mayor) : "normal" };
}

export function saludo(hora: number): string {
  if (hora < 6) return "Buenas noches";
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Tareas para Hoy: las abiertas que vencen hoy o ya vencieron, de la más atrasada a la de hoy. */
export type TareaHoy = { id: string; titulo: string; detalle: string; tono: "error" | "normal"; tarea: Task };
export function tareasDeHoy(tareas: readonly Task[], hoy: string): TareaHoy[] {
  return tareas
    .filter((t) => isTaskOpen(t) && !!t.vence && t.vence <= hoy)
    .sort((a, b) => (a.vence ?? "").localeCompare(b.vence ?? "") || a.titulo.localeCompare(b.titulo, "es"))
    .map((t) => ({
      id: t.id, titulo: t.titulo, tarea: t,
      detalle: t.vence === hoy ? "Para hoy" : `Venció el ${diaLargo(t.vence ?? hoy)}`,
      tono: t.vence === hoy ? "normal" : "error",
    }));
}

/** Marcar hecha: queda completada con fecha; el servidor guarda quién lo hizo en su historial. */
export function completarTarea(t: Task, ahora = new Date()): Task {
  const fecha = ahora.toISOString();
  return { ...t, estado: "completada", completadoEl: fecha, actualizadoEl: fecha };
}
