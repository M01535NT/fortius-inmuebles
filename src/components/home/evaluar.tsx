"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: POST to lead endpoint. Local confirmation until backend exists.
    setSent(true);
  }

  return (
    <section id="evaluar" className="scroll-mt-20 bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Left: pitch + what happens next */}
          <div className="lg:col-span-5">
            <h2 className="display-title text-4xl text-foreground sm:text-5xl md:text-[54px]">
              ¿Cuánto vale
              <br />
              tu propiedad?
            </h2>
            <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Cuéntanos lo básico. Sin compromiso y sin publicar nada antes de
              revisarlo contigo.
            </p>
            <ol className="mt-9 space-y-4">
              {PASOS.map((paso, i) => (
                <li key={paso} className="flex items-start gap-4">
                  <span className="font-mono text-[13px] leading-[1.7] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-foreground/85">
                    {paso}
                  </span>
                </li>
              ))}
            </ol>
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
                className="rounded-lg border border-border bg-card p-6 md:p-8"
                noValidate={false}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
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
                  <div className="flex flex-col gap-2">
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
                  <div className="flex flex-col gap-2">
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
                  <div className="flex flex-col gap-2">
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
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
