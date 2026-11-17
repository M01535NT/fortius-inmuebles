import "server-only";
import { ApiError, databaseError } from "./http";

export type Fallo = { code?: string; message?: string };
/** Errores de la base con mensaje propio (los escriben las migraciones del panel) o tablas que aún no existen. */
export function fallo(error: Fallo): never {
  if (["42P01", "PGRST205", "PGRST200"].includes(error.code ?? "")) {
    throw new ApiError(503, "Esta parte se activa cuando se integren los cambios de la base. Mientras tanto no hay nada que mostrar.");
  }
  if (error.code === "22023" && error.message && error.message.length <= 200) throw new ApiError(400, error.message);
  if (error.code === "PT409") throw new ApiError(409, "Alguien más cambió esto. Vuelve a cargar y repite el cambio.");
  if (error.code === "PT403" && error.message && error.message.length <= 200) throw new ApiError(403, error.message);
  return databaseError(error);
}
