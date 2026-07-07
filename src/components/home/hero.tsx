"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SLIDES = [
  { src: "/hero/casa-playa.webp", alt: "Residencia frente al mar en Baja California" },
  { src: "/hero/edificio-ciudad.webp", alt: "Edificio residencial en zona urbana de Tijuana" },
  { src: "/hero/interior-depa.webp", alt: "Interior de departamento con acabados claros" },
  { src: "/hero/plaza.webp", alt: "Plaza comercial en operación" },
];

const ROTATE_MS = 8000;

export function Hero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden" aria-label="Presentación">
      {/* Background rotator */}
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className={reduce ? "absolute inset-0" : "kenburns absolute inset-0"}>
              <Image
                src={SLIDES[index].src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Scrim: keeps copy AA-readable over any slide, both themes. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b120e]/85 via-[#0b120e]/30 to-[#0b120e]/10" />
      </div>

      {/* Copy block, asymmetric bottom-left */}
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1280px] flex-col justify-end px-5 pb-16 pt-24 md:px-8 md:pb-20">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="display-title text-[12.5vw] text-[#f2f4ee] sm:text-6xl md:text-7xl lg:text-[84px]"
        >
          Vende con plan,
          <br />
          no con anuncios.
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-[#e6e9e2]/90 md:text-[17px]"
        >
          Precio con datos, expediente revisado y seguimiento por escrito. De la
          captación a la firma ante notario, en Tijuana y Baja California.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <a
            href="#evaluar"
            className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
          >
            Evaluar mi propiedad
          </a>
          <a
            href="#metodo"
            className="inline-flex h-12 items-center rounded-md border border-[#f2f4ee]/35 px-6 text-[15px] font-medium text-[#f2f4ee] backdrop-blur-sm transition-colors hover:border-[#f2f4ee]/60 hover:bg-[#f2f4ee]/10 active:scale-[0.98]"
          >
            Conocer el método
          </a>
        </motion.div>

        {/* Slide state: functional carousel control, not decoration. */}
        <div className="mt-10 flex gap-2" role="tablist" aria-label="Imágenes del inicio">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              role="tab"
              aria-selected={i === index}
              aria-label={`Imagen ${i + 1}`}
              onClick={() => setIndex(i)}
              className="group relative h-4 w-9 cursor-pointer"
            >
              <span
                className={
                  "absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-colors " +
                  (i === index ? "bg-[#f2f4ee]" : "bg-[#f2f4ee]/30 group-hover:bg-[#f2f4ee]/55")
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
