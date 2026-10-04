import { Plus } from "lucide-react";

/*
  FAQ del detalle de propiedad. Respuestas honestas y generales; las
  particulares de cada inmueble se resuelven con el asesor.
*/
const QA = [
  {
    q: "¿Cómo agendo una visita?",
    a: "Envía el formulario de esta página. Confirmamos la disponibilidad y coordinamos contigo día, hora y condiciones de la visita.",
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
    <div className="mt-12">
      <h2 className="display-soft text-2xl text-foreground">Preguntas frecuentes</h2>
      <div className="mt-4 max-w-[640px] divide-y divide-border border-y border-border">
        {QA.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-base font-medium text-foreground">{item.q}</span>
              <Plus
                className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45"
                strokeWidth={1.5}
              />
            </summary>
            <p className="max-w-[60ch] pb-5 text-base leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
