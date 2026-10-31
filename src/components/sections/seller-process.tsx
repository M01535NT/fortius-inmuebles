import { FileText } from "lucide-react";

const stages = [
  { title: "Quién vende", text: "Confirmamos al propietario y sus documentos.", doc: "Análisis de factibilidad" },
  { title: "Qué se ofrece", text: "Medidas y estado del inmueble, con su fuente.", doc: "Ficha con fuentes" },
  { title: "Precio", text: "Una opinión de precio con evidencia de mercado.", doc: "Opinión de valor" },
  { title: "Publicación", text: "Canales, visitas y seguimiento con fechas.", doc: "Plan de comercialización" },
];

/* Vender (30/10/2026): cuatro pasos en columnas; cada uno en una línea y con el documento que recibes. */
export function SellerProcess() {
  return (
    <section id="pasos" className="pg-container vd-section" aria-labelledby="seller-process">
      <p className="pg-eyebrow pg-eyebrow-ink">Cómo funciona</p>
      <h2 id="seller-process" className="pg-h2">Cuatro pasos antes de publicar.</h2>
      <ol className="sp-steps">
        {stages.map((stage, index) => (
          <li key={stage.title} id={index === 2 ? "precio-y-condiciones" : undefined} className="sp-step">
            <span className="sp-step-number" aria-hidden="true">0{index + 1}</span>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
            <span className="sp-step-doc"><FileText size={16} aria-hidden="true" /><span className="sr-only">Recibes: </span>{stage.doc}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
