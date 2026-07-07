import Link from "next/link";
import { ArrowUpRight, Calculator, ReceiptText, Scale } from "lucide-react";

import { Reveal } from "@/components/gsap/reveal";
import { SplitHeading } from "@/components/gsap/split-heading";

/*
  Herramientas: los números antes de decidir. Refuerza el ángulo de la
  marca (método y datos) y da acceso a las calculadoras públicas.
*/
const TOOLS = [
  {
    icon: Calculator,
    title: "Calculadora de hipoteca",
    text: "Estima tu mensualidad con enganche, plazo y tasa editables.",
    href: "/herramientas/hipoteca",
  },
  {
    icon: ReceiptText,
    title: "Gastos de cierre",
    text: "Cuánto cuesta comprar o vender, desglosado por concepto.",
    href: "/herramientas/gastos-de-cierre",
  },
  {
    icon: Scale,
    title: "Evaluar mi propiedad",
    text: "Una lectura inicial de valor con comparables de tu zona.",
    href: "#evaluar",
  },
];

export function Herramientas() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
      <SplitHeading
        lines={["Números antes", "de decidir."]}
        className="display-title max-w-[16ch] text-4xl text-foreground sm:text-5xl"
      />
      <Reveal delay={0.2} distance={40}>
        <p className="mt-4 max-w-[54ch] text-[15.5px] leading-relaxed text-muted-foreground">
          Herramientas abiertas para que llegues a la conversación con una
          idea clara. Las cifras finales siempre se confirman con el
          especialista.
        </p>
      </Reveal>

      {/* Tiles con flip 3D de entrada, repetible. */}
      <div className="mt-10 grid gap-4 [perspective:1200px] md:grid-cols-3">
        {TOOLS.map(({ icon: Icon, title, text, href }, i) => (
          <Reveal key={href} rotateY={24} distance={50} delay={0.09 * i} className="h-full">
            <Link
              href={href}
              className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div>
                <Icon
                  className="h-6 w-6 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
                  strokeWidth={1.5}
                />
                <h3 className="display-soft mt-5 text-[21px] text-foreground">{title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary">
                Abrir
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
