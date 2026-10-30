import type { Metadata } from "next";
import Link from "next/link";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/comprar-propiedad" },
  title: "Guía para comprar un inmueble",
  description: routePages.comprar.description,
};

const STEPS = [
  { title: "Documentos", text: "Qué revisar antes de apartar o firmar." },
  { title: "Gastos", text: "Lo que se suma al precio de compra." },
  { title: "Forma de pago", text: "Contado o crédito, y cuánto cuesta cada uno." },
  { title: "Oferta y firma", text: "Del acuerdo por escrito a la entrega de llaves." },
];

const DOCUMENTS = [
  { title: "Escritura y titularidad", text: "Que quien vende sea el propietario y que el inmueble esté inscrito a su nombre." },
  { title: "Libertad de gravamen", text: "Certificado vigente que indica si el inmueble tiene hipotecas, embargos u otras cargas." },
  { title: "Predial, agua y luz", text: "Recibos al corriente. Cualquier adeudo debe aclararse antes de firmar." },
  { title: "Uso de suelo y permisos", text: "Que el uso que piensas darle sea compatible y que las construcciones cuenten con sus permisos." },
  { title: "Superficies", text: "Que la escritura, el catastro y lo que ves en el inmueble coincidan." },
  { title: "Cuotas y reglamento", text: "En condominios y fraccionamientos, cuotas de mantenimiento al corriente y reglamento interno." },
];

const COSTS = [
  { title: "Impuesto de adquisición (ISAI)", text: "Se paga al municipio por adquirir el inmueble. Depende del valor de la operación y del municipio." },
  { title: "Honorarios notariales", text: "Por preparar y formalizar la escritura. Se cotizan con la notaría que elijas." },
  { title: "Derechos de registro", text: "Por inscribir la escritura en el Registro Público de la Propiedad." },
  { title: "Avalúo", text: "Determina el valor del inmueble. Lo solicita el banco cuando hay crédito." },
  { title: "Gastos del crédito", text: "Comisión de apertura, seguros y otros cargos que fije la institución financiera." },
  { title: "Honorarios de la inmobiliaria", text: "Si aplican, deben quedar por escrito antes de avanzar, con su monto y condiciones." },
];

const PAYMENT = [
  { title: "De contado", text: "Necesitas el precio y los gastos de la operación. Es la forma más directa de cerrar." },
  { title: "Crédito bancario", text: "El banco evalúa tu capacidad de pago y solicita un avalúo. La mensualidad depende del plazo y la tasa." },
  { title: "Infonavit o Fovissste", text: "Si cuentas con una subcuenta de vivienda, puedes consultar cuánto crédito te corresponde. Sujeto a aprobación de la institución." },
];

const CLOSING = [
  { title: "Oferta por escrito", text: "Precio, forma de pago, plazos y condiciones, antes de apartar." },
  { title: "Apartado y contrato", text: "Se formaliza el compromiso de compra y venta, con sus penalidades y fechas." },
  { title: "Revisión final", text: "Se confirman los documentos, los pagos pendientes y el estado del inmueble." },
  { title: "Firma ante notario", text: "Se firma la escritura y se pagan impuestos y honorarios." },
  { title: "Registro y entrega", text: "Se inscribe la escritura y se entregan llaves e inventario." },
];

/* Guía para compradores: documentos, gastos, forma de pago y pasos al cierre; termina en el inventario. */
export default function ComprarInmueblePage() {
  return <main className="pg-page">
    <InteriorPage {...routePages.comprar} eyebrow="Para compradores" title="Antes de comprar, esto es lo que debes saber."
      description="Comprar bien empieza por revisar los documentos y conocer todos los gastos, no solo el precio."
      primary={{ href: "/inventario", label: "Explorar inventario" }} secondary={{ href: "/herramientas/gastos-de-cierre", label: "Calcular gastos de cierre" }}
      aside={<ol className="ip-steps" aria-label="Qué cubre esta guía">
        {STEPS.map((step, index) => <li key={step.title} className={index === 0 ? "is-current" : undefined}>
          <span className="ip-step-dot" aria-hidden="true" /><span className="ip-step-number">0{index + 1}</span>
          <strong>{step.title}</strong><span>{step.text}</span>
        </li>)}
      </ol>} />

    <section id="documentos" className="pg-container pg-section" aria-labelledby="gd-documentos">
      <h2 id="gd-documentos" className="pg-h2">Revisa la documentación.</h2>
      <p className="pg-lead pg-lead-ink">Pídela antes de apartar. Lo que falte o no coincida cambia el precio, el crédito o la fecha de cierre.</p>
      <ul className="pg-grid-3 gd-cards">
        {DOCUMENTS.map(item => <li key={item.title} className="pg-card pg-card-pad">
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ul>
      <p className="gd-note">Si el estado civil de quien vende o la forma en que adquirió el inmueble lo requieren, puede hacer falta la firma de más personas. <Link href="/due-diligence-inmobiliaria" className="editorial-text-link">Conoce nuestra revisión documental</Link>.</p>
    </section>

    <section id="gastos" className="pg-container pg-section" aria-labelledby="gd-gastos">
      <h2 id="gd-gastos" className="pg-h2">Lo que se suma al precio.</h2>
      <p className="pg-lead pg-lead-ink">Al precio del inmueble súmale los gastos de la operación. Conocerlos desde el principio evita sorpresas el día de la firma.</p>
      <ul className="gd-list">
        {COSTS.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}
      </ul>
      <p className="gd-note">Los importes dependen de cada operación y se confirman con la notaría y con cada institución. La calculadora te da una referencia inicial. <Link href="/herramientas/gastos-de-cierre" className="editorial-text-link">Estimar mis gastos de cierre</Link>.</p>
    </section>

    <section id="pago" className="pg-container pg-section" aria-labelledby="gd-pago">
      <h2 id="gd-pago" className="pg-h2">Define cómo vas a pagar.</h2>
      <ul className="pg-grid-3 gd-cards">
        {PAYMENT.map(item => <li key={item.title} className="pg-card pg-card-pad">
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ul>
      <p className="gd-note">Las condiciones del crédito las confirma la institución financiera. <Link href="/herramientas/hipoteca" className="editorial-text-link">Estimar mi mensualidad</Link>.</p>
    </section>

    <section id="cierre" className="pg-container pg-section" aria-labelledby="gd-cierre">
      <h2 id="gd-cierre" className="pg-h2">De la oferta a las llaves.</h2>
      <ol className="gd-list gd-steps">
        {CLOSING.map((item, index) => <li key={item.title}><strong><span aria-hidden="true">0{index + 1}</span> {item.title}</strong><span>{item.text}</span></li>)}
      </ol>
      <p className="gd-note">Cada operación puede variar según el inmueble, la forma de pago y las partes. ¿Tienes dudas? Revisa las <Link href="/preguntas-frecuentes" className="editorial-text-link">preguntas frecuentes</Link>.</p>
    </section>

    <section className="pg-container pg-section pg-section-last" aria-labelledby="gd-cta">
      <div className="pg-card pg-card-wine pg-card-pad gd-cta">
        <div>
          <h2 id="gd-cta" className="pg-h2">Cuando estés listo, explora el inventario.</h2>
          <p className="pg-muted">Cada ficha muestra las características, la documentación disponible y cómo pedir una visita.</p>
        </div>
        <div className="gd-cta-actions">
          <Link href="/inventario" className="pg-btn pg-btn-light">Explorar inventario</Link>
          <Link href="/contacto" className="gd-cta-link">Hablar con un asesor</Link>
        </div>
      </div>
    </section>
  </main>;
}
