"use client";

import * as React from "react";
import Link from "next/link";

import { gsap, useGSAP } from "@/lib/gsap";
import { FlechaDerecha } from "@/components/sitio/iconos";
import { VideoFondo } from "@/components/sitio/video-fondo";

const COLUMNAS = [
  { titulo: "Propiedades", texto: "Venta y renta de casas, departamentos, locales, oficinas, naves y terrenos." },
  { titulo: "Papeles", texto: "Escritura, adeudos o una hipoteca por cancelar: qué falta y qué sigue." },
  { titulo: "Números", texto: "Cuánto vale, cuánto cuesta cerrar y cuánto pagarías al mes." },
];

/*
  Quiénes somos (17/11/2026): un titular corto y un video que crece hasta ocupar el ancho de la
  pantalla al bajar; las tres columnas suben con él. Con movimiento reducido el video ya está
  abierto y quieto en su póster.
*/
export function QuienesSomos() {
  const ref = React.useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
      const caja = ref.current?.querySelector<HTMLElement>(".qs-video");
      const columnas = ref.current?.querySelector<HTMLElement>(".qs-columnas");
      if (!caja || !columnas) return;
      const disparo = { trigger: caja, start: "top bottom", end: "top 20%", scrub: 0.6 };
      gsap.fromTo(caja, { width: "62%", borderRadius: 28 }, { width: "100%", borderRadius: 0, ease: "none", scrollTrigger: disparo });
      gsap.fromTo(columnas, { y: 48 }, { y: 0, ease: "none", scrollTrigger: disparo });
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <section ref={ref} className="qs" aria-labelledby="qs-titulo">
      <div className="s-contenedor qs-cabeza">
        <h2 id="qs-titulo" className="qs-titulo">Una inmobiliaria para lo que traigas.</h2>
        <div className="qs-apoyo">
          <p>Vendemos, compramos y rentamos propiedades en Baja California. Y cuando el asunto es otro, también lo vemos contigo.</p>
          <Link href="/nosotros" className="s-enlace">Conocer al equipo<FlechaDerecha /></Link>
        </div>
      </div>
      <div className="qs-video s-banda">
        <VideoFondo webm="/hero/asunto-nave.webm" mp4="/hero/asunto-nave.mp4" poster="/hero/asunto-nave-poster.webp" className="qs-media" />
        <span className="qs-velo" aria-hidden="true" />
        <div className="s-contenedor qs-columnas">
          {COLUMNAS.map((c) => (
            <div key={c.titulo} className="qs-columna">
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
