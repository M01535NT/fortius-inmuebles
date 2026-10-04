"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useSpring } from "motion/react";

import { useMotionProfile } from "@/lib/use-motion-profile";
import { cn } from "@/lib/utils";

/*
  TiltCard: inclinación 3D sutil que sigue el cursor (máx ~7 grados),
  con springs fuera del ciclo de render de React. Reduced-motion: estático.
*/
export function TiltCard({
  children,
  className,
  max = 7,
}: React.PropsWithChildren<{ className?: string; max?: number }>) {
  const { magnetic } = useMotionProfile();
  const rotateX = useSpring(0, { stiffness: 180, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 20 });
  const y = useSpring(0, { stiffness: 220, damping: 24 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!magnetic || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max);
    rotateX.set(-py * max);
    y.set(-6);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={magnetic ? { rotateX, rotateY, y, transformPerspective: 1000 } : undefined}
      className={cn("interactive-card", className)}
    >
      {children}
    </motion.div>
  );
}
