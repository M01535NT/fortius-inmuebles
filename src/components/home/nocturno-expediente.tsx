"use client";

import * as React from "react";
import { Check, FileText } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";

type Item = { title: string; text: string };
const EXAMPLE_READY = 4;

/*
  Por qué Fortius · opción «Expediente» (elegida por el titular, 18/10/2026).
  Un expediente de ejemplo se completa documento por documento al desplazar;
  los pilares se encienden en el mismo recorrido. Con movimiento reducido se
  muestra un estado fijo del ejemplo.
*/
export function NocturnoExpediente({ intro, pillars, documents }: { intro: string; pillars: Item[]; documents: Item[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const [ready, setReady] = React.useState(EXAMPLE_READY);
  const [pillar, setPillar] = React.useState(-1);
  const total = documents.length;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      setReady(0);
      gsap.timeline({
        scrollTrigger: {
          trigger: ".nx-exp-stack", start: "top 75%", end: "bottom 55%", scrub: 1.2,
          onUpdate: (self) => {
            setReady(Math.min(total, Math.floor(self.progress * (total + 0.99))));
            setPillar(Math.min(pillars.length - 1, Math.floor(self.progress * pillars.length)));
          },
        },
      })
        .fromTo(".nx-exp-sheet-back", { rotate: 0, x: 0 }, { rotate: 7, x: 36, ease: "none" }, 0)
        .fromTo(".nx-exp-sheet-mid", { rotate: 0, x: 0 }, { rotate: 3.5, x: 18, ease: "none" }, 0)
        .fromTo(".nx-exp-card", { y: 60 }, { y: 0, ease: "none" }, 0);
      // El desplazamiento es pausado; la opacidad llega antes para que el texto se lea mientras se mueve.
      const enter = { trigger: ref.current, start: "top 80%", toggleActions: "play none none reverse" };
      // El titular sube desde su máscara; el resto del texto entra como antes.
      gsap.from(".nx-title-mask > span", { yPercent: 110, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 82%", once: true } });
      gsap.from(".nx-exp-copy > :not(h2)", { y: 32, duration: 1.4, stagger: 0.14, ease: "power3.out", scrollTrigger: enter });
      gsap.from(".nx-exp-copy > :not(h2)", { opacity: 0, duration: 0.5, stagger: 0.06, ease: "expo.out", scrollTrigger: enter });
      return () => { setReady(EXAMPLE_READY); setPillar(-1); };
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [total, pillars.length] });

  return (
    <section ref={ref} id="por-que-fortius" aria-labelledby="por-que-title" className="nx-section nx-container">
      <div className="nx-exp">
        <div className="nx-exp-copy">
          <h2 id="por-que-title" className="nx-title"><span className="nx-title-mask"><span>Tu venta, en un expediente que puedes ver.</span></span></h2>
          <p className="nx-lead">{intro}</p>
          <ol className="nx-exp-pillars">
            {pillars.map((item, index) => <li key={item.title} className={index === pillar ? "is-active" : undefined}>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </li>)}
          </ol>
        </div>
        <div className="nx-exp-stack">
          <span className="nx-exp-sheet nx-exp-sheet-back" aria-hidden="true" />
          <span className="nx-exp-sheet nx-exp-sheet-mid" aria-hidden="true" />
          <div id="entregables" className="nx-exp-card" aria-labelledby="entregables-title">
            <div className="nx-exp-card-head">
              <h3 id="entregables-title">Documentos de tu operación <span>(ejemplo)</span></h3>
              <span className="nx-exp-chip" aria-hidden="true">{ready} de {total} listos</span>
            </div>
            <div className="nx-exp-progress" aria-hidden="true"><span style={{ transform: `scaleX(${total ? ready / total : 0})` }} /></div>
            <div className="nx-exp-list">
              {documents.map((doc, index) => {
                const done = index < ready;
                return <article key={doc.title} data-deliverable-card className={"nx-exp-row" + (done ? " is-done" : "")}>
                  <span className="nx-exp-icon" aria-hidden="true">{done ? <Check size={18} strokeWidth={2.25} /> : <FileText size={18} strokeWidth={1.75} />}</span>
                  <div><h4>{doc.title}</h4><p>{doc.text}</p></div>
                  <span className="nx-exp-state" aria-hidden="true">{done ? "Listo" : "Pendiente"}</span>
                </article>;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
