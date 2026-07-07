"use client";

import * as React from "react";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";

/*
  NumberTicker: anima un valor numérico con spring hacia su nuevo valor.
  Uso permitido: resultados de cálculo (calculadoras); nunca métricas
  inventadas. Formatea con separador de miles estable (en-US).
*/
type NumberTickerProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function NumberTicker({ value, prefix = "", suffix = "", className }: NumberTickerProps) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 22 });
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  React.useEffect(() => {
    if (reduce) return;
    const unsubscribe = spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString("en-US")}${suffix}`;
      }
    });
    return unsubscribe;
  }, [spring, prefix, suffix, reduce]);

  const staticText = `${prefix}${Math.round(value).toLocaleString("en-US")}${suffix}`;

  if (reduce) {
    return <span className={className}>{staticText}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {staticText}
    </span>
  );
}
