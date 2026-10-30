import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type InteriorPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  /* Foto vertical a la derecha con los criterios como etiquetas encima. */
  media?: { src: string; alt: string };
  /* Bloque propio a la derecha (asistente, pasos, reporte); sustituye la lista. */
  aside?: ReactNode;
  className?: string;
};

/*
  Cabecera compartida de las rutas interiores, dirección «Nocturno»: banda
  oscura con el titular, la descripción y las acciones; a la derecha una foto,
  un bloque propio o la lista de criterios de trabajo.
*/
export function InteriorPage({ eyebrow, title, description, bullets, primary = { href: "/vender-propiedad", label: "Evaluar mi propiedad" }, secondary = { href: "/#metodo", label: "Conocer el método" }, media, aside, className = "" }: InteriorPageProps) {
  return (
    <section className={"pg-hero ip-hero " + className}>
      <div className="pg-container pg-hero-body">
        <div className="pg-hero-grid ip-grid">
          <div>
            <p className="pg-eyebrow">{eyebrow}</p>
            <h1 className="pg-title">{title}</h1>
            <p className="pg-lead">{description}</p>
            <div className="pg-pills ip-actions">
              <Link href={primary.href} className="pg-btn pg-btn-light">{primary.label}</Link>
              <Link href={secondary.href} className="pg-btn pg-btn-ghost">{secondary.label}</Link>
            </div>
          </div>
          {aside ? <div className="ip-aside">{aside}</div> : media ? (
            <figure className="ip-media">
              <Image src={media.src} alt={media.alt} fill priority sizes="(max-width: 1023px) 100vw, 40vw" />
              <figcaption className="ip-chips" aria-label="Criterios de trabajo">
                {bullets.map(bullet => <span key={bullet}>{bullet}</span>)}
              </figcaption>
            </figure>
          ) : (
            <div className="ip-criteria">
              <p className="pg-eyebrow">Criterios de trabajo</p>
              <ul>{bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
