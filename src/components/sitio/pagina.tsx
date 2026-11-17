import * as React from "react";
import Link from "next/link";

/*
  Piezas de las páginas interiores, Fortius II (etapa 5, 17/11/2026): la cabeza con el título
  grande, el bloque «título a un lado y contenido al otro», las filas con líneas finas y el
  siguiente paso al final. Página clara; el pie pone la banda oscura de invitación.
*/

type Volver = { href: string; etiqueta: string };

/** Cabeza de página: título grande, una línea de apoyo y, si hace falta, acciones. */
export function CabezaPagina({ titulo, entrada, volver, chico = false, children }: { titulo: React.ReactNode; entrada?: React.ReactNode; volver?: Volver; chico?: boolean; children?: React.ReactNode }) {
  return (
    <header className="s-contenedor s-cabeza">
      {volver && <Link href={volver.href} className="s-volver"><span aria-hidden="true">←</span>{volver.etiqueta}</Link>}
      <div className="s-cabeza-fila">
        <h1 className={chico ? "s-cabeza-titulo s-cabeza-titulo-chico" : "s-cabeza-titulo"}>{titulo}</h1>
        {(entrada || children) && (
          <div className="s-cabeza-lado">
            {entrada && <p className="s-entrada">{entrada}</p>}
            {children && <div className="s-acciones">{children}</div>}
          </div>
        )}
      </div>
    </header>
  );
}

/** Bloque con el título a la izquierda y el contenido a la derecha (se apilan en el teléfono). */
export function Bloque({ id, titulo, apoyo, children, className }: { id: string; titulo: React.ReactNode; apoyo?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={["s-contenedor s-bloque", className ?? ""].filter(Boolean).join(" ")} aria-labelledby={`${id}-titulo`}>
      <div className="s-bloque-cabeza">
        <h2 id={`${id}-titulo`} className="s-h2">{titulo}</h2>
        {apoyo && <p className="s-entrada">{apoyo}</p>}
      </div>
      <div className="s-bloque-cuerpo">{children}</div>
    </section>
  );
}

type Fila = { titulo: React.ReactNode; texto?: React.ReactNode };

/** Filas de dato y explicación con líneas finas. `ordenadas` usa una lista numerada (sin números a la vista). */
export function Filas({ filas, ordenadas = false }: { filas: readonly Fila[]; ordenadas?: boolean }) {
  const Lista = ordenadas ? "ol" : "ul";
  return (
    <Lista className="s-filas">
      {filas.map((fila, i) => (
        <li key={i}>
          <span className="s-filas-titulo">{fila.titulo}</span>
          {fila.texto && <span className="s-filas-texto">{fila.texto}</span>}
        </li>
      ))}
    </Lista>
  );
}

/** Nota pequeña al pie de un bloque, con enlace. */
export function Nota({ children }: { children: React.ReactNode }) {
  return <p className="s-nota">{children}</p>;
}

type Pregunta = { id?: string; q: string; a: React.ReactNode; enlace?: { href: string; label: string } };

/** Preguntas que se abren con un toque (detalles nativos: teclado y lector de pantalla sin código). */
export function Preguntas({ preguntas }: { preguntas: readonly Pregunta[] }) {
  return (
    <div className="s-preguntas">
      {preguntas.map((p) => (
        <details key={p.id ?? p.q} id={p.id} className="s-pregunta">
          <summary>
            <span>{p.q}</span>
            <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </summary>
          <div className="s-pregunta-respuesta">
            <p>{p.a}</p>
            {p.enlace && <Link href={p.enlace.href} className="s-enlace">{p.enlace.label}</Link>}
          </div>
        </details>
      ))}
    </div>
  );
}

/** Siguiente paso al final de la página: título y acciones, sobre una línea. */
export function SiguientePaso({ id, titulo, texto, children }: { id: string; titulo: React.ReactNode; texto?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="s-contenedor s-siguiente" aria-labelledby={id}>
      <div className="s-siguiente-texto">
        <h2 id={id} className="s-h2">{titulo}</h2>
        {texto && <p className="s-entrada">{texto}</p>}
      </div>
      <div className="s-acciones">{children}</div>
    </section>
  );
}
