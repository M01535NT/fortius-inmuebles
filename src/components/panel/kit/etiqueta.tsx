import type { ReactNode } from "react";

import { Icono, type NombreIcono } from "../icons";

export type TonoEtiqueta = "normal" | "exito" | "aviso" | "error" | "acento";

/**
 * Etiqueta de estado (una sola pieza para «En marcha», «Hoy», «Recibido», «Falleció»…). El color nunca va solo:
 * siempre lleva su texto. No es un botón: para elegir, la lista desplegable.
 */
export function Etiqueta({ tono = "normal", icono, children, title }: { tono?: TonoEtiqueta; icono?: NombreIcono; children: ReactNode; title?: string }) {
  return (
    <span className="pn-etq" data-tono={tono === "normal" ? undefined : tono} title={title}>
      {icono ? <Icono nombre={icono} tamano={12} aria-hidden /> : null}
      {children}
    </span>
  );
}
