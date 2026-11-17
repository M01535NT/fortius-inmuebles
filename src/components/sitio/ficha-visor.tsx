"use client";

import * as React from "react";
import Image from "next/image";

import type { ImagenPropiedad } from "@/data/propiedades";
import { PropertyShare } from "@/components/property/property-share";
import { Pestanas, type Opcion } from "@/components/sitio/pestanas";
import { videoEmbedUrl } from "@/lib/video-embed";

type Modo = "fotos" | "video" | "360";

type Props = {
  imagenes: ImagenPropiedad[];
  titulo: string;
  videoUrl?: string;
  tour360Url?: string;
  fichaUrl?: string;
  share?: { title: string; text: string; url: string };
};

const ETIQUETAS: Record<Modo, string> = { fotos: "Fotos", video: "Video", "360": "360°" };

function Icono({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const ANTERIOR = "M15 18l-6-6 6-6";
const SIGUIENTE = "M9 18l6-6-6-6";
const AMPLIAR = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
const PAUSA = "M9 5v14M15 5v14";
const REPRODUCIR = "M7 4.5v15l12-7.5z";
const DOCUMENTO = "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6";
const CERRAR = "M6 6l12 12M18 6L6 18";

/*
  Marco de la ficha (17/11/2026): fotos, video y 360° en un marco limpio, sin
  nada encima. Todos los controles van debajo: pestañas, flechas, miniaturas,
  contador, pausa, pantalla completa, compartir y la ficha técnica en PDF.
  La foto se amplía en una ventana que se recorre con flechas o deslizando.
*/
export function FichaVisor({ imagenes, titulo, videoUrl, tour360Url, fichaUrl, share }: Props) {
  const videoEmbed = videoEmbedUrl(videoUrl);
  const modos: Modo[] = ["fotos", ...(videoUrl ? ["video" as const] : []), ...(tour360Url ? ["360" as const] : [])];
  const opciones: Opcion<Modo>[] = modos.map((valor) => ({ valor, etiqueta: ETIQUETAS[valor] }));
  const [modo, setModo] = React.useState<Modo>("fotos");
  const [index, setIndex] = React.useState(0);
  const [pausado, setPausado] = React.useState(true);
  const marcoRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const ampliarRef = React.useRef<HTMLButtonElement>(null);
  const toque = React.useRef<{ x: number; y: number } | null>(null);
  const actual = imagenes[index] ?? imagenes[0];
  const varias = imagenes.length > 1;

  const mover = React.useCallback((paso: 1 | -1) => {
    setIndex((i) => (i + paso + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  // Con movimiento reducido el video no arranca solo.
  React.useEffect(() => {
    if (modo !== "video" || !videoRef.current) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // El botón sigue al video por sus eventos de reproducir y pausar.
    if (reducido) { videoRef.current.pause(); return; }
    videoRef.current.play().catch(() => {});
  }, [modo]);

  function alternarVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {}); else video.pause();
  }

  function pantallaCompleta() {
    if (modo === "fotos") { dialogRef.current?.showModal(); return; }
    void marcoRef.current?.requestFullscreen?.();
  }

  function deslizar(inicio: { x: number; y: number } | null, fin: { clientX: number; clientY: number }) {
    if (!inicio || Math.abs(fin.clientY - inicio.y) > Math.abs(fin.clientX - inicio.x)) return;
    if (Math.abs(fin.clientX - inicio.x) > 40) mover(fin.clientX < inicio.x ? 1 : -1);
  }
  const alTocar = (event: React.TouchEvent) => { const t = event.touches[0]; toque.current = { x: t.clientX, y: t.clientY }; };
  const alSoltar = (event: React.TouchEvent) => { deslizar(toque.current, event.changedTouches[0]); toque.current = null; };

  if (!actual) return null;

  return (
    <div className="fv">
      <div ref={marcoRef} id={`fv-panel-${modo}`} role={modos.length > 1 ? "tabpanel" : undefined} className="fv-marco" onTouchStart={modo === "fotos" ? alTocar : undefined} onTouchEnd={modo === "fotos" ? alSoltar : undefined}>
        {modo === "fotos" && (
          <button ref={ampliarRef} type="button" className="fv-foto" onClick={() => dialogRef.current?.showModal()} aria-label={`Ampliar fotografía: ${actual.alt}`}>
            <Image key={actual.src} src={actual.src} alt={actual.alt} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 1360px" />
          </button>
        )}
        {modo === "video" && videoUrl && (videoEmbed
          ? <iframe src={videoEmbed} title={`Video de ${titulo}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          : <video ref={videoRef} src={videoUrl} muted loop playsInline preload="metadata" aria-label={`Video de ${titulo}`}
            onLoadStart={() => setPausado(true)} onPlay={() => setPausado(false)} onPause={() => setPausado(true)} />)}
        {modo === "360" && tour360Url && <iframe src={tour360Url} title={`Recorrido 360° de ${titulo}`} allowFullScreen />}
      </div>

      <div className="fv-controles">
        {modos.length > 1 && <Pestanas opciones={opciones} valor={modo} onCambio={setModo} etiqueta="Qué ver" chicas idPanel={(m) => `fv-panel-${m}`} />}

        {modo === "fotos" && varias && (
          <div className="fv-fotos">
            <button type="button" className="s-btn s-btn-contorno s-btn-icono" onClick={() => mover(-1)} aria-label="Foto anterior"><Icono d={ANTERIOR} /></button>
            <div className="fv-miniaturas" role="group" aria-label={`Fotos de ${titulo}`}>
              {imagenes.map((img, i) => (
                <button key={img.src} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)}>
                  <Image src={img.src} alt="" fill sizes="80px" />
                </button>
              ))}
            </div>
            <button type="button" className="s-btn s-btn-contorno s-btn-icono" onClick={() => mover(1)} aria-label="Foto siguiente"><Icono d={SIGUIENTE} /></button>
            <span className="fv-contador" aria-live="polite">{index + 1} / {imagenes.length}</span>
          </div>
        )}

        {modo === "video" && !videoEmbed && (
          <button type="button" className="s-btn s-btn-contorno s-btn-chico" onClick={alternarVideo} aria-pressed={pausado}>
            <Icono d={pausado ? REPRODUCIR : PAUSA} size={16} />{pausado ? "Reproducir" : "Pausar"}
          </button>
        )}

        <div className="fv-acciones">
          <button type="button" className="s-btn s-btn-contorno s-btn-icono" onClick={pantallaCompleta} aria-label="Pantalla completa"><Icono d={AMPLIAR} /></button>
          {share && <PropertyShare {...share} />}
          {fichaUrl && <a href={fichaUrl} download className="s-btn s-btn-contorno s-btn-chico"><Icono d={DOCUMENTO} size={16} />Ficha técnica<span className="sr-only"> en PDF</span></a>}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="fv-ventana"
        aria-label="Fotografías del inmueble"
        onClose={() => ampliarRef.current?.focus()}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); mover(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); mover(-1); }
        }}
        onTouchStart={alTocar}
        onTouchEnd={alSoltar}
      >
        <div className="fv-ventana-foto">
          <Image src={actual.src} alt={actual.alt} fill sizes="100vw" />
        </div>
        <div className="fv-ventana-controles">
          {varias && <button type="button" className="s-btn s-btn-contorno s-btn-icono" onClick={() => mover(-1)} aria-label="Fotografía anterior"><Icono d={ANTERIOR} /></button>}
          <span role="status" className="fv-contador">{index + 1} / {imagenes.length}</span>
          {varias && <button type="button" className="s-btn s-btn-contorno s-btn-icono" onClick={() => mover(1)} aria-label="Fotografía siguiente"><Icono d={SIGUIENTE} /></button>}
          <button type="button" className="s-btn s-btn-contorno s-btn-icono fv-cerrar" onClick={() => dialogRef.current?.close()} aria-label="Cerrar fotografías"><Icono d={CERRAR} /></button>
        </div>
      </dialog>
    </div>
  );
}
