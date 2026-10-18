"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Nosotros: entradas al desplazar. Cada bloque con [data-reveal] sube y se
  enciende al entrar en pantalla; los hijos con [data-reveal-item] llegan
  escalonados. Con movimiento reducido todo se muestra de inmediato.
*/
export function AboutReveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(block => {
        const items = block.querySelectorAll<HTMLElement>("[data-reveal-item]");
        const targets = items.length ? items : [block];
        // Blocks already on screen play at once; the rest wait for the scroll.
        const visible = block.getBoundingClientRect().top < window.innerHeight * 0.85;
        gsap.fromTo(targets, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: "expo.out", clearProps: "opacity,transform",
          scrollTrigger: visible ? undefined : { trigger: block, start: "top 85%", once: true },
        });
      });
    });
    return () => media.revert();
  }, { scope: ref });

  return <div ref={ref} className="about-reveal">{children}</div>;
}
