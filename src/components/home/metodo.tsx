"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

import { FASES } from "@/data/metodo";

/*
  Método vertical con línea de progreso al scroll. Es la versión para
  mobile, prefers-reduced-motion y el modo de motion "equilibrado".
  Data compartida en src/data/metodo.ts.
*/
export function Metodo({ anchor = true }: { anchor?: boolean }) {
  const reduce = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.72", "end 0.72"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section
      id={anchor ? "metodo" : undefined}
      className="mx-auto max-w-[1280px] scroll-mt-20 px-5 py-24 md:px-8 md:py-36"
    >
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
