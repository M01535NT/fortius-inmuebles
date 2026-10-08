"use client";

import * as React from "react";

import { MessagingContact } from "@/components/contact/messaging-actions";
import { ContactForm } from "@/components/sections/contact-form";

const intents = {
  comprar: {
    label: "Quiero comprar",
    objective: "Comprar una propiedad",
    message: "Hola, quiero recibir orientación para comprar una propiedad.",
  },
  vender: {
    label: "Quiero vender",
    objective: "Vender mi propiedad",
    message: "Hola, quiero revisar la venta de mi propiedad.",
  },
  inmueble: {
    label: "Consultar un inmueble",
    objective: "Consultar un inmueble publicado",
    message: "Hola, quiero información sobre un inmueble publicado por Fortius.",
  },
} as const;

type Intent = keyof typeof intents;

export function ContactIntents() {
  const [intent, setIntent] = React.useState<Intent>("comprar");
  const selected = intents[intent];

  return (
    <div>
      <fieldset>
        <legend className="display-soft text-xl text-foreground">¿Qué necesitas?</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(Object.entries(intents) as [Intent, (typeof intents)[Intent]][]).map(([key, item]) => (
            <label key={key} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-4 text-center text-sm font-medium transition-colors ${intent === key ? "border-primary bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              <input className="sr-only" type="radio" name="contact-intent" value={key} checked={intent === key} onChange={() => setIntent(key)} />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8">
        <MessagingContact title="Habla directamente con Fortius." message={selected.message}>
          <ContactForm key={intent} submitLabel="Enviar consulta" initialObjective={selected.objective} initialMessage={selected.message} />
        </MessagingContact>
      </div>
    </div>
  );
}
