"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { captureLead } from "@/lib/admin/store";

/*
  Interior lead form. TODO(M3.1): POST al endpoint real cuando exista el
  backend; hoy el lead queda en la bandeja local del panel.
*/
export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex min-h-[320px] flex-col items-start justify-center rounded-lg border border-border bg-card p-8">
        <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
        <h3 className="display-soft mt-5 text-2xl text-foreground">
          Recibimos tu solicitud.
        </h3>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          Revisamos la información y te contactamos para decirte cuál es el
          siguiente paso.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-6 md:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const objetivo = String(data.get("objective") ?? "");
        const mensaje = String(data.get("message") ?? "");
        captureLead({
          nombre: String(data.get("name") ?? ""),
          telefono: String(data.get("phone") ?? ""),
          mensaje: [objetivo, mensaje].filter(Boolean).join(" · ") || undefined,
          origen: "contacto",
        });
        setSent(true);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[13.5px] font-medium text-foreground">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-[13.5px] font-medium text-foreground">
            Teléfono o WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="664 000 0000"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="objective" className="text-[13.5px] font-medium text-foreground">
            Objetivo
          </label>
          <input
            id="objective"
            name="objective"
            placeholder="Vender, comprar, rentar o evaluar"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="message" className="text-[13.5px] font-medium text-foreground">
            Zona o propiedad
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Cuéntanos el contexto inicial"
            className="rounded-md border border-input bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] sm:w-auto"
      >
        Solicitar evaluación
      </button>

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        Sin compromiso. Usamos tus datos solo para dar seguimiento a tu
        solicitud.
      </p>
    </form>
  );
}
