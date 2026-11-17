import { ApiError, databaseError } from "@/lib/backend/http";

/**
 * Quitar y restaurar una imagen de un formato (04 y 07) o una copia firmada de un PDF emitido (PN-06).
 * Es eliminación recuperable: se marcan `deleted_at` y `deleted_by`; la fila, los bytes en Storage y la huella se conservan.
 * Mientras la migración `20261116091000_pn06_quitar_imagen_y_copia_firmada.sql` no esté aplicada, las columnas no existen:
 * las listas siguen como antes (sin filtrar) y quitar responde 503 con un mensaje claro.
 */

type ErrorBase = { code?: string; message?: string };
type Resultado<T> = { data: T | null; error: ErrorBase | null };

export const SIN_RETIRO = "Quitar archivos todavía no está disponible en el servidor. Avísale a dirección.";

/** La columna `deleted_at` aún no existe (filtro: 42703; escritura: PGRST204). */
export const sinColumnaDeRetiro = (error: ErrorBase) =>
  error.code === "42703" || error.code === "PGRST204" || (/deleted_at/.test(error.message ?? "") && /column/i.test(error.message ?? ""));

/** Lee solo lo activo; si la columna aún no existe, lee todo (antes de la migración nada estaba quitado). */
export async function soloActivos<T>(consulta: (filtrar: boolean) => PromiseLike<Resultado<T>>): Promise<T | null> {
  let r = await consulta(true);
  if (r.error && sinColumnaDeRetiro(r.error)) r = await consulta(false);
  if (r.error) databaseError(r.error);
  return r.data;
}

/** Resultado de quitar o restaurar: 503 si falta la migración, 409 si ya estaba en ese estado. */
export function resultadoDeRetiro<T>(r: Resultado<T>, yaEstaba: string): T {
  if (r.error && sinColumnaDeRetiro(r.error)) throw new ApiError(503, SIN_RETIRO);
  if (r.error) databaseError(r.error);
  if (!r.data) throw new ApiError(409, yaEstaba);
  return r.data;
}

/** Las imágenes que la hoja usa: foto principal, croquis y las fotografías del 07 (una por renglón). */
export function imagenesEnUso(datos: unknown): Set<string> {
  const d = datos && typeof datos === "object" ? (datos as Record<string, unknown>) : {};
  const fotos = Array.isArray(d.fotografias) ? d.fotografias.map((f) => (f && typeof f === "object" ? (f as Record<string, unknown>).assetId : undefined)) : [];
  return new Set([d.fotoPrincipalId, d.croquisId, ...fotos].filter((x): x is string => typeof x === "string" && x.length > 0));
}

export const marcaDeRetiro = (quitar: boolean, usuario: string) =>
  quitar ? { deleted_at: new Date().toISOString(), deleted_by: usuario } : { deleted_at: null, deleted_by: null };
