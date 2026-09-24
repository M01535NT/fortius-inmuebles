"use client";

import { homeText } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import * as React from "react";
import { useRouter } from "next/navigation";

import { Scrub } from "@/components/gsap/scrub";
import { SplitHeading } from "@/components/gsap/split-heading";
import { BorderBeam } from "@/components/magicui/border-beam";
import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { MessagingContact } from "@/components/contact/messaging-actions";
import { EASE_OUT, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/*
  Lead capture. The form is the page's conversion tool: few fields, visible
  labels, honest microcopy. El POST al BFF de MNT debe confirmar la persistencia
  antes de redirigir a la página de gracias; un fallo conserva el borrador.
*/
const PASOS = [
  "Recibimos los datos de tu propiedad.",
  "Identificamos la información necesaria para revisar el caso.",
  "Te contactamos para acordar el siguiente paso.",
];

export function Evaluar({ content }: { content?: SiteContent | null }) {
  const router = useRouter();
  const sectionRef = React.useRef<HTMLElement>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /*
    Hay que ESPERAR la entrega antes de navegar: si se lanzara el envío y se
    redirigiera de inmediato, el navegador cancelaría la petición al cambiar de
    página y el prospecto se perdería en silencio — justo lo que veníamos
    haciendo. Y si falla, no se va a la página de gracias: no se agradece un
    lead que no llegó.
  */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      await captureLead({
        website: String(data.get("website") ?? ""),
        nombre: String(data.get("nombre") ?? ""),
        telefono: String(data.get("telefono") ?? ""),
        zona: String(data.get("zona") ?? ""),
        tipoPropiedad: String(data.get("tipo") ?? ""),
        origen: "evaluar",
      });
      router.push("/vender-propiedad/gracias");
    } catch {
      setError(
        "No pudimos enviar tus datos. Revisa tu conexión e inténtalo otra vez, o escríbenos por WhatsApp.",
      );
      setEnviando(false);
    }
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


    },
    { scope: sectionRef },
  );

  return (
    <section id="evaluar" ref={sectionRef} className="scroll-mt-20 bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Left: pitch + what happens next */}
          <div className="lg:col-span-5">
            <SplitHeading
              lines={homeText(content, "evaluarTitulo").split("\n")}
              className="display-title text-4xl text-foreground sm:text-5xl md:text-5xl"
            />
            <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
              {homeText(content, "evaluarTexto")}
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
                      className="inline-block font-mono text-sm leading-[1.7] text-primary"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-relaxed text-foreground/85">
                      {paso}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: the form */}
          <div className="lg:col-span-6 lg:col-start-7">
            <MessagingContact message="Hola, quiero evaluar mi propiedad con MNT Inmuebles.">
            <PublicLeadForm
                onSubmit={onSubmit}
                className="relative rounded-lg border border-border bg-card p-6 md:p-8"
                noValidate={false}
              >
                {/* Único BorderBeam de la página: señala la herramienta de conversión. */}
                <BorderBeam />
                <div className="relative grid gap-5 sm:grid-cols-2">
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="nombre" className="text-sm font-medium text-foreground">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      required
                      autoComplete="name"
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="telefono" className="text-sm font-medium text-foreground">
                      Teléfono o WhatsApp
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      required
                      autoComplete="tel"
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
                      placeholder="664 000 0000"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="zona" className="text-sm font-medium text-foreground">
                      Zona o colonia
                    </label>
                    <input
                      id="zona"
                      name="zona"
                      required
                      className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
                      placeholder="Ej. Zona Río, Otay"
                    />
                  </div>
                  <div data-campo className="flex flex-col gap-2">
                    <label htmlFor="tipo" className="text-sm font-medium text-foreground">
                      Tipo de propiedad
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      required
                      defaultValue=""
                      className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
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

                {error ? (
                  <p
                    role="alert"
                    className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="relative">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
                  >
                    {enviando ? "Enviando…" : "Solicitar evaluación"}
                  </button>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Sin compromiso. Usamos tus datos solo para dar seguimiento a
                    tu solicitud.
                  </p>
                </div>
              </PublicLeadForm>
            </MessagingContact>
          </div>
        </div>
      </div>
    </section>
  );
}
