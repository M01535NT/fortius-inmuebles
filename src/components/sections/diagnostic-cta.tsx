import { ContactForm } from "@/components/sections/contact-form";
import { MessagingContact } from "@/components/contact/messaging-actions";

export function DiagnosticCTA({ headingLevel = "h2", general = false }: { headingLevel?: "h1" | "h2"; general?: boolean }) {
  const Heading = headingLevel;
  return (
    <section id="diagnostico" className="pg-container pg-section pg-section-last dc-section">
      <div className="dc-grid">
        <div>
          <p className="pg-eyebrow pg-eyebrow-ink">{general ? "Contacto" : "Primer paso"}</p>
          <Heading className="pg-h2">{general ? "Cuéntanos qué necesitas." : "Empieza con la entrevista inicial."}</Heading>
          <p className="pg-muted dc-text">
            {general
              ? "Vender, comprar o consultar. Te proponemos el siguiente paso."
              : "Nos cuentas del inmueble y agendamos el levantamiento."}
          </p>
        </div>
        <div className="pg-card pg-card-pad">
          <MessagingContact><ContactForm submitLabel={general ? "Enviar consulta" : "Pedir entrevista"} /></MessagingContact>
        </div>
      </div>
    </section>
  );
}
