"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { KineticTitle } from "@/components/magicui/kinetic-title";

/*
  Compromisos: prueba social honesta mientras no existan testimonios
  reales (guardrail: nada inventado). Cada fila entra escalonada y su
  hairline crece desde la izquierda.
*/
const COMPROMISOS = [
  "Información clara antes de cada decisión, no después.",
  "Seguimiento por escrito de tu propiedad o tu búsqueda.",
  "Comunicación directa durante todo el proceso.",
  "Cuidado con tus datos y tus documentos.",
];

function Fila({ texto, index, inView }: { texto: string; index: number; inView: boolean }) {
  const reduce = useReducedMotion();
  const delay = 0.12 * index;

  if (reduce) {
    return (
      <li className="border-b border-border">
        <div className="flex items-baseline gap-4 py-4">
          <span className="font-mono text-[12px] text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[15px] text-foreground/85">{texto}</span>
        </div>
      </li>
    );
  }

  return (
    <li className="relative">
      {/* Hairline que crece desde la izquierda */}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-border"
      />
      <motion.div
        initial={{ opacity: 0, x: -18 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
        transition={{ duration: 0.6, delay: delay + 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-baseline gap-4 py-4"
      >
        <span className="font-mono text-[12px] text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[15px] text-foreground/85">{texto}</span>
      </motion.div>
    </li>
  );
}

export function Compromisos() {
  const listRef = React.useRef<HTMLUListElement>(null);
  const inView = useInView(listRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <KineticTitle
            lines={["Lo que puedes esperar", "en cada operación"]}
            className="display-soft text-2xl text-foreground lg:col-span-4"
            delayStep={0.08}
          />
          <div className="lg:col-span-7 lg:col-start-6">
            <ul ref={listRef} className="border-t border-border">
              {COMPROMISOS.map((c, i) => (
                <Fila key={c} texto={c} index={i} inView={inView} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
