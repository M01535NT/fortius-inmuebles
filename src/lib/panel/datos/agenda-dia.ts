import type { Evento } from "@/lib/domain/records";
import { HORA_MAXIMA, HORA_MINIMA, aTexto, deTexto, horaTexto } from "@/lib/panel/calendario";
import { DURACION_MIN } from "@/lib/panel/datos/agenda";
import { aHoraGuardada, deHoraGuardada } from "@/lib/panel/datos/agenda-acciones";

/**
 * Vista de Día de la Agenda (PN-04, DECISIONES.md «Agenda»): línea de tiempo con las citas por hora,
 * que arranca una hora antes de la primera cita. Mover una cita cambia su hora de 30 en 30 minutos
 * (arrastrando, con Alt + ↑/↓ o con «Mover a…»). Funciones puras.
 */

export const PASO = 30;
/** Píxeles por minuto de la línea de tiempo. 30 min = 48 px. */
export const PX_MIN = 1.6;

export type Bloque = { id: string; ini: number; fin: number; carril: number; carriles: number };

const duracion = (e: Pick<Evento, "tipo">) => DURACION_MIN[e.tipo] ?? 30;
const abajo = (m: number) => Math.floor(m / PASO) * PASO;
const arriba = (m: number) => Math.ceil(m / PASO) * PASO;

/** Desde una hora antes de la primera cita (sin pasar de medianoche) hasta las 20:00 o el fin de la última. */
export function rangoDelDia(citas: readonly Pick<Evento, "hora" | "tipo">[]): { inicio: number; fin: number } {
  const con = citas.map((e) => ({ ini: deHoraGuardada(e.hora), dur: duracion(e) })).filter((x): x is { ini: number; dur: number } => x.ini !== null);
  if (!con.length) return { inicio: HORA_MINIMA, fin: HORA_MAXIMA };
  const primera = Math.min(...con.map((x) => x.ini));
  const ultima = Math.max(...con.map((x) => x.ini + x.dur));
  return { inicio: Math.max(0, abajo(primera - 60)), fin: Math.min(24 * 60, Math.max(HORA_MAXIMA, arriba(ultima))) };
}

/** Las horas en punto que se rotulan en la línea de tiempo. */
export function marcasDeHora(inicio: number, fin: number): number[] {
  const marcas: number[] = [];
  for (let m = Math.ceil(inicio / 60) * 60; m <= fin; m += 60) marcas.push(m);
  return marcas;
}

/**
 * Bloques de las citas con hora. Las que se cruzan van lado a lado en carriles (nada frena: se ven las dos).
 * Un grupo es un tramo continuo de citas que se cruzan; todas las del grupo comparten el número de carriles.
 */
export function bloquesDelDia(citas: readonly Pick<Evento, "id" | "hora" | "tipo">[]): Bloque[] {
  const base = citas
    .map((e) => { const ini = deHoraGuardada(e.hora); return ini === null ? null : { id: e.id, ini, fin: ini + duracion(e) }; })
    .filter((x): x is { id: string; ini: number; fin: number } => x !== null)
    .sort((a, b) => a.ini - b.ini || a.fin - b.fin || a.id.localeCompare(b.id));
  const salida: Bloque[] = [];
  let grupo: Bloque[] = [];
  let finGrupo = -1;
  const cerrar = () => { const n = Math.max(1, ...grupo.map((b) => b.carril + 1)); for (const b of grupo) salida.push({ ...b, carriles: n }); grupo = []; };
  for (const c of base) {
    if (grupo.length && c.ini >= finGrupo) cerrar();
    const ocupados = new Set(grupo.filter((b) => b.fin > c.ini).map((b) => b.carril));
    let carril = 0;
    while (ocupados.has(carril)) carril++;
    grupo.push({ ...c, carril, carriles: 1 });
    finGrupo = grupo.length === 1 ? c.fin : Math.max(finGrupo, c.fin);
  }
  if (grupo.length) cerrar();
  return salida;
}

/** Mueve `pasos` de 30 min sin salirse de 7:00 a 20:00 (el mismo horario que el selector de hora). */
export function moverPasos(minutos: number, pasos: number): number {
  return Math.min(HORA_MAXIMA, Math.max(HORA_MINIMA, abajo(minutos) + pasos * PASO));
}

/** Cuántos pasos de 30 min representa un desplazamiento vertical en píxeles. */
export const pasosDesdePixeles = (dy: number, pxMin = PX_MIN) => Math.round(dy / (pxMin * PASO)) || 0;

/** La cita con su hora nueva («HH:mm», como la guarda la base). Lo demás no cambia. */
export function conHora<E extends Evento>(e: E, minutos: number): E {
  return { ...e, hora: aHoraGuardada(minutos) };
}

/** Las horas a las que se puede mover (para «Mover a…»), de 7:00 a 20:00 de 30 en 30. */
export function horasParaMover(): { valor: string; etiqueta: string }[] {
  const lista: { valor: string; etiqueta: string }[] = [];
  for (let m = HORA_MINIMA; m <= HORA_MAXIMA; m += PASO) lista.push({ valor: aHoraGuardada(m), etiqueta: horaTexto(m) });
  return lista;
}

/** Posición vertical en píxeles de un minuto del día dentro de la línea de tiempo. */
export const yDe = (minutos: number, inicio: number, pxMin = PX_MIN) => (minutos - inicio) * pxMin;

/** La fecha «AAAA-MM-DD» corrida `dias` días (Alt + ←/→ mueve la cita de un día al otro). */
export function correrFecha(fecha: string, dias: number): string | null {
  const d = deTexto(fecha);
  return d ? aTexto(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias)) : null;
}

/** La cita en otro día, con la misma hora. No se mueve a un día que ya pasó. */
export function conFecha<E extends Evento>(e: E, fecha: string, hoy: string): E | null {
  if (!deTexto(fecha) || fecha < hoy || fecha === e.fecha) return null;
  return { ...e, fecha };
}
