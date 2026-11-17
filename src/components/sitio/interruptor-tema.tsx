"use client";

import * as React from "react";

/*
  Interruptor de tema del sitio (dos opciones: claro u oscuro). Usa la misma clave guardada y la
  misma clase .dark que el script de arranque del layout; ThemeToggle del panel no cambia.
*/
const CLAVE = "fortius-inmuebles-theme";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function InterruptorTema({ className }: { className?: string }) {
  const oscuro = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cambiar = () => {
    const siguiente = !oscuro;
    document.documentElement.classList.toggle("dark", siguiente);
    try { localStorage.setItem(CLAVE, siguiente ? "dark" : "light"); } catch { /* sin almacenamiento */ }
  };
  return (
    <button type="button" role="switch" aria-checked={oscuro} onClick={cambiar} className={className ? `s-interruptor ${className}` : "s-interruptor"}>
      <span className="s-interruptor-pista" aria-hidden="true" />
      Tema oscuro
    </button>
  );
}
