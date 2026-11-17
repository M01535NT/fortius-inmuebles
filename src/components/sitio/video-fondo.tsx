"use client";

import * as React from "react";

type Props = {
  /** WebM ligero; se usa cuando el navegador lo reproduce. */
  webm?: string;
  /** Respaldo en MP4 para navegadores sin WebM (iPhone anteriores a iOS 17.4). */
  mp4: string;
  poster: string;
  /** Solo corre el video activo; los demás quedan en su póster. */
  activo?: boolean;
  className?: string;
};

/*
  Video de fondo (17/11/2026): muestra el póster y solo descarga el video cuando está a la vista
  y activo. Se pausa al salir. Con movimiento reducido o ahorro de datos se queda el póster.
  Es decorativo: sin sonido, sin controles y fuera del recorrido con teclado.
*/
export function VideoFondo({ webm, mp4, poster, activo = true, className }: Props) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "160px 0px" });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!activo || !visible || reducido || ahorro) { el.pause(); return; }
    if (!el.getAttribute("src")) {
      el.src = webm && el.canPlayType('video/webm; codecs="vp9"') ? webm : mp4;
    }
    el.play().catch(() => { /* se queda el póster */ });
  }, [activo, visible, webm, mp4]);

  return <video ref={ref} className={className} poster={poster} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />;
}
