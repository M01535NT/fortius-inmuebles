"use client";

import * as React from "react";

/*
  useReducedMotion seguro para hidratación: el snapshot del servidor es
  false (coincide con el HTML prerenderizado) y React re-renderiza tras
  hidratar si el valor real difiere. Usar SIEMPRE este hook cuando
  `reduce` cambia el markup renderizado; el de motion/react lee matchMedia
  en el primer render y rompe la hidratación bajo prefers-reduced-motion
  (React #418).
*/
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useReducedMotionSafe() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
