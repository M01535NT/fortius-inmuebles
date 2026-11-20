"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

import { leerAsuntos, type FilaAsunto } from "@/lib/panel/asuntos/api";

/**
 * Cuántos asuntos abiertos hay, para el número junto a «Asuntos» en el menú (modelo visual: «Asuntos 6»).
 * Mientras la lista de Asuntos está cargada, ella manda su cuenta; fuera de ella se pide la lista una vez al entrar
 * (el servidor solo devuelve lo que cada quien puede ver, así que el asesor cuenta los suyos).
 */
let local: number | null = null;
const oyentes = new Set<() => void>();
const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
const leerLocal = () => local;

export const abiertos = (lista: readonly FilaAsunto[]) => lista.filter((a) => a.en_que_va !== "cerrado").length;

/** La lista de Asuntos publica su cuenta; con null deja de mandar. */
export function publicarCuentaAsuntos(n: number | null) {
  if (local === n) return;
  local = n;
  oyentes.forEach((f) => f());
}

export function useCuentaAsuntos(): number {
  const publicada = useSyncExternalStore(suscribir, leerLocal, () => null);
  const [servidor, setServidor] = useState<number | null>(null);
  useEffect(() => {
    if (publicada !== null || servidor !== null) return;
    let vivo = true;
    leerAsuntos().then((l) => { if (vivo) setServidor(abiertos(l)); }, () => {});
    return () => { vivo = false; };
  }, [publicada, servidor]);
  return publicada ?? servidor ?? 0;
}
