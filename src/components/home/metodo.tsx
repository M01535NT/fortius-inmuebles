"use client";

import * as React from "react";
import { homeText } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { SplitHeading } from "@/components/gsap/split-heading";
import { gsap, useGSAP } from "@/lib/gsap";
import { FASES } from "@/data/metodo";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

export function Metodo({ anchor = true, content }: { anchor?: boolean; content?: SiteContent | null }) {
  const reduce = useReducedMotionSafe();
  const stageRef = React.useRef<HTMLElement>(null);
  const tabsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = React.useState(0);

  useGSAP(() => {
    if (reduce) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".method-atmosphere", { opacity: 0.2 }, {
        opacity: 0.75, ease: "none",
        scrollTrigger: { trigger: stageRef.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });
    return () => media.revert();
  }, { scope: stageRef, dependencies: [reduce], revertOnUpdate: true });

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? FASES.length - 1
      : null;
    if (next === null) return;
    event.preventDefault();
    const target = (next + FASES.length) % FASES.length;
    setActive(target);
    tabsRef.current[target]?.focus();
  };

  return (
    <section ref={stageRef} id={anchor ? "metodo" : undefined} className="method-stage relative scroll-mt-20 py-24 md:py-36">
      <div className="method-atmosphere pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SplitHeading reveal="lines" lines={homeText(content, "metodoTitulo").split("\n")} className="display-title text-4xl text-foreground sm:text-5xl" />
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-muted-foreground">{homeText(content, "metodoTexto")}</p>
          </div>
        </div>
        <div className="relative min-w-0 lg:col-span-8" aria-label="Etapas de la venta">
          <div className="method-accordion" data-method-accordion>
            {FASES.map((fase, index) => {
              const isActive = active === index;
              const tabId = `method-tab-${index}`;
              const panelId = `method-panel-${index}`;
              return <article key={fase.n} className={`method-panel${isActive ? " is-active" : ""}`} data-method-panel>
                <h3 className="method-tab-heading">
                  <button
                    ref={(node) => { tabsRef.current[index] = node; }}
                    type="button"
                    className="method-tab"
                    id={tabId}
                    aria-expanded={isActive}
                    aria-controls={panelId}
                    onClick={() => setActive(index)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                  >
                    <span className="method-tab-number">{fase.n}</span>
                    <span className="method-tab-title">{fase.title}</span>
                    <span className="method-tab-mark" aria-hidden="true">{isActive ? "−" : "+"}</span>
                  </button>
                </h3>
                <div className="method-panel-body" id={panelId} aria-labelledby={tabId} hidden={!isActive}>
                  <span className="method-panel-index">{fase.n} / {String(FASES.length).padStart(2, "0")}</span>
                  <p className="method-panel-title">{fase.title}</p>
                  <p className="method-panel-copy">{homeText(content, fase.copy)}</p>
                </div>
              </article>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
