import { MESES, aTexto, deTexto } from "@/lib/panel/calendario";
import { isTaskOpen, type Task } from "@/lib/tasks";

/**
 * Agenda (PN-04, revisión móvil del 16/11/2026): qué semana se ve y las tareas con fecha de esa semana.
 * Las tareas son de solo lectura aquí; se cumplen en Hoy o en su asunto. Funciones puras.
 */

/** «16 al 22 de noviembre»; «30 de noviembre al 6 de diciembre»; con el año si la semana cambia de año. */
export function textoSemana(desde: Date): string {
  const hasta = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 6);
  const d1 = desde.getDate(), d2 = hasta.getDate();
  const m1 = MESES[desde.getMonth()], m2 = MESES[hasta.getMonth()];
  if (desde.getFullYear() !== hasta.getFullYear()) return `${d1} de ${m1} de ${desde.getFullYear()} al ${d2} de ${m2} de ${hasta.getFullYear()}`;
  if (m1 === m2) return `${d1} al ${d2} de ${m2}`;
  return `${d1} de ${m1} al ${d2} de ${m2}`;
}

export type TareaDia = { id: string; fecha: string; titulo: string; vencida: boolean; expedienteId?: string };

/** Fecha «AAAA-MM-DD» de la tarea, aunque venga con hora. */
const fechaDe = (vence: string | undefined): string | null => {
  const f = vence?.slice(0, 10);
  return f && deTexto(f) ? f : null;
};

/** Tareas abiertas que vencen entre `desde` y `desde + 6` días; las de antes de hoy se marcan vencidas. */
export function tareasDeLaSemana(tareas: readonly Task[], desde: Date, hoy: Date): TareaDia[] {
  const ini = aTexto(desde);
  const fin = aTexto(new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 6));
  const hoyTexto = aTexto(hoy);
  const lista: TareaDia[] = [];
  for (const t of tareas) {
    if (!isTaskOpen(t)) continue;
    const fecha = fechaDe(t.vence);
    if (!fecha || fecha < ini || fecha > fin) continue;
    lista.push({ id: t.id, fecha, titulo: t.titulo?.trim() || "Tarea", vencida: fecha < hoyTexto, ...(t.expedienteId ? { expedienteId: t.expedienteId } : {}) });
  }
  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

export function tareasPorFecha(lista: readonly TareaDia[]): Map<string, TareaDia[]> {
  const m = new Map<string, TareaDia[]>();
  for (const t of lista) m.set(t.fecha, [...(m.get(t.fecha) ?? []), t]);
  return m;
}
