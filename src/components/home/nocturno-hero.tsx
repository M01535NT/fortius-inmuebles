"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Pause, Play, Search } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

type Option = { value: string; label: string };

/* Zonas de cobertura del marquee: texto de presentación, no un filtro. */
const COVERAGE = ["Playas de Tijuana", "Zona Río", "Otay", "Chapultepec", "Rosarito", "Tecate", "Ensenada"];

/** Inicio nocturno: foto a sangre, titular, buscador sólido y marquee al pie. */
export function NocturnoHero({ zonas, tipos }: { zonas: string[]; tipos: Option[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const router = useRouter();
  const [paused, setPaused] = React.useState(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .from(".nx-eyebrow", { opacity: 0, y: 12, duration: 0.8 }, 0.15)
        .from(".nx-hero-line > span", { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.2)
        .from(".nx-search", { opacity: 0, y: 24, duration: 1 }, 0.55)
        .from(".nx-hero-seller", { opacity: 0, duration: 0.8 }, 0.8)
        .from(".nx-marquee", { opacity: 0, duration: 1 }, 0.9);
      gsap.fromTo(".nx-hero-media img", { scale: 1.14 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
    });
    return () => media.revert();
  }, { scope: ref });

  /* The inventory reads its filters from the URL; empty choices are omitted. */
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => { if (typeof value === "string" && value) params.set(key, value); });
    const query = params.toString();
    router.push(query ? `/inventario?${query}` : "/inventario");
  }

  return (
    <section ref={ref} aria-labelledby="hero-title" className="nx-hero">
      <div className="nx-hero-media">
        <Image src="/hero/casa-playa.webp" alt="" fill priority sizes="100vw" />
      </div>
      <div className="nx-hero-scrim" aria-hidden="true" />
      <div className="nx-hero-body nx-container">
        <p className="nx-eyebrow">Inmobiliaria en Baja California</p>
        <h1 id="hero-title" className="nx-hero-title">
          <span className="nx-hero-line"><span>La venta empieza</span></span>{" "}
          <span className="nx-hero-line"><span>antes del anuncio.</span></span>
        </h1>
        <form role="search" aria-label="Buscar propiedades" action="/inventario" onSubmit={submit} className="nx-search">
          <label className="nx-field">
            <span className="nx-field-label">Operación</span>
            <select name="op" defaultValue="">
              <option value="">Comprar o rentar</option>
              <option value="venta">Comprar</option>
              <option value="renta">Rentar</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
          <label className="nx-field">
            <span className="nx-field-label">Tipo</span>
            <select name="tipo" defaultValue="">
              <option value="">Todos los tipos</option>
              {tipos.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
          <label className="nx-field">
            <span className="nx-field-label">Zona</span>
            <select name="zona" defaultValue="">
              <option value="">Todas las zonas</option>
              {zonas.map((zona) => <option key={zona} value={zona}>{zona}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
          <button type="submit" className="nx-search-submit"><Search size={18} aria-hidden="true" />Buscar</button>
        </form>
        <Link href="/vender-propiedad" className="nx-hero-seller">
          ¿Quieres vender? <strong>Pide una opinión de valor</strong>
        </Link>
      </div>
      <div className="nx-marquee" data-paused={paused}>
        <div className="nx-marquee-window">
          <div className="nx-marquee-track">
            <ul className="nx-marquee-group" aria-label="Zonas de cobertura">
              {COVERAGE.map((zona) => <li key={zona} className="nx-marquee-item">{zona}</li>)}
            </ul>
            <ul className="nx-marquee-group" aria-hidden="true">
              {COVERAGE.map((zona) => <li key={zona} className="nx-marquee-item">{zona}</li>)}
            </ul>
          </div>
        </div>
        <button type="button" className="nx-marquee-toggle" onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Reanudar el movimiento de zonas" : "Pausar el movimiento de zonas"}>
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
