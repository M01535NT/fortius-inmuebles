import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/gsap/reveal";
import { Scrub } from "@/components/gsap/scrub";
import { SplitHeading } from "@/components/gsap/split-heading";
import { PropertyCard } from "@/components/property/property-card";
import { getFeaturedProperties } from "@/lib/inventario";

/*
  Acceso directo al inventario sin convertir el Home en portal.
  Motion: cada columna deriva a una velocidad distinta con el scroll
  (el grid respira); las cards re-animan al re-scrollear.
*/
const DRIFT: [number, number][] = [
  [24, -24],
  [56, -56],
  [24, -24],
];

export async function Destacadas() {
  const destacadas = (await getFeaturedProperties()).slice(0, 3);
  if (destacadas.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <SplitHeading
            lines={["Propiedades."]}
            className="display-title text-4xl text-foreground sm:text-5xl"
          />
          <Reveal delay={0.15} distance={40}>
            <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Cada propiedad publicada pasó por revisión documental y análisis
              de precio antes de salir al mercado.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.2} distance={40}>
          <Link
            href="/inventario"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            Ver inventario
            <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {destacadas.map((p, i) => (
          <Scrub key={p.slug} y={DRIFT[i] ?? [24, -24]}>
            <Reveal distance={80} scale={0.95} delay={0.07 * i}>
              <PropertyCard property={p} />
            </Reveal>
          </Scrub>
        ))}
      </div>
    </section>
  );
}
