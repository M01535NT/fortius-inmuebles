"use client";

import * as React from "react";
import Link from "next/link";

import { SplitHeading } from "@/components/gsap/split-heading";
import { EASE_OUT, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/* Contract terms and owner decisions, with the existing row reveal. */
const COMPROMISOS = [
  "Los honorarios y el trabajo incluido se establecen en el contrato.",
  "El precio de publicación y la aceptación de una oferta se acuerdan contigo.",
  "Los gastos e impuestos se presentan como estimaciones hasta que se confirmen los importes.",
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
            lines={["Antes de contratar"]}
            charDelay={0.012}
            className="display-soft text-2xl text-foreground lg:col-span-4"
          />
          <div className="lg:col-span-7 lg:col-start-6">
            <ul ref={listRef} className="border-t border-border">
              {COMPROMISOS.map((c) => (
                <li key={c} data-fila className="relative">
                  <span
                    data-hairline
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px bg-border"
                  />
                  <p data-texto className="py-4 text-base leading-relaxed text-foreground/85">{c}</p>
                </li>
              ))}
            </ul>
            <Link href="/privacidad" className="mt-5 inline-block text-sm text-primary underline underline-offset-4">
              Consulta cómo tratamos tus datos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
