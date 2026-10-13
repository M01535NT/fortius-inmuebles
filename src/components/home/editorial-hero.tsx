"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

export function EditorialHero() {
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const entrance = gsap.timeline({ defaults: { duration: 0.65, ease: "power3.out" } });
      entrance
        .from(".editorial-cover-eyebrow", { opacity: 0, y: 8 }, 0)
        .from(".editorial-title-line", { opacity: 0, y: 18, stagger: 0.1 }, 0.12)
        .from(".editorial-cover-description", { opacity: 0, y: 12 }, 0.25)
        .from(".editorial-cover-actions > a", { opacity: 0, y: 10, stagger: 0.1 }, 0.36)
        .from(".editorial-cover-photo", { scale: 1.025, duration: 0.85 }, 0);
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <section ref={ref} aria-labelledby="hero-title" className="editorial-hero">
      <div className="editorial-hero-content editorial-container">
        <div className="editorial-cover-copy">
          <div className="editorial-cover-heading">
            <p className="editorial-cover-eyebrow">INMOBILIARIA EN BAJA CALIFORNIA</p>
            <h1 id="hero-title" className="editorial-cover-title">
              <span className="editorial-title-line">La venta empieza</span>{" "}
              <span className="editorial-title-line editorial-cover-emphasis">antes del anuncio.</span>
            </h1>
          </div>
          <p className="editorial-cover-description">
            Analizamos el mercado, revisamos la documentación y coordinamos contigo cada etapa de la comercialización de tu propiedad.
          </p>
          <div className="editorial-cover-actions">
            <Link href="/vender-propiedad" className="editorial-hero-primary">
              Quiero vender mi propiedad <span className="editorial-cta-direction" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </Link>
            <Link href="/inventario" className="editorial-hero-secondary">
              <span>Ver propiedades</span><ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <a href="#hero-panorama" className="editorial-scroll-cue">
          <span>Desplázate para descubrir</span>
          <ChevronDown size={20} aria-hidden="true" />
        </a>
      </div>
      <span id="hero-panorama" className="editorial-photo-start" aria-hidden="true" />
      <figure className="editorial-cover-figure">
        <div className="editorial-cover-window">
          <div className="editorial-cover-photo">
            <Image src="/hero/panorama-editorial-full.webp" alt="Panorámica de arquitectura comercial y paisaje costero, imagen conceptual de referencia"
              fill loading="eager" fetchPriority="high" sizes="max(100vw, 300svh)"
              className="object-cover" />
          </div>
        </div>
      </figure>
    </section>
  );
}
