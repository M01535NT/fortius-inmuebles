"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

/** Scroll choreographies use native scrolling on both mouse and touch. */
export function EditorialHome({ children }: React.PropsWithChildren) {
  const root = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotionSafe();
  useGSAP(() => {
    if (reduce) return;
    gsap.utils.toArray<HTMLElement>("[data-editorial-rule]", root.current).forEach((element) => {
      gsap.fromTo(element, { "--rule-progress": 0 }, { "--rule-progress": 1, duration: 1.2,
        ease: "power3.out", scrollTrigger: { trigger: element, start: "top 92%", toggleActions: "play none none reverse" } });
    });
    gsap.utils.toArray<HTMLElement>("[data-editorial-reveal]", root.current).forEach((element) => {
      gsap.fromTo(element, { y: 36 }, { y: 0, duration: 1.05, ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 90%", toggleActions: "play none none reverse" } });
    });
    gsap.utils.toArray<HTMLElement>("[data-editorial-image]", root.current).forEach((element) => {
      gsap.fromTo(element, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none",
        scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  }, { scope: root, dependencies: [reduce], revertOnUpdate: true });
  return <main ref={root} className="editorial-home">{children}</main>;
}
