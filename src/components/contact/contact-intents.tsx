"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Clock3 } from "lucide-react";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

import { MessagingContact } from "@/components/contact/messaging-actions";
import { ContactForm } from "@/components/sections/contact-form";

const intents = {
  comprar: {
    label: "Quiero comprar",
    detail: "Te ayudamos a encontrarla.",
    title: "Hablemos de tu próxima propiedad.",
    objective: "Comprar una propiedad",
    message: "Hola, quiero recibir orientación para comprar una propiedad.",
    photo: { src: "/hero/que-hacemos-comprar.webp", alt: "Sala luminosa de un departamento con vista a la ciudad" },
  },
  vender: {
    label: "Quiero vender",
    detail: "Empezamos con una entrevista.",
    title: "Hablemos de la venta de tu propiedad.",
    objective: "Vender mi propiedad",
    message: "Hola, quiero revisar la venta de mi propiedad.",
    photo: { src: "/hero/que-hacemos-vender.webp", alt: "Casa de dos niveles con jardín" },
  },
  inmueble: {
    label: "Consultar un inmueble",
    detail: "Disponibilidad y visitas.",
    title: "Resuelve tus dudas sobre ese inmueble.",
    objective: "Consultar un inmueble publicado",
    message: "Hola, quiero información sobre un inmueble publicado por Fortius.",
    photo: { src: "/hero/interior-depa.webp", alt: "Sala de un departamento con vista al mar al anochecer" },
  },
} as const;

type Intent = keyof typeof intents;

/* Boceto Contacto: tres motivos como tarjetas numeradas (la elegida en
   borgoña), el formulario en tarjeta clara y los canales directos al lado. */
export function ContactIntents() {
  const [intent, setIntent] = React.useState<Intent>("comprar");
  const selected = intents[intent];
  const { settings } = usePublicFeatures();

  return (
    <div className="ct-workspace">
      <div>
        <fieldset className="ct-choices">
          <legend className="sr-only">¿Qué necesitas?</legend>
          <div className="ct-intents">
            {(Object.entries(intents) as [Intent, (typeof intents)[Intent]][]).map(([key, item]) => (
              <label key={key} className="ct-intent" data-selected={intent === key}>
                <input className="sr-only" type="radio" name="contact-intent" value={key} checked={intent === key} onChange={() => setIntent(key)} aria-controls="contact-conversation" />
                <span className="ct-intent-top">{intent === key && <span className="ct-intent-check" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>}</span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <div id="contact-conversation" className="ct-form">
          <ContactForm key={intent} submitLabel="Enviar consulta" initialObjective={selected.objective} initialMessage={selected.message} />
        </div>
      </div>
      <div className="ct-side">
        <aside className="ct-direct">
          <MessagingContact title={selected.title} message={selected.message} />
          {settings?.horario?.trim() && <p className="ct-hours"><Clock3 size={17} aria-hidden="true" /><span>{settings.horario}</span></p>}
        </aside>
        {/* La foto cambia con el motivo elegido; en móvil se omite para no alejar el formulario. */}
        <figure className="ct-photo"><Image src={selected.photo.src} alt={selected.photo.alt} fill sizes="(max-width: 1023px) 0px, 30vw" /></figure>
      </div>
    </div>
  );
}
