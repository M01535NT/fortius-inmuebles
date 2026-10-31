import type { Metadata } from "next";
import Link from "next/link";
import { ContactIntents } from "@/components/contact/contact-intents";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" }, title: "Contacto",
  description: "Consulta sobre compra, venta o un inmueble publicado y solicita una conversación inicial.",
};

/* Boceto Contacto: página nocturna completa con motivos, formulario y canales directos. */
export default function ContactoPage() {
  return <main className="pg-page">
    <section className="pg-hero ct-hero">
      <div className="pg-container pg-hero-body">
        <header className="ct-head">
          <p className="pg-eyebrow">Contacto</p>
          <h1 className="pg-title">¿Compras o vendes? Hablemos.</h1>
          <p className="pg-lead">Elige el motivo y te respondemos.</p>
        </header>
        <section aria-label="Opciones de contacto"><ContactIntents /></section>
        <div className="ct-team"><p>Quién te atiende.</p><Link href="/nosotros#agentes" className="pg-btn pg-btn-ghost">Conocer al equipo</Link></div>
      </div>
    </section>
  </main>;
}
