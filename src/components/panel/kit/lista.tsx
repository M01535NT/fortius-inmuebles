import Link from "next/link";
import type { ReactNode } from "react";

/** Tarjeta: se separa con línea, no con sombra. */
export function Tarjeta({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`pn-tarjeta${className ? ` ${className}` : ""}`} {...rest}>{children}</div>;
}

/** Lista agrupada: título pequeño y las filas dentro de una sola tarjeta. */
export function GrupoLista({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section>
      {titulo ? <h2 className="pn-grupo">{titulo}</h2> : null}
      <Tarjeta className="pn-lista">{children}</Tarjeta>
    </section>
  );
}

type TonoLado = "normal" | "error" | "aviso";

type PropsFila = {
  titulo: string;
  subtitulo?: string;
  /** Línea extra bajo el subtítulo (por ejemplo, «Venció hace 3 días»). */
  detalle?: string;
  tonoDetalle?: TonoLado;
  /** Lado derecho: monto o fecha. */
  lado?: string;
  ladoMenor?: string;
  izquierda?: ReactNode;
  derecha?: ReactNode;
  seleccionada?: boolean;
  /** Menú «⋯» u otros botones al final de la fila, fuera del botón principal (no se anidan botones). */
  acciones?: ReactNode;
} & ({ href: string; alPulsar?: never } | { href?: never; alPulsar?: () => void });

/** Una fila de lista. Con `href` es un enlace; con `alPulsar`, un botón; sin ninguno, texto. */
export function Fila({ acciones, ...props }: PropsFila) {
  if (!acciones) return <FilaSola {...props} />;
  return (
    <div className="pn-fila-envoltura">
      <FilaSola {...props} />
      <span className="pn-fila-acciones">{acciones}</span>
    </div>
  );
}

function FilaSola({ titulo, subtitulo, detalle, tonoDetalle = "normal", lado, ladoMenor, izquierda, derecha, seleccionada, href, alPulsar }: Omit<PropsFila, "acciones">) {
  const cuerpo = (
    <>
      {izquierda}
      <span className="pn-fila-cuerpo">
        <span className="pn-fila-titulo">{titulo}</span>
        {subtitulo ? <span className="pn-fila-sub">{subtitulo}</span> : null}
        {detalle ? <span className={`pn-fila-sub${tonoDetalle === "error" ? " pn-tono-error" : tonoDetalle === "aviso" ? " pn-tono-aviso" : ""}`}>{detalle}</span> : null}
      </span>
      {lado ? <span className="pn-fila-lado"><span style={{ fontWeight: 700 }}>{lado}</span>{ladoMenor ? <span className="pn-fila-sub">{ladoMenor}</span> : null}</span> : null}
      {derecha}
    </>
  );
  const aria = seleccionada ? ({ "aria-current": "true" } as const) : {};
  if (href) return <Link href={href} className="pn-fila" {...aria}>{cuerpo}</Link>;
  if (alPulsar) return <button type="button" className="pn-fila" onClick={alPulsar} {...aria}>{cuerpo}</button>;
  return <div className="pn-fila" {...aria}>{cuerpo}</div>;
}

export function Contador({ n, etiqueta }: { n: number; etiqueta: string }) {
  if (n <= 0) return null;
  return <span className="pn-contador" aria-label={`${n} ${etiqueta}`}>{n}</span>;
}
