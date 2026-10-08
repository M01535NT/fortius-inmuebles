"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-m";
import { AnimatePresence, useInView, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SplitHeading } from "@/components/gsap/split-heading";
import { resolveSiteContent } from "@/data/home-copy";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteContent } from "@/lib/admin/store";
import { HeroMarquee } from "@/components/home/hero-marquee";

const PHOTOS = [
  { src: "/hero/casa-playa.webp", alt: "Residencia junto al mar" },
  { src: "/hero/interior-depa.webp", alt: "Interior de departamento" },
  { src: "/hero/edificio-ciudad.webp", alt: "Arquitectura residencial en la ciudad" },
  { src: "/hero/plaza.webp", alt: "Plaza comercial" },
];

export function EditorialHero({ content }: { content?: SiteContent | null }) {
  const copy = resolveSiteContent(content);
  const reduce = useReducedMotionSafe();
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const playing = inView && visible && !reduce && !paused;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  React.useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  React.useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setIndex((value) => (value + 1) % PHOTOS.length), 8000);
    return () => clearTimeout(timer);
  }, [index, playing]);

  return (
    <section ref={ref} aria-label="Presentación" className="editorial-hero">
      <figure className="editorial-cover-figure">
        <div className="editorial-cover-window">
          <motion.div className="editorial-cover-depth" style={{ y: reduce ? 0 : photoY, scale: reduce ? 1 : photoScale }}>
            <AnimatePresence initial={false} mode="sync">
              <motion.div key={index} className="editorial-cover-photo"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 1.15, ease: [0.76, 0, 0.24, 1] }}>
                <div className={reduce ? "absolute inset-0" : "kenburns absolute inset-0"} style={{ animationPlayState: playing ? "running" : "paused" }}>
                  <Image src={PHOTOS[index].src} alt={PHOTOS[index].alt} fill priority={index === 0}
                    sizes="100vw" className="object-cover" />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </figure>
      <div className="editorial-hero-shade" aria-hidden="true" />
      <div className="editorial-hero-content editorial-container">
        <div className="editorial-cover-copy">
          <SplitHeading as="h1" once reveal="soft-lines" delay={0.1}
            lines={copy.heroTitulo === "Vende tu propiedad." ? ["Vende tu ", "propiedad."] : copy.heroTitulo.split("\n")}
            className="editorial-cover-title" />
          <motion.p className="hero-copy-entry editorial-cover-description"
            initial={false} animate={{ y: 0 }} transition={{ duration: reduce ? 0 : 0.8 }}>
            {copy.heroSubtitulo}
          </motion.p>
          <motion.div className="hero-copy-entry editorial-cover-actions" initial={false}
            whileInView={reduce ? undefined : { y: [16, 0] }} viewport={{ once: true }} transition={{ duration: 0.75 }}>
            <Link href="/vender-propiedad" className="editorial-button" data-cursor="Vender">Quiero vender mi propiedad <ArrowUpRight size={20} aria-hidden="true" /></Link>
            <Link href="/inventario" className="editorial-text-link" data-cursor="Explorar">Ver propiedades <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </motion.div>
        </div>
        <div role="group" aria-label="Imágenes del inicio" aria-describedby="editorial-slide-help" className="editorial-photo-controls">
          <span id="editorial-slide-help" className="sr-only">Selecciona una imagen para mantenerla en pantalla y detener los cambios automáticos.</span>
          {PHOTOS.map((photo, i) => <button key={photo.src} type="button" aria-label={`Imagen ${i + 1}`}
            aria-pressed={index === i} onClick={() => { setIndex(i); setPaused(true); }}><span /></button>)}
        </div>
      </div>
      <HeroMarquee />
    </section>
  );
}
