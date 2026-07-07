import { BlurFade } from "@/components/magicui/blur-fade";

/*
  Narrative opening: the problem (improvised selling) and the turn
  (our manifesto). The manifesto band is the page's single color-block
  moment, identical in both themes.
*/
export function Relato() {
  return (
    <>
      {/* The problem */}
      <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-36">
        <div className="md:ml-[8%] lg:ml-[14%]">
          <BlurFade>
            <p className="display-soft max-w-[24ch] text-3xl text-foreground sm:text-4xl md:text-[44px]">
              La mayoría de las propiedades salen al mercado igual: fotos de
              celular, precio al tanteo y a esperar llamadas.
            </p>
          </BlurFade>
          <BlurFade delay={0.12}>
            <p className="mt-8 max-w-[52ch] text-[15.5px] leading-relaxed text-muted-foreground md:ml-[22%] md:text-[16.5px]">
              Eso atrae curiosos, quema semanas y suele terminar en rebajas.
              Y cuando por fin aparece un comprador real, un papel pendiente
              detiene todo en la recta final.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* The turn: manifesto color-block */}
      <section className="bg-block text-block-foreground">
        <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
          <div className="grid gap-10 md:grid-cols-12">
            <BlurFade className="md:col-span-7">
              <h2 className="display-title text-4xl sm:text-5xl md:text-[64px]">
                No prometemos resultados.
                <br />
                {/* Block is dark in both themes; mint keeps ~9:1 contrast. */}
                <span className="text-[#57e3b3]">Documentamos el proceso.</span>
              </h2>
            </BlurFade>
            <BlurFade delay={0.15} className="self-end md:col-span-4 md:col-start-9">
              <p className="text-[15.5px] leading-relaxed text-block-muted">
                Cada operación sigue el mismo método por escrito, de la
                captación a la firma. Por eso siempre sabes en qué paso va la
                tuya, y qué sigue después.
              </p>
            </BlurFade>
          </div>
        </div>
      </section>
    </>
  );
}
