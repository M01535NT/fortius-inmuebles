import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./gracias.css";

export const metadata: Metadata = pageMetadata({
  path: "/vender-propiedad/gracias",
  title: "Recibimos tu solicitud",
  description:
    "Recibimos los datos de tu propiedad. Te contactamos para revisar el precio, los documentos y el siguiente paso de tu venta.",
  robots: { index: false, follow: false }, // página de confirmación, no indexable
});

const SIGUIENTE = [
  { when: "Ahora", text: "Leemos los datos de tu propiedad." },
  { when: "Después", text: "Te llamamos para la entrevista inicial y agendamos la visita." },
  { when: "Al final", text: "Tras la visita y la revisión de papeles, te entregamos la opinión jurídica y la de valor." },
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
          <p className="pg-lead">No publicamos nada ni compartimos tus datos. Primero hablamos contigo.</p>
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
          <p className="gr-links">También puedes <Link href="/#metodo">conocer las cinco etapas del método</Link> o <Link href="/#entregables">revisar los documentos que recibirás</Link>.</p>
        </div>
      </section>
    </main>
  );
}
