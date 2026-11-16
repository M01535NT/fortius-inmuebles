import type { Evento, EventoTipo } from "@/lib/domain/records";
import { citasDelDia } from "@/lib/panel/datos/agenda";

/**
 * Escribir en la Agenda (PN-04) con la colección `eventos` que ya existe. «Nada frena, solo avisa»: el empalme se dice, no se impide.
 * Funciones puras.
 */

export type DatosCita = {
  tipo: EventoTipo; titulo: string; fecha: string; hora: number | null;
  clienteId: string; propiedadSlug: string; notas: string; asesorId?: string | null;
};

const dos = (n: number) => String(n).padStart(2, "0");
/** Minutos desde medianoche a «HH:mm», como lo guarda la base. */
export const aHoraGuardada = (m: number) => `${dos(Math.floor(m / 60))}:${dos(m % 60)}`;
export function deHoraGuardada(h: string | undefined): number | null {
  const m = h ? /^(\d{1,2}):(\d{2})$/.exec(h) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const TITULO_POR_TIPO: Record<EventoTipo, string> = { visita: "Visita", llamada: "Llamada", firma: "Firma", reunion: "Reunión", otro: "Cita" };

/** Si no se escribe título, se arma con el tipo y la persona: «Visita con Ana». */
export function tituloCita(d: Pick<DatosCita, "tipo" | "titulo">, persona?: string): string {
  const t = d.titulo.trim();
  if (t) return t.slice(0, 160);
  return persona ? `${TITULO_POR_TIPO[d.tipo]} con ${persona}` : TITULO_POR_TIPO[d.tipo];
}

function aplicar(base: Evento, d: DatosCita, persona?: string): Evento {
  const e: Evento = { ...base, tipo: d.tipo, titulo: tituloCita(d, persona), fecha: d.fecha };
  if (d.hora !== null) e.hora = aHoraGuardada(d.hora); else delete e.hora;
  if (d.clienteId) e.clienteId = d.clienteId; else delete e.clienteId;
  if (d.propiedadSlug) e.propiedadSlug = d.propiedadSlug; else delete e.propiedadSlug;
  const n = d.notas.trim();
  if (n) e.notas = n.slice(0, 2000); else delete e.notas;
  if (d.asesorId) e.asesorId = d.asesorId;
  return e;
}

export function nuevaCita(d: DatosCita, persona?: string, id: string = crypto.randomUUID()): Evento {
  return aplicar({ id, titulo: "", fecha: d.fecha, tipo: d.tipo }, d, persona);
}
export function editarCita(previa: Evento, d: DatosCita, persona?: string): Evento {
  return aplicar(previa, d, persona);
}
export function datosDeCita(e: Evento): DatosCita {
  return { tipo: e.tipo, titulo: e.titulo, fecha: e.fecha, hora: deHoraGuardada(e.hora), clienteId: e.clienteId ?? "", propiedadSlug: e.propiedadSlug ?? "", notas: e.notas ?? "", asesorId: e.asesorId ?? null };
}

/** ¿La cita se empalma con otra del mismo día? Se avisa antes de guardar. */
export function seEmpalma(cita: Evento, todas: readonly Evento[]): string | null {
  const otras = todas.filter((e) => e.id !== cita.id);
  const fila = citasDelDia([...otras, cita], cita.fecha).find((c) => c.id === cita.id);
  if (!fila?.empalme) return null;
  const choca = citasDelDia([...otras, cita], cita.fecha).find((c) => c.id !== cita.id && c.empalme);
  return choca ? `Se empalma con «${choca.titulo}»${choca.hora ? ` a las ${choca.hora}` : ""}.` : "Se empalma con otra cita.";
}
