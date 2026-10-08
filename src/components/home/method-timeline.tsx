"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useScroll, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { FASES } from "@/data/metodo";
import { homeText } from "@/data/home-copy";
import { SplitHeading } from "@/components/gsap/split-heading";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteContent } from "@/lib/admin/store";

export function MethodTimeline({ content }: { content?: SiteContent | null }) {
  const ref = React.useRef<HTMLOListElement>(null);
  const reduce = useReducedMotionSafe();
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const progress = useTransform(scrollYProgress, (value) => `${value * 100}%`);

  return <section id="metodo" className="method-timeline-section editorial-container" aria-labelledby="timeline-title">
    <div className="method-timeline-heading">
      <div id="timeline-title"><SplitHeading reveal="lines" lines={homeText(content, "metodoTitulo").split("\n")} className="editorial-section-title" /></div>
    </div>
    <motion.ol ref={ref} className="method-timeline" data-method-timeline
      style={{ "--timeline-progress": reduce ? "100%" : progress } as React.CSSProperties}>
      {FASES.map((stage, index) => <motion.li key={stage.n}
        initial={false} whileInView={reduce ? undefined : { y: [28, 0] }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}>
        <span className="timeline-node" aria-hidden="true" />
        <span className="timeline-number" aria-hidden="true">{stage.n}</span>
        <h3><button type="button" id={`stage-${stage.n}-button`} className="timeline-toggle"
          aria-expanded={expanded === stage.n} aria-controls={`stage-${stage.n}-detail`}
          onClick={() => setExpanded((current) => current === stage.n ? null : stage.n)}>
          <span>{stage.title}</span><Plus size={18} aria-hidden="true" />
        </button></h3>
        <motion.div id={`stage-${stage.n}-detail`} role="region" aria-labelledby={`stage-${stage.n}-button`}
          aria-hidden={expanded !== stage.n} inert={expanded !== stage.n} className="timeline-detail"
          initial={false} animate={{ height: expanded === stage.n ? "auto" : 0, opacity: expanded === stage.n ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <p>{homeText(content, stage.copy)}</p>
        </motion.div>
      </motion.li>)}
    </motion.ol>
  </section>;
}
