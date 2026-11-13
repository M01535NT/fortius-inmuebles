import type { FormatoField } from "@/lib/formatos/catalog";
import type { Zona } from "@/lib/formatos/documento/pdf";

/*
  Captura por lista (DEC-44, 12/11/2026): en el celular, la entrevista (02) y el levantamiento
  (04A a 04G) se pueden llenar una pregunta por pantalla. Cada pregunta es una celda del
  documento, en el orden en que aparece, y lo capturado se guarda en la misma celda: la hoja
  sigue siendo la del PDF.
*/
export const CAPTURA_POR_LISTA = new Set(["02", "04A", "04B", "04C", "04D", "04E", "04F", "04G"]);

export const NO_SABE = "No sabe";
/** Opciones que ya significan «no se sabe» en la plantilla. */
const OPCIONES_NO_SABE = ["no_sabe", "no_verificado", "por_aclarar", "por_definir"];
/** Datos que llena el panel o la oficina: «No sabe» no tiene sentido ahí. */
const SIN_NO_SABE = new Set(["folio", "asesor", "idInmueble", "elaboro", "reviso", "versionAnterior"]);

const vacio = (value: unknown) => value === undefined || value === null || (Array.isArray(value) ? value.length === 0 : String(value).trim() === "");

/**
  Valor de «No sabe» para un campo: la opción de la plantilla que lo dice, el texto «No sabe» en
  preguntas abiertas, o nada donde hace falta una cifra, una fecha o una elección real.
*/
export function noSabeValor(field: FormatoField): string | null {
  if (SIN_NO_SABE.has(field.key)) return null;
  if (field.type === "choice") return field.options?.find(option => OPCIONES_NO_SABE.includes(option.value))?.value ?? null;
  if (field.type === "text" || field.type === "long") return NO_SABE;
  return null;
}

/** Lo que escribe «No sabe» en una pregunta: solo en sus campos vacíos que lo admiten. */
export function parcheNoSabe(fields: readonly FormatoField[], values: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of fields) {
    const value = noSabeValor(field);
    if (value !== null && vacio(values[field.key])) patch[field.key] = value;
  }
  return patch;
}

/**
  Las preguntas de la lista: una por celda, en el orden del documento, sin repetir la misma celda
  (la foto y su identificador abren los mismos campos). Con «solo lo pendiente», quedan las
  celdas con algo vacío o marcado como faltante; la lista se toma al empezar y no cambia mientras
  se llena.
*/
export function preguntasDeLista(zonas: readonly Zona[], values: Record<string, unknown>, opciones: { soloPendiente: boolean; faltantes?: ReadonlySet<string> }): Zona[] {
  const vistas = new Set<string>(), lista: Zona[] = [];
  for (const zona of zonas) {
    const clave = zona.keys.join(",");
    if (!zona.keys.length || vistas.has(clave)) continue;
    vistas.add(clave);
    if (opciones.soloPendiente && !zona.keys.some(key => vacio(values[key]) || opciones.faltantes?.has(key))) continue;
    lista.push(zona);
  }
  return lista;
}
