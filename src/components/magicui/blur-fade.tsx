"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useInView,
  type HTMLMotionProps,
  type UseInViewOptions,
  type Variants } from "motion/react";

import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import { cn } from "@/lib/utils";

type BlurFadeProps = HTMLMotionProps<"div"> & {
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
  inView?: boolean;
  inViewMargin?: string;
  inViewOnce?: boolean;
};

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.9,
  yOffset = 18,
  blur = "8px",
  inView = true,
  inViewMargin = "-50px",
  inViewOnce = true,
  ...props
}: BlurFadeProps) {
  const reduce = useReducedMotionSafe();
  const ref = React.useRef<HTMLDivElement>(null);
  const inViewResult = useInView(ref, {
    once: inViewOnce,
    margin: inViewMargin as UseInViewOptions["margin"],
  });
  const isInView = !inView || inViewResult;

  const variants: Variants = {
    hidden: {
      y: yOffset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={reduce || inView ? false : "hidden"}
      animate={reduce ? "visible" : inView ? (isInView ? "visible" : undefined) : "visible"}
      variants={variants}
      transition={{ delay: reduce ? 0 : delay, duration: reduce ? 0 : duration, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
