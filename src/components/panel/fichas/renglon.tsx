import Link from "next/link";
import type { ReactNode } from "react";

import "./modelo.css";

type Tono = "normal" | "error" | "aviso";

type Props = {
  titulo: string;
  subtitulo?: string;
  /** Segunda línea (por ejemplo, «Venció el 3 de noviembre»), con su tono. */
  detalle?: string;
  tonoDetalle?: Tono;
  /** A la derecha: importe o fecha, y una línea chica debajo. */
  lado?: string;
  ladoMenor?: string;
  tonoLado?: "normal" | "bien" | "aviso";
  izquierda?: ReactNode;
  seleccionado?: boolean;
  /** Botón al final del renglón, fuera del renglón principal (no se anidan botones). */
  accion?: ReactNode;
  className?: string;
} & ({ href: string; alPulsar?: never } | { href?: never; alPulsar: () => void });

/**
 * Un renglón de la columna de lista, como el modelo visual (`.row`): 8 px × 14 px, el título y su línea gris, el importe a
 * la derecha y el abierto en azul sólido (asunto.css `.as-lista .as-it`). Con `href` es un enlace; con `alPulsar`, un botón.
 */
export function Renglon({ titulo, subtitulo, detalle, tonoDetalle = "normal", lado, ladoMenor, tonoLado = "normal", izquierda, seleccionado, accion, className, href, alPulsar }: Props) {
  const cuerpo = (
    <>
      {izquierda}
      <span className="as-it-c">
        <b>{titulo}</b>
        {subtitulo ? <small>{subtitulo}</small> : null}
        {detalle ? <small data-tono={tonoDetalle === "normal" ? undefined : tonoDetalle}>{detalle}</small> : null}
      </span>
      {lado ? <span className="fm-it-lado"><b data-tono={tonoLado === "normal" ? undefined : tonoLado}>{lado}</b>{ladoMenor ? <small>{ladoMenor}</small> : null}</span> : null}
    </>
  );
  const clase = `as-it fm-it${className ? ` ${className}` : ""}`;
  const actual = seleccionado ? ("page" as const) : undefined;
  const fila = href
    ? <Link href={href} className={clase} aria-current={actual}>{cuerpo}</Link>
    : <button type="button" className={clase} aria-current={actual} onClick={alPulsar}>{cuerpo}</button>;
  if (!accion) return fila;
  return <div className="fm-it-env">{fila}{accion}</div>;
}

/** Título de un grupo dentro de la columna de lista, con su cuenta a la derecha. */
export function TramoLista({ titulo, cuenta }: { titulo: string; cuenta?: number }) {
  return <h2 className="fm-tramo"><span>{titulo}</span>{cuenta !== undefined ? <span>{cuenta}</span> : null}</h2>;
}
