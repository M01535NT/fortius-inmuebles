/**
 * Modelo del panel nuevo (PN-02): tipos, folios y reglas que la base de datos hace cumplir (RP-106 a RP-108).
 * Aquí viven las reglas como funciones puras para usarlas en pantalla y en pruebas; la base de datos sigue siendo
 * quien las impone (folios por disparador, visibilidad por RLS). Nada de esto sustituye a la seguridad del servidor.
 */

export const TIPOS_ASUNTO = ["venta", "renta", "busqueda", "tramite", "inversion", "revision", "otro"] as const;
export type TipoAsunto = (typeof TIPOS_ASUNTO)[number];

export const ESTADOS_ASUNTO = ["activo", "en_espera", "cerrado"] as const;
export type EstadoAsunto = (typeof ESTADOS_ASUNTO)[number];

/** Cómo termina un asunto cerrado. Cancelar es cerrarlo como «no se dio»: nunca se borra (RP-107). */
export type ResultadoAsunto = "se_logro" | "no_se_dio";

export const PAPELES = ["vende", "compra", "pone_en_renta", "renta", "copropietario", "apoderado", "aliado", "notaria", "banco", "abogado", "otro"] as const;
export type Papel = (typeof PAPELES)[number];

export const ROLES_MIEMBRO = ["titular", "colaborador"] as const;
export type RolMiembro = (typeof ROLES_MIEMBRO)[number];

export const TIPOS_PENDIENTE = ["tarea", "llamada", "cita", "visita", "firma", "seguimiento", "espera", "cobro", "entrega", "vencimiento"] as const;
export type TipoPendiente = (typeof TIPOS_PENDIENTE)[number];

// ---------- Qué abre un asunto nuevo (RP-108) ----------

export type MotivoAlta =
  | "encargo_inmueble" // el propietario encarga un inmueble en venta o renta
  | "busqueda_real" // comprador o arrendatario con una búsqueda real
  | "tramite_sin_venta"
  | "mandato_inversion"
  | "recomercializacion" // el mismo inmueble tras un cierre, o de venta a renta con documentos emitidos
  | "consulta"
  | "visita"
  | "archivo"
  | "cambio_de_precio"
  | "reapertura";

const ABREN: ReadonlySet<MotivoAlta> = new Set(["encargo_inmueble", "busqueda_real", "tramite_sin_venta", "mandato_inversion", "recomercializacion"]);

/** Solo estos cinco motivos abren un asunto; una consulta, una visita, un archivo, un cambio de precio o una reapertura no. */
export function abreAsunto(motivo: MotivoAlta): boolean {
  return ABREN.has(motivo);
}

/** Tipo de asunto que corresponde a cada motivo que abre uno. */
export function tipoDeAsunto(motivo: MotivoAlta, operacion?: "venta" | "renta"): TipoAsunto | null {
  switch (motivo) {
    case "encargo_inmueble":
    case "recomercializacion": return operacion === "renta" ? "renta" : "venta";
    case "busqueda_real": return "busqueda";
    case "tramite_sin_venta": return "tramite";
    case "mandato_inversion": return "inversion";
    default: return null;
  }
}

// ---------- Folios (RP-107) ----------

const RE_EXP = /^EXP-(\d{6,})$/;
const RE_INMUEBLE = /^FORTIUS-(\d{6,})$/;

/** `EXP-000412`: seis dígitos como mínimo y más si hace falta. */
export function folioAsunto(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1) throw new RangeError("El número de folio debe ser un entero positivo");
  return `EXP-${String(numero).padStart(6, "0")}`;
}

export function folioInmueble(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1) throw new RangeError("El número de folio debe ser un entero positivo");
  return `FORTIUS-${String(numero).padStart(6, "0")}`;
}

/** Número de un folio de asunto, o null si no tiene la forma `EXP-######`. Acepta minúsculas y espacios alrededor. */
export function numeroDeFolioAsunto(folio: string): number | null {
  const m = RE_EXP.exec(folio.trim().toUpperCase());
  return m ? Number(m[1]) : null;
}

export function numeroDeFolioInmueble(folio: string): number | null {
  const m = RE_INMUEBLE.exec(folio.trim().toUpperCase());
  return m ? Number(m[1]) : null;
}

/** El formato emitido cita el folio del asunto, el número del formato y la versión: `EXP-000412·09·v2`. */
export function folioFormato(folioDelAsunto: string, formato: string, version: number): string {
  if (numeroDeFolioAsunto(folioDelAsunto) === null) throw new RangeError("Folio de asunto inválido");
  if (!/^\d{2}[A-Z]?$/.test(formato)) throw new RangeError("Número de formato inválido");
  if (!Number.isInteger(version) || version < 1) throw new RangeError("La versión empieza en 1");
  return `${folioDelAsunto.trim().toUpperCase()}·${formato}·v${version}`;
}

/** Solo el recibo emitido lleva folio de dinero: `REC-2026-0007`. El número no se reutiliza aunque el recibo se cancele. */
export function folioRecibo(anio: number, numero: number): string {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2999) throw new RangeError("Año inválido");
  if (!Number.isInteger(numero) || numero < 1) throw new RangeError("El número debe ser un entero positivo");
  return `REC-${anio}-${String(numero).padStart(4, "0")}`;
}

// ---------- Visibilidad (RP-101): espejo de la regla de la base, solo para la pantalla ----------

export type Usuario = { esDirector: boolean; asesorId: string | null };
export type AsuntoVisible = { asesorId: string; miembros: readonly { asesorId: string; retirado?: boolean }[]; borrado?: boolean };

/**
 * Qué asuntos ve cada quien: el director, todos; el asesor, los que lleva o en los que es miembro vigente.
 * Es el espejo de `fortius_inmuebles_puede_ver_asunto`; la base lo hace cumplir y esto solo evita mostrar botones inútiles.
 */
export function puedeVerAsunto(u: Usuario, a: AsuntoVisible): boolean {
  if (u.esDirector) return true;
  if (!u.asesorId || a.borrado) return false;
  return a.asesorId === u.asesorId || a.miembros.some((m) => !m.retirado && m.asesorId === u.asesorId);
}

/** Solo el director reasigna el responsable de un registro (RP-101). */
export function puedeReasignar(u: Usuario): boolean {
  return u.esDirector;
}

/** El porcentaje de los miembros de un asunto no puede pasar de 100 (reparto de comisión). */
export function repartoValido(miembros: readonly { porcentaje?: number | null; retirado?: boolean }[]): boolean {
  const total = miembros.filter((m) => !m.retirado).reduce((s, m) => s + (m.porcentaje ?? 0), 0);
  return total <= 100 + 1e-9;
}
