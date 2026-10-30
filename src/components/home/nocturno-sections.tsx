"use client";

import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/data/propiedades";
import * as React from "react";

export function NocturnoDestacadas({ properties }: { properties: Property[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const [lead, ...rest] = properties;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".nx-title-mask > span", { yPercent: 110, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 82%", once: true } });
    });
    return () => media.revert();
  }, { scope: ref });

  return <section ref={ref} id="destacadas" aria-labelledby="destacadas-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <p className="nx-eyebrow">Inventario</p>
        <h2 id="destacadas-title" className="nx-title"><span className="nx-title-mask"><span>Propiedades destacadas</span></span></h2>
      </div>
      <Link href="/inventario" className="nx-link">Explorar el inventario</Link>
    </div>
    {lead
      ? <div className="nx-props-layout">
          <PropertyCard property={lead} layout="feature" />
          {rest.length > 0 && <div className="nx-props-rows">{rest.map((property) => <PropertyCard key={property.slug} property={property} layout="row" />)}</div>}
        </div>
      : <p className="nx-empty">Por ahora no hay propiedades destacadas disponibles. Puedes consultar el inventario completo.</p>}
  </section>;
}
