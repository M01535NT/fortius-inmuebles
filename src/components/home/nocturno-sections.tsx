"use client";

import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatPrecio, TIPO_LABELS, type Property } from "@/data/propiedades";
import { barajasDestacadas, datosDestacada, marcaDestacada } from "@/lib/destacadas";
import * as React from "react";

/* Baraja (boceto H1 del lienzo «Bocetos de Propiedades destacadas»): cada carta se fija arriba y la siguiente la cubre. */
export function NocturnoDestacadas({ properties }: { properties: Property[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const barajas = React.useMemo(() => barajasDestacadas(properties), [properties]);
  const [elegida, setElegida] = React.useState(barajas[0]?.key);
  const baraja = barajas.find((b) => b.key === elegida) ?? barajas[0];

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".nx-title-mask > span", { yPercent: 110, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 82%", once: true } });
    });
    return () => media.revert();
  }, { scope: ref });

  return <section ref={ref} id="destacadas" aria-labelledby="destacadas-title" className="nx-section">
    <div className="nx-container">
      <div className="nx-head">
        <div>
          <h2 id="destacadas-title" className="nx-title"><span className="nx-title-mask"><span>Propiedades destacadas</span></span></h2>
        </div>
        <Link href="/inventario" className="nx-link">Explorar el inventario</Link>
      </div>
      {barajas.length > 1 && <div role="group" aria-label="Tipo de propiedad" className="nx-deck-filter">
        {barajas.map((b) => <button key={b.key} type="button" aria-pressed={b.key === baraja.key} onClick={() => setElegida(b.key)}>{b.label}</button>)}
      </div>}
    </div>
    {baraja && baraja.properties.length
      ? <>
          <ol className="nx-deck" aria-label={baraja.label === "Todas" ? "Propiedades destacadas" : baraja.label}>
            {baraja.properties.map((property, index) => <DeckCard key={property.slug} property={property} index={index} total={baraja.properties.length} />)}
          </ol>
          {baraja.inventario && <div className="nx-container nx-deck-more">
            <Link href={baraja.inventario.href} className="nx-link">{baraja.inventario.label}</Link>
          </div>}
        </>
      : <div className="nx-container"><p className="nx-empty">Por ahora no hay propiedades destacadas disponibles. Puedes consultar el inventario completo.</p></div>}
  </section>;
}

function DeckCard({ property, index, total }: { property: Property; index: number; total: number }) {
  const datos = datosDestacada(property);
  const foto = property.galeria[0];
  const cerrada = property.estado === "vendida" || property.estado === "rentada";
  return <li className="nx-deck-item" style={{ zIndex: index + 1 }}>
    <article data-property-card className="nx-deck-card">
      <Link href={`/inventario/${property.slug}`} data-cursor="Ver" className="nx-deck-link">
        {foto && <Image src={foto.src} alt={foto.alt} fill sizes="100vw" className={"nx-deck-img" + (cerrada ? " is-closed" : "")} />}
        <span className="nx-deck-top">
          <span>{property.zona}</span>
          <span className="nx-deck-badge">{marcaDestacada(property)}</span>
          <span className="nx-deck-count">{index + 1} de {total}</span>
        </span>
        <span className="nx-deck-bottom">
          <h3 className="nx-deck-name">{property.titulo}</h3>
          <span className="nx-deck-meta">
            <span className="nx-deck-price">{formatPrecio(property.precio)}</span>
            <span>{datos.length ? datos.join(" · ") : TIPO_LABELS[property.tipo]}</span>
            <span className="nx-deck-cta">Ver la propiedad</span>
          </span>
        </span>
      </Link>
    </article>
  </li>;
}
