"use client";

import * as React from "react";
import { ArrowDownToLine, FileCheck2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";
import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Lead magnet: checklist de venta a cambio de nombre y WhatsApp.
  El PDF es placeholder (public/descargas/) con marca provisional.
  La descarga se libera solo tras confirmar la persistencia en el backend de COTA.
*/
const PREVIEW = [
  "Escritura inscrita y sin gravámenes pendientes.",
  "Predial y agua al corriente, con recibos a la mano.",
  "Precio definido con comparables vendidos, no al tanteo.",
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
              <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
                CHK-VEN-001 · Descarga
              </p>
              <h2 className="display-title mt-3 max-w-[18ch] text-3xl text-foreground sm:text-4xl">
                ¿Está lista tu propiedad para venderse?
              </h2>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
                Diez puntos que revisamos antes de publicar cualquier
                propiedad. Marca los tuyos y sabrás qué falta antes de salir
                al mercado.
              </p>
              <ul className="mt-6 space-y-2.5">
                {PREVIEW.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14.5px] text-foreground/85">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                    {item}
                  </li>
                ))}
                <li className="pl-7 text-[14px] text-muted-foreground">…y 7 puntos más en el PDF.</li>
              </ul>
            </div>

            {/* Captura / descarga */}
            <div className="self-center lg:col-span-5 lg:col-start-8">
              {sent ? (
                <div className="rounded-lg border border-border bg-card p-6 md:p-7">
                  <p className="display-soft text-xl text-foreground">Listo. Aquí está tu checklist.</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    También lo usaremos para dar seguimiento a tu caso, sin
                    spam y sin compartir tus datos.
                  </p>
                  <a
                    href="/descargas/checklist-venta-cota.pdf"
                    download
                    className="mt-5 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    <ArrowDownToLine className="size-4" strokeWidth={1.5} />
                    Descargar PDF
                  </a>
                </div>
              ) : (
                <PublicLeadForm onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-6 md:p-7">
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lm-nombre" className="text-[13.5px] font-medium text-foreground">
                        Nombre
                      </label>
                      <input
                        id="lm-nombre"
                        name="nombre"
                        required
                        autoComplete="name"
                        placeholder="Tu nombre"
                        className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lm-telefono" className="text-[13.5px] font-medium text-foreground">
                        Teléfono o WhatsApp
                      </label>
                      <input
                        id="lm-telefono"
                        name="telefono"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="664 000 0000"
                        className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  >
                    <ArrowDownToLine className="size-4" strokeWidth={1.5} />
                    {enviando ? "Enviando…" : "Obtener el checklist"}
                  </button>
                  {error ? (
                    <p
                      role="alert"
                      className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13px] leading-relaxed text-destructive"
                    >
                      {error}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
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
