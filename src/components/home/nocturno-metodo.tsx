"use client";

import * as React from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Stage = { n: string; title: string; text: string };

/*
  Método: en escritorio la sección se fija y las seis etapas recorren la
  pantalla en horizontal mientras avanza la barra; la etapa activa se enciende
  en borgoña. En móvil las tarjetas se apilan al desplazar. Con movimiento
  reducido se muestran todas, sin fijar ni animar.
*/
export function NocturnoMetodo({ title, stages }: { title: string; stages: Stage[] }) {
  const ref = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(-1);

  useGSAP(() => {
    const section = ref.current;
    const viewport = section?.querySelector<HTMLElement>(".nx-method-viewport");
    const track = section?.querySelector<HTMLElement>(".nx-method-track");
    if (!section || !viewport || !track) return;
    const cards = gsap.utils.toArray<HTMLElement>(".nx-stage", section);
    const last = cards.length - 1;
    const media = gsap.matchMedia();

    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      setActive(0);
      gsap.timeline({
        scrollTrigger: {
          trigger: section, start: "top top", end: () => `+=${distance() + innerHeight * 0.75}`,
          pin: true, scrub: 1.2, anticipatePin: 1, invalidateOnRefresh: true,
          // The lit stage is the card nearest a focus point that travels with the
          // scroll. Layout offsets (not the scrubbed transform) keep it exact.
          onUpdate: (self) => {
            const focus = viewport.clientWidth * (0.25 + 0.5 * self.progress);
            const shift = distance() * self.progress;
            let nearest = 0;
            let gap = Infinity;
            cards.forEach((card, index) => {
              const center = card.offsetLeft + card.offsetWidth / 2 - shift;
              const away = Math.abs(center - focus);
              if (away < gap) { gap = away; nearest = index; }
            });
            setActive(Math.min(last, nearest));
          },
        },
      })
        .to(track, { x: () => -distance(), ease: "none" }, 0)
        .fromTo(".nx-progress-fill", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0)
        .to(".nx-method-glow", { xPercent: 95, ease: "none" }, 0);
      // Entrance, created after the pin so its start accounts for the pin spacer.
      // Movimiento pausado; la opacidad llega antes para que el texto se lea mientras entra.
      const enter = { trigger: viewport, start: "top 92%", toggleActions: "play none none reverse" };
      gsap.fromTo(cards, { y: 90, rotate: 2 }, {
        y: 0, rotate: 0, duration: 1.6, stagger: 0.14, ease: "power3.out", clearProps: "transform,translate,rotate,scale", scrollTrigger: enter,
      });
      gsap.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.14, ease: "power1.out", clearProps: "opacity", scrollTrigger: enter });
      return () => setActive(-1);
    });

    media.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
      setActive(0);
      cards.forEach((card, index) => ScrollTrigger.create({
        trigger: card, start: "top 62%", end: "bottom 38%",
        onToggle: (self) => { if (self.isActive) setActive(index); },
      }));
      gsap.fromTo(".nx-progress-fill", { scaleX: 0 }, {
        scaleX: 1, ease: "none", scrollTrigger: { trigger: track, start: "top 70%", end: "bottom 70%", scrub: true },
      });
      return () => setActive(-1);
    });

    return () => media.revert();
  }, { scope: ref, dependencies: [stages.length] });

  return (
    <section ref={ref} id="metodo" aria-labelledby="metodo-title" className="nx-method">
      <span className="nx-method-glow" aria-hidden="true" />
      <div className="nx-container">
        <div className="nx-method-head">
          <div>
            <p className="nx-eyebrow">Nuestro método</p>
            <h2 id="metodo-title" className="nx-title">{title}</h2>
          </div>
          <p className="nx-method-count" aria-hidden="true">{String(Math.max(active, 0) + 1).padStart(2, "0")}<span> / {String(stages.length).padStart(2, "0")}</span></p>
        </div>
        <div className="nx-progress" aria-hidden="true"><div className="nx-progress-fill" /></div>
      </div>
      <div className="nx-method-viewport">
        <ol className="nx-method-track" data-method-timeline>
          {stages.map((stage, index) => <li key={stage.n}
            className={"nx-stage" + (index === active ? " is-active" : "") + (active > index ? " is-past" : "")}
            style={{ "--stage-index": index } as React.CSSProperties}>
            <span className="nx-stage-number" aria-hidden="true">{stage.n}</span>
            <div>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
              <span className="nx-stage-step">Etapa {Number(stage.n)} de {stages.length}</span>
            </div>
          </li>)}
        </ol>
      </div>
    </section>
  );
}
