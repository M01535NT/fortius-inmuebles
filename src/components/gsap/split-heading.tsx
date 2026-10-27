"use client";

import * as React from "react";
import { useInView } from "motion/react";

import { EASE_OUT, SplitText, actions, gsap, useGSAP } from "@/lib/gsap";

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
  reveal?: "chars" | "lines" | "soft-lines";
};

export function SplitHeading({
  lines,
  as: Tag = "h2",
  className,
  once = false,
  charDelay = 0.035,
  delay = 0,
  reveal = "chars",
}: Props) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  const softEntranceDone = React.useRef(false);
  const nearViewport = useInView(ref, { once: true, margin: "200px" });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !nearViewport) return;
      const media = gsap.matchMedia();
      const soft = reveal === "soft-lines";
      media.add(soft ? { reduce: "(prefers-reduced-motion: reduce)", motion: "(prefers-reduced-motion: no-preference)" } : { reduce: "(prefers-reduced-motion: reduce)", compact: "(max-width: 767px)", desktop: "(min-width: 768px)" }, (context) => {
      if (context.conditions?.reduce) {
        if (soft) softEntranceDone.current = true;
        return;
      }
      if (soft && softEntranceDone.current) return;
      const compact = !!context.conditions?.compact;

      if (reveal === "lines" || soft) {
        const split = SplitText.create(el, {
          type: "lines", mask: soft ? undefined : "lines", autoSplit: true,
          onSplit: (self) => {
            if (soft) {
              if (softEntranceDone.current) return;
              return gsap.fromTo(self.lines, { y: 18, opacity: 0, filter: "blur(3px)" }, {
                y: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, delay, stagger: 0.22, ease: "power3.out",
                onComplete: () => {
                  softEntranceDone.current = true;
                  gsap.set(self.lines, { clearProps: "filter,transform" });
                },
              });
            }
            return gsap.from(self.lines, {
              yPercent: 105, duration: 1.5, delay, stagger: 0.16, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", toggleActions: actions(once) },
            });
          },
        });
        return () => split.revert();
      }

      const split = SplitText.create(el, {
        type: "chars,words",
        wordsClass: "whitespace-nowrap",
      });

      gsap.from(split.chars, {
        yPercent: 110,
        rotation: compact ? 5 : 10,
        opacity: 0,
        filter: compact ? undefined : "blur(8px)",
        transformOrigin: "0% 100%",
        duration: 1.1,
        delay,
        ease: EASE_OUT,
        stagger: Math.min(charDelay, (compact ? 0.55 : 0.85) / Math.max(split.chars.length, 1)),
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          toggleActions: actions(once),
        },
        onComplete: () => gsap.set(split.chars, { clearProps: "filter" }),
      });

      return () => split.revert();
      });
      return () => media.revert();
    },
    { scope: ref, dependencies: [nearViewport, reveal, delay, once, charDelay], revertOnUpdate: true },
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
