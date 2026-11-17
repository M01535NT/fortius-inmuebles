"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

import { leerCola, sinColaEnServidor } from "@/lib/panel/datos/bandeja-acciones";

/**
 * Cuántos archivos esperan en la Bandeja, para el número del menú y de la barra del teléfono (boceto: «5 por revisar»).
 * Mientras la página de la Bandeja está abierta manda su propia cuenta (la cola local, que incluye lo que todavía sube).
 * Fuera de ella se lee la cola del servidor (`GET /api/admin/bandeja`); si responde 503 (migración sin aplicar),
 * la cola solo vive en la página y no hay número que mostrar.
 */
let local: number | null = null;
const oyentes = new Set<() => void>();
const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
const leerLocal = () => local;

/** La página de la Bandeja publica su cuenta; con null deja de mandar (al salir de la página). */
export function publicarCuentaBandeja(n: number | null) {
  if (local === n) return;
  local = n;
  oyentes.forEach((f) => f());
}

export function useCuentaBandeja(cada = 90_000): number {
  const enPagina = useSyncExternalStore(suscribir, leerLocal, () => null);
  const [servidor, setServidor] = useState<number | null>(null);
  const [sinCola, setSinCola] = useState(false);
  const fuera = enPagina === null;
  useEffect(() => {
    if (!fuera) return;
    if (sinCola) return;
    let c = new AbortController();
    const leer = () => {
      c.abort();
      c = new AbortController();
      const senal = c.signal;
      leerCola(senal).then(
        (filas) => setServidor(filas.filter((f) => f.estado === "por_confirmar").length),
        (e) => { if (senal.aborted) return; if (sinColaEnServidor(e)) setSinCola(true); },
      );
    };
    leer();
    const t = window.setInterval(leer, cada);
    return () => { c.abort(); window.clearInterval(t); };
    // La cuenta del servidor se relee al salir de la Bandeja: lo que se acomodó allí ya no cuenta.
  }, [cada, sinCola, fuera]);
  return enPagina ?? servidor ?? 0;
}
