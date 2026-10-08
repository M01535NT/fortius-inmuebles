"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useScroll, useTransform } from "motion/react";
import { FASES } from "@/data/metodo";
import { homeText } from "@/data/home-copy";
import { SplitHeading } from "@/components/gsap/split-heading";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteContent } from "@/lib/admin/store";

export function MethodTimeline({ content }: { content?: SiteContent | null }) {
  const ref = React.useRef<HTMLOListElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const progress = useTransform(scrollYProgress, (value) => `${value * 100}%`);

  return <section id="metodo" className="method-timeline-section editorial-container" aria-labelledby="timeline-title">
    <div className="method-timeline-heading">
      <div id="timeline-title"><SplitHeading reveal="lines" lines={homeText(content, "metodoTitulo").split("\n")} className="editorial-section-title" /></div>
      <p>{homeText(content, "metodoTexto")}</p>
    </div>
    <motion.ol ref={ref} className="method-timeline" data-method-timeline
      style={{ "--timeline-progress": reduce ? "100%" : progress } as React.CSSProperties}>
      {FASES.map((stage, index) => <motion.li key={stage.n}
        initial={false} whileInView={reduce ? undefined : { y: [28, 0] }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}>
        <span className="timeline-node" aria-hidden="true" />
        <span className="timeline-number" aria-hidden="true">{stage.n}</span>
        <h3>{stage.title}</h3>
        <p>{homeText(content, stage.copy)}</p>
      </motion.li>)}
    </motion.ol>
  </section>;
}
