import Image from "next/image";
import { Play } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPublicSettings } from "@/lib/backend/public";

/*
  Espacio reservado para el video institucional "cómo trabajamos".
  Principio del proyecto: la estructura queda lista y el cliente carga el
  archivo real; al llenar videoInstitucionalUrl en el panel este
  componente reproduce el video en lugar del placeholder.
*/
export async function InstitutionalVideo() {
  const url = (await getPublicSettings())?.videoInstitucionalUrl;

  return (
    <section className="border-t border-border">
      <Container className="py-16 md:py-20">
        <BlurFade>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            VID-INS-001 · Video
          </p>
          <h2 className="display-title mt-3 max-w-[16ch] text-3xl text-foreground sm:text-4xl">
            Cómo trabajamos, en video.
          </h2>

          <div className="relative mt-8 overflow-hidden rounded-lg border border-border">
            {url ? (
              <video
                src={url}
                controls
                preload="metadata"
                className="aspect-video w-full bg-image-scrim"
              >
                Tu navegador no puede reproducir este video.
              </video>
            ) : (
              <div className="relative aspect-video w-full">
                {/* Poster provisional con render del proyecto. */}
                <Image
                  src="/hero/interior-depa.webp"
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 100vw, 1216px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-image-scrim/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-on-image/40 text-on-image"
                  >
                    <Play className="ml-1 size-6" strokeWidth={1.5} />
                  </span>
                  <p className="display-soft max-w-[30ch] text-xl text-on-image">
                    Espacio reservado para el video institucional.
                  </p>
                  <p className="max-w-[46ch] text-sm leading-relaxed text-on-image-muted/80">
                    Aquí verás el recorrido por las cuatro fases del método,
                    contado por el equipo. En producción.
                  </p>
                </div>
              </div>
            )}
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
