import { EVENTO_TIPO_LABELS, type Evento } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";

/**
 * Agenda (PN-04, primer corte de solo lectura). Reglas de DECISIONES.md «Agenda»:
 * lo agendado de los próximos 7 días, una tira con punto en los días con citas y la lista por día.
 * «Nada frena, solo avisa»: si dos citas se empalman, se dice.
 */

export type DiaTira = { fecha: string; letra: string; numero: number; hoy: boolean; citas: number };
export type FilaCita = {
  id: string; fecha: string; hora?: string; titulo: string; tipo: string; notas?: string; empalme: boolean;
  /** Con quién, dónde y de quién es: se usan para enlazar la cita con su persona e inmueble (AUD-03, G2). */
  clienteId?: string; leadId?: string; propiedadSlug?: string; asesorId?: string;
};

/**
 * Duración supuesta mientras la cita no tenga fin (AUD-03, M5): visita, firma y reunión 60 min; llamada 15; otro 30.
 * Con el modelo base, `pendientes` llevará fin y esto se retira.
 */
export const DURACION_MIN: Record<Evento["tipo"], number> = { visita: 60, firma: 60, reunion: 60, llamada: 15, otro: 30 };

const minutos = (hora: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const LETRAS = ["D", "L", "M", "M", "J", "V", "S"] as const;

/** Siete días desde `desde`. `hoy` marca el día de hoy cuando la semana se mueve con las flechas. */
export function semanaDesde(desde: Date, eventos: readonly Pick<Evento, "fecha">[], hoy: Date = desde): DiaTira[] {
  const hoyTexto = aTexto(hoy);
  const cuenta = new Map<string, number>();
  for (const e of eventos) cuenta.set(e.fecha, (cuenta.get(e.fecha) ?? 0) + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    const fecha = aTexto(d);
    return { fecha, letra: LETRAS[d.getDay()], numero: d.getDate(), hoy: fecha === hoyTexto, citas: cuenta.get(fecha) ?? 0 };
  });
}

/**
 * Citas de un día, por hora (las de hora sin fijar al final). Se empalman dos citas del mismo responsable
 * cuyos horarios se cruzan, contando la duración supuesta; las de asesores distintos no (el director ve a todos).
 */
export function citasDelDia(eventos: readonly Evento[], fecha: string): FilaCita[] {
  const del = eventos.filter((e) => e.fecha === fecha);
  const tramos = del.map((e) => {
    const ini = e.hora ? minutos(e.hora) : null;
    return { id: e.id, quien: e.asesorId ?? "", ini, fin: ini === null ? null : ini + (DURACION_MIN[e.tipo] ?? 30) };
  });
  const empalmadas = new Set<string>();
  for (let i = 0; i < tramos.length; i++) {
    for (let j = i + 1; j < tramos.length; j++) {
      const a = tramos[i], b = tramos[j];
      if (a.ini === null || b.ini === null || a.fin === null || b.fin === null || a.quien !== b.quien) continue;
      if (a.ini < b.fin && b.ini < a.fin) { empalmadas.add(a.id); empalmadas.add(b.id); }
    }
  }
  return del
    .map((e) => ({
      id: e.id, fecha: e.fecha, hora: e.hora, titulo: e.titulo?.trim() || EVENTO_TIPO_LABELS[e.tipo] || "Cita",
      tipo: EVENTO_TIPO_LABELS[e.tipo] ?? "Otro", notas: e.notas?.trim() || undefined, empalme: empalmadas.has(e.id),
      clienteId: e.clienteId, leadId: e.leadId, propiedadSlug: e.propiedadSlug, asesorId: e.asesorId,
    }))
    .sort((a, b) => (a.hora ?? "99:99").localeCompare(b.hora ?? "99:99"));
}

/** Siete días desde `desde` agrupados, solo los días con citas. */
export function semanaEnLista(eventos: readonly Evento[], desde: Date, hoy: Date = desde): { fecha: string; titulo: string; citas: FilaCita[] }[] {
  const manana = aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
  return semanaDesde(desde, eventos, hoy)
    .filter((d) => d.citas > 0)
    .map((d) => ({ fecha: d.fecha, titulo: d.hoy ? "Hoy" : d.fecha === manana ? "Mañana" : diaLargo(d.fecha), citas: citasDelDia(eventos, d.fecha) }));
}

/** La primera fecha con citas a partir de `desde` (incluido), para «Próxima cita» cuando la semana está libre (AUD-03, A2). */
export function proximaFecha(eventos: readonly Pick<Evento, "fecha">[], desde: string): string | null {
  let mejor: string | null = null;
  for (const e of eventos) if (e.fecha >= desde && (mejor === null || e.fecha < mejor)) mejor = e.fecha;
  return mejor;
}

/** Mueve una fecha `dias` días (negativo hacia atrás). */
export const sumarDias = (d: Date, dias: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);

/**
 * La cita que sigue hoy (sugerencia 14): la primera con hora que todavía no termina, contando su duración supuesta.
 * `minutosAhora` son los minutos desde medianoche. Las citas sin hora no cuentan como «siguiente».
 */
export function siguienteCita(citas: readonly FilaCita[], tipos: Record<string, Evento["tipo"]>, minutosAhora: number): FilaCita | null {
  for (const c of citas) {
    if (!c.hora) continue;
    const ini = minutos(c.hora);
    if (ini === null) continue;
    const fin = ini + (DURACION_MIN[tipos[c.id] ?? "otro"] ?? 30);
    if (fin > minutosAhora) return c;
  }
  return null;
}

/** «en 25 min», «en 2 h», «ahora». */
export function faltaPara(hora: string, minutosAhora: number): string {
  const ini = minutos(hora);
  if (ini === null) return "";
  const d = ini - minutosAhora;
  if (d <= 0) return "ahora";
  if (d < 60) return `en ${d} min`;
  const h = Math.floor(d / 60), m = d % 60;
  return m ? `en ${h} h ${m} min` : `en ${h} h`;
}
