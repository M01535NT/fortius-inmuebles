import type { Metadata } from "next";

import { Boton } from "@/components/sitio/boton";
import { CabezaPagina } from "@/components/sitio/pagina";
import { notices, noticeContent } from "@/lib/public-notices";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./avisos-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/avisos",
  title: "Avisos y documentos",
  description:
    "Consulta y descarga privacidad, derechos del consumidor, no discriminación, términos, honorarios y canales de atención de Fortius Inmuebles.",
});

const EN_LINEA = ["derechos", "no-discriminacion"];

/*
  Avisos, rediseño del sitio (etapa 5, 17/11/2026): los documentos en filas con líneas, cada uno con
  «Consultar» y «Descargar PDF». Los dos que no tienen página propia se leen aquí mismo.
*/
export default function AvisosPage() {
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="Información para tener a la mano." entrada="Consulta nuestros documentos o guarda una copia en PDF." />
      <section className="s-contenedor av" aria-label="Documentos">
        <ul className="av-lista">
          {notices.map((aviso) => {
            const enLinea = EN_LINEA.includes(aviso.id);
            return (
              <li key={aviso.id} id={aviso.id} className="av-fila">
                <div className="av-texto">
                  <h2 className="av-titulo">{aviso.title}</h2>
                  <p className="s-apoyo">{aviso.description}</p>
                </div>
                <div className="s-acciones">
                  {!enLinea && <Boton href={aviso.href} variante="contorno" tamano="chico">Consultar</Boton>}
                  <a href={`/avisos/${aviso.id}.pdf`} download className="s-btn s-btn-contorno s-btn-chico">Descargar PDF</a>
                </div>
                {enLinea && (
                  <details className="av-lectura">
                    <summary>Leer documento</summary>
                    <div className="s-prosa">
                      {noticeContent(aviso.id)!.sections.map((seccion) => (
                        <section key={seccion.title}>
                          <h3>{seccion.title}</h3>
                          {seccion.paragraphs.map((p) => <p key={p}>{p}</p>)}
                        </section>
                      ))}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
