import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";

export const metadata: Metadata = {
  alternates: { canonical: "/vender-propiedad/gracias" },
  title: "Recibimos tu solicitud",
  robots: { index: false, follow: false }, // página de confirmación, no indexable
};

const SIGUIENTE = [
  { when: "Ahora", text: "Revisamos los datos de tu propiedad y su zona." },
  { when: "Después", text: "Revisamos la información de precio disponible y te decimos qué falta para estimar un rango." },
  { when: "Al final", text: "Te contactamos para explicarte el resultado y el siguiente paso." },
];

/* Boceto Gracias: confirmación centrada con los tres momentos siguientes. */
export default async function GraciasPage() {
  const contact = publicContact(await getPublicSettings());
  return (
    <main className="pg-page">
      <section className="pg-hero gr-hero">
        <div className="pg-container pg-hero-body gr-body">
          <span className="gr-check" aria-hidden="true"><Check size={34} strokeWidth={2.5} /></span>
          <h1 className="pg-title">Recibimos los datos de tu propiedad.</h1>
          <p className="pg-lead">Gracias por la confianza. No publicamos nada ni compartimos tu información: el primer paso es revisar y hablar contigo.</p>
          <ol className="gr-steps">
            {SIGUIENTE.map((paso, index) => <li key={paso.when} className={index === 0 ? "is-current" : undefined}>
              <span className="gr-step-when">{paso.when}</span>
              <p>{paso.text}</p>
            </li>)}
          </ol>
          <div className="pg-pills gr-actions">
            {contact.whatsapp
              ? <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="pg-btn pg-btn-light">Escribir por WhatsApp <ArrowUpRight size={18} aria-hidden="true" /></a>
              : <span className="pg-btn pg-btn-light" aria-disabled="true" title="WhatsApp: por confirmar">Escribir por WhatsApp</span>}
            <Link href="/herramientas/gastos-de-cierre" className="pg-btn pg-btn-ghost">Mientras tanto: estima tus gastos</Link>
            <Link href="/" className="pg-btn pg-btn-ghost">Volver al inicio</Link>
          </div>
          <p className="gr-links">También puedes <Link href="/#metodo">conocer las seis etapas del método</Link> o <Link href="/#entregables">revisar los documentos que recibirás</Link>.</p>
        </div>
      </section>
    </main>
  );
}
