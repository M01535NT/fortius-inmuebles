import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BlurFade } from "@/components/magicui/blur-fade";

/*
  Segmentos: puertas a las rutas de especialidad con los renders del
  proyecto. Layout asimétrico (residencial grande + dos compactas).
*/
const SEGMENTOS = [
  {
    title: "Residencial",
    text: "Casas y departamentos con lectura de zona, valor y expediente.",
    href: "/residencial",
    image: { src: "/hero/edificio-ciudad.webp", alt: "Edificio residencial en zona urbana" },
  },
  {
    title: "Comercial",
    text: "Locales y oficinas con criterio de ubicación y flujo.",
    href: "/comercial",
    image: { src: "/hero/interior-plaza.webp", alt: "Interior de plaza comercial" },
  },
  {
    title: "Industrial",
    text: "Naves y terrenos operativos con revisión documental.",
    href: "/industrial",
    image: { src: "/hero/parque-industrial.webp", alt: "Parque industrial en operación" },
  },
];

function SegmentoCard({
  segmento,
  large = false,
}: {
  segmento: (typeof SEGMENTOS)[number];
  large?: boolean;
}) {
  return (
    <Link
      href={segmento.href}
      className="group relative block h-full overflow-hidden rounded-lg border border-border"
    >
      <div className={large ? "relative h-full min-h-[420px]" : "relative h-full min-h-[200px]"}>
        <Image
          src={segmento.image.src}
          alt={segmento.image.alt}
          fill
          sizes={large ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 42vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {/* Scrim para legibilidad del texto sobre foto, ambos temas. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b120e]/85 via-[#0b120e]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="display-title text-2xl text-[#f2f4ee]">{segmento.title}</h3>
              <p className="mt-1.5 max-w-[38ch] text-[13.5px] leading-relaxed text-[#e6e9e2]/85">
                {segmento.text}
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#f2f4ee]/30 text-[#f2f4ee] transition-all duration-300 group-hover:border-[#57e3b3] group-hover:text-[#57e3b3]">
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Segmentos() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-6 md:px-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <BlurFade className="lg:col-span-7">
          <SegmentoCard segmento={SEGMENTOS[0]} large />
        </BlurFade>
        <div className="grid gap-4 lg:col-span-5">
          <BlurFade delay={0.08}>
            <SegmentoCard segmento={SEGMENTOS[1]} />
          </BlurFade>
          <BlurFade delay={0.16}>
            <SegmentoCard segmento={SEGMENTOS[2]} />
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
