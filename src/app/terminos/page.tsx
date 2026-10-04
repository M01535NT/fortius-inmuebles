import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SITE_TERMS } from "@/data/site-terms";

export const metadata: Metadata = {
  alternates: { canonical: "/terminos" },
  title: "Términos y condiciones",
  description: "Términos de uso de Mint Inmuebles: publicaciones, solicitudes, herramientas, contratación y canales de aclaración.",
};

export default function TerminosPage() {
  return (
    <main className="bg-background pt-28 md:pt-32">
      <Container className="max-w-3xl pb-24 md:pb-32">
        <article>
          <header className="border-b border-border pb-8">
            <h1 className="display-title text-5xl text-foreground md:text-6xl">
              Términos y condiciones.
            </h1>
            <p className="mt-5 text-sm text-muted-foreground">
              Versión vigente desde el <time dateTime={SITE_TERMS.effectiveDate}>{SITE_TERMS.dateLabel}</time>.
            </p>
            <dl className="mt-7 space-y-4 text-base leading-7">
              <div><dt className="font-medium text-foreground">Responsable del sitio</dt><dd className="text-muted-foreground">{SITE_TERMS.responsible} · {SITE_TERMS.commercialName}</dd></div>
              <div><dt className="font-medium text-foreground">Lugar de atención</dt><dd className="text-muted-foreground">{SITE_TERMS.location}. La atención se coordina previamente por correo.</dd></div>
              <div><dt className="font-medium text-foreground">Correo para contacto y aclaraciones</dt><dd><a href={`mailto:${SITE_TERMS.email}`} className="break-all text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{SITE_TERMS.email}</a></dd></div>
            </dl>
          </header>

          <nav aria-label="Contenido de los términos" className="border-b border-border py-7">
            <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {SITE_TERMS.sections.map((section, index) => <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-11 items-center py-2 text-sm leading-6 text-foreground/80 underline-offset-4 hover:text-primary hover:underline">
                  {index + 1}. {section.title}
                </a>
              </li>)}
            </ol>
          </nav>

          <div className="mt-10 space-y-10 md:space-y-12">
            {SITE_TERMS.sections.map((section, index) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
              <h2 id={`${section.id}-title`} className="display-soft text-2xl leading-tight text-foreground md:text-3xl">{index + 1}. {section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-foreground/85">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.id === "datos" && <p><Link href="/privacidad" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">Consultar el aviso de privacidad</Link>.</p>}
                {section.id === "aclaraciones" && <p><a href={`mailto:${SITE_TERMS.email}`} className="break-all text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{SITE_TERMS.email}</a></p>}
              </div>
            </section>)}
          </div>

          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6">
            <Link href="/" className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline">Volver al inicio</Link>
            <a href="#" className="inline-flex min-h-11 items-center text-foreground/80 underline-offset-4 hover:underline">Volver arriba</a>
          </div>
        </article>
      </Container>
    </main>
  );
}
