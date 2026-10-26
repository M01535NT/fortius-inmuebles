"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/*
  Punto único de registro de GSAP. Las reglas activas de identidad y diseño
  están en docs/brand.md; el desarrollo se guía por PLAN_ERP_CRM.md.
  Importar gsap/ScrollTrigger/SplitText SIEMPRE desde aquí.
*/
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/* Ease de la casa: salida suave (como cubic-bezier(0.25,1,0.5,1) en CSS), sin el arranque brusco de expo. */
export const EASE_OUT = "power3.out";

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
