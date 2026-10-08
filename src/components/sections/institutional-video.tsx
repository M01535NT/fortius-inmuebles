import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPublicSettings } from "@/lib/backend/public";

/* El bloque solo aparece cuando el panel tiene un video institucional real. */
export async function InstitutionalVideo() {
  const url = (await getPublicSettings())?.videoInstitucionalUrl;
  if (!url) return null;

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
            <video
                src={url}
                controls
                preload="metadata"
                className="aspect-video w-full bg-image-scrim"
              >
                Tu navegador no puede reproducir este video.
              </video>
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
