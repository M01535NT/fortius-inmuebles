"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

export function DeliverablesStack({ documents }: { documents: { title: string; text: string }[] }) {
  const reduce = useReducedMotionSafe();
  const stackRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduce) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-deliverable-card]", stackRef.current);
      cards.slice(0, -1).forEach((card, index) => {
        gsap.to(card, {
          scale: 0.965,
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: { trigger: cards[index + 1], start: "top 75%", end: "top 130px", scrub: 0.45 },
        });
      });
    });
    return () => media.revert();
  }, { scope: stackRef, dependencies: [reduce], revertOnUpdate: true });

  return <div className="deliverables-stack" ref={stackRef}>
    {documents.map((document, index) => <article
      key={document.title}
      className="editorial-document"
      data-deliverable-card
      style={{ "--deliverable-index": index } as React.CSSProperties}
    >
      <span className="editorial-document-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <h3>{document.title}</h3>
      <p>{document.text}</p>
    </article>)}
  </div>;
}
