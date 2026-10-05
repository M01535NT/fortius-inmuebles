"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/*
  Punto único de registro de GSAP. El antecedente de motion quedó archivado en
  evidencia histórica: docs/fortius-inmuebles-implementation.md;
  las reglas activas de diseño están en README.md.
  Importar gsap/ScrollTrigger/SplitText SIEMPRE desde aquí.
*/
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/* Equivalente a cubic-bezier(0.16,1,0.3,1), el ease de la casa. */
export const EASE_OUT = "expo.out";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function isMobile() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

/* toggleActions estándar: repetible al re-scrollear, salvo `once`. */
export function actions(once: boolean) {
  return once ? "play none none none" : "restart none none reverse";
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
