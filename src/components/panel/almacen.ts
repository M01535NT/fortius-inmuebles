"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Preferencias de la interfaz de este navegador (menú contraído, orden del menú, tema).
 * No es dato del negocio: eso siempre va al servidor. Si el navegador no deja guardar, se usa el valor por omisión.
 */
const EVENTO = "panel-almacen";

function leer(clave: string): string | null {
  try { return window.localStorage.getItem(clave); } catch { return null; }
}

export function guardarPreferencia(clave: string, valor: string | null) {
  try {
    if (valor === null) window.localStorage.removeItem(clave); else window.localStorage.setItem(clave, valor);
  } catch { /* sin almacenamiento: la preferencia vale solo mientras la pantalla siga abierta */ }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: clave }));
}

export function usePreferencia(clave: string, porOmision: string): [string, (valor: string | null) => void] {
  const suscribir = useCallback((cb: () => void) => {
    window.addEventListener(EVENTO, cb);
    window.addEventListener("storage", cb);
    return () => { window.removeEventListener(EVENTO, cb); window.removeEventListener("storage", cb); };
  }, []);
  const valor = useSyncExternalStore(suscribir, () => leer(clave) ?? porOmision, () => porOmision);
  const guardar = useCallback((v: string | null) => guardarPreferencia(clave, v), [clave]);
  return [valor, guardar];
}
