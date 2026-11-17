"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { gsap, useGSAP } from "@/lib/gsap";
import { videoEmbedUrl } from "@/lib/video-embed";
import { Distintivo } from "@/components/sitio/distintivo";
import { FlechaDerecha } from "@/components/sitio/iconos";
import { VideoFondo } from "@/components/sitio/video-fondo";
import { ESTADO_LABELS, formatPrecio, OPERACION_LABELS, type Property } from "@/data/propiedades";

/*
  En el mercado ahora (17/11/2026), como en el boceto: tira de tarjetas altas. La primera es ancha
  y lleva el video del inmueble si tiene uno propio (un enlace de YouTube o Vimeo no sirve de
  fondo; entonces va su foto). Al bajar, la tira se desliza de lado; también se arrastra con el
  ratón o se recorre con el dedo o la rueda. En el teléfono y con movimiento reducido no se
  desliza sola.
*/
export function TiraPropiedades({ propiedades }: { propiedades: Property[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const marcoRef = React.useRef<HTMLDivElement>(null);
  const arrastre = React.useRef({ activo: false, x: 0, scroll: 0, movio: false });

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
      const pista = ref.current?.querySelector<HTMLElement>(".tp-pista");
      const marco = marcoRef.current;
      if (!pista || !marco) return;
      // Como el boceto: un recorrido corto (hasta 360 px) mientras baja pantalla y media; el resto se arrastra.
      const sobra = () => Math.max(0, pista.scrollWidth - marco.clientWidth);
      gsap.fromTo(pista, { x: 120 }, { x: () => 120 - Math.min(360, sobra() + 120), ease: "none", scrollTrigger: { trigger: marco, start: "top bottom", end: () => `+=${window.innerHeight * 1.5}`, scrub: 0.6, invalidateOnRefresh: true } });
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [propiedades.length] });

  // Arrastre con el ratón; el dedo y la rueda usan el desplazamiento propio del navegador.
  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !marcoRef.current) return;
    arrastre.current = { activo: true, x: e.clientX, scroll: marcoRef.current.scrollLeft, movio: false };
  };
  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    const marco = marcoRef.current;
    if (!a.activo || !marco) return;
    const dx = e.clientX - a.x;
    if (!a.movio && Math.abs(dx) > 6) {
      a.movio = true;
      marco.setPointerCapture(e.pointerId);
      marco.classList.add("tp-arrastrando");
    }
    if (a.movio) marco.scrollLeft = a.scroll - dx;
  };
  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    arrastre.current.activo = false;
    marcoRef.current?.classList.remove("tp-arrastrando");
    if (marcoRef.current?.hasPointerCapture(e.pointerId)) marcoRef.current.releasePointerCapture(e.pointerId);
  };
  // Si hubo arrastre, el clic que lo termina no abre la ficha.
  const alClic = (e: React.MouseEvent<HTMLDivElement>) => {
    if (arrastre.current.movio) {
      e.preventDefault();
      e.stopPropagation();
      arrastre.current.movio = false;
    }
  };

  if (!propiedades.length) return null;

  return (
    <section ref={ref} className="tp" aria-labelledby="tp-titulo">
      <div className="s-contenedor tp-cabeza">
        <h2 id="tp-titulo" className="s-h2">En el mercado ahora</h2>
        <Link href="/inventario" className="s-enlace">Ver todo el inventario<FlechaDerecha /></Link>
      </div>
      <div
        ref={marcoRef}
        className="tp-marco"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClickCapture={alClic}
        onDragStart={(e) => e.preventDefault()}
      >
        <ul className="tp-pista">
          {propiedades.map((p, i) => {
            const foto = p.galeria[0];
            const video = i === 0 && p.videoUrl && !videoEmbedUrl(p.videoUrl) ? p.videoUrl : undefined;
            const sello = p.estado !== "disponible" ? ESTADO_LABELS[p.estado] : `${OPERACION_LABELS[p.operacion]}${p.demo ? " de ejemplo" : ""}`;
            return (
              <li key={p.slug} className={i % 3 === 0 ? "tp-ancha" : undefined}>
                <Link href={`/inventario/${p.slug}`} className="tp-tarjeta">
                  {foto && <Image src={foto.src} alt={foto.alt} fill sizes="(max-width: 767px) 85vw, 640px" />}
                  {video && foto && <VideoFondo mp4={video} poster={foto.src} className="tp-video" />}
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
