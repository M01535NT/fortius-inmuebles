/**
 * ÚNICO punto por donde el panel nuevo toca el panel viejo (`/admin-anterior`).
 * Cuando el panel viejo se retire (etapa PN-11), este archivo se reemplaza por la sesión propia y no cambia nada más.
 * Regla de aislamiento: nada de `src/**\/panel/**` importa de `@/lib/admin` ni de `@/components/admin`, salvo esta carpeta.
 */
export {
  errorMessage,
  isLoggedIn,
  login,
  logout,
  needsMfaCode,
  useSession,
  useSessionExpired,
  verifyMfaCode,
} from "@/lib/admin/store";
