import { ContactForm } from "@/components/sections/contact-form";
import { MessagingContact } from "@/components/contact/messaging-actions";

export function DiagnosticCTA({ headingLevel = "h2", general = false }: { headingLevel?: "h1" | "h2"; general?: boolean }) {
  const Heading = headingLevel;
  return (
    <section id="diagnostico" className="pg-container pg-section pg-section-last dc-section">
      <div className="dc-grid">
        <div>
          <p className="pg-eyebrow pg-eyebrow-ink">{general ? "Contacto" : "Primer paso"}</p>
          <Heading className="pg-h2">{general ? "Cuéntanos qué necesitas." : "Empieza con una evaluación."}</Heading>
          <p className="pg-muted dc-text">
            {general
              ? "Dinos si quieres vender, comprar o consultar sobre un inmueble. Te contactaremos para entender el caso y proponer un siguiente paso."
              : "Cuéntanos qué quieres resolver. La primera conversación aclara precio, tiempos, condición del inmueble y el siguiente paso."}
          </p>
        </div>
        <div className="pg-card pg-card-pad">
          <MessagingContact><ContactForm submitLabel={general ? "Enviar consulta" : "Solicitar evaluación"} /></MessagingContact>
        </div>
      </div>
    </section>
  );
}
