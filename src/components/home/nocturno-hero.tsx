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
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".nx-hero-line > span", { yPercent: 110, duration: 1.6, stagger: 0.18 }, 0.2)
        .from(".nx-search", { opacity: 0, y: 24, duration: 1.3 }, 0.8)
        .from(".nx-hero-sub, .nx-hero-actions", { opacity: 0, y: 16, duration: 1.1, stagger: 0.12 }, 0.7)
        .from(".nx-marquee", { opacity: 0, duration: 1.4 }, 1.3);
      // La foto se acerca con el desplazamiento en lugar de moverse sola al cargar.
      gsap.fromTo(".nx-hero-media img", { scale: 1.12 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 1.2 },
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
        <h1 id="hero-title" className="nx-hero-title">
          <span className="nx-hero-line"><span>La venta empieza</span></span>{" "}
          <span className="nx-hero-line"><span>antes del anuncio.</span></span>
        </h1>
        <p className="nx-hero-sub">Revisamos, valuamos, preparamos y promovemos tu propiedad, de la primera conversación a la firma.</p>
        <div className="nx-hero-actions">
          <Link href="/vender-propiedad#diagnostico" className="nx-btn nx-btn-primary">Pide tu opinión de valor</Link>
          <Link href="/#metodo" className="nx-btn">Ver cómo trabajamos</Link>
        </div>
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
