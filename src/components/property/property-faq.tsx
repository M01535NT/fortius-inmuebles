import { Plus } from "lucide-react";

/*
  FAQ del detalle de propiedad. Respuestas honestas y generales; las
  particulares de cada inmueble se resuelven con el asesor.
*/
const QA = [
  {
    q: "¿Cómo agendo una visita?",
    a: "Envía el formulario de esta página o usa el botón de agendar. Calificamos cada solicitud y coordinamos contigo día y hora; en la visita te acompaña el asesor titular de la propiedad.",
  },
  {
    q: "¿Puedo comprar con crédito hipotecario?",
    a: "Sí, cuando la propiedad califica. Te acompañamos en el proceso: avalúo, gestión con el banco y coordinación notarial. Los tiempos con crédito suelen ser mayores que de contado y te los explicamos desde el inicio.",
  },
  {
    q: "¿El precio es negociable?",
    a: "Las ofertas se presentan por escrito y se analizan con el propietario, con datos de mercado como referencia. No prometemos descuentos; prometemos un proceso serio para tu oferta.",
  },
  {
    q: "¿Qué gastos debo considerar además del precio?",
    a: "Impuestos de adquisición, honorarios notariales, avalúo y gestoría, entre otros. Te entregamos una estimación desglosada antes de que decidas; los montos se confirman con el notario.",
  },
];

export function PropertyFaq() {
  return (
    <div className="mt-12">
      <h2 className="display-soft text-2xl text-foreground">Preguntas frecuentes</h2>
      <div className="mt-4 max-w-[640px] divide-y divide-border border-y border-border">
        {QA.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-[15px] font-medium text-foreground">{item.q}</span>
              <Plus
                className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45"
                strokeWidth={1.5}
              />
            </summary>
            <p className="max-w-[60ch] pb-5 text-[14.5px] leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
