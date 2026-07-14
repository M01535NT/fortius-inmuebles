import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { getPropiedades } from "@/lib/inventario";
import { zonas } from "@/data/zonas";

export const metadata: Metadata = {
  title: "Zonas de operación",
  description:
    "Zonas donde operamos en Tijuana, Rosarito, Tecate y Ensenada: qué se mueve en cada una y qué revisamos antes de comprar o vender ahí.",
};

/*
  Hub SEO local: una card por zona con el conteo real de inventario público.
  El contenido editorial vive en src/data/zonas.ts.
*/
export const revalidate = 300;

export default async function ZonasPage() {
  const propiedades = await getPropiedades();

  return (
    <>
      <main className="bg-background pt-28 md:pt-32">
        <Container className="pb-20 md:pb-28">
          <BlurFade inView={false}>
            <h1 className="display-title max-w-[14ch] text-5xl text-foreground md:text-6xl lg:text-7xl">
              Zonas con criterio local.
            </h1>
            <p className="mt-6 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Cada zona de Baja California se compra y se vende distinto. Aquí
              está lo que se mueve en cada una y lo que revisamos antes de
              operar ahí. Sin promedios inventados: criterio, no estadística
              improvisada.
            </p>
          </BlurFade>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zonas.map((zona, i) => {
              const enZona = propiedades.filter(
                (p) => p.zona === zona.nombre && p.estado !== "vendida",
              ).length;
              return (
                <BlurFade key={zona.slug} delay={0.05 * (i % 3)} className="h-full">
                  <Link
                    href={`/zonas/${zona.slug}`}
                    className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        {zona.municipio}
                      </p>
                      <h2 className="display-title mt-3 text-[26px] text-foreground">
                        {zona.nombre}
                      </h2>
                      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                        {zona.resumen}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="font-mono text-[11.5px] text-muted-foreground">
                        {enZona > 0
                          ? `${String(enZona).padStart(2, "0")} en inventario`
                          : "Inventario a consulta"}
                      </span>
                      <ArrowUpRight
                        className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                </BlurFade>
              );
            })}
          </div>

          <p className="mt-10 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
            ¿Tu propiedad está en otra zona? También la evaluamos: el método es
            el mismo y el criterio local se construye con comparables de tu
            sector.
          </p>
        </Container>
      </main>
      <DiagnosticCTA />
    </>
  );
}
