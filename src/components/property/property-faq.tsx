import { Plus } from "lucide-react";

/*
  FAQ del detalle de propiedad. Respuestas honestas y generales; las
  particulares de cada inmueble se resuelven con el asesor.
*/
const QA = [
  {
    q: "¿Cómo agendo una visita?",
    a: "Propón un día en la tarjeta de visita. Te confirmamos la hora.",
  },
  {
    q: "¿Puedo comprar con crédito hipotecario?",
    a: "Depende del inmueble y de tu perfil. El banco confirma aprobación y condiciones.",
  },
  {
    q: "¿El precio es negociable?",
    a: "Haz tu oferta por escrito y te damos la respuesta del dueño.",
  },
  {
    q: "¿Qué gastos debo considerar además del precio?",
    a: "ISAI, notaría y, si aplica, avalúo y crédito. Estímalos en la calculadora.",
  },
];

export function PropertyFaq() {
  return (
    <div className="fe-faq">
      {QA.map((item) => (
        <details key={item.q} className="fe-card">
          <summary>
            <span>{item.q}</span>
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
