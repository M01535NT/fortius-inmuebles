import type { Metadata } from "next";
import Link from "next/link";

import { InteriorPage } from "@/components/sections/interior-page";

export const metadata: Metadata = {
  alternates: { canonical: "/opinion-de-valor" },
  title: "Opinión de valor",
  description: "Una opinión de valor propone un precio de salida con propiedades comparables, fuentes y límites. No sustituye un avalúo.",
};

const INCLUDES = [
  { title: "Propiedades comparables", text: "Inmuebles parecidos al tuyo." },
  { title: "Fuentes de la información", text: "De dónde sale cada dato." },
  { title: "Rango de precio propuesto", text: "Precio de salida y margen para negociar." },
  { title: "Límites de la información", text: "Qué falta confirmar y cómo cambiaría el precio." },
];

const NEEDS = [
  "Ubicación y tipo de inmueble.",
  "Superficies de terreno y construcción.",
  "Características y estado de conservación.",
  "Escritura y predial, si los tienes.",
];

/* Qué es una opinión de valor, qué incluye y qué no sustituye. */
export default function OpinionDeValorPage() {
  return <main className="pg-page">
    <InteriorPage eyebrow="Para propietarios" title="Conoce con qué precio salir al mercado."
      description="Un precio de salida con comparables y fuentes a la vista."
      bullets={[]}
      primary={{ href: "/vender-propiedad#diagnostico", label: "Solicitar mi opinión de valor" }} secondary={{ href: "/preguntas-frecuentes", label: "Resolver dudas" }}
      aside={<div className="ip-criteria">
        <p className="pg-eyebrow">Qué necesitamos de ti</p>
        <ul>{NEEDS.map(item => <li key={item}>{item}</li>)}</ul>
      </div>} />

    <section className="pg-container pg-section" aria-labelledby="ov-incluye">
      <h2 id="ov-incluye" className="pg-h2">Qué incluye.</h2>
      <ul className="pg-grid-4 gd-cards">
        {INCLUDES.map(item => <li key={item.title} className="pg-card pg-card-pad">
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ul>
    </section>

    <section className="pg-container pg-section" aria-labelledby="ov-limites">
      <h2 id="ov-limites" className="pg-h2">Qué no es.</h2>
      <p className="pg-lead pg-lead-ink">Es informativa. No es un avalúo ni tiene efectos fiscales, hipotecarios ni judiciales.</p>
      <p className="gd-note">Para crédito, trámite fiscal o juicio se necesita un avalúo de perito registrado; te decimos cuándo y lo coordinamos. Su vigencia depende del mercado y de la información disponible.</p>
    </section>

    <section className="pg-container pg-section pg-section-last" aria-labelledby="ov-cta">
      <div className="pg-card pg-card-wine pg-card-pad gd-cta">
        <div>
          <h2 id="ov-cta" className="pg-h2">Empieza contándonos tu caso.</h2>
          <p className="pg-muted">Con ubicación y tipo de inmueble, te decimos qué documentos faltan.</p>
        </div>
        <div className="gd-cta-actions">
          <Link href="/vender-propiedad#diagnostico" className="pg-btn pg-btn-light">Solicitar mi opinión de valor</Link>
          <Link href="/contacto" className="gd-cta-link">Hablar con un asesor</Link>
        </div>
      </div>
    </section>
  </main>;
}
