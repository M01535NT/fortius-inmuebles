import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "Recibimos tu solicitud",
  robots: { index: false, follow: false }, // página de confirmación, no indexable
};

const SIGUIENTE = [
  "Revisamos los datos de tu propiedad y su zona.",
  "Consultamos comparables vendidos para una lectura inicial de valor.",
  "Te contactamos para explicarte el resultado y el siguiente paso.",
];

export default async function GraciasPage() {
  const contact = publicContact(await getPublicSettings());
  return (
    <main className="bg-background pt-28 md:pt-32">
      <Container className="pb-24 md:pb-32">
        <div className="grid gap-14 lg:grid-cols-12">
          <BlurFade inView={false} className="lg:col-span-7">
            <CheckCircle2 className="h-9 w-9 text-primary" strokeWidth={1.5} />
            <h1 className="display-title mt-6 max-w-[16ch] text-5xl text-foreground md:text-6xl">
              Recibimos los datos de tu propiedad.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Gracias por la confianza. No publicamos nada ni compartimos tu
              información: el primer paso es revisar y hablar contigo.
            </p>

            <ol className="mt-9 space-y-4">
              {SIGUIENTE.map((paso, i) => (
                <li key={paso} className="flex items-start gap-4">
                  <span className="font-mono text-[13px] leading-[1.7] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-foreground/85">{paso}</span>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={contact.whatsapp || undefined}
                aria-disabled={!contact.whatsapp}
                title={contact.whatsapp ? undefined : "WhatsApp: por confirmar"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Escribir por WhatsApp
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </a>
              <Link
                href="/"
                className="inline-flex h-12 items-center rounded-md border border-border px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
              >
                Volver al inicio
              </Link>
            </div>
          </BlurFade>

          <BlurFade delay={0.12} className="self-end lg:col-span-4 lg:col-start-9">
            <p className="display-soft text-[19px] text-foreground">Mientras tanto</p>
            <ul className="mt-5 space-y-3 text-[14.5px]">
              <li>
                <Link
                  href="/herramientas/gastos-de-cierre"
                  className="text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Estima tus gastos de cierre
                </Link>
              </li>
              <li>
                <Link
                  href="/#metodo"
                  className="text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Conoce las cuatro fases del método
                </Link>
              </li>
              <li>
                <Link
                  href="/#entregables"
                  className="text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Revisa los documentos que recibirás
                </Link>
              </li>
            </ul>
          </BlurFade>
        </div>
      </Container>
    </main>
  );
}
