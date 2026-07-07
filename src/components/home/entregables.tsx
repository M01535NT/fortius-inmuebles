import { FileText } from "lucide-react";

import { BlurFade } from "@/components/magicui/blur-fade";
import { KineticTitle } from "@/components/magicui/kinetic-title";
import { MagicCard } from "@/components/magicui/magic-card";
import { TiltCard } from "@/components/magicui/tilt-card";

/*
  These are real documents from the firm's internal manual, with their real
  internal codes, in the order the owner receives them. The codes are the
  proof: a firm that names its paperwork actually uses it.
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
    <section
      id="entregables"
      className="mx-auto max-w-[1280px] scroll-mt-20 px-5 py-24 md:px-8 md:py-32"
    >
      <KineticTitle
        lines={["Papeles,", "no promesas."]}
        className="display-title max-w-[16ch] text-4xl text-foreground sm:text-5xl md:text-[56px]"
      />
      <BlurFade delay={0.2}>
        <p className="mt-6 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground">
          Cada fase produce documentos con nombre y código en nuestro manual
          interno. Estos seis los recibes tú, en este orden.
        </p>
      </BlurFade>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map((doc, i) => (
          <BlurFade key={doc.code} delay={0.06 * i} className="h-full">
            <TiltCard className="h-full">
              <MagicCard className="h-full rounded-lg">
              <article className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
              <div>
                <div className="flex items-center justify-between">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[11.5px] text-muted-foreground">
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
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
