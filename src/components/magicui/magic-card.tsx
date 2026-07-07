"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/*
  MagicCard: spotlight sutil que sigue el cursor sobre la card.
  Motion values fuera del render de React (cero re-renders por mousemove).
*/
type MagicCardProps = React.PropsWithChildren<{
  className?: string;
  /* Color del halo; por defecto el verde firma con alpha bajo. */
  glow?: string;
}>;

export function MagicCard({ children, className, glow = "rgba(15, 107, 78, 0.10)" }: MagicCardProps) {
  const reduce = useReducedMotion();
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const background = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, ${glow}, transparent 75%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function onMouseLeave() {
    mouseX.set(-200);
    mouseY.set(-200);
  }

  return (
    <div
      onMouseMove={reduce ? undefined : onMouseMove}
      onMouseLeave={reduce ? undefined : onMouseLeave}
      className={cn("group relative", className)}
    >
      {!reduce ? (
        <motion.div
          aria-hidden="true"
          style={{ background }}
          className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      ) : null}
      {children}
    </div>
  );
}
