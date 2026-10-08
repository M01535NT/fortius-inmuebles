"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Formulario de contacto. El lead se entrega al backend dedicado de MNT; si la entrega falla,
  NO se dan las gracias: se dice la verdad y se ofrece el teléfono.
*/
export function ContactForm({ submitLabel = "Enviar consulta", initialObjective = "", initialMessage = "" }: { submitLabel?: string; initialObjective?: string; initialMessage?: string }) {
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="flex min-h-[320px] flex-col items-start justify-center rounded-lg border border-border bg-card p-8">
        <CheckCircle2 className="h-8 w-8 text-primary-ink" strokeWidth={1.5} />
        <h3 className="display-soft mt-5 text-2xl text-foreground">
          Recibimos tu solicitud.
        </h3>
        <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
          Revisamos la información y te contactamos para decirte cuál es el
          siguiente paso.
        </p>
      </div>
    );
  }

  return (
    <PublicLeadForm
      className="rounded-lg border border-border bg-card p-6 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const objetivo = String(data.get("objective") ?? "");
        const mensaje = String(data.get("message") ?? "");
        setEnviando(true);
        setError(null);
        try {
          await captureLead({
            website: String(data.get("website") ?? ""),
            nombre: String(data.get("name") ?? ""),
            telefono: String(data.get("phone") ?? ""),
            mensaje: [objetivo, mensaje].filter(Boolean).join(" · ") || undefined,
            origen: "contacto",
          });
          setSent(true);
        } catch {
          setError(
            "No pudimos enviar tus datos. Revisa tu conexión e inténtalo otra vez, o escríbenos por WhatsApp.",
          );
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Teléfono o WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="664 000 0000"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="objective" className="text-sm font-medium text-foreground">
            Objetivo
          </label>
          <input
            id="objective"
            name="objective"
            defaultValue={initialObjective}
            placeholder="Vender, comprar, rentar o evaluar"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="message" className="text-sm font-medium text-foreground">
            Zona o propiedad
          </label>
          <textarea
            id="message"
            name="message"
            defaultValue={initialMessage}
            rows={3}
            placeholder="Cuéntanos el contexto inicial"
            className="rounded-md border border-input bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground"
          />
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

      <button
        type="submit"
        disabled={enviando}
        className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
      >
        {enviando ? "Enviando…" : submitLabel}
      </button>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Sin compromiso. Usamos tus datos solo para dar seguimiento a tu
        solicitud.
      </p>
    </PublicLeadForm>
  );
}
