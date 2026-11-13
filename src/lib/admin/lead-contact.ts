import type { Lead } from "@/lib/domain/records";

/*
  Registro de contacto con el interesado en dos toques (COR-18, RP-21): qué pasó (Llamé · No
  contestó · Mandé WhatsApp · Visitó) y el siguiente paso con fecha. Se guarda como una nota marcada
  con `contacto`, sin cambiar la base; la primera vez cuenta como primera atención (RP-23, COR-21).
  Tras tres «No contestó» seguidos se propone reintentar en 30 días (RP-97).
*/

export const CONTACT_KINDS = { llamada: "Llamé", no_contesto: "No contestó", whatsapp: "Mandé WhatsApp", visito: "Visitó" } as const;
export type ContactKind = keyof typeof CONTACT_KINDS;
export type ContactNote = Lead["notas"][number] & { contacto?: ContactKind };

const NEXT: Record<ContactKind, { accion: string; dias: number }> = {
  llamada: { accion: "Enviarle opciones", dias: 2 },
  no_contesto: { accion: "Volver a llamar", dias: 2 },
  whatsapp: { accion: "Confirmar que vio las opciones", dias: 2 },
  visito: { accion: "Preguntar qué le pareció", dias: 1 },
};
export const RETRY_DAYS = 30;
export const RETRY_ACTION = "Reintentar: no contesta";

export function addDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Siguiente paso que se propone después de un contacto; el asesor lo puede cambiar. */
export function suggestedNext(kind: ContactKind, today: string) {
  return { accion: NEXT[kind].accion, fecha: addDays(today, NEXT[kind].dias) };
}

/** Intentos de contacto registrados, del más reciente al más antiguo. */
export function contactAttempts(lead: Pick<Lead, "notas">) {
  return (lead.notas as ContactNote[]).filter(note => !!note.contacto && note.contacto in CONTACT_KINDS).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** «No contestó» seguidos desde el último contacto logrado. */
export function missedInARow(lead: Pick<Lead, "notas">) {
  let count = 0;
  for (const note of contactAttempts(lead)) { if (note.contacto !== "no_contesto") break; count += 1; }
  return count;
}

/** Texto del registro en la línea de tiempo: «No contestó · Le dejé mensaje». */
export function contactText(note: ContactNote) {
  const label = note.contacto ? CONTACT_KINDS[note.contacto] : "";
  return [label, note.texto.trim()].filter(Boolean).join(" · ");
}

/** El prospecto con el contacto registrado, su siguiente paso y la primera atención. */
export function withContact(lead: Lead, input: { kind: ContactKind; nota?: string; accion: string; fecha: string; id: string; at: string }): Lead {
  const note: ContactNote = { id: input.id, texto: input.nota?.trim() ?? "", fecha: input.at, contacto: input.kind };
  return {
    ...lead,
    notas: [note, ...lead.notas],
    estado: lead.estado === "nuevo" ? "contactado" : lead.estado,
    firstContactedAt: lead.firstContactedAt ?? input.at,
    perfil: { ...lead.perfil, proximoContacto: input.fecha, proximaAccion: input.accion.trim().slice(0, 160) },
  };
}
