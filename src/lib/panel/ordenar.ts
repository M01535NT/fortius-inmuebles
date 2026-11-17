/** Orden de listas que el usuario cambia arrastrando (RP-102). Sin dependencias de pantalla para poder probarlo. */

/** Mueve el elemento de `de` a `a` y devuelve una lista nueva. Fuera de rango o sin cambio, devuelve la misma lista. */
export function moverElemento<T>(lista: readonly T[], de: number, a: number): T[] {
  if (de === a || de < 0 || a < 0 || de >= lista.length || a >= lista.length) return [...lista];
  const nueva = [...lista];
  const [x] = nueva.splice(de, 1);
  nueva.splice(a, 0, x);
  return nueva;
}

/** Aplica un orden guardado (lista de claves) a una lista base. Las claves que ya no existen se ignoran y las nuevas van al final. */
export function aplicarOrden<T>(base: readonly T[], claves: readonly string[], clave: (x: T) => string): T[] {
  const por = new Map(base.map((x) => [clave(x), x]));
  const primero: T[] = [];
  const vistos = new Set<string>();
  for (const k of claves) {
    const x = por.get(k);
    if (x !== undefined && !vistos.has(k)) { primero.push(x); vistos.add(k); }
  }
  return [...primero, ...base.filter((x) => !vistos.has(clave(x)))];
}

/** Lee un orden guardado como JSON; cualquier cosa que no sea una lista de textos se descarta. */
export function leerOrdenGuardado(texto: string | null | undefined): string[] {
  if (!texto) return [];
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Frase para el aviso que lee el lector de pantalla después de mover algo. */
export function avisoDeMovimiento(nombre: string, lugar: number, total: number): string {
  return `${nombre} quedó en el lugar ${lugar} de ${total}`;
}
