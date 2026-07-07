import { FileText } from "lucide-react";

import { Reveal } from "@/components/gsap/reveal";
import { Scrub } from "@/components/gsap/scrub";
import { SplitHeading } from "@/components/gsap/split-heading";
import { MagicCard } from "@/components/magicui/magic-card";
import { TiltCard } from "@/components/magicui/tilt-card";

/*
  These are real documents from the firm's internal manual, with their real
  internal codes, in the order the owner receives them. The codes are the
  proof: a firm that names its paperwork actually uses it.
  Motion: watermark EXPEDIENTE deriva con el scroll detrás del grid; las
  cards entran con rotación alterna y vuelven a animar al re-scrollear.
*/
type Doc = { code: string; name: string; text: string };

const DOCS: Doc[] = [
  {
    code: "DUE-LEG-001",
    name: "Análisis de Factibilidad",
    text: "Confirmamos que tu inmueble se puede vender, o qué hay que subsanar antes de salir al mercado.",
  },
  {
    code: "VAL-CMA-001",
    name: "Opinión de Valor",
    text: "Comparables vendidos en tu zona para fijar un precio defendible, no un número al tanteo.",
  },
  {
    code: "PLA-TRA-001",
    name: "Plan de Comercialización",
    text: "La ruta de trabajo por escrito: canales, cronograma y estrategia de promoción.",
  },
  {
    code: "GAS-CIE-001",
    name: "Cálculo de Gastos",
    text: "Impuestos, comisión y demás costos estimados, y cuánto te queda libre de la venta.",
  },
  {
    code: "CON-PSE-001",
    name: "Contrato",
    text: "Todo el trabajo es bajo contrato, con obligaciones claras. Certeza para las dos partes.",
  },
  {
    code: "REP-MAR-001",
    name: "Reportes",
    text: "Avances, visitas y prospectos, por escrito cada 30 días.",
  },
];

export function Entregables() {
  return (
    <section id="entregables" className="relative scroll-mt-20 overflow-hidden">
      {/* Watermark tipográfico: el expediente literal detrás de los papeles. */}
      <Scrub
        xPercent={[-6, 6]}
        className="pointer-events-none absolute left-0 top-10 z-0 select-none md:top-16"
      >
        <span
          aria-hidden="true"
          className="display-title watermark-outline block whitespace-nowrap text-[24vw] leading-none md:text-[200px]"
        >
          EXPEDIENTE
        </span>
      </Scrub>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
        <SplitHeading
          lines={["Papeles,", "no promesas."]}
          className="display-title max-w-[16ch] text-4xl text-foreground sm:text-5xl md:text-[56px]"
        />
        <Reveal delay={0.2} distance={40}>
          <p className="mt-6 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground">
            Cada fase produce documentos con nombre y código en nuestro manual
            interno. Estos seis los recibes tú, en este orden.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOCS.map((doc, i) => (
            <Reveal
              key={doc.code}
              className="h-full"
              distance={100}
              rotate={i % 2 === 0 ? -3 : 3}
              scale={0.92}
              blur={6}
              delay={0.08 * (i % 3)}
            >
              <TiltCard className="h-full">
                <MagicCard className="h-full rounded-lg">
                  <article className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
                    <div>
                      <div className="flex items-center justify-between">
                        <FileText
                          className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-6"
                          strokeWidth={1.5}
                        />
                        <span className="font-mono text-[11.5px] text-muted-foreground transition-transform duration-300 group-hover:-translate-x-1">
                          {doc.code}
                        </span>
                      </div>
                      <h3 className="display-soft mt-5 text-[21px] text-foreground">
                        <span className="mr-2 font-mono text-[13px] text-primary">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {doc.name}
                      </h3>
                    </div>
                    <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                      {doc.text}
                    </p>
                  </article>
                </MagicCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
