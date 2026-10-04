"use client";

import * as React from "react";
import { homeText } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { SplitHeading } from "@/components/gsap/split-heading";
import { gsap, useGSAP } from "@/lib/gsap";

import { FASES } from "@/data/metodo";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

/* Cards stack on desktop and touch screens; reduced motion keeps normal flow. */
export function Metodo({ anchor = true, content }: { anchor?: boolean; content?: SiteContent | null }) {
  const reduce = useReducedMotionSafe();
  const stageRef = React.useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reduce) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-method-card]", stageRef.current);
      cards.slice(0, -1).forEach((card, index) => {
        gsap.to(card, {
          scale: 0.96, transformOrigin: "center top", ease: "none",
          scrollTrigger: { trigger: cards[index + 1], start: "top 75%", end: "top 130px", scrub: 0.45 },
        });
      });
      gsap.fromTo(".method-atmosphere", { opacity: 0.2 }, {
        opacity: 0.85, ease: "none",
        scrollTrigger: { trigger: stageRef.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });
    return () => media.revert();
  }, { scope: stageRef, dependencies: [reduce], revertOnUpdate: true });

  return (
    <section
      ref={stageRef}
      id={anchor ? "metodo" : undefined}
      className="method-stage relative scroll-mt-20 py-24 md:py-36"
    >
      <div className="method-atmosphere pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 md:px-8 lg:grid-cols-12">
        {/* Sticky intro column */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SplitHeading reveal="lines" lines={homeText(content, "metodoTitulo").split("\n")} className="display-title text-4xl text-foreground sm:text-5xl" />
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-muted-foreground">
              {homeText(content, "metodoTexto")}
            </p>
          </div>
        </div>

        {/* Stacked phases */}
        <div className="relative lg:col-span-7 lg:col-start-6">
          <ol className="method-cards">
            {FASES.map((fase, index) => (
              <li key={fase.n} data-method-card className="method-card" style={{ "--phase-index": index } as React.CSSProperties}>
                <div className="mb-5 border-b border-border pb-3">
                  <span className="font-mono text-xs text-primary">Paso {index + 1} de {FASES.length}</span>
                </div>
                <div className="method-card-content">
                  <h3 className="display-soft text-[clamp(1.8rem,4vw,2.8rem)] text-foreground">
                    {fase.title}
                  </h3>
                  <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
                    {homeText(content, fase.copy)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
