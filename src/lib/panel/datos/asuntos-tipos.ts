import type { Expediente } from "@/lib/panel/datos/asuntos";

/** Tipos y papeles del asunto (PN-02). Constantes puras, sin pedir nada al servidor. */

/** Tipos de asunto de PN-02 (migración 20261116090200), con su nombre en pantalla. */
export const TIPOS_ASUNTO = {
  venta: "Venta", renta: "Renta", busqueda: "Búsqueda", tramite: "Trámite", inversion: "Inversión", revision: "Revisión de inmueble", otro: "Otro",
} as const;
export type TipoAsunto = keyof typeof TIPOS_ASUNTO;
export const OPCIONES_TIPO_ASUNTO = (Object.keys(TIPOS_ASUNTO) as TipoAsunto[]).map((valor) => ({ valor, etiqueta: TIPOS_ASUNTO[valor] }));
/** Para crear: la ruta de alta solo conoce la operación; el tipo nuevo se guarda después. */
export const OPERACION_DE_TIPO: Record<TipoAsunto, Expediente["operacion"]> = {
  venta: "venta", renta: "renta", busqueda: "otra", tramite: "otra", inversion: "inversion", revision: "otra", otro: "otra",
};
/** Tipo que corresponde a la operación de un expediente que aún no tiene `tipo_asunto`. */
export function tipoDeOperacion(op: Expediente["operacion"]): TipoAsunto {
  return op === "venta" ? "venta" : op === "renta" ? "renta" : op === "inversion" ? "inversion" : "otro";
}

/** Papeles de una persona en el asunto (migración 20261116090300). */
export const PAPELES = {
  vende: "Vende", compra: "Compra", pone_en_renta: "Pone en renta", renta: "Renta", copropietario: "Copropietario", apoderado: "Apoderado",
  aliado: "Aliado", notaria: "Notaría", banco: "Banco", abogado: "Abogado", otro: "Otro",
} as const;
export type Papel = keyof typeof PAPELES;
export const OPCIONES_PAPEL = (Object.keys(PAPELES) as Papel[]).map((valor) => ({ valor, etiqueta: PAPELES[valor] }));
/** Notarías, bancos y abogados no se eligen como contacto principal (boceto). */
export const PAPEL_DE_APOYO: readonly Papel[] = ["notaria", "banco", "abogado"];
