"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/*
  ParallaxImage: la imagen se desplaza dentro de su marco mientras la
  sección cruza el viewport (profundidad clásica de motionsite). El zoom
  de hover vive en un div interno para no pelear con el transform de
  Motion. El contenedor padre define el tamaño (relative + overflow-hidden).
*/
type ParallaxImageProps = {
  src: string;
  alt: string;
  sizes: string;
  hoverZoom?: boolean;
};

export function ParallaxImage({ src, alt, sizes, hoverZoom = true }: ParallaxImageProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

  if (reduce) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    );
  }

  return (
    <div ref={ref} className="absolute inset-0">
      <motion.div style={{ y }} className="absolute inset-[-10%_0]">
        <div
          className={
            "relative h-full w-full" +
            (hoverZoom
              ? " transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              : "")
          }
        >
          <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
        </div>
      </motion.div>
    </div>
  );
}
