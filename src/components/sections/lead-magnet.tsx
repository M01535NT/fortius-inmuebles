"use client";

import * as React from "react";
import { ArrowDownToLine, FileCheck2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Lead magnet: checklist de venta a cambio de nombre y WhatsApp.
  La descarga se libera solo tras confirmar la persistencia en el backend de MNT.
*/
const PREVIEW = [
  "Identificar al propietario o representante y reunir el título disponible.",
  "Revisar adeudos, gravámenes y diferencias documentales que deban resolverse.",
  "Sustentar el precio con la evidencia de mercado que exista.",
];

export function LeadMagnet() {
  const [sent, setSent] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
        origen: "checklist",
      });
      setSent(true);
    } catch {
      setError("No pudimos enviar tus datos. Inténtalo otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="border-y border-border">
      <Container className="py-16 md:py-20">
        <BlurFade>
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Pitch */}
            <div className="lg:col-span-6">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Guía para propietarios
              </p>
              <h2 className="display-title mt-3 max-w-[18ch] text-3xl text-foreground sm:text-4xl">
                ¿Está lista tu propiedad para venderse?
              </h2>
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
                Diez preguntas para preparar una venta. Algunas se resuelven
                de inmediato; otras requieren revisar documentos o consultar
                a un especialista antes de publicar.
              </p>
              <ul className="mt-6 space-y-2.5">
                {PREVIEW.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base text-foreground/85">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                    {item}
                  </li>
                ))}
                <li className="pl-7 text-sm text-muted-foreground">…y 7 puntos más en el PDF.</li>
              </ul>
            </div>

            {/* Captura / descarga */}
            <div className="self-center lg:col-span-5 lg:col-start-8">
              {sent ? (
                <div className="rounded-lg border border-border bg-card p-6 md:p-7">
                  <p className="display-soft text-xl text-foreground">Listo. Aquí está tu checklist.</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    También lo usaremos para dar seguimiento a tu caso, sin
                    spam y sin compartir tus datos.
                  </p>
                  <a
                    href="/descargas/checklist-venta-fortius.pdf"
                    download
                    className="mt-5 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    <ArrowDownToLine className="size-4" strokeWidth={1.5} />
                    Descargar PDF
                  </a>
                </div>
              ) : (
                <PublicLeadForm onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-6 md:p-7">
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lm-nombre" className="text-sm font-medium text-foreground">
                        Nombre
                      </label>
                      <input
                        id="lm-nombre"
                        name="nombre"
                        required
                        autoComplete="name"
                        placeholder="Tu nombre"
                        className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lm-telefono" className="text-sm font-medium text-foreground">
                        Teléfono o WhatsApp
                      </label>
                      <input
                        id="lm-telefono"
                        name="telefono"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="664 000 0000"
                        className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  >
                    <ArrowDownToLine className="size-4" strokeWidth={1.5} />
                    {enviando ? "Enviando…" : "Obtener el checklist"}
                  </button>
                  {error ? (
                    <p
                      role="alert"
                      className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm leading-relaxed text-destructive"
                    >
                      {error}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Sin costo. Usamos tus datos solo para dar seguimiento; no
                    los compartimos.
                  </p>
                </PublicLeadForm>
              )}
            </div>
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
