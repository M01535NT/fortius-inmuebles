import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { PropertyCard } from "@/components/property/property-card";
import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { getPropiedades } from "@/lib/inventario";
import { getZonaBySlug, zonas } from "@/data/zonas";

type Props = { params: Promise<{ zona: string }> };

export function generateStaticParams() {
  return zonas.map((z) => ({ zona: z.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zona: slug } = await params;
  const zona = getZonaBySlug(slug);
  if (!zona) return {};
  return {
    title: `Bienes raíces en ${zona.nombre}`,
    alternates: { canonical: `/zonas/${zona.slug}` },
    description: `${zona.resumen} Qué se mueve en ${zona.nombre} y qué revisamos antes de comprar o vender ahí.`,
  };
}

/*
  Página SEO local por zona: editorial + inventario real de la zona (o
  estado vacío honesto), FAQ y mapa. El contenido vive en src/data/zonas.ts.
*/
export default async function ZonaPage({ params }: Props) {
  const { zona: slug } = await params;
  const zona = getZonaBySlug(slug);
  if (!zona) notFound();

  const propiedades = await getPropiedades();
  const enZona = propiedades.filter(
    (p) => p.zona === zona.nombre && p.estado !== "vendida",
  );

  return (
    <>
      <main className="bg-background pt-28 md:pt-32">
        <Container className="pb-20 md:pb-24">
          {/* Encabezado */}
          <BlurFade inView={false}>
            <nav aria-label="Miga de pan" className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
              <Link href="/zonas" className="transition-colors hover:text-foreground">
                Zonas
              </Link>
              <span aria-hidden="true"> / </span>
              <span className="text-foreground/80">{zona.municipio}</span>
            </nav>
            <h1 className="display-title mt-4 max-w-[14ch] text-5xl text-foreground md:text-6xl lg:text-7xl">
              {zona.nombre}.
            </h1>
          </BlurFade>

          <div className="mt-10 grid gap-12 lg:grid-cols-12">
            {/* Editorial */}
            <BlurFade className="lg:col-span-6">
              {zona.descripcion.map((parrafo) => (
                <p
                  key={parrafo.slice(0, 24)}
                  className="mt-5 max-w-[58ch] text-[15.5px] leading-relaxed text-muted-foreground first:mt-0"
                >
                  {parrafo}
                </p>
              ))}

              <p className="display-soft mt-9 text-[19px] text-foreground">
                Qué se mueve aquí
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {zona.perfil.map((item) => (
                  <li
                    key={item}
                    className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-[13.5px] text-foreground/85"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/#evaluar"
                  className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
                >
                  Vender en {zona.nombre}
                </Link>
                <Link
                  href="/inventario"
                  className="inline-flex h-12 items-center rounded-md border border-border px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
                >
                  Buscar propiedad
                </Link>
              </div>
            </BlurFade>

            {/* Mapa */}
            <BlurFade delay={0.1} className="lg:col-span-5 lg:col-start-8">
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(zona.mapQuery)}&z=13&output=embed`}
                  title={`Mapa de ${zona.nombre}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[300px] w-full md:h-[380px]"
                />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                Referencia general de la zona. Las ubicaciones exactas se
                comparten al agendar visita.
              </p>
            </BlurFade>
          </div>

          {/* Inventario de la zona */}
          <div className="mt-20 border-t border-border pt-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="display-title text-3xl text-foreground sm:text-4xl">
                Propiedades en {zona.nombre}
              </h2>
              <Link
                href="/inventario"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-[13.5px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Ver todo el inventario
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </Link>
            </div>

            {enZona.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enZona.map((p) => (
                  <PropertyCard key={p.slug} property={p} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-border p-8 md:p-10">
                <p className="display-soft text-xl text-foreground">
                  Sin inventario público en {zona.nombre} por ahora.
                </p>
                <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-muted-foreground">
                  Parte de las propiedades que trabajamos se promueven de forma
                  dirigida. Cuéntanos qué buscas y te avisamos cuando entre
                  algo que encaje en la zona.
                </p>
                <Link
                  href="/contacto"
                  className="mt-6 inline-flex h-11 items-center rounded-md border border-border px-5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cuéntanos qué buscas
                </Link>
              </div>
            )}
          </div>

          {/* FAQ local */}
          <div className="mt-20 grid gap-10 border-t border-border pt-12 lg:grid-cols-12">
            <h2 className="display-title text-3xl text-foreground sm:text-4xl lg:col-span-4">
              Preguntas de la zona
            </h2>
            <div className="lg:col-span-7 lg:col-start-6">
              <div className="divide-y divide-border border-y border-border">
                {zona.faq.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                      <span className="display-soft text-[18px] text-foreground">{item.q}</span>
                      <Plus
                        className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45"
                        strokeWidth={1.5}
                      />
                    </summary>
                    <p className="max-w-[62ch] pb-6 text-[14.5px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </main>
      <DiagnosticCTA />
    </>
  );
}
