"use client";

import { useState } from "react";

const services = ["Precio de salida", "Revisión documental", "Fotografía", "Visitas coordinadas", "Negociación", "Cierre"];

/** One accessible list; the second copy only closes the visual loop. */
export function HeroMarquee() {
  const [paused, setPaused] = useState(false);
  return <button type="button" className="hero-marquee" aria-pressed={paused}
    aria-label={paused ? "Reanudar banda de servicios" : "Pausar banda de servicios"}
    aria-describedby="hero-marquee-services" onClick={() => setPaused((value) => !value)}>
    <span id="hero-marquee-services" className="sr-only">{services.join(" · ")}</span>
    <span className="hero-marquee-track" aria-hidden="true" style={{ animationPlayState: paused ? "paused" : "running" }}>
      {[0, 1].map((copy) => <span key={copy} className="hero-marquee-group" data-marquee-copy={copy}>
        {services.map((service) => <span className="hero-marquee-item" key={service}><span />{service}</span>)}
      </span>)}
    </span>
  </button>;
}

