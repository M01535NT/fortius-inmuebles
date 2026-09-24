"use client";

import * as React from "react";
import { useInView } from "motion/react";

import { EASE_OUT, actions, gsap, useGSAP } from "@/lib/gsap";

/*
  Reveal dramático y repetible (reemplaza BlurFade en el Home): entra al
  cruzar el viewport y vuelve a su estado inicial al salir, para que la
  página siga viva al re-scrollear. Reduced motion → estático.
*/
type Props = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  rotate?: number;
  /** Flip 3D de entrada (grados en Y); usa perspectiva propia. */
  rotateY?: number;
  scale?: number;
  blur?: number;
  delay?: number;
  once?: boolean;
  duration?: number;
};

export function Reveal({
  children,
  className,
  distance = 90,
  direction = "up",
  rotate = 0,
  rotateY = 0,
  scale = 1,
  blur = 0,
  delay = 0,
  once = false,
  duration = 0.9,
}: Props) {
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

      /* direction = lado desde el que ENTRA: left → arranca en x negativa. */
      const axis = direction === "left" || direction === "right" ? "x" : "y";
      const sign = direction === "down" || direction === "left" ? -1 : 1;

      gsap.from(el, {
        [axis]: sign * distance * (compact ? 0.6 : 1),
        rotation: rotate,
        rotationY: rotateY,
        transformPerspective: rotateY ? 900 : undefined,
        scale,
        opacity: 0,
        filter: !compact && blur ? `blur(${blur}px)` : undefined,
        duration,
        delay,
        ease: EASE_OUT,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: actions(once),
        },
        onComplete: () => gsap.set(el, { clearProps: "filter" }),
      });
      });
      return () => media.revert();
    },
    { scope: ref, dependencies: [nearViewport], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
