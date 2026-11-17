import type { Metadata } from "next";

import { EnlaceFlecha } from "@/components/sitio/boton";
import { CabezaPagina } from "@/components/sitio/pagina";
import { privacyNotice } from "@/data/privacy-notice";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "../avisos/avisos-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/privacidad",
  title: "Aviso de privacidad",
  description:
    "Responsable, tratamiento de datos, derechos y decisiones de consentimiento de Fortius Inmuebles.",
});

/* Aviso de privacidad, Fortius II (etapa 5, 17/11/2026): el mismo texto en lectura de 720 px. */
export default function PrivacidadPage() {
  return (
    <main className="s-pagina">
      <CabezaPagina chico titulo="Aviso de privacidad." volver={{ href: "/avisos", etiqueta: "Avisos" }}>
        <a href="/avisos/privacidad.pdf" download className="s-btn s-btn-contorno">Descargar PDF</a>
      </CabezaPagina>
      <div className="s-contenedor lg lg-sin-indice">
        <div className="s-prosa">
          {privacyNotice.sections.map((seccion) => (
            <section key={seccion.title}>
              <h2>{seccion.title}</h2>
              {seccion.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ))}
          <div className="lg-pie"><EnlaceFlecha href="/avisos">Volver a Avisos</EnlaceFlecha></div>
        </div>
      </div>
    </main>
  );
}
