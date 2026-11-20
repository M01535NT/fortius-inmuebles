/**
 * Reglas de pantalla de la cuenta (entrada y Configuración → Seguridad). Las reglas de verdad las hace cumplir el
 * servidor (`src/lib/backend/auth.ts`); aquí solo se avisa antes de mandar, con las mismas medidas.
 * Nada de esto guarda ni registra contraseñas, códigos ni claves.
 */

/** Lo que acepta el servidor para una contraseña nueva. */
export const CLAVE_MINIMO = 12;
export const CLAVE_MAXIMO = 128;
/** Dispositivos de verificación que acepta el servidor por cuenta. */
export const MAXIMO_DISPOSITIVOS = 2;

/** El aviso de la contraseña nueva, o null si está bien. No mira qué letras lleva: el servidor solo pide el largo. */
export function revisarClaveNueva(clave: string, confirmacion: string): string | null {
  if (clave.length < CLAVE_MINIMO) return `Usa al menos ${CLAVE_MINIMO} caracteres.`;
  if (clave.length > CLAVE_MAXIMO) return `Usa como máximo ${CLAVE_MAXIMO} caracteres.`;
  if (clave !== confirmacion) return "Las dos contraseñas no coinciden.";
  return null;
}

/** El código de la app: seis dígitos. Quita espacios y guiones que se cuelan al copiarlo. */
export const limpiarCodigo = (texto: string) => texto.replace(/[\s-]/g, "").slice(0, 6);
export const codigoCompleto = (codigo: string) => /^\d{6}$/.test(codigo);

/** El estado en una frase: apagada o en cuántos dispositivos. */
export function estadoDosPasos(dispositivos: number): string {
  if (dispositivos <= 0) return "Apagada";
  return dispositivos === 1 ? "Activa en un dispositivo" : `Activa en ${dispositivos} dispositivos`;
}

export const puedeAgregarDispositivo = (dispositivos: number) => dispositivos < MAXIMO_DISPOSITIVOS;

/** La fecha en que se registró un dispositivo, como se dice: «13 de noviembre de 2026». */
export function fechaRegistro(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "fecha desconocida" : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * El servidor pide volver a entrar (acceso viejo) para cambiar la contraseña o activar los dos pasos.
 * Se lee del error sin importar su clase, para no atarse al panel provisional.
 */
export function pideVolverAEntrar(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { status, details } = error as { status?: unknown; details?: { reauth?: unknown } };
  return details?.reauth === true || status === 401;
}
