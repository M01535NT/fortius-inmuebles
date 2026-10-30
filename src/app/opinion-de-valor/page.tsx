import type { Metadata } from "next";
import Link from "next/link";

import { InteriorPage } from "@/components/sections/interior-page";

export const metadata: Metadata = {
  alternates: { canonical: "/opinion-de-valor" },
  title: "Opinión de valor",
  description: "Una opinión de valor propone un precio de salida con propiedades comparables, fuentes y límites. No sustituye un avalúo.",
};

const INCLUDES = [
  { title: "Propiedades comparables", text: "Inmuebles parecidos al tuyo en zona, superficie, características y estado." },
  { title: "Fuentes de la información", text: "De dónde sale cada dato y cuáles quedan por confirmar." },
  { title: "Rango de precio propuesto", text: "Un precio de salida y el margen razonable para negociar." },
  { title: "Límites de la información", text: "Qué datos faltan por confirmar y cómo podrían cambiar la propuesta." },
];

const NEEDS = [
  "Ubicación y tipo de inmueble.",
  "Superficies de terreno y construcción.",
  "Características y estado de conservación.",
  "Los documentos que tengas a la mano, como escritura y predial.",
];

/* Qué es una opinión de valor, qué incluye y qué no sustituye. */
export default function OpinionDeValorPage() {
  return <main className="pg-page">
    <InteriorPage eyebrow="Para propietarios" title="Conoce con qué precio salir al mercado."
      description="La opinión de valor propone un precio de salida con inmuebles comparables, fuentes y límites explicados. Sirve para decidir con información."
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
      <p className="pg-lead pg-lead-ink">Una opinión de valor es informativa y ayuda a fijar el precio de salida. No es un avalúo y no tiene efectos fiscales, hipotecarios ni judiciales.</p>
      <p className="gd-note">Si necesitas un avalúo para un crédito, un trámite fiscal o un juicio, lo elabora un perito valuador registrado. Te indicamos cuándo conviene solicitarlo y lo coordinamos contigo. La vigencia de la opinión depende de las condiciones del mercado y de la información disponible en ese momento.</p>
    </section>

    <section className="pg-container pg-section pg-section-last" aria-labelledby="ov-cta">
      <div className="pg-card pg-card-wine pg-card-pad gd-cta">
        <div>
          <h2 id="ov-cta" className="pg-h2">Empieza contándonos tu caso.</h2>
          <p className="pg-muted">Con la ubicación y el tipo de inmueble te decimos qué documentos necesitamos para preparar tu opinión.</p>
        </div>
        <div className="gd-cta-actions">
          <Link href="/vender-propiedad#diagnostico" className="pg-btn pg-btn-light">Solicitar mi opinión de valor</Link>
          <Link href="/contacto" className="gd-cta-link">Hablar con un asesor</Link>
        </div>
      </div>
    </section>
  </main>;
}
