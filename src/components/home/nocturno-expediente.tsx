"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Item = { title: string; text: string };
const EXAMPLE_READY = 4;

/*
  Por qué Fortius · opción «Expediente» (elegida por el titular, 18/10/2026).
  Un expediente de ejemplo se completa documento por documento al desplazar.
  31/10/2026: en escritorio con pantalla suficiente la sección se fija y cada
  palomita se dibuja con el recorrido; a la izquierda una línea avanza y el punto
  que corresponde se enciende. En pantallas bajas y en móvil cada fila se marca al
  cruzar la pantalla. Con movimiento reducido se muestra un estado fijo del ejemplo.
*/
export function NocturnoExpediente({ intro, pillars, documents }: { intro: string; pillars: Item[]; documents: Item[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const [ready, setReady] = React.useState(EXAMPLE_READY);
  const [animated, setAnimated] = React.useState(false);
  const total = documents.length;
  // Cada punto de la izquierda acompaña a una parte del expediente.
  const pillar = !animated ? -1 : ready === 0 ? 0 : Math.min(pillars.length - 1, Math.floor(((ready - 1) * pillars.length) / total));

  useGSAP(() => {
    const section = ref.current;
    if (!section) return;
    const rows = gsap.utils.toArray<HTMLElement>(".nx-exp-row", section);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      setAnimated(true);
      setReady(0);
      gsap.from(".nx-title-mask > span", { yPercent: 110, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 82%", once: true } });
      const enter = { trigger: section, start: "top 78%", toggleActions: "play none none reverse" };
      gsap.from(".nx-exp-lead", { y: 28, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: enter });
      gsap.from(".nx-exp-pillars li > div", { x: -40, opacity: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: enter });
      gsap.from(".nx-exp-card", { y: 80, rotate: 1.5, opacity: 0, duration: 1.3, ease: "power3.out", scrollTrigger: enter });
      gsap.from(".nx-exp-row", { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power2.out", delay: 0.25, scrollTrigger: enter });
      return () => { setAnimated(false); setReady(EXAMPLE_READY); };
    });

    // Escritorio con altura suficiente: la sección queda fija y el expediente se llena con el recorrido.
    media.add("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.create({
        trigger: section, start: "center center", end: () => `+=${total * 200}`,
        pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          section.style.setProperty("--exp-progress", self.progress.toFixed(3));
          setReady(Math.min(total, Math.floor(self.progress * total + 0.15)));
        },
      });
      gsap.fromTo(".nx-exp-sheet-back", { rotate: 0, x: 0 }, { rotate: 6, x: 28, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: 1 } });
      gsap.fromTo(".nx-exp-sheet-mid", { rotate: 0, x: 0 }, { rotate: 3, x: 14, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: 1 } });
      return () => section.style.removeProperty("--exp-progress");
    });

    // Móvil y pantallas bajas: cada palomita se marca cuando su fila cruza la pantalla.
    media.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference), (max-height: 699px) and (prefers-reduced-motion: no-preference)", () => {
      rows.forEach((row, index) => ScrollTrigger.create({
        trigger: row, start: "center 72%",
        onEnter: () => setReady((value) => Math.max(value, index + 1)),
        onLeaveBack: () => setReady(index),
      }));
      ScrollTrigger.create({
        trigger: ".nx-exp-list", start: "top 72%", end: "bottom 72%",
        onUpdate: (self) => section.style.setProperty("--exp-progress", self.progress.toFixed(3)),
      });
      return () => section.style.removeProperty("--exp-progress");
    });

    return () => media.revert();
  }, { scope: ref, dependencies: [total, pillars.length] });

  return (
    <section ref={ref} id="por-que-fortius" aria-labelledby="por-que-title" className={"nx-section nx-container nx-exp-section" + (animated ? " is-animated" : "")}>
      <div className="nx-exp">
        <div className="nx-exp-copy">
          <h2 id="por-que-title" className="nx-title"><span className="nx-title-mask"><span>Tu venta, en un expediente a la vista.</span></span></h2>
          <p className="nx-lead nx-exp-lead">{intro}</p>
          <div className="nx-exp-pillars-wrap">
            <span className="nx-exp-rail" aria-hidden="true"><span /></span>
            <ol className="nx-exp-pillars">
              {pillars.map((item, index) => <li key={item.title} className={(index === pillar ? "is-active" : "") + (index < pillar ? " is-past" : "")}>
                <span className="nx-exp-dot" aria-hidden="true" />
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </li>)}
            </ol>
          </div>
        </div>
        <div className="nx-exp-stack">
          <span className="nx-exp-sheet nx-exp-sheet-back" aria-hidden="true" />
          <span className="nx-exp-sheet nx-exp-sheet-mid" aria-hidden="true" />
          <div id="entregables" className="nx-exp-card" aria-labelledby="entregables-title">
            <div className="nx-exp-card-head">
              <h3 id="entregables-title">Expediente de tu venta <span>(ejemplo)</span></h3>
              <span className="nx-exp-chip" aria-hidden="true"><span key={ready} className="nx-exp-chip-n">{ready}</span> de {total} listos</span>
            </div>
            <div className="nx-exp-progress" aria-hidden="true"><span style={{ transform: `scaleX(${total ? ready / total : 0})` }} /></div>
            <div className="nx-exp-list">
              {documents.map((doc, index) => {
                const done = index < ready;
                return <article key={doc.title} data-deliverable-card className={"nx-exp-row" + (done ? " is-done" : "")}>
                  <span className="nx-exp-icon" aria-hidden="true">
                    <FileText className="nx-exp-file" size={18} strokeWidth={1.75} />
                    <svg className="nx-exp-check" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" /></svg>
                  </span>
                  <div><h4>{doc.title}</h4><p>{doc.text}</p></div>
                  <span className="nx-exp-state" aria-hidden="true"><span className="nx-exp-pending">Pendiente</span><span className="nx-exp-done">Listo</span></span>
                </article>;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
