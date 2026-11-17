import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "texto" | "peligro";

const CLASES: Record<Variante, string> = {
  primario: "pn-btn pn-btn-primario",
  secundario: "pn-btn pn-btn-secundario",
  texto: "pn-btn pn-btn-texto",
  peligro: "pn-btn pn-btn-peligro",
};

type Comunes = { variante?: Variante; bloque?: boolean; children: ReactNode };

/**
 * Siempre un botón real (o un enlace real si lleva `href`). 44 px de alto como mínimo. Un solo primario por pantalla.
 * Deshabilitado con `aria-disabled` para que siga siendo enfocable y se pueda explicar por qué.
 */
export function Boton({ variante = "primario", bloque, className, children, deshabilitado, onClick, ...rest }: Comunes & { deshabilitado?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`${CLASES[variante]}${bloque ? " pn-btn-bloque" : ""}${className ? ` ${className}` : ""}`}
      aria-disabled={deshabilitado || undefined}
      onClick={deshabilitado ? (e) => e.preventDefault() : onClick}
    >
      {children}
    </button>
  );
}

export function BotonEnlace({ variante = "secundario", bloque, href, children }: Comunes & { href: string }) {
  return (
    <Link href={href} className={`${CLASES[variante]}${bloque ? " pn-btn-bloque" : ""}`}>
      {children}
    </Link>
  );
}
