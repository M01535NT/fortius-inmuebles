"use client";
import { useEffect, useRef } from "react";

/** ¿El foco está escribiendo? Los atajos de una sola tecla no se disparan ahí. */
export function estaEscribiendo(destino: EventTarget | null): boolean {
  const el = destino as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const t = el.tagName;
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || el.isContentEditable;
}

/** Hay una lista desplegable o un menú abierto: ahí una letra salta a una opción y no debe disparar un atajo. */
export function hayListaAbierta(): boolean {
  return typeof document !== "undefined" && !!document.querySelector("[role=listbox], [role=menu]");
}

/**
 * Atajo de teclado global. `tecla` en minúsculas («k», «n», «escape»). Con `conControl`, Ctrl (o Cmd en Mac).
 * Sin `conControl` no se dispara mientras alguien escribe en un campo ni con Ctrl, Cmd o Alt pulsados.
 */
export function useAtajo(tecla: string, accion: (e: KeyboardEvent) => void, opciones: { conControl?: boolean; activo?: boolean } = {}) {
  const { conControl = false, activo = true } = opciones;
  const ultima = useRef(accion);
  useEffect(() => { ultima.current = accion; });
  useEffect(() => {
    if (!activo) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== tecla) return;
      if (conControl) {
        if (!(e.ctrlKey || e.metaKey)) return;
      } else if (e.ctrlKey || e.metaKey || e.altKey || estaEscribiendo(e.target) || hayListaAbierta()) return;
      ultima.current(e);
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [tecla, conControl, activo]);
}

/** Índice al moverse con J (paso 1) o K (paso -1). Sin fila enfocada, J va a la primera y K a la última. Sin dar la vuelta. */
export function siguienteFila(actual: number, total: number, paso: 1 | -1): number {
  if (total <= 0) return -1;
  if (actual < 0) return paso === 1 ? 0 : total - 1;
  return Math.min(total - 1, Math.max(0, actual + paso));
}

/**
 * Teclado en las listas (sugerencia 15): J y K pasan de fila en fila en la pantalla, Enter la abre (es un botón o enlace)
 * y «/» lleva a la búsqueda. No actúan mientras hay una ventana abierta ni mientras alguien escribe.
 */
export function useTecladoEnListas() {
  const mover = (paso: 1 | -1) => (e: KeyboardEvent) => {
    if (document.querySelector("[role=dialog]:not([data-lateral])")) return;
    const filas = Array.from(document.querySelectorAll<HTMLElement>("main button.pn-fila, main a.pn-fila"));
    if (!filas.length) return;
    e.preventDefault();
    const i = siguienteFila(filas.indexOf(document.activeElement as HTMLElement), filas.length, paso);
    filas[i]?.focus();
    filas[i]?.scrollIntoView({ block: "nearest" });
  };
  useAtajo("j", mover(1));
  useAtajo("k", mover(-1));
  useAtajo("/", (e) => {
    if (document.querySelector("[role=dialog]:not([data-lateral])")) return;
    const campo = document.querySelector<HTMLInputElement>("main input[type=search]");
    if (!campo) return;
    e.preventDefault();
    campo.focus();
  });
}
