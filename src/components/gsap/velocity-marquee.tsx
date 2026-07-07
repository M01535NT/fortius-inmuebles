"use client";

import * as React from "react";

import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

/*
  Marquee infinito cuya velocidad y dirección reaccionan al scroll: al
  scrollear rápido la banda acelera; al scrollear hacia arriba se invierte.
  Reduced motion → banda estática (una sola copia, sin desplazamiento).
*/
type Props = {
  children: React.ReactNode;
  className?: string;
  /** Segundos por vuelta a velocidad base. */
  duration?: number;
  reverse?: boolean;
};

const COPIES = 3;

export function VelocityMarquee({ children, className, duration = 40, reverse = false }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();

  useGSAP(
    () => {
      const track = ref.current?.querySelector<HTMLElement>("[data-track]");
      if (!track || prefersReducedMotion()) return;

      const base = reverse ? -1 : 1;
      const tween = gsap.to(track, {
        xPercent: -100 / COPIES,
        duration,
        ease: "none",
        repeat: -1,
      });
      tween.timeScale(base);

      /* La velocidad del scroll modula el timeScale y vuelve suave a la base. */
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = gsap.utils.clamp(-4, 4, self.getVelocity() / 300);
          gsap.to(tween, {
            timeScale: base + boost * base,
            duration: 0.3,
            overwrite: true,
            onComplete: () => {
              gsap.to(tween, { timeScale: base, duration: 1.2, overwrite: true });
            },
          });
        },
      });

      return () => {
        st.kill();
      };
    },
    { scope: ref, dependencies: [duration, reverse] },
  );

  return (
    <div ref={ref} className={className ? `overflow-hidden ${className}` : "overflow-hidden"}>
      <div data-track className="flex w-max will-change-transform">
        {Array.from({ length: reduce ? 1 : COPIES }).map((_, i) => (
          <div key={i} aria-hidden={i > 0} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
