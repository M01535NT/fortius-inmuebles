"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Video de fondo para una sección (31/10/2026). Va detrás del contenido con un velo de marca.
  Solo se descarga y reproduce cuando la sección está a la vista, y se pausa al salir; en
  pantallas angostas usa la versión ligera. Con movimiento reducido, ahorro de datos o sin
  JavaScript queda el póster. Sin acercamiento con el desplazamiento: escalar el video en cada
  cuadro le provocaba tirones. Los archivos van en ida y vuelta (sin fundido) para que el bucle
  no tenga saltos ni imágenes fantasma.
*/
type Props = { src: string; mobileSrc?: string; poster: string };

export function SectionVideo({ src, mobileSrc, poster }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);

  useGSAP(() => {
    const el = video.current;
    const box = ref.current;
    if (!el || !box) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      if (saveData) return;
      el.src = mobileSrc && matchMedia("(max-width: 767px)").matches ? mobileSrc : src;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => { /* el póster se queda */ });
        else el.pause();
      }, { rootMargin: "120px 0px" });
      observer.observe(box);
      return () => { observer.disconnect(); el.pause(); };
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <div ref={ref} className="nx-band-video" aria-hidden="true">
      <video ref={video} poster={poster} muted loop playsInline preload="none" tabIndex={-1} />
    </div>
  );
}
