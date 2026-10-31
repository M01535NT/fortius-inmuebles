"use client";

import * as React from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Portada (30/10/2026): video a sangre en bucle y sin sonido, con el titular que sube
  desde su máscara. Dice dónde trabaja Fortius, qué hace y qué puede hacer quien llega.
  Con movimiento reducido el video queda quieto en su primer cuadro.
*/
export function NocturnoHero() {
  const ref = React.useRef<HTMLElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".nx-hero-rise", { yPercent: 110, duration: 1.6, stagger: 0.14, ease: "power3.out", delay: 0.2 });
      gsap.from(".nx-hero-fade", { opacity: 0, y: 18, duration: 1.2, stagger: 0.12, ease: "power3.out", delay: 0.7 });
      // El video se acerca con el desplazamiento, como lo hacía la foto.
      gsap.fromTo(".nx-hero-media video", { scale: 1.08 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 1.2 },
      });
      video.current?.play().catch(() => { /* el póster se queda */ });
    });
    media.add("(prefers-reduced-motion: reduce)", () => { video.current?.pause(); });
    return () => media.revert();
  }, { scope: ref });

  return (
    <section ref={ref} aria-labelledby="hero-title" className="nx-hero">
      <div className="nx-hero-media">
        <video ref={video} src="/hero/portada.mp4" poster="/hero/portada-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
      </div>
      <div className="nx-hero-scrim" aria-hidden="true" />
      <div className="nx-hero-body nx-container">
        <p className="nx-hero-eyebrow"><span className="nx-hero-line"><span className="nx-hero-rise">Inmobiliaria en Tijuana, Rosarito, Tecate y Ensenada</span></span></p>
        <h1 id="hero-title" className="nx-hero-title">
          <span className="nx-hero-line"><span className="nx-hero-rise">Te ayudamos a vender o comprar</span></span>{" "}
          <span className="nx-hero-line"><span className="nx-hero-rise">tu propiedad, con cada paso por escrito.</span></span>
        </h1>
        <div className="nx-hero-foot">
          <p className="nx-hero-lead nx-hero-fade">Revisamos los documentos, fijamos el precio con datos y te decimos qué sigue en cada etapa.</p>
          <div className="nx-hero-actions nx-hero-fade">
            <Link href="/vender-propiedad" className="nx-btn nx-btn-primary">Quiero vender</Link>
            <Link href="/inventario" className="nx-btn nx-btn-light">Quiero comprar</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
