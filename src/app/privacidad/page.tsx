import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidad" },
  title: "Aviso de privacidad",
  description: "Aviso de privacidad para solicitudes inmobiliarias.",
};

export default function PrivacidadPage() {
  return (
    <main className="bg-background pt-32">
      <Container className="max-w-3xl py-16">
        <h1 className="display-title text-5xl md:text-7xl">Aviso de privacidad.</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            La informacion enviada mediante formularios se utilizara unicamente para dar seguimiento
            a solicitudes inmobiliarias, diagnosticos, contacto comercial y orientacion inicial.
          </p>
          <p>
            Este texto es una base provisional. Debe sustituirse por un aviso validado por el responsable
            legal del negocio antes de publicar el sitio en produccion.
          </p>
        </div>
      </Container>
    </main>
  );
}
