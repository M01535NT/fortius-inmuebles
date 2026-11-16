/** Búsqueda para «Buscar o crear» (Ctrl K). Ignora mayúsculas y acentos y acepta varias palabras. */

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export type Entrada = {
  id: string;
  /** Lo que se ve. */
  titulo: string;
  /** Otras palabras con las que se puede encontrar (folio, teléfono, sinónimos). */
  claves?: readonly string[];
  grupo: "Ir a" | "Crear" | "Personas" | "Inmuebles" | "Consultas";
  /** Línea secundaria (tipo, folio, teléfono). */
  detalle?: string;
};

/** Puntaje: título que empieza igual vale más que el que solo contiene las palabras. 0 si alguna palabra no aparece. */
export function puntaje(entrada: Entrada, consulta: string): number {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return 1;
  const titulo = normalizar(entrada.titulo);
  const pajar = [titulo, ...(entrada.claves ?? []).map(normalizar)].join(" ");
  let total = 0;
  for (const p of palabras) {
    if (!pajar.includes(p)) return 0;
    total += titulo.startsWith(p) ? 3 : titulo.includes(p) ? 2 : 1;
  }
  return total;
}

export function filtrar(entradas: readonly Entrada[], consulta: string): Entrada[] {
  return entradas
    .map((e, i) => ({ e, p: puntaje(e, consulta), i }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((x) => x.e);
}

const ORDEN_GRUPOS: Entrada["grupo"][] = ["Personas", "Inmuebles", "Consultas", "Ir a", "Crear"];

/**
 * Busca y deja cada grupo junto (los datos primero), con un máximo por grupo de datos.
 * Los datos solo aparecen con al menos dos letras escritas, para no llenar la lista al abrir.
 */
export function filtrarAgrupado<T extends Entrada>(entradas: readonly T[], consulta: string, maxPorGrupo = 5): T[] {
  const conTexto = normalizar(consulta).length >= 2;
  const encontradas = (filtrar(entradas, consulta) as T[]).filter((e) => conTexto || e.grupo === "Ir a" || e.grupo === "Crear");
  const cuenta = new Map<string, number>();
  const salida: T[] = [];
  for (const g of ORDEN_GRUPOS) {
    for (const e of encontradas) {
      if (e.grupo !== g) continue;
      const n = cuenta.get(g) ?? 0;
      if ((g === "Ir a" || g === "Crear") || n < maxPorGrupo) { salida.push(e); cuenta.set(g, n + 1); }
    }
  }
  return salida;
}
