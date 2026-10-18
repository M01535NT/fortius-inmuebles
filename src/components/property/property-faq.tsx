import { Plus } from "lucide-react";

/*
  FAQ del detalle de propiedad. Respuestas honestas y generales; las
  particulares de cada inmueble se resuelven con el asesor.
*/
const QA = [
  {
    q: "¿Cómo agendo una visita?",
    a: "Propón un día en la tarjeta de visita de esta página. Confirmamos la disponibilidad y coordinamos contigo la hora y las condiciones de la visita.",
  },
  {
    q: "¿Puedo comprar con crédito hipotecario?",
    a: "Depende del inmueble, tu perfil y la institución que otorgue el crédito. Podemos revisar contigo los datos de la propiedad; la aprobación y condiciones las confirma el banco.",
  },
  {
    q: "¿El precio es negociable?",
    a: "Presenta tu oferta por escrito. La revisamos con el propietario y te comunicamos su respuesta.",
  },
  {
    q: "¿Qué gastos debo considerar además del precio?",
    a: "Considera impuestos de adquisición, honorarios notariales y, si aplica, avalúo y crédito. Puedes hacer una estimación inicial en nuestra calculadora de gastos de cierre.",
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
