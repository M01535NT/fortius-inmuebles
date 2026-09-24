import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { VelocityMarquee } from "@/components/gsap/velocity-marquee";

const ZONAS_A = [
  "Zona Río",
  "Otay",
  "Playas de Tijuana",
  "La Mesa",
  "Santa Fe",
  "El Florido",
];

const ZONAS_B = ["Chapultepec", "Cacho", "Rosarito", "Tecate", "Ensenada", "Colinas"];

function Fila({ zonas }: { zonas: string[] }) {
  return (
    <>
      {zonas.map((zona) => (
        <span
          key={zona}
          className="display-title text-outline mx-7 whitespace-nowrap text-4xl md:text-5xl"
        >
          {zona}
        </span>
      ))}
    </>
  );
}

/*
  Banda de zonas: doble fila contra-rotante en tipografía display outline
  que se rellena de verde al hover. La velocidad reacciona al scroll
  (acelera al scrollear, se invierte al subir). Única unidad marquee.
*/
export function Zonas() {
  return (
    <section aria-label="Zonas de operación" className="overflow-hidden border-y border-border py-8">
      <VelocityMarquee duration={52} className="marquee-mask">
        <Fila zonas={ZONAS_A} />
      </VelocityMarquee>
      <VelocityMarquee duration={60} reverse className="marquee-mask mt-2">
        <Fila zonas={ZONAS_B} />
      </VelocityMarquee>
      <div className="mx-auto mt-6 max-w-[1280px] px-5 md:px-8">
        <Link
          href="/zonas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-foreground"
        >
          Conocer cada zona
          <ArrowUpRight className="size-4" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
