"use client";

import * as React from "react";
import Image from "next/image";
import { gsap, useGSAP } from "@/lib/gsap";

/** Portada mínima (boceto 2): foto a sangre y una frase abajo a la izquierda. */
export function NocturnoHero() {
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".nx-hero-line > span", { yPercent: 110, duration: 1.6, stagger: 0.18, ease: "power3.out", delay: 0.2 });
      // La foto se acerca con el desplazamiento en lugar de moverse sola al cargar.
      gsap.fromTo(".nx-hero-media img", { scale: 1.12 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 1.2 },
      });
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <section ref={ref} aria-labelledby="hero-title" className="nx-hero">
      <div className="nx-hero-media">
        <Image src="/hero/casa-playa.webp" alt="Residencia de dos niveles frente al mar en Playas de Tijuana al atardecer" fill priority sizes="100vw" />
      </div>
      <div className="nx-hero-scrim" aria-hidden="true" />
      <div className="nx-hero-body nx-container">
        <h1 id="hero-title" className="nx-hero-title">
          <span className="nx-hero-line"><span>Compra, vende o renta</span></span>{" "}
          <span className="nx-hero-line"><span>con cada paso documentado.</span></span>
        </h1>
      </div>
    </section>
  );
}
