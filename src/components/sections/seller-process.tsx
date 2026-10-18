import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

const stages = [
  { title: "Quién puede vender", text: "Confirmamos quién es el propietario o representante y qué documentos respaldan el encargo. Si falta algo, lo señalamos antes de anunciar.", doc: "Análisis de factibilidad" },
  { title: "Qué se está ofreciendo", text: "Contrastamos superficies, estado observable y características con la fuente disponible. La ficha distingue los datos confirmados de los pendientes.", doc: "Ficha con fuentes" },
  { title: "Precio y condiciones", text: "Preparamos una opinión de precio con la evidencia que exista y acordamos publicación, visitas y condiciones de entrega contigo.", doc: "Opinión de valor" },
  { title: "Publicación y seguimiento", text: "Canales y acciones definidos contigo, con fechas. Durante la venta acordamos cómo darte seguimiento a visitas y ofertas.", doc: "Plan de comercialización" },
];

/* Boceto Vender: línea de tiempo vertical con lo que recibes en cada etapa. */
export function SellerProcess() {
  return (
    <section className="pg-container pg-section" aria-labelledby="seller-process">
      <div className="pg-head">
        <div>
          <p className="pg-eyebrow pg-eyebrow-ink">Así trabajamos tu venta</p>
          <h2 id="seller-process" className="pg-h2">Antes de publicar.</h2>
        </div>
        <p className="pg-muted sp-intro">La primera conversación sirve para ubicar los pendientes. La publicación se prepara cuando el inmueble, el encargo y la información que podemos mostrar están claros.</p>
      </div>
      <ol className="sp-timeline">
        {stages.map((stage, index) => (
          <li key={stage.title} id={index === 2 ? "precio-y-condiciones" : undefined} className={"sp-stage" + (index === 0 ? " is-first" : "")}>
            <span className="sp-stage-marker" aria-hidden="true"><span>0{index + 1}</span><span className="sp-stage-line" /></span>
            <div className="sp-stage-body">
              <h3>{stage.title}</h3>
              <p className="pg-muted">{stage.text}</p>
              <span className="sp-stage-doc"><FileText size={16} aria-hidden="true" />Recibes: {stage.doc}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="pg-grid-2 sp-after">
        <div className="pg-card pg-card-pad">
          <h3 className="pg-h3">Lo que recibes</h3>
          <p className="pg-muted">Una respuesta sobre lo que ya puede avanzar, los pendientes que requieren atención y una propuesta de siguientes pasos.</p>
          <Link href="/#entregables" className="pg-link">Ver entregables del método <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="pg-card pg-card-pad">
          <h3 className="pg-h3">Si hay pendientes</h3>
          <p className="pg-muted">Te decimos cuáles afectan el precio, la promoción o el cierre y qué información se necesita para resolverlos. No tienes que adivinar si conviene anunciar de inmediato.</p>
          <Link href="/herramientas/gastos-de-cierre" className="pg-link">Estimar gastos y neto de venta <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
