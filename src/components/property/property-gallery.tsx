"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, FileText, Images, Maximize2, Play, Rotate3d, X, type LucideIcon } from "lucide-react";

import type { ImagenPropiedad } from "@/data/propiedades";
import { PropertyShare } from "@/components/property/property-share";

type Modo = "fotos" | "video" | "360" | "ficha";

export type FichaPreview = {
  titulo: string;
  codigo: string;
  zona: string;
  precio: string;
  filas: { label: string; value: string }[];
  demo: boolean;
};

type Props = {
  imagenes: ImagenPropiedad[];
  titulo: string;
  videoUrl?: string;
  tour360Url?: string;
  fichaUrl?: string;
  ficha?: FichaPreview;
  share?: { title: string; text: string; url: string };
};

const MODOS: { id: Modo; label: string; icon: LucideIcon }[] = [
  { id: "fotos", label: "Fotos", icon: Images },
  { id: "video", label: "Video", icon: Play },
  { id: "360", label: "Recorrido 360°", icon: Rotate3d },
  { id: "ficha", label: "Ficha técnica", icon: FileText },
];

/*
  Visor de la ficha «Escenario»: un solo escenario oscuro que cambia entre
  fotos, video, recorrido 360 y la vista previa de la ficha técnica. Solo
  aparecen las pestañas con contenido. Las miniaturas mantienen la galería
  completa accesible y la foto se amplía a pantalla completa.
*/
export function PropertyGallery({ imagenes, titulo, videoUrl, tour360Url, fichaUrl, ficha, share }: Props) {
  const [modo, setModo] = React.useState<Modo>("fotos");
  const [index, setIndex] = React.useState(0);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const openButtonRef = React.useRef<HTMLButtonElement>(null);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const stageTouch = React.useRef<{ x: number; y: number } | null>(null);
  const actual = imagenes[index];
  const modos = MODOS.filter(({ id }) => id === "fotos" || (id === "video" && videoUrl) || (id === "360" && tour360Url) || (id === "ficha" && ficha));
  const counts: Partial<Record<Modo, string>> = { fotos: String(imagenes.length) };

  const move = React.useCallback((direction: 1 | -1) => {
    setIndex((current) => (current + direction + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  function swipe(start: { x: number; y: number } | null, end: { clientX: number; clientY: number }) {
    if (!start || Math.abs(end.clientY - start.y) > Math.abs(end.clientX - start.x)) return;
    if (Math.abs(end.clientX - start.x) > 40) move(end.clientX < start.x ? 1 : -1);
  }

  return (
    <div className="property-gallery fe-visor">
      <div className="fe-visor-bar" role="group" aria-label="Modo de galería">
        <div className="fe-visor-tabs">
          {modos.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)}>
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              {label}
              {counts[id] ? <span className="fe-visor-count" aria-hidden="true">{counts[id]}</span> : null}
            </button>
          ))}
        </div>
        <div className="fe-visor-actions">
          {fichaUrl && <a href={fichaUrl} download aria-label="Ficha técnica (descargar PDF)" className="fe-visor-pdf">
            <Download size={16} strokeWidth={1.8} aria-hidden="true" />PDF
          </a>}
          {share && <PropertyShare {...share} />}
        </div>
      </div>

      <div className="fe-visor-stage">
        {modo === "fotos" ? (
          <div className="property-gallery-photos" onTouchStart={(event) => { const t = event.touches[0]; stageTouch.current = { x: t.clientX, y: t.clientY }; }}
            onTouchEnd={(event) => { swipe(stageTouch.current, event.changedTouches[0]); stageTouch.current = null; }}>
            <div className="property-gallery-main">
              <button ref={openButtonRef} type="button" onClick={() => dialogRef.current?.showModal()} aria-label={`Ampliar fotografía: ${actual.alt}`} className="fe-visor-zoom">
                <Image key={actual.src} src={actual.src} alt={actual.alt} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 1280px" className="fe-visor-photo" />
                <span className="fe-visor-expand"><Maximize2 size={16} aria-hidden="true" /></span>
              </button>
              {imagenes.length > 1 ? <>
                <button type="button" onClick={() => move(-1)} aria-label="Foto anterior" className="fe-visor-arrow is-prev"><ChevronLeft aria-hidden="true" /></button>
                <button type="button" onClick={() => move(1)} aria-label="Foto siguiente" className="fe-visor-arrow is-next"><ChevronRight aria-hidden="true" /></button>
              </> : null}
              <span className="property-gallery-counter fe-visor-counter" aria-live="polite">{index + 1} / {imagenes.length}</span>
              <span className="fe-visor-caption">{actual.alt}</span>
            </div>
          </div>
        ) : null}

        {modo === "video" && videoUrl ? (
          <video src={videoUrl} controls playsInline className="fe-visor-media" />
        ) : null}

        {modo === "360" && tour360Url ? (
          <iframe src={tour360Url} title={`Recorrido 360 de ${titulo}`} allowFullScreen className="fe-visor-media" />
        ) : null}

        {modo === "ficha" && ficha ? (
          <div className="fe-visor-sheet">
            <div className="fe-sheet">
              <div className="fe-sheet-head"><span>Fortius Inmuebles</span><span>Ficha técnica</span></div>
              <p className="fe-sheet-title">{ficha.titulo}</p>
              <p className="fe-sheet-sub">{ficha.zona} · {ficha.codigo}</p>
              {imagenes[0] && <div className="fe-sheet-photo"><Image src={imagenes[0].src} alt="" fill sizes="420px" /></div>}
              <dl className="fe-sheet-rows">
                {ficha.filas.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
                <div><dt>Precio</dt><dd>{ficha.precio}</dd></div>
              </dl>
              {ficha.demo && <p className="fe-sheet-demo">Demostración · datos de ejemplo</p>}
            </div>
            <div className="fe-sheet-side">
              <p>La ficha técnica resume superficies, distribución y precio en un PDF para imprimir o compartir.</p>
              {fichaUrl && <a href={fichaUrl} download className="pg-btn">Descargar ficha técnica<span className="sr-only"> en PDF</span></a>}
            </div>
          </div>
        ) : null}
      </div>

      {modo === "fotos" && imagenes.length > 1 ? (
        <div className="property-gallery-navigation fe-visor-thumbs-wrap">
          <div className="property-gallery-thumbnails fe-visor-thumbs" role="group" aria-label={`Imágenes de ${titulo}`}>
            {imagenes.map((img, i) => (
              <button key={img.src} type="button" aria-label={`Ver imagen ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)}>
                <Image src={img.src} alt="" fill sizes="120px" />
              </button>
            ))}
          </div>
        </div>
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
        onTouchEnd={(event) => { swipe(touchStart.current, event.changedTouches[0]); touchStart.current = null; }}
        className="m-auto h-[100dvh] w-screen max-w-none bg-[#060c14] p-0 text-white backdrop:bg-[#060c14]/95"
      >
        <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-10">
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Cerrar fotografías" className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20"><X className="size-5" aria-hidden="true" /></button>
          {imagenes.length > 1 ? <button type="button" onClick={() => move(-1)} aria-label="Fotografía anterior" className="absolute left-3 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20 sm:left-6"><ChevronLeft aria-hidden="true" /></button> : null}
          <Image src={actual.src} alt={actual.alt} fill sizes="100vw" className="object-contain object-center p-4 sm:p-10" />
          {imagenes.length > 1 ? <button type="button" onClick={() => move(1)} aria-label="Fotografía siguiente" className="absolute right-3 z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/20 sm:right-6"><ChevronRight aria-hidden="true" /></button> : null}
          <span role="status" className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-mono text-sm">{index + 1} / {imagenes.length}</span>
        </div>
      </dialog>
    </div>
  );
}
