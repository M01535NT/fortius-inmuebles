import type { ImagenDocumento } from "./imagen";

/*
  Documento con el diseño de las plantillas de Fortius (Metodología, decisión del titular,
  16/10/2026): carta, logotipo arriba, título azul marino, banda de datos, secciones
  numeradas, subtítulos verdes, tablas con encabezado azul y pie con la franja de marca.
  Cada formato arma sus bloques con el mismo texto de su plantilla; los renderizadores
  de PDF y de Word dibujan el mismo modelo.
*/

/** Bloque completo pulsable en la vista en vivo (una tabla con filas, una cláusula): abre esos campos. */
export type ZonaBloque = { keys: string[]; label: string };
export type Block = ({ zona?: ZonaBloque }) & (
  | { kind: "title"; text: string; bold?: boolean; size?: number }
  /** force: también en Word; hoja: en PDF abre hoja nueva aunque quede espacio (una hoja para firmar). */
  | { kind: "pagebreak"; force?: boolean; hoja?: boolean }
  /** Barra azul de hoja de cálculo («01 / PRECIO Y DIFERENCIA»), con un dato opcional a la derecha. */
  | { kind: "bar"; text: string; right?: string; big?: boolean; raw?: boolean; center?: boolean }
  /** Texto alineado a la derecha (lugar y fecha de una carta). */
  | { kind: "right"; text: string }
  /** Encabezado corto en negritas (destinatario, «Precio propuesto»). */
  | { kind: "label"; text: string; size?: number }
  /** Encabezado de cláusula «01   Objeto». */
  | { kind: "h3"; text: string }
  /** Renglones de hoja: etiqueta sin fondo y valor sobre gris claro; w = ancho relativo (12 por renglón). */
  | { kind: "sheet"; rows: Array<Array<{ label?: string; value?: string; w: number; strong?: boolean; big?: boolean; keys?: string[] }>> }
  /** Formulario de preguntas (02, 12, 13…): sección «01 / …» y renglones de celdas con la pregunta arriba y la respuesta debajo; w = ancho relativo. */
  | { kind: "form"; label?: string; rows: Array<Array<FormCell>>; filled?: boolean }
  /** Pregunta con opciones en casillas; la elegida va marcada (☒). */
  | { kind: "checks"; q: string; options: Array<{ value: string; label: string }>; selected?: unknown }
  | { kind: "subtitle"; text: string }
  /** Recuadro de imagen con su barra de título (foto principal, croquis); vacío si no hay imagen. */
  | { kind: "image"; label: string; image?: ImagenDocumento; height: number; keys?: string[] }
  /** Tabla con encabezado claro (F3F7F4) y bordes finos, como las de los levantamientos. */
  /** labels: primera columna en negritas, como «Terreno» o «Muros»; minRow: alto mínimo de renglón en puntos. */
  | { kind: "grid"; widths: number[]; header: string[]; rows: string[][]; labels?: boolean; minRow?: number; keys?: Array<Array<string[] | undefined>> }
  | { kind: "note"; text: string }
  | { kind: "p"; text: string; indent?: boolean; strong?: boolean }
  /** Encabezado de sección con número en vino y título en mayúsculas (opinión jurídica). */
  | { kind: "numbered"; num: string; text: string }
  | { kind: "caption"; text: string }
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  /** Banda de datos: celdas con etiqueta en mayúsculas y su valor debajo. */
  | { kind: "band"; widths: number[]; rows: Array<Array<{ label: string; value: string }>> }
  /** Tabla con encabezado azul (opcional) y filas alternadas. Cada celda puede tener varias líneas. */
  | { kind: "table"; widths: number[]; header?: string[]; rows: string[][]; small?: boolean }
  /** Estilo contrato: título centrado en negritas, cláusula con encabezado en negritas, tabla etiqueta/valor y firmas. */
  | { kind: "center"; text: string }
  | { kind: "clause"; lead: string; text: string }
  | { kind: "fields"; widths: [number, number]; rows: Array<[string, string]>; dark?: boolean }
  | { kind: "signatures"; parties: Array<{ role: string; name: string }>; line?: boolean });

/** Parte de un renglón con casillas: con «check» es una casilla dibujada (marcada si es true); sin él, texto. */
export type Marca = { text: string; check?: boolean };
/**
  Celda de formulario. «marks» sustituye a la respuesta cuando la plantilla imprime casillas
  («☐ Sí ☐ Pendiente  Rol: …»), un renglón por arreglo. «keys» son los campos que llenan la celda:
  la vista en vivo la vuelve pulsable; el PDF y el Word las ignoran.
*/
export type FormCell = { q: string; a: string; w: number; marks?: Marca[][]; keys?: string[] };

/** «marca»: Archivo azul marino (planes, reportes, levantamientos). «contrato»: Times negro, como el 09 y la promesa. */
/** «aviso»: leyenda al pie de cada hoja, como «Documento incompleto: faltan 3 datos». */
export type Documento = { title: string; subject?: string; estilo?: "marca" | "contrato" | "opinion" | "aviso"; blocks: Block[]; aviso?: string };

export const COLORS = { navy: "061F3F", green: "0F6B4E", wine: "8A1634", band1: "F6F8F6", band2: "F0F3F7", band3: "F7F9F7", head: "F3F7F4", cell: "F2F6F3", ink2: "08284C", value2: "F6F8FA", gray: "6B7280", white: "FFFFFF", black: "000000", rule: "B4C7BB" } as const;
/** Datos extra que algunos formatos necesitan para dibujarse: imágenes adjuntas por ID. */
export type DocumentoContexto = { imagenes?: Record<string, ImagenDocumento> };
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
/** Casillas como texto (Word): ☒ la marcada, ☐ las demás. */
export function marcasTexto(marks: Marca[][]): string {
  return marks.map(line => line.map(part => part.check === undefined ? part.text : `${part.check ? "☒" : "☐"} ${part.text}`).join("  ")).join("\n");
}
