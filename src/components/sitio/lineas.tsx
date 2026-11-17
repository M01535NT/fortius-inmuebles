import * as React from "react";
import Link from "next/link";

import { FlechaDiagonal } from "@/components/sitio/iconos";

/**
  Lista con líneas finas (lienzo: guías, herramientas, documentos). Cada fila lleva a otra parte
  con una flecha en diagonal. `grande` usa la letra de las guías; `fuerte` marca la primera línea en tinta.
*/
export function ListaLineas({ grande = false, fuerte = false, className, children, etiqueta }: { grande?: boolean; fuerte?: boolean; className?: string; etiqueta?: string; children: React.ReactNode }) {
  const cls = ["s-lineas", grande ? "s-lineas-grande" : "", fuerte ? "s-lineas-fuerte" : "", className ?? ""].filter(Boolean).join(" ");
  return <ul className={cls} aria-label={etiqueta}>{children}</ul>;
}

type FilaProps = {
  href: string;
  titulo: React.ReactNode;
  /** Una línea de apoyo bajo el título. */
  detalle?: React.ReactNode;
  /** Para descargas (PDF): abre como documento, sin navegación del sitio. */
  documento?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function FilaLinea({ href, titulo, detalle, documento = false, onClick }: FilaProps) {
  const contenido = (
    <>
      <span className="s-linea-titulo">{titulo}{detalle ? <span className="s-linea-sub">{detalle}</span> : null}</span>
      <FlechaDiagonal />
    </>
  );
  const externo = documento || /^(https?:|mailto:|tel:)/.test(href);
  return (
    <li>
      {externo
        ? <a href={href} className="s-linea" onClick={onClick} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{contenido}</a>
        : <Link href={href} className="s-linea" onClick={onClick}>{contenido}</Link>}
    </li>
  );
}

/** Datos en dos columnas con líneas finas: «Precio … $12,850,000 MXN». */
export function DatosLineas({ filas, className }: { filas: readonly { dato: React.ReactNode; valor: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={className ? `s-datos ${className}` : "s-datos"}>
      {filas.map((fila, i) => (
        <div key={i}><dt>{fila.dato}</dt><dd>{fila.valor}</dd></div>
      ))}
    </dl>
  );
}
