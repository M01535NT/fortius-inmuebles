/** Calendario y hora para el selector de fecha y horario (DECISIONES.md, «Calendario y hora»). Sin dependencias de pantalla. */

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;
export const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

export type CeldaDia = {
  /** Fecha en formato AAAA-MM-DD, o null en los huecos al inicio del mes. */
  fecha: string | null;
  dia: number | null;
  hoy: boolean;
  /** Antes de hoy: no se puede elegir. */
  pasado: boolean;
};

const dos = (n: number) => String(n).padStart(2, "0");

/** AAAA-MM-DD en hora local (no UTC, para que «hoy» no salte de día de noche). */
export function aTexto(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function deTexto(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return aTexto(d) === texto ? d : null;
}

/** Mes de 6 filas o menos con semana que empieza en lunes. `mes` va de 0 a 11 y se admite pasarse de rango (el año se ajusta). */
export function diasDelMes(anio: number, mes: number, hoy: Date): CeldaDia[] {
  const primero = new Date(anio, mes, 1);
  const hueco = (primero.getDay() + 6) % 7;
  const total = new Date(anio, mes + 1, 0).getDate();
  const textoHoy = aTexto(hoy);
  const celdas: CeldaDia[] = [];
  for (let i = 0; i < hueco; i++) celdas.push({ fecha: null, dia: null, hoy: false, pasado: true });
  for (let d = 1; d <= total; d++) {
    const fecha = aTexto(new Date(anio, mes, d));
    celdas.push({ fecha, dia: d, hoy: fecha === textoHoy, pasado: fecha < textoHoy });
  }
  return celdas;
}

export function tituloMes(anio: number, mes: number): string {
  const d = new Date(anio, mes, 1);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** «viernes 20 nov» */
export function diaLargo(fecha: string): string {
  const d = deTexto(fecha);
  if (!d) return "";
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

/** Minutos desde medianoche a «H:MM» de 24 horas, con ceros solo en los minutos (7:00, 10:30). */
export function horaTexto(minutos: number): string {
  return `${Math.floor(minutos / 60)}:${dos(minutos % 60)}`;
}

export const HORA_MINIMA = 7 * 60;
export const HORA_MAXIMA = 20 * 60;

/** Mueve la hora en pasos de 30 minutos sin salirse de 7:00 a 20:00. */
export function moverHora(minutos: number, pasos: number): number {
  return Math.min(HORA_MAXIMA, Math.max(HORA_MINIMA, minutos + pasos * 30));
}

/** Cuántos días faltan desde hoy hasta la fecha (negativo si ya pasó). */
export function diasDesde(hoy: Date, fecha: string): number | null {
  const d = deTexto(fecha);
  if (!d) return null;
  const a = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  return Math.round((d.getTime() - a) / 86400000);
}
