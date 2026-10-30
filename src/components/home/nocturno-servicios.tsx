import Link from "next/link";
import { ArrowRight } from "lucide-react";

/*
  Inicio · lo que hacemos antes de publicar y cómo se promueve una propiedad.
  Sin cifras, plazos ni honorarios; los ejemplos van rotulados y el alcance de lo que se prepara
  se acuerda en el contrato. La opinión de valor no se presenta como avalúo.
*/

const REVIEW_ROWS: { title: string; status: "ok" | "pending" | "expert"; label: string }[] = [
  { title: "Titularidad", status: "ok", label: "Revisado" },
  { title: "Gravámenes", status: "pending", label: "Pendiente" },
  { title: "Predial, agua y luz", status: "ok", label: "Revisado" },
  { title: "Uso de suelo y permisos", status: "expert", label: "Especialista" },
  { title: "Superficies", status: "pending", label: "Pendiente" },
];

/* Revisión documental: una de las cosas que se hacen antes de captar y publicar. */
export function NocturnoRevision() {
  return <section id="revision" aria-labelledby="revision-title" className="nx-section nx-container">
    <div className="nx-split">
      <div>
        <h2 id="revision-title" className="nx-title">Primero, revisamos lo que vas a vender.</h2>
        <p className="nx-lead">Antes de captar una propiedad revisamos la documentación del inmueble. Es una de varias cosas que hacemos antes de publicar, junto con la opinión de valor y la preparación para promoverla.</p>
        <ul className="nx-checks">
          <li>Quién puede vender y con qué documentos.</li>
          <li>Gravámenes, predial, agua y luz.</li>
          <li>Uso de suelo, permisos y superficies.</li>
        </ul>
        <Link href="/vender-propiedad#diagnostico" className="nx-link">Contarnos mi caso <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
      <div className="nx-report" role="group" aria-label="Reporte de revisión de ejemplo">
        <p className="nx-report-head">Reporte de revisión <span>(ejemplo)</span></p>
        <ul>
          {REVIEW_ROWS.map((row) => <li key={row.title} className={`is-${row.status}`}>
            <span>{row.title}</span>
            <span className="nx-report-status"><i aria-hidden="true" />{row.label}</span>
          </li>)}
        </ul>
        <p className="nx-report-foot">Los datos son ilustrativos. Cada reporte incluye una recomendación de siguiente paso.</p>
      </div>
    </div>
  </section>;
}

const VALUE_STEPS = [
  { title: "Conocemos el inmueble", text: "Ubicación, superficies, características y estado." },
  { title: "Buscamos comparables", text: "Inmuebles parecidos al tuyo en zona, tamaño y condiciones." },
  { title: "Explicamos las fuentes", text: "De dónde sale cada dato y cuáles quedan por confirmar." },
  { title: "Proponemos un rango", text: "Un precio de salida y el margen para negociar." },
  { title: "Lo acordamos contigo", text: "Tú decides el precio al que se publica." },
];

/* Opinión de valor y el proceso para obtenerla. */
export function NocturnoOpinion() {
  return <section id="opinion" aria-labelledby="opinion-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="opinion-title" className="nx-title">Cuánto vale tu propiedad, con datos.</h2>
        <p className="nx-lead">La opinión de valor propone un precio de salida con inmuebles comparables y fuentes explicadas. Así la preparamos.</p>
      </div>
    </div>
    <ol className="nx-steps">
      {VALUE_STEPS.map((step, index) => <li key={step.title}>
        <span className="nx-step-n" aria-hidden="true">0{index + 1}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </li>)}
    </ol>
    <p className="nx-note">Es una opinión informativa, no un avalúo: no tiene efectos fiscales, hipotecarios ni judiciales.</p>
    <div className="nx-actions">
      <Link href="/vender-propiedad#diagnostico" className="nx-btn nx-btn-primary">Pedir mi opinión de valor <ArrowRight size={18} aria-hidden="true" /></Link>
      <Link href="/opinion-de-valor" className="nx-btn">Cómo se hace</Link>
    </div>
  </section>;
}

const PROMOTION = [
  { title: "Fotografía", text: "Imágenes del inmueble para la ficha y los anuncios." },
  { title: "Video", text: "Un recorrido en video del inmueble y su entorno." },
  { title: "Recorrido 360", text: "Para que el interesado lo conozca a distancia." },
  { title: "Página de la propiedad", text: "Ficha pública con características, mapa y ficha técnica en PDF." },
  { title: "Presentación y plan de comercialización", text: "Dónde, cómo y cuándo se promueve." },
  { title: "Informes de seguimiento", text: "Consultas, visitas y ofertas que se reciben." },
];

/* Lo que se prepara para promover una propiedad. */
export function NocturnoPromocion() {
  return <section id="promocion" aria-labelledby="promocion-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="promocion-title" className="nx-title">Cómo presentamos tu propiedad al mercado.</h2>
        <p className="nx-lead">Esto es lo que preparamos para promoverla, según el inmueble y lo que acordemos en el contrato.</p>
      </div>
    </div>
    <ul className="nx-feats">
      {PROMOTION.map((item) => <li key={item.title}>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </li>)}
    </ul>
  </section>;
}
