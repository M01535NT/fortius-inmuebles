import { EVENTO_TIPOS, type Evento, type EventoTipo } from "@/lib/domain/records";
import { citasDelDia } from "@/lib/panel/datos/agenda";

/**
 * Escribir en la Agenda (PN-04) con la colección `eventos` que ya existe. «Nada frena, solo avisa»: el empalme se dice, no se impide.
 * Funciones puras.
 */

export type DatosCita = {
  tipo: EventoTipo; titulo: string; fecha: string; hora: number | null;
  /** El cliente del panel provisional: las citas de antes lo conservan tal cual; el panel nuevo elige `personaId`. */
  clienteId: string; propiedadSlug: string; notas: string; asesorId?: string | null;
  /** Expediente del panel provisional al que va ligada la cita. */
  expedienteId?: string;
  /** La persona del Directorio con quien es la cita (uuid de su ficha). */
  personaId?: string;
  /** El asunto del panel al que va ligada la cita (cuando se agenda desde un asunto). */
  asuntoId?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** ¿Es el id de una ficha del Directorio o de un asunto del panel? Los del panel provisional no son uuid. */
export const esDelPanel = (id: string) => UUID.test(id);

/**
 * «Visita» o «Agendar» desde un inmueble, una persona o un asunto: abre la Agenda con la cita nueva y lo de ahí ya elegido.
 * La Agenda lee `?nueva=1&tipo=…&inmueble=<slug>&persona=<id>&asunto=<id>` y limpia la dirección.
 */
export function rutaNuevaCita(d: { tipo?: EventoTipo; inmueble?: string; persona?: string; asunto?: string } = {}): string {
  const q = new URLSearchParams({ nueva: "1" });
  if (d.tipo) q.set("tipo", d.tipo);
  if (d.inmueble) q.set("inmueble", d.inmueble);
  if (d.persona) q.set("persona", d.persona);
  if (d.asunto) q.set("asunto", d.asunto);
  return `/panel/agenda?${q.toString()}`;
}

/**
 * Lo que trae la dirección para la cita nueva; null si no trae nada que elegir (se abre la línea vacía). Una persona o un
 * asunto del panel (uuid) van a `personaId` y `asuntoId`; un id del panel provisional, a `clienteId` y `expedienteId`.
 */
export function nuevaDesdeDireccion(q: { get: (k: string) => string | null }): {
  tipo?: EventoTipo; propiedadSlug: string; clienteId: string; expedienteId: string; personaId: string; asuntoId: string;
} | null {
  const limpio = (k: string) => { const v = q.get(k)?.trim() ?? ""; return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(v) ? v : ""; };
  const tipo = q.get("tipo");
  const persona = limpio("persona"), asunto = limpio("asunto");
  const r = {
    tipo: (EVENTO_TIPOS as readonly string[]).includes(tipo ?? "") ? (tipo as EventoTipo) : undefined, propiedadSlug: limpio("inmueble"),
    clienteId: esDelPanel(persona) ? "" : persona, personaId: esDelPanel(persona) ? persona.toLowerCase() : "",
    expedienteId: esDelPanel(asunto) ? "" : asunto, asuntoId: esDelPanel(asunto) ? asunto.toLowerCase() : "",
  };
  return r.propiedadSlug || persona || asunto ? r : null;
}

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
  if (d.personaId) e.personaId = d.personaId; else delete e.personaId;
  if (d.asuntoId) e.asuntoId = d.asuntoId; else delete e.asuntoId;
  if (d.propiedadSlug) e.propiedadSlug = d.propiedadSlug; else delete e.propiedadSlug;
  const n = d.notas.trim();
  if (n) e.notas = n.slice(0, 2000); else delete e.notas;
  if (d.asesorId) e.asesorId = d.asesorId;
  if (d.expedienteId) e.expedienteId = d.expedienteId;
  return e;
}

export function nuevaCita(d: DatosCita, persona?: string, id: string = crypto.randomUUID()): Evento {
  return aplicar({ id, titulo: "", fecha: d.fecha, tipo: d.tipo }, d, persona);
}
export function editarCita(previa: Evento, d: DatosCita, persona?: string): Evento {
  return aplicar(previa, d, persona);
}
export function datosDeCita(e: Evento): DatosCita {
  return {
    tipo: e.tipo, titulo: e.titulo, fecha: e.fecha, hora: deHoraGuardada(e.hora), clienteId: e.clienteId ?? "", propiedadSlug: e.propiedadSlug ?? "",
    notas: e.notas ?? "", asesorId: e.asesorId ?? null,
    ...(e.personaId ? { personaId: e.personaId } : {}), ...(e.asuntoId ? { asuntoId: e.asuntoId } : {}),
  };
}

/** ¿La cita se empalma con otra del mismo día? Se avisa antes de guardar. */
export function seEmpalma(cita: Evento, todas: readonly Evento[]): string | null {
  const otras = todas.filter((e) => e.id !== cita.id);
  const fila = citasDelDia([...otras, cita], cita.fecha).find((c) => c.id === cita.id);
  if (!fila?.empalme) return null;
  const choca = citasDelDia([...otras, cita], cita.fecha).find((c) => c.id !== cita.id && c.empalme);
  return choca ? `Se empalma con «${choca.titulo}»${choca.hora ? ` a las ${choca.hora}` : ""}.` : "Se empalma con otra cita.";
}
