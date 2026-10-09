"use client";
import * as motion from "motion/react-m";
import { MessagingActions } from "@/components/contact/messaging-actions";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useInView } from "motion/react";

import { SplitHeading } from "@/components/gsap/split-heading";
import { ESPECTACULAR } from "@/data/motion-config";
import { useMotionProfile } from "@/lib/use-motion-profile";
import { resolveSiteContent } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { gsap, useGSAP } from "@/lib/gsap";

const SLIDES = [
  { src: "/hero/casa-playa.webp", alt: "Residencia frente al mar en Baja California" },
  { src: "/hero/edificio-ciudad.webp", alt: "Edificio residencial en zona urbana de Tijuana" },
  { src: "/hero/interior-depa.webp", alt: "Interior de departamento con acabados claros" },
  { src: "/hero/plaza.webp", alt: "Plaza comercial en operación" },
];

const ROTATE_MS = 8000;

/* CTA con atracción magnética suave (motion values, cero re-renders). */
function MagneticCta({ href, children }: { href: string; children: React.ReactNode }) {
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      href={href}
      data-cursor="Hablemos"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
    >
      {children}
    </motion.a>
  );
}

export function Hero({ content }: { content?: SiteContent | null }) {
  const copy = resolveSiteContent(content);
  const titleLines = copy.heroTitulo.split("\n");
  const { reduce, magnetic, parallax } = useMotionProfile();
  const kinetic = ESPECTACULAR && magnetic;
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [visible, setVisible] = React.useState(true);

  const sectionRef = React.useRef<HTMLElement>(null);
  const depthRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { amount: 0.05 });
  const playing = !reduce && !paused && visible && inView;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  /* Parallax: el fondo se queda atrás mientras la sección sale de cuadro. */
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", `${ESPECTACULAR ? parallax : 0}%`]);

  useGSAP(() => {
    const depth = depthRef.current;
    const section = sectionRef.current;
    if (!depth || !section || !magnetic) return;
    const x = gsap.quickTo(depth, "x", { duration: 1.1, ease: "power3.out" });
    const y = gsap.quickTo(depth, "y", { duration: 1.1, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = section.getBoundingClientRect();
      x((event.clientX / rect.width - 0.5) * -28);
      y(((event.clientY - rect.top) / rect.height - 0.5) * -20);
    };
    const leave = () => { x(0); y(0); };
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", leave);
    return () => { section.removeEventListener("pointermove", move); section.removeEventListener("pointerleave", leave); };
  }, { scope: sectionRef, dependencies: [magnetic], revertOnUpdate: true });

  React.useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [playing, index]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] overflow-hidden bg-block" aria-label="Presentación">
      {/* Background rotator con parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-x-0 -top-[18%] bottom-0" aria-hidden="true">
        <div ref={depthRef} className="absolute -inset-5">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={index}
            initial={reduce ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 1.4, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0"
          >
            <div className={reduce ? "absolute inset-0" : "kenburns absolute inset-0"} style={{ animationPlayState: playing ? "running" : "paused" }}>
              <Image
                src={SLIDES[index].src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Scrim: keeps copy AA-readable over any slide, both themes. */}
        <div className="absolute inset-0 bg-gradient-to-t from-image-scrim/85 via-image-scrim/30 to-image-scrim/10" />
        </div>
      </motion.div>

      {/* Copy block, asymmetric bottom-left */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1280px] flex-col justify-end px-5 pb-8 pt-28 md:px-8 md:pb-12">
        {/* Masked line reveal (GSAP SplitText); the hero entrance runs once. */}
        <SplitHeading
          as="h1"
          lines={titleLines}
          once
          reveal="lines"
          delay={0.15}
          charDelay={0.028}
          className="hero-title max-w-[19ch] text-on-image"
        />

        <motion.p
          initial={reduce ? false : { opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0, delay: 0 } : { duration: 0.7, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="hero-copy-entry mt-5 max-w-[46ch] text-base leading-relaxed text-on-image-muted/90 md:text-lg"
        >
          {copy.heroSubtitulo}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 1, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0, delay: 0 } : { duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="hero-copy-entry mt-8 flex flex-wrap items-center gap-3"
        >
          <MessagingActions message="Hola, quiero conversar sobre una propiedad con Fortius Inmuebles." fallback={kinetic ? (
            <MagneticCta href="/vender-propiedad">Quiero vender mi propiedad</MagneticCta>
          ) : (
            <a
              href="/vender-propiedad"
              className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              Quiero vender mi propiedad
            </a>
          )} />
          <Link
            href="/inventario"
            data-cursor="Explorar"
            className="inline-flex h-12 items-center rounded-md border border-on-image/35 px-6 text-base font-medium text-on-image backdrop-blur-sm transition-colors hover:border-on-image/60 hover:bg-on-image/10 active:scale-[0.98]"
          >
            Ver propiedades <ArrowUpRight className="ml-3 size-4" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* Slide state: control funcional con progreso de 8s en la barra activa. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/25 pt-3">
        <div className="flex items-center gap-2" role="group" aria-label="Imágenes del inicio" aria-describedby="hero-slide-help">
          <p id="hero-slide-help" className="sr-only">Selecciona una imagen para mantenerla en pantalla y detener los cambios automáticos.</p>
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-pressed={i === index}
              aria-label={`Imagen ${i + 1}`}
              onClick={() => { setIndex(i); setPaused(true); }}
              className="group relative h-11 w-11 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-on-image/25">
                {i === index && playing ? (
                  <motion.span
                    key={`progress-${index}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
                    className="block h-full origin-left bg-on-image"
                  />
                ) : i === index ? (
                  <span className="block h-full bg-on-image" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
        <a href="#metodo" className="inline-flex min-h-11 items-center gap-3 text-sm text-on-image transition-opacity hover:opacity-80">Conocer el método <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
