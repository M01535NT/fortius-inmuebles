import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icono, type NombreIcono } from "../icons";

/**
 * Las variantes del boceto: `primario` (azul, una por pantalla), `normal` (blanco con borde, el .btn del boceto),
 * `fantasma` (sin borde, para barras y renglones), `secundario` (azul suave), `texto` (enlace) y `peligro`.
 */
type Variante = "primario" | "normal" | "fantasma" | "secundario" | "texto" | "peligro";

const CLASES: Record<Variante, string> = {
  primario: "pn-btn pn-btn-primario",
  normal: "pn-btn",
  fantasma: "pn-btn pn-btn-fantasma",
  secundario: "pn-btn pn-btn-secundario",
  texto: "pn-btn pn-btn-texto",
  peligro: "pn-btn pn-btn-peligro",
};

type Comunes = {
  variante?: Variante; bloque?: boolean;
  /** Ícono a la izquierda del texto. */
  icono?: NombreIcono;
  /** Solo el ícono: botón cuadrado. Lleva `aria-label` obligatorio (lo pide quien lo usa) y lo repite como globo. */
  soloIcono?: boolean;
  children?: ReactNode;
};

const clases = (variante: Variante, bloque?: boolean, soloIcono?: boolean, extra?: string) =>
  `${CLASES[variante]}${bloque ? " pn-btn-bloque" : ""}${soloIcono ? " pn-btn-icono" : ""}${extra ? ` ${extra}` : ""}`;

/**
 * Siempre un botón real (o un enlace real si lleva `href`). 34 px en escritorio y 44 px en el teléfono, como el boceto.
 * Deshabilitado con `aria-disabled` para que siga siendo enfocable y se pueda explicar por qué.
 */
export function Boton({ variante = "primario", bloque, icono, soloIcono, className, children, deshabilitado, onClick, title, ...rest }: Comunes & { deshabilitado?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      title={title ?? (soloIcono ? rest["aria-label"] : undefined)}
      className={clases(variante, bloque, soloIcono, className)}
      aria-disabled={deshabilitado || undefined}
      onClick={deshabilitado ? (e) => e.preventDefault() : onClick}
    >
      {icono ? <Icono nombre={icono} tamano={soloIcono ? 17 : 16} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function BotonEnlace({ variante = "secundario", bloque, icono, soloIcono, href, children, className, ...rest }: Comunes & { href: string; className?: string; "aria-label"?: string; title?: string }) {
  return (
    <Link href={href} className={clases(variante, bloque, soloIcono, className)} title={rest.title ?? (soloIcono ? rest["aria-label"] : undefined)} aria-label={rest["aria-label"]}>
      {icono ? <Icono nombre={icono} tamano={soloIcono ? 17 : 16} aria-hidden /> : null}
      {children}
    </Link>
  );
}
