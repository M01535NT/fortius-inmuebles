"use client";

import * as React from "react";

import { SplitHeading } from "@/components/gsap/split-heading";
import { EASE_OUT, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/*
  Compromisos: prueba social honesta mientras no existan testimonios
  reales (guardrail: nada inventado). Cada fila se ilumina al cruzar el
  viewport: hairline que crece, texto de tenue a pleno y número con pop.
  Repetible al re-scrollear.
*/
const COMPROMISOS = [
  "Información clara antes de cada decisión, no después.",
  "Seguimiento por escrito de tu propiedad o tu búsqueda.",
  "Comunicación directa durante todo el proceso.",
  "Cuidado con tus datos y tus documentos.",
];

export function Compromisos() {
  const listRef = React.useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || prefersReducedMotion()) return;

      gsap.utils.toArray<HTMLElement>("[data-fila]", list).forEach((fila, i) => {
        const tl = gsap.timeline({
          delay: 0.06 * i,
          scrollTrigger: {
            trigger: fila,
            start: "top 78%",
            toggleActions: "restart none none reverse",
          },
        });
        tl.from(fila.querySelector("[data-hairline]"), {
          scaleX: 0,
          transformOrigin: "0% 50%",
          duration: 0.8,
          ease: EASE_OUT,
        })
          .from(
            fila.querySelector("[data-texto]"),
            { x: -18, opacity: 0.25, duration: 0.6, ease: EASE_OUT },
            0.1,
          )
          .from(
            fila.querySelector("[data-num]"),
            { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(2.2)" },
            0.15,
          );
      });
    },
    { scope: listRef },
  );

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <SplitHeading
            lines={["Lo que puedes esperar", "en cada operación"]}
            charDelay={0.012}
            className="display-soft text-2xl text-foreground lg:col-span-4"
          />
          <div className="lg:col-span-7 lg:col-start-6">
            <ul ref={listRef} className="border-t border-border">
              {COMPROMISOS.map((c, i) => (
                <li key={c} data-fila className="relative">
                  <span
                    data-hairline
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-border"
                  />
                  <div data-texto className="flex items-baseline gap-4 py-4">
                    <span data-num className="inline-block font-mono text-[12px] text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] text-foreground/85">{c}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
