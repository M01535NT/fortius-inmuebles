"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Hoja que sube desde abajo en el teléfono y ventana centrada en escritorio (mismo componente).
 * Esc o un toque fuera la cierra; el foco entra, se queda adentro y vuelve a donde estaba.
 */
export function Hoja({ abierta, titulo, alCerrar, children, ancha, ocultarTitulo, plana }: {
  abierta: boolean; titulo: string; alCerrar: () => void; children: ReactNode; ancha?: boolean; ocultarTitulo?: boolean;
  /** Sin relleno: el contenido llena la hoja (paleta de búsqueda). */
  plana?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  // La función de cerrar puede cambiar en cada pintado de quien la pasa; el foco no debe reiniciarse por eso.
  const cerrar = useRef(alCerrar);
  useEffect(() => { cerrar.current = alCerrar; });

  useEffect(() => {
    if (!abierta) return;
    const previo = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    // Con campos, el foco va al primero. Sin campos, entra a la hoja misma (el lector la anuncia y no salta al botón del final).
    const primero = panel?.querySelector<HTMLElement>("input, textarea, select");
    (primero ?? panel)?.focus({ preventScroll: !primero });
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); cerrar.current(); return; }
      if (e.key !== "Tab" || !panel) return;
      const lista = [...panel.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((x) => x.offsetParent !== null);
      if (!lista.length) return;
      const a = lista[0];
      const z = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
    document.addEventListener("keydown", alTeclear);
    return () => { document.removeEventListener("keydown", alTeclear); previo?.focus?.(); };
  }, [abierta]);

  if (!abierta) return null;
  return (
    <div className="pn-capa">
      <button type="button" className="pn-capa-fondo" aria-label="Cerrar" tabIndex={-1} onClick={alCerrar} />
      <div ref={ref} className={`pn-hoja${ancha ? " pn-hoja-ancha" : ""}${plana ? " pn-hoja-plana" : ""}`} role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}>
        <span className="pn-hoja-asa" aria-hidden />
        <h2 id={idTitulo} className={ocultarTitulo ? "pn-solo-lector" : undefined}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
