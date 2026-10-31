"use client";

import * as React from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Portada (31/10/2026): limpia, solo el titular y una barra por escena (sin botones ni
  subtítulo, por decisión del titular). Video a sangre en bucle y sin sonido. El titular cambia con cada
  escena del video (casa, oficina, nave): las líneas salen hacia arriba por su máscara y las
  nuevas suben desde abajo. Los cortes se midieron sobre /hero/portada.mp4 (fundidos hacia
  5.6 s y 10.3 s; desde 14.7 s el fundido ya regresa a la casa); si cambia el video, ajusta
  `start` y LOOP_BACK. Con movimiento reducido o sin JavaScript queda el póster quieto con
  la primera escena. El h1 es fijo para lectores de pantalla y buscadores.
*/
const SCENES = [
  { start: 0, label: "Residencial", lines: ["Te ayudamos a vender o comprar", "tu casa, con cada paso por escrito."] },
  { start: 5.6, label: "Comercial", lines: ["Oficinas y locales con precio", "sustentado en datos del mercado."] },
  { start: 10.3, label: "Industrial", lines: ["Naves industriales con", "documentos revisados antes de firmar."] },
];
const LOOP_BACK = 14.7;

function sceneAt(time: number) {
  if (time >= LOOP_BACK) return 0;
  let index = 0;
  SCENES.forEach((scene, i) => { if (time >= scene.start) index = i; });
  return index;
}

export function NocturnoHero() {
  const ref = React.useRef<HTMLElement>(null);
  const video = React.useRef<HTMLVideoElement>(null);
  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const shown = React.useRef(0);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".nx-hero-slide:first-child .nx-hero-rise", { yPercent: 110, duration: 1.6, stagger: 0.14, ease: "power3.out", delay: 0.2 });
      // El video se acerca con el desplazamiento, como lo hacía la foto.
      gsap.fromTo(".nx-hero-media video", { scale: 1.08 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 1.2 },
      });
      video.current?.play().then(() => {
        // Los titulares de las otras escenas esperan bajo su máscara hasta que les toque.
        gsap.set(".nx-hero-slide + .nx-hero-slide .nx-hero-rise", { yPercent: 110 });
        setPlaying(true);
      }).catch(() => { /* el póster se queda */ });
    });
    media.add("(prefers-reduced-motion: reduce)", () => { video.current?.pause(); });
    return () => media.revert();
  }, { scope: ref });

  // Escena y avance de la barra, leídos del tiempo real del video en cada cuadro.
  React.useEffect(() => {
    const el = video.current;
    const root = ref.current;
    if (!playing || !el || !root) return;
    let frame = 0;
    const tick = () => {
      const t = el.currentTime;
      const index = sceneAt(t);
      const end = index === SCENES.length - 1 ? LOOP_BACK : SCENES[index + 1].start;
      const progress = t >= LOOP_BACK ? 0 : (t - SCENES[index].start) / (end - SCENES[index].start);
      root.style.setProperty("--nx-scene-progress", Math.min(1, Math.max(0, progress)).toFixed(3));
      setActive((prev) => (prev === index ? prev : index));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Relevo del titular: las líneas viejas salen hacia arriba y las nuevas suben desde abajo.
  useGSAP(() => {
    const prev = shown.current;
    if (prev === active) return;
    shown.current = active;
    const slides = gsap.utils.toArray<HTMLElement>(".nx-hero-slide", ref.current);
    const out = slides[prev].querySelectorAll(".nx-hero-rise");
    const into = slides[active].querySelectorAll(".nx-hero-rise");
    gsap.killTweensOf([out, into]);
    gsap.timeline()
      .to(out, { yPercent: -110, duration: 0.7, stagger: 0.06, ease: "power3.in" })
      .fromTo(into, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "power3.out" }, "-=0.25");
  }, { scope: ref, dependencies: [active] });

  const goTo = (index: number) => {
    if (video.current) video.current.currentTime = SCENES[index].start + 0.05;
  };

  return (
    <section ref={ref} aria-labelledby="hero-title" className="nx-hero">
      <div className="nx-hero-media">
        <video ref={video} src="/hero/portada.mp4" poster="/hero/portada-poster.webp" muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
      </div>
      <div className="nx-hero-scrim" aria-hidden="true" />
      <div className="nx-hero-body nx-container">
        <p className="sr-only">Inmobiliaria en Tijuana, Rosarito, Tecate y Ensenada.</p>
        <h1 id="hero-title" className="sr-only">Te ayudamos a vender o comprar tu propiedad, con cada paso por escrito.</h1>
        <div className={`nx-hero-slides${playing ? " is-live" : ""}`} aria-hidden="true">
          {SCENES.map((scene) => (
            <div key={scene.label} className="nx-hero-slide">
              <p className="nx-hero-title">
                {scene.lines.map((line) => (
                  <React.Fragment key={line}><span className="nx-hero-line"><span className="nx-hero-rise">{line}</span></span>{" "}</React.Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
        {playing ? (
          <ol className="nx-hero-scenes" aria-label="Escenas del video">
            {SCENES.map((scene, i) => (
              <li key={scene.label}>
                <button type="button" onClick={() => goTo(i)} aria-label={`Ir a la escena ${scene.label}`} aria-current={i === active ? "true" : undefined} className="nx-hero-scene">
                  <span className="nx-hero-scene-bar" aria-hidden="true"><span /></span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
