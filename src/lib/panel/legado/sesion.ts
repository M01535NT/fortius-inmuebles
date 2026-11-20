/**
 * ÚNICO punto por donde el panel nuevo toca el panel viejo (`/admin`).
 * Cuando el panel viejo se retire (etapa PN-11), este archivo se reemplaza por la sesión propia y no cambia nada más.
 * Regla de aislamiento: nada de `src/**\/panel/**` importa de `@/lib/admin` ni de `@/components/admin`, salvo esta carpeta.
 *
 * Cuenta y seguridad (las mismas llamadas y reglas que el provisional): el enlace del correo de recuperación o de
 * invitación (`acceptPasswordLink`), pedir ese correo (`recoverPassword`), cambiar la contraseña (`changePassword`) y la
 * entrada en dos pasos (`mfaStatus`, `startMfaEnrollment`, `confirmMfaEnrollment`).
 */
export {
  acceptPasswordLink,
  changePassword,
  confirmMfaEnrollment,
  errorMessage,
  isLoggedIn,
  login,
  logout,
  mfaStatus,
  needsMfaCode,
  recoverPassword,
  startMfaEnrollment,
  useSession,
  useSessionExpired,
  verifyMfaCode,
  type MfaStatus,
} from "@/lib/admin/store";
