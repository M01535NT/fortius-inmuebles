"use client";

import * as React from "react";
import { useInView } from "motion/react";

import { gsap, useGSAP } from "@/lib/gsap";

/*
  Wrapper scroll-linked genérico: el elemento deriva CON el scroll mientras
  su contenedor cruza el viewport. Solo transform. En mobile la deriva se
  reduce a la mitad; reduced motion → estático.
*/
type Range = [from: number, to: number];

type Props = {
  children: React.ReactNode;
  className?: string;
  y?: Range;
  x?: Range;
  /** Deriva horizontal en % del propio elemento (watermarks). */
  xPercent?: Range;
  rotate?: Range;
  scaleY?: Range;
};

export function Scrub({ children, className, y, x, xPercent, rotate, scaleY }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const nearViewport = useInView(ref, { once: true, margin: "200px" });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !nearViewport) return;
      const media = gsap.matchMedia();
      media.add({ reduce: "(prefers-reduced-motion: reduce)", compact: "(max-width: 767px)", desktop: "(min-width: 768px)" }, (context) => {
      if (context.conditions?.reduce) return;
      const compact = !!context.conditions?.compact;

      const k = compact ? 0.5 : 1;
      const from: gsap.TweenVars = {};
      const to: gsap.TweenVars = {
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      };
      if (y) [from.y, to.y] = [y[0] * k, y[1] * k];
      if (x) [from.x, to.x] = [x[0] * k, x[1] * k];
      if (xPercent) [from.xPercent, to.xPercent] = [xPercent[0] * k, xPercent[1] * k];
      if (rotate) [from.rotation, to.rotation] = [rotate[0], rotate[1]];
      if (scaleY) [from.scaleY, to.scaleY] = [scaleY[0], scaleY[1]];

      gsap.fromTo(el, from, to);
      });
      return () => media.revert();
    },
    { scope: ref, dependencies: [nearViewport], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className ? `will-change-transform ${className}` : "will-change-transform"}>
      {children}
    </div>
  );
}
