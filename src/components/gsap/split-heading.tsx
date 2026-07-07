"use client";

import * as React from "react";

import { EASE_OUT, SplitText, actions, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/*
  Título con cascada por letra (SplitText). Sustituye a KineticTitle en el
  Home: cada carácter entra con y+rotación+blur en stagger. Repetible al
  re-scrollear salvo `once` (hero). Reduced motion → estático.
*/
type Props = {
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  once?: boolean;
  charDelay?: number;
  /** Retraso inicial (solo útil con `once`, p.ej. el hero). */
  delay?: number;
};

export function SplitHeading({
  lines,
  as: Tag = "h2",
  className,
  once = false,
  charDelay = 0.035,
  delay = 0,
}: Props) {
  const ref = React.useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const split = SplitText.create(el, {
        type: "chars,words",
        wordsClass: "whitespace-nowrap",
      });

      gsap.from(split.chars, {
        yPercent: 110,
        rotation: 10,
        opacity: 0,
        filter: "blur(8px)",
        transformOrigin: "0% 100%",
        duration: 0.7,
        delay,
        ease: EASE_OUT,
        stagger: charDelay,
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          toggleActions: actions(once),
        },
        onComplete: () => gsap.set(split.chars, { clearProps: "filter" }),
      });

      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </Tag>
  );
}
