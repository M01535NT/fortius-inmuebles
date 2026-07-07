"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Reveal } from "@/components/gsap/reveal";
import { SplitHeading } from "@/components/gsap/split-heading";

/*
  Objection handling, phrased as the questions owners actually ask.
  Honest answers: no promised dates, no invented figures.
  Motion: items entran alternando desde los lados; la apertura anima
  grid-template-rows 0fr→1fr con rotación del Plus.
*/
const QA = [
  {
    q: "¿Cuánto tarda en venderse una propiedad?",
    a: "Depende de la zona, el precio y el tipo de inmueble. Desconfía de quien te promete una fecha exacta. Lo que sí hacemos: revisar el avance con datos cada 30 días y ajustar la estrategia si el mercado no responde.",
  },
  {
    q: "¿Cómo definen el precio de salida?",
    a: "Con un análisis comparativo de mercado: propiedades similares vendidas en tu zona, su superficie, estado y las condiciones actuales de oferta. Buscamos un precio que atraiga ofertas reales, sin regalar tu propiedad ni espantar compradores.",
  },
  {
    q: "¿Cuánto voy a pagar de costos de cierre?",
    a: "Te entregamos una estimación desglosada desde el principio: impuestos, notario, avalúo y gestoría. Los montos varían por operación y se confirman con el notario o el especialista correspondiente.",
  },
  {
    q: "¿Qué necesito para empezar?",
    a: "Solo los datos básicos del inmueble. Con eso hacemos una revisión inicial y te decimos qué documentos conviene tener listos para avanzar sin frenones.",
  },
];

function Item({ item, index }: { item: (typeof QA)[number]; index: number }) {
  const [open, setOpen] = React.useState(false);
  const panelId = `respuesta-${index}`;

  return (
    <Reveal
      direction={index % 2 === 0 ? "left" : "right"}
      distance={70}
      delay={0.05 * index}
    >
      <div className="border-b border-border">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
        >
          <span className="display-soft text-[19px] text-foreground md:text-[21px]">
            {item.q}
          </span>
          <Plus
            className={
              "h-5 w-5 shrink-0 text-primary transition-transform duration-300" +
              (open ? " rotate-45" : "")
            }
            strokeWidth={1.5}
          />
        </button>
        <div
          id={panelId}
          className={
            "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] " +
            (open ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]")
          }
        >
          <div className="min-h-0 overflow-hidden">
            <p className="max-w-[62ch] pb-7 text-[15px] leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Respuestas() {
  return (
    <section
      id="respuestas"
      className="mx-auto max-w-[1280px] scroll-mt-20 overflow-x-clip px-5 py-24 md:px-8 md:py-32"
    >
      <div className="grid gap-12 lg:grid-cols-12">
        <SplitHeading
          lines={["Preguntas directas,", "respuestas directas."]}
          className="display-title text-4xl text-foreground sm:text-5xl lg:col-span-4"
        />

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="border-t border-border">
            {QA.map((item, i) => (
              <Item key={item.q} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
