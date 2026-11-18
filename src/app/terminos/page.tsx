import type { Metadata } from "next";
import Link from "next/link";

import { DatosLineas } from "@/components/sitio/lineas";
import { CabezaPagina } from "@/components/sitio/pagina";
import { SITE_TERMS } from "@/data/site-terms";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "../avisos/avisos-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/terminos",
  title: "Términos y condiciones",
  description:
    "Términos de uso de Fortius Inmuebles: publicaciones, solicitudes, herramientas, contratación y canales de aclaración.",
});

/*
  Términos y condiciones, rediseño del sitio (etapa 5, 17/11/2026): el mismo texto con un índice fijo al
  lado (arriba en el teléfono) y lectura de 720 px.
*/
export default function TerminosPage() {
  return (
    <main className="s-pagina">
      <CabezaPagina chico titulo="Términos y condiciones." entrada={<>Versión vigente desde el <time dateTime={SITE_TERMS.effectiveDate}>{SITE_TERMS.dateLabel}</time>.</>} />
      <div className="s-contenedor lg">
        <nav aria-label="Contenido de los términos" className="lg-indice">
          <ol>
            {SITE_TERMS.sections.map((seccion, i) => <li key={seccion.id}><a href={`#${seccion.id}`}>{i + 1}. {seccion.title}</a></li>)}
          </ol>
        </nav>
        <article className="s-prosa">
          <DatosLineas className="lg-datos" filas={[
            { dato: "Responsable del sitio", valor: `${SITE_TERMS.responsible} · ${SITE_TERMS.commercialName}` },
            { dato: "Lugar de atención", valor: `${SITE_TERMS.location}. La atención se coordina previamente por correo.` },
            { dato: "Correo para contacto y aclaraciones", valor: <a href={`mailto:${SITE_TERMS.email}`}>{SITE_TERMS.email}</a> },
          ]} />
          {SITE_TERMS.sections.map((seccion, i) => (
            <section key={seccion.id} id={seccion.id} aria-labelledby={`${seccion.id}-title`}>
              <h2 id={`${seccion.id}-title`}>{i + 1}. {seccion.title}</h2>
              {seccion.paragraphs.map((p) => <p key={p}>{p}</p>)}
              {seccion.id === "datos" && <p><Link href="/privacidad">Consultar el aviso de privacidad</Link>.</p>}
              {seccion.id === "aclaraciones" && <p><a href={`mailto:${SITE_TERMS.email}`}>{SITE_TERMS.email}</a></p>}
            </section>
          ))}
          <div className="lg-pie">
            <Link href="/" className="s-enlace">Volver al inicio</Link>
            <a href="#" className="s-enlace s-enlace-subrayado">Volver arriba</a>
          </div>
        </article>
      </div>
    </main>
  );
}
