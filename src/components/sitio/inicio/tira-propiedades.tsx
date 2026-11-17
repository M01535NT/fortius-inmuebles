"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { gsap, useGSAP } from "@/lib/gsap";
import { Distintivo } from "@/components/sitio/distintivo";
import { FlechaDerecha } from "@/components/sitio/iconos";
import { ESTADO_LABELS, formatPrecio, OPERACION_LABELS, type Property } from "@/data/propiedades";

/*
  En el mercado ahora (17/11/2026): tira de propiedades publicadas que se desliza de lado al
  bajar. Las tarjetas alternan ancho, como en el boceto. En el teléfono, o con movimiento
  reducido, la tira se recorre con el dedo o con la barra, sin desplazamiento automático.
*/
export function TiraPropiedades({ propiedades }: { propiedades: Property[] }) {
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
      const pista = ref.current?.querySelector<HTMLElement>(".tp-pista");
      const marco = ref.current?.querySelector<HTMLElement>(".tp-marco");
      if (!pista || !marco) return;
      const sobra = () => Math.max(0, pista.scrollWidth - marco.clientWidth);
      if (sobra() < 40) return;
      gsap.fromTo(pista, { x: 120 }, { x: () => -sobra(), ease: "none", scrollTrigger: { trigger: marco, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } });
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [propiedades.length] });

  if (!propiedades.length) return null;

  return (
    <section ref={ref} className="tp" aria-labelledby="tp-titulo">
      <div className="s-contenedor tp-cabeza">
        <h2 id="tp-titulo" className="s-h2">En el mercado ahora</h2>
        <Link href="/inventario" className="s-enlace">Ver todo el inventario<FlechaDerecha /></Link>
      </div>
      <div className="tp-marco">
        <ul className="tp-pista">
          {propiedades.map((p, i) => {
            const foto = p.galeria[0];
            const sello = p.estado !== "disponible" ? ESTADO_LABELS[p.estado] : `${OPERACION_LABELS[p.operacion]}${p.demo ? " de ejemplo" : ""}`;
            return (
              <li key={p.slug} className={i % 3 === 0 ? "tp-ancha" : undefined}>
                <Link href={`/inventario/${p.slug}`} className="tp-tarjeta">
                  {foto && <Image src={foto.src} alt={foto.alt} fill sizes="(max-width: 767px) 85vw, 640px" />}
                  <span className="tp-velo" aria-hidden="true" />
                  <span className="tp-arriba"><Distintivo tono="media">{sello}</Distintivo></span>
                  <span className="tp-abajo">
                    <span className="tp-datos">
                      <span className="tp-zona">{p.zona}</span>
                      <span className="tp-nombre">{p.titulo}</span>
                    </span>
                    <span className="tp-precio">{formatPrecio(p.precio)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
