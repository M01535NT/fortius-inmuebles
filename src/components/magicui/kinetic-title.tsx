"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";

import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import { cn } from "@/lib/utils";

/*
  KineticTitle: cada línea del titular emerge desde una máscara al entrar
  en viewport (el mismo gesto del hero, extendido a las secciones).
  Reduced-motion: estático.
*/
type KineticTitleProps = {
  lines: string[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  delayStep?: number;
};

export function KineticTitle({
  lines,
  as: Tag = "h2",
  className,
  delayStep = 0.1,
}: KineticTitleProps) {
  const reduce = useReducedMotionSafe();
  const ref = React.useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (reduce) {
    return (
      <Tag className={className}>
        {lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={cn(className)}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            initial={{ y: "112%" }}
            animate={inView ? { y: 0 } : { y: "112%" }}
            transition={{ duration: 0.8, delay: i * delayStep, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
