import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { InteriorPage } from "@/components/sections/interior-page";

export const metadata: Metadata = {
  alternates: { canonical: "/opinion-de-valor" },
  title: "Opinión de valor",
  description: "La opinión de valor se entrega dentro de nuestro método, después de la entrevista, el levantamiento y la revisión de documentos. No sustituye un avalúo.",
};

/* El procedimiento del titular (30/10/2026): sin estos pasos no se entrega opinión de valor. */
const STEPS = [
  { title: "Entrevista inicial", text: "Nos cuentas del inmueble y qué esperas." },
  { title: "Levantamiento", text: "Visitamos, medimos y fotografiamos." },
  { title: "Documentos", text: "Reunimos y revisamos el checklist completo." },
  { title: "Dictamen y precio", text: "Factibilidad jurídica y opinión de valor comercial." },
];

const INCLUDES = [
  { title: "Propiedades comparables", text: "Inmuebles parecidos al tuyo." },
  { title: "Fuentes de la información", text: "De dónde sale cada dato." },
  { title: "Rango de precio propuesto", text: "Precio de salida y margen para negociar." },
  { title: "Límites de la información", text: "Qué falta confirmar y cómo cambiaría el precio." },
];

/*
  Qué es la opinión de valor y cómo se llega a ella. No se solicita por separado:
  es parte del método y se entrega junto con el dictamen de factibilidad.
*/
export default function OpinionDeValorPage() {
  return <main className="pg-page">
    <InteriorPage title="El precio sale de revisar tu propiedad."
      description="Es parte del método: llega con el dictamen de factibilidad, después de conocer el inmueble."
      bullets={[]}
      primary={{ href: "/vender-propiedad#diagnostico", label: "Agendar entrevista" }} secondary={{ href: "/vender-propiedad#pasos", label: "Ver el método" }}
      aside={<ol className="ip-steps" aria-label="Cómo llegamos al precio">
        {STEPS.map((step, index) => <li key={step.title} className={index === STEPS.length - 1 ? "is-current" : undefined}>
          <span className="ip-step-dot" aria-hidden="true" /><span className="ip-step-number">0{index + 1}</span>
          <strong>{step.title}</strong><span>{step.text}</span>
        </li>)}
      </ol>} />

    <section className="pg-container pg-section" aria-labelledby="ov-incluye">
      <div className="pg-split pg-split-reverse">
        <div>
          <h2 id="ov-incluye" className="pg-h2">Qué incluye.</h2>
          <ul className="gd-list">
            {INCLUDES.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}
          </ul>
        </div>
        <figure className="pg-split-media"><Image src="/hero/etapa-02-precio.webp" alt="Cinta métrica sobre un plano" fill sizes="(max-width: 1023px) 100vw, 40vw" /></figure>
      </div>
    </section>

    <section className="pg-container pg-section" aria-labelledby="ov-limites">
      <h2 id="ov-limites" className="pg-h2">Qué no es.</h2>
      <p className="pg-lead pg-lead-ink">Es informativa. No es un avalúo ni tiene efectos fiscales, hipotecarios ni judiciales.</p>
      <p className="gd-note">Para crédito, trámite fiscal o juicio se necesita un avalúo de perito registrado; te decimos cuándo y lo coordinamos. Su vigencia depende del mercado y de la información disponible.</p>
    </section>

    <section className="pg-container pg-section pg-section-last" aria-labelledby="ov-cta">
      <div className="pg-card pg-card-wine pg-card-pad gd-cta">
        <div>
          <h2 id="ov-cta" className="pg-h2">Todo empieza con la entrevista.</h2>
          <p className="pg-muted">Sin entrevista, levantamiento y documentos no hay opinión de valor.</p>
        </div>
        <div className="gd-cta-actions">
          <Link href="/vender-propiedad#diagnostico" className="pg-btn pg-btn-light">Agendar entrevista</Link>
          <Link href="/contacto" className="gd-cta-link">Hablar con un asesor</Link>
        </div>
      </div>
    </section>
  </main>;
}
