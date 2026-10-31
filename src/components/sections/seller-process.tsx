import Image from "next/image";
import { FileText } from "lucide-react";

const stages = [
  { title: "Entrevista inicial", text: "Nos cuentas del inmueble y qué esperas.", src: "/hero/que-hacemos-vender.webp", alt: "Casa de dos niveles con jardín" },
  { title: "Levantamiento", text: "Visitamos, medimos y fotografiamos.", src: "/hero/etapa-03-telefono.webp", alt: "Teléfono en un trípode frente a la fachada de una casa" },
  { title: "Documentos", text: "Reunimos y revisamos el checklist.", src: "/hero/etapa-01-revisamos.webp", alt: "Escritura y pluma sobre un escritorio" },
  { title: "Dictamen y precio", text: "Si se puede vender y en cuánto.", src: "/hero/etapa-02-precio.webp", alt: "Cinta métrica sobre un plano", doc: "Factibilidad y opinión de valor" },
];

/*
  Vender (30/10/2026): el procedimiento del titular en cuatro pasos con foto. Solo el
  último entrega documentos al propietario: el dictamen y la opinión de valor.
*/
export function SellerProcess() {
  return (
    <section id="pasos" className="pg-container vd-section" aria-labelledby="seller-process">
      <p className="pg-eyebrow pg-eyebrow-ink">Cómo funciona</p>
      <h2 id="seller-process" className="pg-h2">Cuatro pasos antes de publicar.</h2>
      <ol className="sp-steps">
        {stages.map((stage, index) => (
          <li key={stage.title} id={index === 3 ? "precio-y-condiciones" : undefined} className="sp-step">
            <span className="sp-step-photo"><Image src={stage.src} alt={stage.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" /></span>
            <span className="sp-step-number" aria-hidden="true">0{index + 1}</span>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
            {stage.doc && <span className="sp-step-doc"><FileText size={16} aria-hidden="true" /><span className="sr-only">Recibes: </span>{stage.doc}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
