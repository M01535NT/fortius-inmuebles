/*
  Tope mensual de gasto de la lectura con IA (IA-02). El director lo cambia en Configuración; si
  nunca lo cambió, manda la variable del servidor IA_TOPE_MENSUAL_USD y, sin ella, 20 dólares.
  Compartido por el servidor (que lo aplica) y la pantalla (que lo valida antes de guardar).
*/
export const TOPE_IA_POR_OMISION = 20;
export const TOPE_IA_MAXIMO = 1000;

/** Un tope válido en dólares (0 a 1000, con centavos) o `undefined` si no lo es. */
export function topeIaValido(valor: unknown): number | undefined {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0 || valor > TOPE_IA_MAXIMO) return undefined;
  return Math.round(valor * 100) / 100;
}

export type UsoIa = {
  /** Gasto aproximado del mes en curso, en dólares. */
  gastoUsd: number;
  topeUsd: number;
  /** De dónde sale el tope: Configuración, la variable del servidor o el valor por omisión. */
  origenTope: "configuracion" | "servidor" | "omision";
  lecturas: number;
  /** Primer día del mes contado (AAAA-MM-DD, UTC). */
  desde: string;
  /** Hay un servicio de lectura con su clave. */
  disponible: boolean;
};

const numero = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** «$12.50 USD». */
export const dolares = (valor: number) => `$${numero.format(valor)} USD`;
