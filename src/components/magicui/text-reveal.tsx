"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";

/*
  TextReveal: cada palabra pasa de apagada a encendida conforme el bloque
  cruza el viewport. Firma motionsite para momentos narrativos.
  Con reduced-motion el texto se muestra completo y estático.
*/
type TextRevealProps = {
  text: string;
  className?: string;
};

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <span className="relative inline-block">
      <motion.span style={{ opacity }}>{children}</motion.span>
      {" "}
    </span>
  );
}

export function TextReveal({ text, className }: TextRevealProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const words = text.split(" ");

  if (reduce) {
    return <p className={className}>{text}</p>;
  }

  return (
    <p ref={ref} className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={`${word}-${i}`} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
}
