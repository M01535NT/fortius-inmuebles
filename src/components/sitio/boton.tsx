import * as React from "react";
import Link from "next/link";

import { FlechaDerecha } from "@/components/sitio/iconos";

type Variante = "relleno" | "rojo" | "contorno";
type Tamano = "chico" | "normal" | "grande";

type Comun = {
  variante?: Variante;
  tamano?: Tamano;
  /** Agrega la flecha a la derecha (acciones que avanzan). */
  flecha?: boolean;
  /** Sobre foto o video: contorno y letra claros en cualquier tema. */
  sobreMedia?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ComoEnlace = Comun & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & { href: string };
type ComoBoton = Comun & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

function clases({ variante = "relleno", tamano = "normal", sobreMedia, className }: Comun) {
  return [
    "s-btn",
    `s-btn-${variante}`,
    tamano === "normal" ? "" : `s-btn-${tamano}`,
    sobreMedia ? "s-sobre-media" : "",
    className ?? "",
  ].filter(Boolean).join(" ");
}

const externo = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

/**
  Botón del sitio: relleno (la acción principal, una por bloque), rojo (la acción que más importa
  de una pantalla, como «Solicitar visita» en la ficha) o contorno.
  Con `href` es un enlace; sin él, un botón. Mide al menos 44 px de alto.
*/
export function Boton(props: ComoEnlace | ComoBoton) {
  const { variante, tamano, flecha, sobreMedia, className, children, ...resto } = props;
  const contenido = <>{children}{flecha ? <FlechaDerecha /> : null}</>;
  const cls = clases({ variante, tamano, sobreMedia, className, children });
  if (typeof resto.href === "string") {
    const { href, ...a } = resto as Omit<ComoEnlace, keyof Comun>;
    if (externo(href)) return <a href={href} className={cls} {...a}>{contenido}</a>;
    return <Link href={href} className={cls} {...a}>{contenido}</Link>;
  }
  const { type = "button", ...b } = resto as Omit<ComoBoton, keyof Comun>;
  return <button type={type} className={cls} {...b}>{contenido}</button>;
}

type EnlaceProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
  href: string;
  className?: string;
  /** «subrayado»: texto con línea abajo, sin flecha (p. ej. «o escribe por WhatsApp»). */
  estilo?: "flecha" | "subrayado";
};

/** Enlace con flecha en el color del acento («Ver todo el inventario →»). */
export function EnlaceFlecha({ href, className, estilo = "flecha", children, ...a }: EnlaceProps) {
  const cls = [estilo === "flecha" ? "s-enlace" : "s-enlace s-enlace-subrayado", className].filter(Boolean).join(" ");
  const contenido = <>{children}{estilo === "flecha" ? <FlechaDerecha /> : null}</>;
  if (externo(href)) return <a href={href} className={cls} {...a}>{contenido}</a>;
  return <Link href={href} className={cls} {...a}>{contenido}</Link>;
}
