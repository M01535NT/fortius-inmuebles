import { z } from "zod";

/*
  Seguimiento privado del inmueble (titular, 29/10/2026): llaves, preparación para
  promoverlo y avisos a compradores. Vive en el registro del inventario, pero nunca
  sale al sitio: la proyección pública es una lista cerrada de campos (SQL y
  `projectPublic`). Sin dependencias de React para que el servidor valide lo mismo.
*/

export const KEY_PLACES = { oficina: "En la oficina", propietario: "Las conserva el propietario", caseta: "En la caseta o administración", otro: "Otro lugar" } as const;
export const PREP_ITEMS = { fotos: "Sesión de fotos", video: "Video", recorrido360: "Recorrido 360", plano: "Plano o croquis", letrero: "Letrero o lona", anuncio: "Texto del anuncio" } as const;
export const PREP_STATES = { pendiente: "Pendiente", agendado: "Agendado", listo: "Listo", no_aplica: "No aplica" } as const;
export const NOTICE_CHANNELS = { whatsapp: "WhatsApp", correo: "Correo", llamada: "Llamada", otro: "Otro medio" } as const;

export type KeyPlace = keyof typeof KEY_PLACES;
export type PrepItem = keyof typeof PREP_ITEMS;
export type PrepState = keyof typeof PREP_STATES;
export type NoticeChannel = keyof typeof NOTICE_CHANNELS;

const keysOf = <T extends Record<string, string>>(options: T) => Object.keys(options) as [keyof T & string, ...(keyof T & string)[]];
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const instant = z.string().max(40).refine(value => !Number.isNaN(Date.parse(value)), "Fecha inválida");
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const person = z.string().trim().min(1).max(160);

export const keyLoanSchema = z.object({
  id, persona: person, motivo: z.string().max(500).optional(),
  salida: instant, regresoPrevisto: calendarDate.optional(), regreso: instant.optional(),
  registradoPor: z.string().max(160).optional(), recibidoPor: z.string().max(160).optional(),
}).passthrough().refine(loan => !loan.regreso || loan.regreso >= loan.salida, { message: "El regreso no puede ser anterior a la salida", path: ["regreso"] });
export const keysSchema = z.object({
  copias: z.number().int().min(0).max(50).optional(),
  lugar: z.enum(keysOf(KEY_PLACES)).optional(),
  detalle: z.string().max(500).optional(),
  prestamos: z.array(keyLoanSchema).max(500),
}).passthrough();

const prepEntry = z.object({ estado: z.enum(keysOf(PREP_STATES)), fecha: calendarDate.optional(), responsable: z.string().max(160).optional(), nota: z.string().max(500).optional() }).passthrough();
export const prepSchema = z.object({ fotos: prepEntry.optional(), video: prepEntry.optional(), recorrido360: prepEntry.optional(), plano: prepEntry.optional(), letrero: prepEntry.optional(), anuncio: prepEntry.optional() }).passthrough();

// «precio»: el precio publicado cuando se avisó; si después baja, la persona vuelve a quedar por avisar.
export const buyerNoticeSchema = z.object({ id, personaId: id, tipo: z.enum(["lead", "cliente"]), fecha: instant, medio: z.enum(keysOf(NOTICE_CHANNELS)), registradoPor: z.string().max(160).optional(), precio: z.object({ monto: z.number().finite().nonnegative().max(1e13), moneda: z.enum(["MXN", "USD"]) }).optional() }).passthrough();
export const buyerNoticesSchema = z.array(buyerNoticeSchema).max(1000);

export type KeyLoan = z.infer<typeof keyLoanSchema>;
export type PropertyKeys = z.infer<typeof keysSchema>;
export type PropertyPrep = z.infer<typeof prepSchema>;
export type BuyerNotice = z.infer<typeof buyerNoticeSchema>;
/** Campos privados del seguimiento; el sitio público nunca los recibe. */
export type PropertyFollowup = { llaves?: PropertyKeys; preparacion?: PropertyPrep; avisosCompradores?: BuyerNotice[] };
export const PRIVATE_PROPERTY_FIELDS = ["llaves", "preparacion", "avisosCompradores"] as const;

/** Préstamos de llaves que no han regresado, del más antiguo al más reciente. */
export function openKeyLoans(keys?: PropertyKeys) {
  return (keys?.prestamos ?? []).filter(loan => !loan.regreso).sort((a, b) => a.salida.localeCompare(b.salida));
}
/** Fecha en que las llaves debían regresar: la prevista o, si no se capturó, el mismo día de la salida. */
export function keyDueDate(loan: KeyLoan, toDay: (instant: string) => string) {
  return loan.regresoPrevisto ?? toDay(loan.salida);
}
export function keyLoanLate(loan: KeyLoan, today: string, toDay: (instant: string) => string) {
  return !loan.regreso && keyDueDate(loan, toDay) < today;
}

type MediaSource = { galeria?: unknown[]; videoUrl?: string; tour360Url?: string; preparacion?: PropertyPrep };
/**
  Estado de cada pieza de la preparación. Lo capturado manda; si no se capturó y el
  material ya está cargado en la ficha (fotos, video o 360), cuenta como listo.
*/
export function prepState(property: MediaSource, item: PrepItem): { estado: PrepState; derived: boolean } {
  const stored = property.preparacion?.[item]?.estado;
  if (stored) return { estado: stored, derived: false };
  const loaded = item === "fotos" ? !!property.galeria?.length : item === "video" ? !!property.videoUrl : item === "recorrido360" ? !!property.tour360Url : false;
  return { estado: loaded ? "listo" : "pendiente", derived: loaded };
}
/** Avance de la preparación: piezas listas de las que aplican. */
export function prepProgress(property: MediaSource) {
  const states = (Object.keys(PREP_ITEMS) as PrepItem[]).map(item => prepState(property, item).estado).filter(state => state !== "no_aplica");
  return { done: states.filter(state => state === "listo").length, total: states.length };
}
