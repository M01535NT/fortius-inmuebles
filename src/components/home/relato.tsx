import { BlurFade } from "@/components/magicui/blur-fade";
import { TextReveal } from "@/components/magicui/text-reveal";
import { ESPECTACULAR } from "@/data/motion-config";
import { homeText, resolveSiteContent } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";

/*
  Narrative opening: the problem (improvised selling) and the turn
  (our manifesto). The manifesto band is the page's single color-block
  moment, identical in both themes.
  Modo espectacular: la declaración se ilumina palabra por palabra al
  scroll (TextReveal) y el manifiesto entra con clip reveal.
*/

export function Relato({ content }: { content?: SiteContent | null }) {
  const copy = resolveSiteContent(content);
  const lines = copy.manifiestoTitulo.split("\n");
  return (
    <>
      {/* The problem */}
      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-36">
        <div className="md:ml-[8%] lg:ml-[14%]">
          {ESPECTACULAR ? (
            <TextReveal
              text={homeText(content, "relatoTexto")}
              className="display-soft max-w-[24ch] text-3xl text-foreground sm:text-4xl md:text-4xl"
            />
          ) : (
            <BlurFade>
              <p className="display-soft max-w-[24ch] text-3xl text-foreground sm:text-4xl md:text-4xl">
                {homeText(content, "relatoTexto")}
              </p>
            </BlurFade>
          )}
          <BlurFade delay={0.12}>
            <p className="mt-8 max-w-[52ch] text-base leading-relaxed text-muted-foreground md:ml-[22%] md:text-lg">
              {homeText(content, "relatoApoyo")}
            </p>
          </BlurFade>
        </div>
      </section>

      {/* The turn: manifesto color-block. Entrada con blur+lift dramática. */}
      <BlurFade yOffset={48} blur="16px" duration={0.95} inViewMargin="-120px">
        <section className="bg-block text-block-foreground">
          <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
            <div className="grid gap-10 md:grid-cols-12">
              <BlurFade className="md:col-span-7">
                <h2 className="display-title text-4xl sm:text-5xl md:text-6xl">
                  {lines.map((line, index) => (
                    <span key={index} className={index === 0 ? "block" : "block text-block-accent"}>{line}</span>
                  ))}
                </h2>
              </BlurFade>
              <BlurFade delay={0.15} className="self-end md:col-span-4 md:col-start-9">
                <p className="text-base leading-relaxed text-block-muted">
                  {copy.manifiestoTexto}
                </p>
              </BlurFade>
            </div>
          </div>
        </section>
      </BlurFade>
    </>
  );
}
