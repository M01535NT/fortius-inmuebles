"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { homeText } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { Reveal } from "@/components/gsap/reveal";
import { SplitHeading } from "@/components/gsap/split-heading";
import { ParallaxImage } from "@/components/magicui/parallax-image";
import { useScroll, useSpring } from "motion/react";

import { FASES } from "@/data/metodo";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

/*
  Método vertical con línea de progreso al scroll. Es la versión para
  mobile, prefers-reduced-motion y el modo de motion "equilibrado".
  Data compartida en src/data/metodo.ts.
*/
export function Metodo({ anchor = true, content }: { anchor?: boolean; content?: SiteContent | null }) {
  const reduce = useReducedMotionSafe();
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
            <SplitHeading lines={homeText(content, "metodoTitulo").split("\n")} className="display-title text-4xl text-foreground sm:text-5xl" />
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-muted-foreground">
              {homeText(content, "metodoTexto")}
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
                <Reveal distance={42} once>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-primary">{fase.n}</span>
                  <h3 className="display-title text-2xl text-foreground sm:text-3xl">
                    {fase.title}
                  </h3>
                </div>
                <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
                  {homeText(content, fase.copy)}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {fase.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base text-foreground/85">
                      <span
                        aria-hidden="true"
                        className="mt-[9px] h-px w-4 shrink-0 bg-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                </Reveal>
                {fase.image ? (
                  <div className="relative mt-7 aspect-[16/9] max-w-[520px] overflow-hidden rounded-lg border border-border">
                    <ParallaxImage
                      src={fase.image.src}
                      alt={fase.image.alt}
                      sizes="(max-width: 768px) 100vw, 520px"
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
