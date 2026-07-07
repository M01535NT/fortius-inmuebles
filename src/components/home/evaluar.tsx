"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Scrub } from "@/components/gsap/scrub";
import { SplitHeading } from "@/components/gsap/split-heading";
import { BorderBeam } from "@/components/magicui/border-beam";
import { EASE_OUT, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/*
  Lead capture. The form is the page's conversion tool: few fields, visible
  labels, honest microcopy. TODO: wire onSubmit to the real endpoint /
  CRM webhook when it exists; today it confirms locally.
*/
const PASOS = [
  "Recibimos los datos de tu propiedad.",
  "Revisamos zona y comparables vendidos.",
  "Te contactamos con una lectura inicial de valor y el siguiente paso.",
];

export function Evaluar() {
  const reduce = useReducedMotion();
  const [sent, setSent] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: POST to lead endpoint. Local confirmation until backend exists.
    setSent(true);
  }

  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el || prefersReducedMotion()) return;

      /* Pasos en cascada con pop del número, repetible. */
      gsap.utils.toArray<HTMLElement>("[data-paso]", el).forEach((paso, i) => {
        const tl = gsap.timeline({
          delay: 0.1 * i,
          scrollTrigger: {
            trigger: paso,
            start: "top 85%",
            toggleActions: "restart none none reverse",
          },
        });
        tl.from(paso, { x: -24, opacity: 0, duration: 0.6, ease: EASE_OUT }).from(
          paso.querySelector("[data-num]"),
          { scale: 0.4, opacity: 0, duration: 0.45, ease: "back.out(2.2)" },
          0.1,
        );
      });

      /* Campos del formulario: stagger una sola vez (zona de conversión). */
      const campos = gsap.utils.toArray<HTMLElement>("[data-campo]", el);
      if (campos.length > 0) {
        gsap.from(campos, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: EASE_OUT,
          stagger: 0.08,
          scrollTrigger: {
            trigger: el.querySelector("form"),
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    },
    { scope: sectionRef, dependencies: [sent] },
  );

  return (
    <section id="evaluar" ref={sectionRef} className="scroll-mt-20 bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Left: pitch + what happens next */}
          <div className="lg:col-span-5">
            <SplitHeading
              lines={["¿Cuánto vale", "tu propiedad?"]}
              className="display-title text-4xl text-foreground sm:text-5xl md:text-[54px]"
            />
            <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Cuéntanos lo básico. Sin compromiso y sin publicar nada antes de
              revisarlo contigo.
            </p>
            <div className="relative mt-9">
              {/* Línea vertical que se dibuja con el scroll. */}
              <Scrub
                scaleY={[0, 1]}
                className="absolute bottom-1 left-0 top-1 w-px origin-top bg-primary/50"
              >
                <span aria-hidden="true" />
              </Scrub>
              <ol className="space-y-4 pl-6">
                {PASOS.map((paso, i) => (
                  <li key={paso} data-paso className="flex items-start gap-4">
                    <span
                      data-num
                      className="inline-block font-mono text-[13px] leading-[1.7] text-primary"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-foreground/85">
                      {paso}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: the form */}
          <div className="lg:col-span-6 lg:col-start-7">
            {sent ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full min-h-[380px] flex-col items-start justify-center rounded-lg border border-border bg-card p-8"
              >
                <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
                <h3 className="display-soft mt-5 text-2xl text-foreground">
                  Recibimos los datos de tu propiedad.
                </h3>
                <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                  Revisamos la información y te contactamos para decirte cuál
                  es el siguiente paso.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="relative rounded-lg border border-border bg-card p-6 md:p-8"
                noValidate={false}
              >
                {/* Único BorderBeam de la página: señala la herramienta de conversión. */}
                <BorderBeam />
                <div className="relative grid gap-5 sm:grid-cols-2">
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="nombre" className="text-[13.5px] font-medium text-foreground">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      required
                      autoComplete="name"
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="telefono" className="text-[13.5px] font-medium text-foreground">
                      Teléfono o WhatsApp
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      required
                      autoComplete="tel"
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                      placeholder="664 000 0000"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="zona" className="text-[13.5px] font-medium text-foreground">
                      Zona o colonia
                    </label>
                    <input
                      id="zona"
                      name="zona"
                      required
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                      placeholder="Ej. Zona Río, Otay"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="tipo" className="text-[13.5px] font-medium text-foreground">
                      Tipo de propiedad
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      required
                      defaultValue=""
                      className="h-11 rounded-md border border-input bg-background px-3 text-[15px] text-foreground"
                    >
                      <option value="" disabled>
                        Selecciona una opción
                      </option>
                      <option>Casa</option>
                      <option>Departamento</option>
                      <option>Local u oficina</option>
                      <option>Terreno</option>
                      <option>Otro</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="submit"
                    className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] sm:w-auto"
                  >
                    Solicitar evaluación
                  </button>

                  <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                    Sin compromiso. Usamos tus datos solo para dar seguimiento a
                    tu solicitud.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
