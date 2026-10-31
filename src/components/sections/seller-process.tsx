import { FileText } from "lucide-react";

const stages = [
  { title: "Entrevista inicial", text: "Nos cuentas del inmueble y qué esperas.", doc: "Entrevista inicial" },
  { title: "Levantamiento", text: "Visitamos, medimos y fotografiamos.", doc: "Levantamiento" },
  { title: "Documentos", text: "Reunimos y revisamos el checklist.", doc: "Checklist de documentos" },
  { title: "Dictamen y precio", text: "Si se puede vender y en cuánto.", doc: "Factibilidad y opinión de valor" },
];

/* Vender (30/10/2026): el procedimiento del titular en cuatro pasos; la opinión de valor llega al final, con el dictamen. */
export function SellerProcess() {
  return (
    <section id="pasos" className="pg-container vd-section" aria-labelledby="seller-process">
      <p className="pg-eyebrow pg-eyebrow-ink">Cómo funciona</p>
      <h2 id="seller-process" className="pg-h2">Cuatro pasos antes de publicar.</h2>
      <ol className="sp-steps">
        {stages.map((stage, index) => (
          <li key={stage.title} id={index === 3 ? "precio-y-condiciones" : undefined} className="sp-step">
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
