"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/*
  The four phases come straight from the firm's internal operations manual
  (Proceso Operativo Inmobiliario). Real process, not marketing filler.
*/
const FASES = [
  {
    n: "01",
    title: "Captación",
    body: "Antes de aceptar tu propiedad revisamos su situación legal y armamos el análisis comparativo de mercado. El precio de salida se defiende con comparables vendidos, no con corazonadas.",
    items: [
      "Dictamen documental antes de publicar",
      "Análisis comparativo de mercado",
      "Contrato con plan de trabajo por escrito",
    ],
  },
  {
    n: "02",
    title: "Preparación",
    body: "La propiedad se pone a punto antes de salir: reparaciones con retorno claro, fotografía profesional y una ficha distinta para cada canal.",
    items: [
      "Puesta a punto y staging",
      "Fotografía y video profesional",
      "Publicación multicanal con estrategia",
    ],
    image: { src: "/hero/interior-depa.webp", alt: "Interior preparado para fotografía profesional" },
  },
  {
    n: "03",
    title: "Comercialización",
    body: "Calificamos a cada prospecto antes de abrir tu puerta. Las ofertas se reciben por escrito y las analizamos contigo antes de responder.",
    items: [
      "Filtro de prospectos antes de cada visita",
      "Reporte de avances cada 30 días",
      "Ofertas por escrito, analizadas contigo",
    ],
  },
  {
    n: "04",
    title: "Cierre",
    body: "Coordinamos notario, expediente y firma. Los costos se estiman desde antes, así sabes cuánto paga cada parte y qué sigue después de firmar.",
    items: [
      "Costos de cierre estimados por adelantado",
      "Checklist documental para notario",
      "Entrega de posesión documentada",
    ],
  },
];

export function Metodo() {
  const reduce = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.72", "end 0.72"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="metodo" className="mx-auto max-w-[1280px] scroll-mt-20 px-5 py-24 md:px-8 md:py-36">
      <div className="grid gap-14 lg:grid-cols-12">
        {/* Sticky intro column */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 className="display-title text-4xl text-foreground sm:text-5xl">
              Cuatro fases.
              <br />
              Un expediente.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Es el mismo proceso en cada operación, con documentos definidos
              en cada fase. Pídelo completo en tu primera reunión.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div ref={trackRef} className="relative lg:col-span-7 lg:col-start-6">
          {/* Rail + scroll progress */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden="true" />
          {!reduce && (
            <motion.div
              aria-hidden="true"
              style={{ scaleY: progress }}
              className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-primary"
            />
          )}

          <ol className="space-y-16">
            {FASES.map((fase) => (
              <li key={fase.n} className="relative pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[7px] block h-[15px] w-[15px] rounded-full border-2 border-primary bg-background"
                />
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[13px] text-primary">{fase.n}</span>
                  <h3 className="display-title text-2xl text-foreground sm:text-[28px]">
                    {fase.title}
                  </h3>
                </div>
                <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-muted-foreground">
                  {fase.body}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {fase.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14.5px] text-foreground/85">
                      <span
                        aria-hidden="true"
                        className="mt-[9px] h-px w-4 shrink-0 bg-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                {fase.image ? (
                  <div className="relative mt-7 aspect-[16/9] max-w-[520px] overflow-hidden rounded-lg border border-border">
                    <Image
                      src={fase.image.src}
                      alt={fase.image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 520px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
