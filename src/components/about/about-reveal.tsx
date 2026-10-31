"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Nosotros: entradas al desplazar. Cada bloque con [data-reveal] sube y se
  enciende al entrar en pantalla; los hijos con [data-reveal-item] llegan
  escalonados. Lo que ya se ve al abrir la página no se oculta ni se anima
  (ningún texto depende del script para verse). Con movimiento reducido
  todo se muestra de inmediato.
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
        // Lo que ya está en pantalla se queda como llegó del servidor; el resto entra al desplazar.
        if (block.getBoundingClientRect().top < window.innerHeight * 0.85) return;
        gsap.fromTo(targets, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", clearProps: "opacity,transform",
          scrollTrigger: { trigger: block, start: "top 85%", once: true },
        });
      });
    });
    return () => media.revert();
  }, { scope: ref });

  return <div ref={ref} className="about-reveal">{children}</div>;
}
