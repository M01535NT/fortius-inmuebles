"use client";

import * as React from "react";
import { ArrowUpRight, House, KeyRound, MessagesSquare, Clock3 } from "lucide-react";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

import { MessagingContact } from "@/components/contact/messaging-actions";
import { ContactForm } from "@/components/sections/contact-form";

const intents = {
  comprar: {
    label: "Quiero comprar",
    detail: "Encuentra una propiedad que se ajuste a tus planes.",
    title: "Hablemos de tu próxima propiedad.",
    icon: KeyRound,
    objective: "Comprar una propiedad",
    message: "Hola, quiero recibir orientación para comprar una propiedad.",
  },
  vender: {
    label: "Quiero vender",
    detail: "Conoce cómo podemos acompañarte en la venta.",
    title: "Hablemos de la venta de tu propiedad.",
    icon: House,
    objective: "Vender mi propiedad",
    message: "Hola, quiero revisar la venta de mi propiedad.",
  },
  inmueble: {
    label: "Consultar un inmueble",
    detail: "Pregunta por disponibilidad, características o visitas.",
    title: "Resuelve tus dudas sobre ese inmueble.",
    icon: MessagesSquare,
    objective: "Consultar un inmueble publicado",
    message: "Hola, quiero información sobre un inmueble publicado por Fortius.",
  },
} as const;

type Intent = keyof typeof intents;

export function ContactIntents() {
  const [intent, setIntent] = React.useState<Intent>("comprar");
  const selected = intents[intent];
  const { settings } = usePublicFeatures();

  return (
    <div className="contact-workspace">
      <fieldset className="contact-choices">
        <legend className="contact-legend">¿Qué necesitas?</legend>
        <div className="contact-intent-list">
          {(Object.entries(intents) as [Intent, (typeof intents)[Intent]][]).map(([key, item]) => (
            <label key={key} className="contact-intent" data-selected={intent === key}>
              <input className="sr-only" type="radio" name="contact-intent" value={key} checked={intent === key} onChange={() => setIntent(key)} aria-controls="contact-conversation" />
              <item.icon size={24} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>

      <div id="contact-conversation" className="contact-conversation">
        <MessagingContact title={selected.title} message={selected.message}>
          <ContactForm key={intent} submitLabel="Enviar consulta" initialObjective={selected.objective} initialMessage={selected.message} />
        </MessagingContact>
        {settings?.horario?.trim() && <p className="contact-hours"><Clock3 size={17} aria-hidden="true" /><span>{settings.horario}</span></p>}
      </div>
    </div>
  );
}
