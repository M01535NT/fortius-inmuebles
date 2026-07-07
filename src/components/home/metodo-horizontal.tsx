"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { Metodo } from "@/components/home/metodo";
import { FASES } from "@/data/metodo";

/*
  Método en scroll horizontal pinned (modo Espectacular, solo desktop):
  la sección mide 360vh; un contenedor sticky ocupa la pantalla y el
  track se desplaza en X conforme avanza el scroll vertical. Storytelling:
  el usuario "recorre" las cuatro fases como un camino.

  Mobile (<lg) y prefers-reduced-motion reciben SIEMPRE la versión
  vertical (Metodo). Implementado solo con Motion (sin GSAP).
*/
export function MetodoHorizontal() {
  const reduce = useReducedMotion();
  const targetRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  // 5 paneles (intro + 4 fases) => el track viaja 4/5 de su ancho.
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);

  if (reduce) {
    return <Metodo />;
  }

  return (
    <div id="metodo" className="scroll-mt-20">
      {/* Desktop: pinned horizontal */}
      <section
        ref={targetRef}
        aria-label="El método, en cuatro fases"
        className="relative hidden h-[360vh] lg:block"
      >
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <motion.div style={{ x }} className="flex">
            {/* Panel intro */}
            <div className="flex w-screen shrink-0 items-center">
              <div className="mx-auto w-full max-w-[1280px] px-8">
                <h2 className="display-title max-w-[12ch] text-6xl text-foreground xl:text-7xl">
                  Cuatro fases. Un expediente.
                </h2>
                <p className="mt-7 max-w-[44ch] text-[16px] leading-relaxed text-muted-foreground">
                  Es el mismo proceso en cada operación, con documentos
                  definidos en cada fase. Pídelo completo en tu primera
                  reunión.
                </p>
              </div>
            </div>

            {/* Paneles de fase */}
            {FASES.map((fase) => (
              <div key={fase.n} className="flex w-screen shrink-0 items-center">
                <div className="mx-auto grid w-full max-w-[1280px] grid-cols-12 items-center gap-10 px-8">
                  <div className="col-span-6">
                    <p
                      aria-hidden="true"
                      className="font-mono text-[15px] text-primary"
                    >
                      {fase.n} / 04
                    </p>
                    <h3 className="display-title mt-4 text-5xl text-foreground xl:text-6xl">
                      {fase.title}
                    </h3>
                    <p className="mt-6 max-w-[50ch] text-[15.5px] leading-relaxed text-muted-foreground">
                      {fase.body}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {fase.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[15px] text-foreground/85"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[10px] h-px w-5 shrink-0 bg-primary"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-span-5 col-start-8">
                    {fase.image ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                        <Image
                          src={fase.image.src}
                          alt={fase.image.alt}
                          fill
                          sizes="40vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      /* Fases sin imagen: el número de fase como pieza tipográfica. */
                      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-border bg-secondary/50">
                        <span className="display-title text-[120px] leading-none text-foreground/15">
                          {fase.n}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Rail de progreso horizontal */}
          <div className="mx-auto mt-10 w-full max-w-[1280px] px-8">
            <div className="relative h-px w-full bg-border">
              <motion.div
                style={{ scaleX: scrollYProgress }}
                className="absolute inset-0 origin-left bg-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / tablet: versión vertical */}
      <div className="lg:hidden">
        <Metodo anchor={false} />
      </div>
    </div>
  );
}
