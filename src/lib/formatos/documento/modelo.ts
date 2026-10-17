/*
  Documento con el diseño de las plantillas de Fortius (Metodología, decisión del titular,
  16/10/2026): carta, logotipo arriba, título azul marino, banda de datos, secciones
  numeradas, subtítulos verdes, tablas con encabezado azul y pie con la franja de marca.
  Cada formato arma sus bloques con el mismo texto de su plantilla; los renderizadores
  de PDF y de Word dibujan el mismo modelo.
*/

export type Block =
  | { kind: "title"; text: string; bold?: boolean }
  /** Formulario de preguntas (02, 12, 13…): sección «01 / …» y renglones de celdas con la pregunta arriba y la respuesta debajo; w = ancho relativo. */
  | { kind: "form"; label?: string; rows: Array<Array<{ q: string; a: string; w: number }>> }
  | { kind: "subtitle"; text: string }
  | { kind: "note"; text: string }
  | { kind: "p"; text: string }
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  /** Banda de datos: celdas con etiqueta en mayúsculas y su valor debajo. */
  | { kind: "band"; widths: number[]; rows: Array<Array<{ label: string; value: string }>> }
  /** Tabla con encabezado azul (opcional) y filas alternadas. Cada celda puede tener varias líneas. */
  | { kind: "table"; widths: number[]; header?: string[]; rows: string[][] }
  /** Estilo contrato: título centrado en negritas, cláusula con encabezado en negritas, tabla etiqueta/valor y firmas. */
  | { kind: "center"; text: string }
  | { kind: "clause"; lead: string; text: string }
  | { kind: "fields"; widths: [number, number]; rows: Array<[string, string]> }
  | { kind: "signatures"; parties: Array<{ role: string; name: string }> };

/** «marca»: Archivo azul marino (planes, reportes, levantamientos). «contrato»: Times negro, como el 09 y la promesa. */
export type Documento = { title: string; subject?: string; estilo?: "marca" | "contrato"; blocks: Block[] };

export const COLORS = { navy: "061F3F", green: "0F6B4E", wine: "8A1634", band1: "F6F8F6", band2: "F0F3F7", band3: "F7F9F7", white: "FFFFFF", black: "000000", rule: "B4C7BB" } as const;
/** Espacio para completar a mano, como en la plantilla. */
export const BLANK = "____________________";

/** Valor capturado o el espacio en blanco de la plantilla. */
export function v(value: unknown): string {
  if (value === undefined || value === null) return BLANK;
  const text = String(value).trim();
  return text ? text : BLANK;
}
/** Dato descriptivo a mitad de frase: inicia en minúscula («para alcanzar vender…»), salvo siglas o nombres en mayúsculas. */
export function m(value: unknown): string {
  const text = v(value);
  return /^\p{Lu}\p{Ll}/u.test(text) ? text[0].toLocaleLowerCase("es-MX") + text.slice(1) : text;
}
export function fecha(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return v(value);
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}
export function dinero(value: unknown, moneda?: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return v(value);
  const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `$${amount}${moneda ? ` ${String(moneda)}` : ""}`;
}
/** Respuesta de formulario: el dato o la celda vacía para escribir a mano. */
export function a(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}
/** Une las partes que tienen dato con « · ». */
export function junta(...parts: unknown[]): string {
  const seen = new Set<string>();
  return parts.map(part => a(part)).filter(text => text && !seen.has(text.toLowerCase()) && seen.add(text.toLowerCase())).join(" · ");
}
/** Filas de una tabla capturada (arreglo de objetos), sin romper si viene vacía o mal formada. */
export function filas(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row)) : [];
}
