import type { Evento } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { DURACION_MIN } from "@/lib/panel/datos/agenda";
import type { ContratoServidor } from "@/lib/panel/datos/hoy";

/**
 * «¿Cómo te fue?» y vencimientos en la Agenda (PN-04, DECISIONES.md «Agenda»). Funciones puras.
 * Funciona con lo que ya existe: la cita guarda su resultado en `eventos` (el esquema admite campos extra),
 * el asunto lo recibe como nota de su historial y lo que sigue es una tarea ligada al asunto.
 */

// ── ¿Cómo te fue? ──
export type ComoFue = "hecha" | "no_llego";
export const COMO_FUE: readonly { valor: ComoFue; etiqueta: string }[] = [
  { valor: "hecha", etiqueta: "Se hizo" },
  { valor: "no_llego", etiqueta: "No llegó" },
];
export type Resultado = { estado: ComoFue; nota: string; anotadoEl: string };
export type EventoConResultado = Evento & { resultado?: Resultado };

const MAX_NOTAS = 2000;
const MAX_ASUNTO = 1000;

const minutos = (hora: string | undefined) => {
  const m = hora ? /^(\d{1,2}):(\d{2})$/.exec(hora) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/**
 * ¿Ya pasó? Un día anterior a hoy, sí. Hoy, solo si tiene hora y ya terminó (con su duración supuesta);
 * una cita de hoy sin hora se pregunta a partir de mañana.
 */
export function yaPaso(e: Pick<Evento, "fecha" | "hora" | "tipo">, ahora: Date): boolean {
  const hoy = aTexto(ahora);
  if (e.fecha < hoy) return true;
  if (e.fecha > hoy) return false;
  const ini = minutos(e.hora);
  if (ini === null) return false;
  return ini + (DURACION_MIN[e.tipo] ?? 30) <= ahora.getHours() * 60 + ahora.getMinutes();
}

/** Sale «¿Cómo te fue?» si ya pasó y todavía no se anotó. */
export const pideComoFue = (e: EventoConResultado, ahora: Date) => !e.resultado && yaPaso(e, ahora);

const etiquetaComo = (estado: ComoFue) => (estado === "hecha" ? "Se hizo" : "No llegó");

/** La línea que queda en las notas de la cita: «Cómo fue (lunes 16 nov): No llegó. Reagendar». */
export function lineaResultado(estado: ComoFue, nota: string, ahora: Date): string {
  const n = nota.trim();
  return `Cómo fue (${diaLargo(aTexto(ahora))}): ${etiquetaComo(estado)}${n ? `. ${n}` : ""}`;
}

/** La cita con su resultado. Las notas que ya tenía se conservan y la línea nueva va al final. */
export function anotarResultado(e: EventoConResultado, estado: ComoFue, nota: string, ahora: Date): EventoConResultado {
  const linea = lineaResultado(estado, nota, ahora);
  const previas = e.notas?.trim();
  const notas = (previas ? `${previas}\n\n${linea}` : linea).slice(0, MAX_NOTAS);
  return { ...e, notas, resultado: { estado, nota: nota.trim().slice(0, MAX_NOTAS), anotadoEl: ahora.toISOString() } };
}

/** Lo que se escribe en el historial del asunto. */
export function notaParaAsunto(e: Pick<Evento, "titulo" | "fecha" | "hora">, estado: ComoFue, nota: string): string {
  const n = nota.trim();
  const cuando = `${diaLargo(e.fecha)}${e.hora ? `, ${e.hora}` : ""}`;
  return `Cita «${e.titulo}» (${cuando}): ${etiquetaComo(estado)}${n ? `. ${n}` : ""}`.slice(0, MAX_ASUNTO);
}

/** Si se deshace, el historial del asunto no se borra: se agrega que se corrigió. */
export const notaDeshecha = (e: Pick<Evento, "titulo" | "fecha">) => `Se quitó lo anotado de la cita «${e.titulo}» (${diaLargo(e.fecha)}).`.slice(0, MAX_ASUNTO);

/** Texto corto del resultado para la ficha. */
export const textoResultado = (r: Resultado) => `${etiquetaComo(r.estado)}${r.nota ? `. ${r.nota}` : ""}`;

// ── Vencimientos en su día ──
/** Un vencimiento en su día. `href` lleva a su pantalla (un trámite, Dinero); sin él, `expedienteId` abre el asunto. */
export type VenceDia = { id: string; fecha: string; titulo: string; detalle: string; expedienteId?: string; href?: string };

/**
 * Fin del encargo de cada contrato y vigencia de la licencia estatal, cada uno en su fecha (lo mismo que avisa Hoy,
 * sin límite de días: la Agenda muestra la semana que se mire). La licencia sale una vez por número.
 */
export function vencimientosEnDias(contratos: readonly ContratoServidor[]): VenceDia[] {
  const lista: VenceDia[] = [];
  const licencias = new Map<string, { numero?: string; vigencia: string; contratos: number }>();
  const esFecha = (f: string | undefined): f is string => Boolean(f && /^\d{4}-\d{2}-\d{2}$/.test(f));
  for (const c of contratos) {
    if (esFecha(c.fin)) {
      lista.push({ id: `${c.expedienteId}:fin`, fecha: c.fin, titulo: `Fin del encargo · ${c.folio}`, detalle: c.emitido ? "Contrato de intermediación" : "Contrato sin emitir", expedienteId: c.expedienteId });
    }
    const vigencia = c.licencia?.vigencia;
    if (esFecha(vigencia)) {
      const numero = c.licencia?.numero?.trim() || undefined;
      const clave = numero ?? `vigencia:${vigencia}`;
      licencias.set(clave, { numero, vigencia, contratos: (licencias.get(clave)?.contratos ?? 0) + 1 });
    }
  }
  for (const [clave, l] of licencias) {
    lista.push({
      id: `licencia:${clave}`, fecha: l.vigencia, titulo: l.numero ? `Licencia estatal ${l.numero}` : "Licencia estatal",
      detalle: l.contratos === 1 ? "La usa 1 contrato" : `La usan ${l.contratos} contratos`,
    });
  }
  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

/** Vencimientos agrupados por fecha. */
export function vencimientosPorFecha(lista: readonly VenceDia[]): Map<string, VenceDia[]> {
  const m = new Map<string, VenceDia[]>();
  for (const v of lista) m.set(v.fecha, [...(m.get(v.fecha) ?? []), v]);
  return m;
}
