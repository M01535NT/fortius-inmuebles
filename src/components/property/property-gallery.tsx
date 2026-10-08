"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, Images, Maximize2, Play, Rotate3d, X, type LucideIcon } from "lucide-react";

import type { ImagenPropiedad } from "@/data/propiedades";
import { PropertyShare } from "@/components/property/property-share";

type Modo = "fotos" | "video" | "360";

type Props = {
  imagenes: ImagenPropiedad[];
  titulo: string;
  videoUrl?: string;
  tour360Url?: string;
  fichaUrl?: string;
  share?: { title: string; text: string; url: string };
};

const MODOS: { id: Modo; label: string; icon: LucideIcon }[] = [
  { id: "fotos", label: "Fotos", icon: Images },
  { id: "video", label: "Video", icon: Play },
  { id: "360", label: "Recorrido 360°", icon: Rotate3d },
];

/* One centered photograph at a time; thumbnails keep the full gallery accessible. */
const MEDIA_BOX =
  "relative aspect-video w-full overflow-hidden border border-border";

export function PropertyGallery({ imagenes, titulo, videoUrl, tour360Url, fichaUrl, share }: Props) {
  const [modo, setModo] = React.useState<Modo>("fotos");
  const [index, setIndex] = React.useState(0);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const openButtonRef = React.useRef<HTMLButtonElement>(null);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const actual = imagenes[index];
  const modos = MODOS.filter(({ id }) => id === "fotos" || (id === "video" && videoUrl) || (id === "360" && tour360Url));

  const move = React.useCallback((direction: 1 | -1) => {
    setIndex((current) => (current + direction + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  function openViewer() {
    dialogRef.current?.showModal();
  }

  function closeViewer() {
    dialogRef.current?.close();
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!start || Math.abs(end.clientY - start.y) > Math.abs(end.clientX - start.x)) return;
    if (Math.abs(end.clientX - start.x) > 40) move(end.clientX < start.x ? 1 : -1);
  }

  return (
    <div className="property-gallery">
      {/* Selector de modo */}
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Modo de galería">
        {modos.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={modo === id}
            onClick={() => setModo(id)}
            className={
              "inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors " +
              (modo === id
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border text-foreground/75 hover:bg-secondary hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
        {fichaUrl && <a href={fichaUrl} download className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 px-3.5 text-sm font-medium text-primary-ink transition-colors hover:bg-secondary">
          <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Ficha técnica
          <span className="sr-only"> (descargar PDF)</span>
        </a>}
        {share && <PropertyShare {...share} />}
      </div>

      {modo === "fotos" ? (
        <>
          <div className="property-gallery-photos">
            <div className="property-gallery-main">
              <button ref={openButtonRef} type="button" onClick={openViewer} aria-label={`Ampliar fotografía: ${actual.alt}`} className="absolute inset-0 z-[1] cursor-zoom-in">
                <Image key={actual.src} src={actual.src} alt={actual.alt} fill
                  priority={index === 0} sizes="(max-width: 767px) 100vw, 1200px" className="object-contain object-center" />
                <span className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur"><Maximize2 className="size-4" aria-hidden="true" /></span>
              </button>
              <span className="property-gallery-counter z-[2] pointer-events-none" aria-live="polite">{index + 1} / {imagenes.length}</span>
            </div>
          </div>
          {imagenes.length > 1 ? (
            <div className="property-gallery-navigation">
              <div className="property-gallery-thumbnails" role="group" aria-label={`Imágenes de ${titulo}`}>
                {imagenes.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    aria-label={`Ver imagen ${i + 1}`}
                    aria-pressed={i === index}
                    onClick={() => setIndex(i)}
                    className={
                      "relative h-16 w-24 shrink-0 overflow-hidden border transition-colors " +
                      (i === index ? "border-primary" : "border-border opacity-75 hover:opacity-100")
                    }
                  >
                    <Image src={img.src} alt="" fill sizes="120px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {modo === "video" ? (
        videoUrl ? (
          <div className={MEDIA_BOX}>
            <video src={videoUrl} controls playsInline className="h-full w-full object-cover" />
          </div>
        ) : null
      ) : null}

      {modo === "360" ? (
        tour360Url ? (
          <div className={MEDIA_BOX}>
            <iframe
              src={tour360Url}
              title={`Recorrido 360 de ${titulo}`}
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : null
      ) : null}

      <dialog
        ref={dialogRef}
        aria-label="Fotografías del inmueble"
        onClose={() => openButtonRef.current?.focus()}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        }}
        onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchEnd={handleTouchEnd}
        className="m-auto h-[100dvh] w-screen max-w-none bg-[#060c14] p-0 text-white backdrop:bg-[#060c14]/95"
      >
        <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-10">
          <button type="button" onClick={closeViewer} aria-label="Cerrar fotografías" className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20"><X className="size-5" aria-hidden="true" /></button>
          {imagenes.length > 1 ? <button type="button" onClick={() => move(-1)} aria-label="Fotografía anterior" className="absolute left-3 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20 sm:left-6"><ChevronLeft aria-hidden="true" /></button> : null}
          <Image src={actual.src} alt={actual.alt} fill sizes="100vw" className="object-contain object-center p-4 sm:p-10" />
          {imagenes.length > 1 ? <button type="button" onClick={() => move(1)} aria-label="Fotografía siguiente" className="absolute right-3 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20 sm:right-6"><ChevronRight aria-hidden="true" /></button> : null}
          <span role="status" className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-mono text-sm">{index + 1} / {imagenes.length}</span>
        </div>
      </dialog>
    </div>
  );
}
