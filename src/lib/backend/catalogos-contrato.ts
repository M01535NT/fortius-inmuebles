/**
 * Los catálogos (SPEC.md, sección 3, «Configuración y catálogos»): lo que comparten la pantalla y el servidor.
 * Las listas y sus valores viven en la base (supabase/migrations/20261118200000_panel_14_catalogos.sql); aquí solo
 * están los nombres de los catálogos y las reglas para leerlos. Los valores de inicio, por si la base no responde,
 * están en catalogos-iniciales.ts.
 */

/** Los catálogos que existen. Cada uno se carga en la base con los valores que Fortius usa hoy. */
export const CATALOGOS = [
  "tipo_asunto", "subtipo_asunto", "encargo", "en_que_va", "resultado_cierre", "motivo_no_procede",
  "papel", "fuente", "estado_tarea", "quien_tarea", "tipo_inmueble", "regimen", "funcion_equipo",
] as const;
export type ClaveCatalogo = (typeof CATALOGOS)[number];

export type ValorCatalogo = {
  id: string; clave: string; etiqueta: string; orden: number; activo: boolean;
  significado: string | null; padre: string | null;
  /** El panel lo usa por su clave: se renombra, pero no se desactiva. */
  de_sistema: boolean;
  /** Vino con el panel: se ofrece si la lista se queda sin ningún valor activo. */
  inicial: boolean; etiqueta_inicial: string | null;
  version: number;
};

export type Significado = { clave: string; etiqueta: string };

export type Catalogo = {
  clave: ClaveCatalogo; nombre: string; ayuda: string; orden: number;
  /** No admite valores nuevos (en qué va un asunto, cómo va una tarea): solo se renombran. */
  fijo: boolean;
  significado_nombre: string | null; significados: Significado[];
  /** Subtipos: el catálogo del que dependen. */
  padre: ClaveCatalogo | null;
  /** Falso: el catálogo ya existe, pero ninguna pantalla lo usa todavía. */
  en_pantalla: boolean;
  /** En orden. */
  valores: ValorCatalogo[];
};

export type Catalogos = Partial<Record<ClaveCatalogo, Catalogo>>;
export type Opcion = { valor: string; etiqueta: string };

export const CLAVE_VALOR = /^[a-z0-9][a-z0-9_]{0,39}$/;

/** «en_marcha» → «En marcha»: solo mientras llegan los catálogos o si un valor no está. */
export const humanizar = (clave: string) => (clave ? clave.charAt(0).toUpperCase() + clave.slice(1).replace(/_/g, " ") : "");

/** Sin ningún valor activo. La pantalla ofrece entonces los valores con que empezó y Configuración lo avisa. */
export const estaVacio = (c: Catalogo | undefined): boolean => Boolean(c && c.valores.length && !c.valores.some((v) => v.activo));

/** Lo que se ofrece en una lista: los activos en orden; si no hay ninguno, los iniciales con su nombre de inicio. */
export function ofrecidos(c: Catalogo | undefined): ValorCatalogo[] {
  if (!c) return [];
  if (!estaVacio(c)) return c.valores.filter((v) => v.activo);
  return c.valores.filter((v) => v.inicial).map((v) => ({ ...v, etiqueta: v.etiqueta_inicial ?? v.etiqueta }));
}

export function etiquetaDe(c: Catalogo | undefined, clave: string | null | undefined): string {
  if (!clave) return "";
  return c?.valores.find((v) => v.clave === clave)?.etiqueta ?? humanizar(clave);
}

export const significadoDe = (c: Catalogo | undefined, clave: string | null | undefined): string | null =>
  (clave ? c?.valores.find((v) => v.clave === clave)?.significado ?? null : null);

/**
 * Las opciones de una lista desplegable: lo que se ofrece, más lo que la fila ya tiene aunque se haya desactivado
 * (desactivar no borra: el asunto lo conserva y se ve).
 */
export function opcionesDe(c: Catalogo | undefined, actual?: string | readonly string[] | null): Opcion[] {
  const lista = ofrecidos(c).map((v) => ({ valor: v.clave, etiqueta: v.etiqueta }));
  const tiene = typeof actual === "string" ? [actual] : actual ?? [];
  for (const k of tiene) if (k && !lista.some((o) => o.valor === k)) lista.push({ valor: k, etiqueta: etiquetaDe(c, k) });
  return lista;
}

/** La clave de un valor nuevo, sacada de su nombre: «Cliente anterior» → «cliente_anterior». No se repite. */
export function claveDesde(etiqueta: string, existentes: readonly string[]): string {
  const base = etiqueta.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 34) || "valor";
  const limpia = /^[a-z0-9]/.test(base) ? base : `v_${base}`.slice(0, 34);
  let clave = limpia;
  for (let n = 2; existentes.includes(clave); n++) clave = `${limpia}_${n}`;
  return clave;
}
