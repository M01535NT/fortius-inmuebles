"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Images, Play, Rotate3d, type LucideIcon } from "lucide-react";

import type { ImagenPropiedad } from "@/data/propiedades";
import { PropertyShare } from "@/components/property/property-share";

type Modo = "fotos" | "video" | "360";

type Props = {
  imagenes: ImagenPropiedad[];
  titulo: string;
  /* Placeholders: sin URL se muestra el espacio reservado; con URL real
     (cargada por el cliente) se activa el reproductor correspondiente. */
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

/*
  Caja de medios compartida por los tres modos: 16:9 real siempre.
  En mobile el ancho manda (w-full + aspect); en desktop manda la altura
  (min(60vh, 684px)) y el ancho se deriva del aspect-ratio, así el
  componente cabe completo en el primer viewport de cualquier pantalla.
  684px = ancho máximo del contenedor (1216) * 9/16.
*/
const MEDIA_BOX =
  "relative aspect-video w-full overflow-hidden rounded-lg border border-border md:w-auto md:h-[min(60vh,684px)]";

function Reservado({ icon: Icon, titulo, texto }: { icon: LucideIcon; titulo: string; texto: string }) {
  return (
    <div className={`${MEDIA_BOX} flex flex-col items-center justify-center gap-3 bg-secondary/50 px-8 text-center`}>
      <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="display-soft text-xl text-foreground">{titulo}</p>
      <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  );
}

export function PropertyGallery({ imagenes, titulo, videoUrl, tour360Url, fichaUrl, share }: Props) {
  const [modo, setModo] = React.useState<Modo>("fotos");
  const [index, setIndex] = React.useState(0);
  const actual = imagenes[index];

  return (
    <div>
      {/* Selector de modo */}
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Modo de galería">
        {MODOS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={modo === id}
            onClick={() => setModo(id)}
            className={
              "inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-[13.5px] font-medium transition-colors " +
              (modo === id
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border text-foreground/75 hover:bg-secondary hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
        {fichaUrl && <a href={fichaUrl} download className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 px-3.5 text-[13.5px] font-medium text-primary transition-colors hover:bg-secondary">
          <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Ficha técnica
          <span className="sr-only"> (descargar PDF)</span>
        </a>}
        {share && <PropertyShare {...share} />}
      </div>

      {modo === "fotos" ? (
        <>
          <div className={MEDIA_BOX}>
            <Image
              key={actual.src}
              src={actual.src}
              alt={actual.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          {imagenes.length > 1 ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex gap-2" role="group" aria-label={`Imágenes de ${titulo}`}>
                {imagenes.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    aria-label={`Ver imagen ${i + 1}`}
                    aria-pressed={i === index}
                    onClick={() => setIndex(i)}
                    className={
                      "relative h-16 w-24 overflow-hidden rounded-md border transition-colors " +
                      (i === index ? "border-primary" : "border-border opacity-75 hover:opacity-100")
                    }
                  >
                    <Image src={img.src} alt="" fill sizes="120px" className="object-cover" />
                  </button>
                ))}
              </div>
              <span className="pl-1 font-mono text-[11.5px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")} / {String(imagenes.length).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </>
      ) : null}

      {modo === "video" ? (
        videoUrl ? (
          <div className={MEDIA_BOX}>
            <video src={videoUrl} controls playsInline className="h-full w-full object-cover" />
          </div>
        ) : (
          <Reservado
            icon={Play}
            titulo="Video de la propiedad"
            texto="Espacio reservado. El recorrido en video se reproducirá aquí cuando se cargue el archivo."
          />
        )
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
        ) : (
          <Reservado
            icon={Rotate3d}
            titulo="Recorrido virtual 360°"
            texto="Espacio reservado. El recorrido interactivo se integrará aquí cuando esté disponible."
          />
        )
      ) : null}
    </div>
  );
}
