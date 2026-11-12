import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BuscadorPropiedades } from "@/components/home/nocturno-extras";
import { NocturnoDestacadas } from "@/components/home/nocturno-sections";
import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";
import { getFeaturedProperties, getPropiedades } from "@/lib/inventario";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/comprar-propiedad",
  title: "Guía para comprar casa en Tijuana",
  description:
    "Antes de comprar casa en Tijuana revisa escritura, gravámenes, predial y uso de suelo. Te decimos qué pedir, cuánto cuesta el cierre y cómo evitar sorpresas.",
});

const DOCUMENTS = [
  { title: "Escritura y titularidad", text: "Que quien vende sea el dueño inscrito." },
  { title: "Libertad de gravamen", text: "Si tiene hipotecas, embargos u otras cargas." },
  { title: "Predial, agua y luz", text: "Al corriente antes de firmar." },
  { title: "Uso de suelo y permisos", text: "Uso permitido y construcción con permisos." },
  { title: "Superficies", text: "Que escritura, catastro y realidad coincidan." },
  { title: "Cuotas y reglamento", text: "En condominio: cuotas al corriente y reglamento." },
];

const COSTS = [
  { title: "Impuesto de adquisición (ISAI)", text: "Al municipio. Depende del valor y del municipio." },
  { title: "Honorarios notariales", text: "Por la escritura. Los cotiza tu notaría." },
  { title: "Derechos de registro", text: "Inscripción en el Registro Público." },
  { title: "Avalúo", text: "Lo pide el banco si hay crédito." },
  { title: "Gastos del crédito", text: "Apertura, seguros y cargos del banco." },
  { title: "Honorarios de la inmobiliaria", text: "Si aplican, por escrito antes de avanzar." },
];

const PAYMENT = [
  { title: "De contado", text: "Precio más gastos. El cierre más directo." },
  { title: "Crédito bancario", text: "El banco evalúa tu capacidad y pide avalúo." },
  { title: "Infonavit o Fovissste", text: "Con tu subcuenta de vivienda, sujeto a aprobación." },
];

const CLOSING = [
  { title: "Oferta por escrito", text: "Precio, pago y plazos." },
  { title: "Apartado y contrato", text: "Compromiso con fechas y penalidades." },
  { title: "Revisión final", text: "Documentos, pagos y estado del inmueble." },
  { title: "Firma ante notario", text: "Escritura, impuestos y honorarios." },
  { title: "Registro y entrega", text: "Inscripción, llaves e inventario." },
];

/*
  Guía para compradores: el buscador arriba (para quien ya sabe qué quiere), luego
  documentos, gastos, forma de pago y pasos al cierre; al final, las propiedades actuales.
*/
export default async function ComprarInmueblePage() {
  const [propiedades, destacadas] = await Promise.all([getPropiedades(), getFeaturedProperties()]);
  return <main className="pg-page">
    <InteriorPage {...routePages.comprar} bullets={[]} title="Compra sin sorpresas."
      description="Documentos y gastos, antes del precio."
      primary={{ href: "/inventario", label: "Explorar inventario" }} secondary={{ href: "/herramientas/gastos-de-cierre", label: "Calcular gastos de cierre" }}
      media={{ src: "/hero/que-hacemos-comprar.webp", alt: "Sala luminosa de un departamento con vista a la ciudad" }} />

    <div className="pg-container gd-search-wrap">
      <BuscadorPropiedades properties={propiedades} className="nx-search gd-search" />
    </div>

    <section id="documentos" className="pg-container pg-section" aria-labelledby="gd-documentos">
      <h2 id="gd-documentos" className="pg-h2">Revisa la documentación.</h2>
      <p className="pg-lead pg-lead-ink">Antes de apartar. Lo que falte cambia precio, crédito o fecha.</p>
      <ul className="pg-grid-3 gd-cards">
        {DOCUMENTS.map(item => <li key={item.title} className="pg-card pg-card-pad">
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ul>
      <p className="gd-note">Según el estado civil de quien vende, pueden firmar más personas. <Link href="/#revision" className="editorial-text-link">Conoce nuestra revisión documental</Link>.</p>
    </section>

    <section id="gastos" className="pg-container pg-section" aria-labelledby="gd-gastos">
      <h2 id="gd-gastos" className="pg-h2">Lo que se suma al precio.</h2>
      <p className="pg-lead pg-lead-ink">Conócelos antes de la firma.</p>
      <ul className="gd-list">
        {COSTS.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}
      </ul>
      <p className="gd-note">La notaría y el banco confirman los importes. <Link href="/herramientas/gastos-de-cierre" className="editorial-text-link">Estimar mis gastos de cierre</Link>.</p>
    </section>

    <section id="pago" className="pg-container pg-section" aria-labelledby="gd-pago">
      <h2 id="gd-pago" className="pg-h2">Define cómo vas a pagar.</h2>
      <ul className="pg-grid-3 gd-cards">
        {PAYMENT.map(item => <li key={item.title} className="pg-card pg-card-pad">
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ul>
      <p className="gd-note">La institución confirma las condiciones. <Link href="/herramientas/hipoteca" className="editorial-text-link">Estimar mi mensualidad</Link>.</p>
    </section>

    <section id="cierre" className="pg-container pg-section" aria-labelledby="gd-cierre">
      <div className="pg-split">
        <div>
          <h2 id="gd-cierre" className="pg-h2">De la oferta a las llaves.</h2>
          <ol className="gd-list gd-steps">
            {CLOSING.map((item, index) => <li key={item.title}><strong><span aria-hidden="true">0{index + 1}</span> {item.title}</strong><span>{item.text}</span></li>)}
          </ol>
        </div>
        <figure className="pg-split-media"><Image src="/hero/etapa-04-cerramos.webp" alt="Llaves sobre un contrato firmado" fill sizes="(max-width: 1023px) 100vw, 40vw" /></figure>
      </div>
      <p className="gd-note">¿Dudas? Revisa las <Link href="/preguntas-frecuentes" className="editorial-text-link">preguntas frecuentes</Link>.</p>
    </section>

    <div className="nocturno-home gd-destacadas"><NocturnoDestacadas properties={destacadas} /></div>

    <section className="pg-container pg-section pg-section-last" aria-labelledby="gd-cta">
      <div className="pg-card pg-card-wine pg-card-pad gd-cta">
        <div>
          <h2 id="gd-cta" className="pg-h2">¿Buscas algo que no está aquí?</h2>
          <p className="pg-muted">Dinos qué buscas y con qué presupuesto.</p>
        </div>
        <div className="gd-cta-actions">
          <Link href="/contacto" className="pg-btn pg-btn-light">Hablar con un asesor</Link>
          <Link href="/inventario" className="gd-cta-link">Ver todo el inventario</Link>
        </div>
      </div>
    </section>
  </main>;
}
