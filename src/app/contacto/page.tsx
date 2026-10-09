import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContactIntents } from "@/components/contact/contact-intents";
import { BlurFade } from "@/components/magicui/blur-fade";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" }, title: "Contacto",
  description: "Consulta sobre compra, venta o un inmueble publicado y solicita una conversación inicial.",
};

export default function ContactoPage() {
  return <main className="contact-page">
    <div className="editorial-container">
      <header className="contact-heading">
        <BlurFade><p className="contact-eyebrow">Contacto · Fortius Inmuebles</p>
          <h1>¿Compras o vendes?<br /><span>Hablemos.</span></h1>
        </BlurFade>
        <p>Cuéntanos qué buscas o qué propiedad quieres vender. Elige el motivo de tu consulta para empezar.</p>
      </header>
      <section aria-label="Opciones de contacto"><ContactIntents /></section>
      <div className="contact-team-link"><p>Conoce a las personas<br />detrás de Fortius.</p><Link href="/nosotros#agentes">Conocer al equipo <ArrowUpRight size={22} aria-hidden="true" /></Link></div>
    </div>
  </main>;
}
