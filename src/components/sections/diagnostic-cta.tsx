"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";

/*
  Cierre de Vender (12/11/2026, decisión del titular): solo WhatsApp y Llamar; el formulario
  vive en el asistente de la portada (#entrevista). Se conserva #diagnostico para enlaces antiguos.
*/
export function DiagnosticCTA({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings, "Hola, quiero agendar la entrevista para vender mi propiedad.");
  const directo = !!(contact.whatsapp || contact.phoneHref);
  return (
    <section id="diagnostico" className="pg-container pg-section pg-section-last dc-section">
      <div className="dc-grid">
        <div>
          <Heading className="pg-h2">¿Prefieres hablarlo directo?</Heading>
          <p className="pg-muted dc-text">Escríbenos o llámanos y agendamos la entrevista inicial.</p>
        </div>
        <div className="pg-card pg-card-pad dc-actions">
          {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="pg-btn"><MessageCircle size={18} aria-hidden="true" />WhatsApp</a>}
          {contact.phoneHref && <a href={contact.phoneHref} className="pg-btn pg-btn-ghost"><Phone size={18} aria-hidden="true" />Llamar</a>}
          {!directo && <Link href="/vender-propiedad#entrevista" className="pg-btn">Ir al formulario</Link>}
        </div>
      </div>
    </section>
  );
}
