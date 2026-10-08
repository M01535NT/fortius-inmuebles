import type { Metadata } from "next";

import { ContactIntents } from "@/components/contact/contact-intents";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description:
    "Consulta sobre compra, venta o un inmueble publicado y solicita una conversación inicial.",
};

export default function ContactoPage() {
  return (
    <main className="bg-background pb-24 pt-28 md:pt-32">
      <Container className="grid gap-12 lg:grid-cols-12">
        <header className="lg:col-span-5">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary-ink">Contacto</p>
          <h1 className="display-title mt-4 max-w-[11ch] text-5xl text-foreground sm:text-6xl">Cuéntanos qué quieres resolver.</h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground">Elige el motivo de tu consulta. El mensaje se prepara con el contexto necesario para que la conversación empiece en el punto correcto.</p>
        </header>
        <section className="lg:col-span-6 lg:col-start-7" aria-label="Opciones de contacto">
          <ContactIntents />
        </section>
      </Container>
    </main>
  );
}
