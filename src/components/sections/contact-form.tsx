"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Formulario de contacto. El lead se entrega al backend dedicado de MNT; si la entrega falla,
  NO se dan las gracias: se dice la verdad y se ofrece el teléfono.
  El asistente de «Vender» deja su selección en sessionStorage para prellenar objetivo y zona.
*/
export const SELLER_START_KEY = "fortius-seller-start";

export function ContactForm({ submitLabel = "Enviar consulta", initialObjective = "", initialMessage = "" }: { submitLabel?: string; initialObjective?: string; initialMessage?: string }) {
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objective, setObjective] = useState(initialObjective);
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    const adopt = () => {
      try {
        const raw = window.sessionStorage.getItem(SELLER_START_KEY);
        if (!raw) return;
        window.sessionStorage.removeItem(SELLER_START_KEY);
        const start = JSON.parse(raw) as { tipo?: string; zona?: string };
        if (start.tipo) setObjective(`Vender · ${start.tipo}`);
        if (start.zona) setMessage(start.zona);
      } catch {
        // Sin prellenado: el formulario funciona igual.
      }
    };
    adopt();
    window.addEventListener(SELLER_START_KEY, adopt);
    return () => window.removeEventListener(SELLER_START_KEY, adopt);
  }, []);

  if (sent) {
    return (
      <div role="status" className="cf-sent">
        <CheckCircle2 size={32} strokeWidth={1.5} aria-hidden="true" />
        <h3 className="pg-h3">Recibimos tu solicitud.</h3>
        <p className="pg-muted">Revisamos la información y te contactamos para decirte cuál es el siguiente paso.</p>
      </div>
    );
  }

  return (
    <PublicLeadForm
      className="cf-form"
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
          setError("No pudimos enviar tus datos. Revisa tu conexión e inténtalo otra vez, o escríbenos por WhatsApp.");
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="cf-fields">
        <div className="pg-field"><label htmlFor="name">Nombre</label><input id="name" name="name" required autoComplete="name" placeholder="Tu nombre" /></div>
        <div className="pg-field"><label htmlFor="phone">Teléfono o WhatsApp</label><input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="664 000 0000" /></div>
        <div className="pg-field cf-span"><label htmlFor="objective">Objetivo</label><input id="objective" name="objective" value={objective} onChange={event => setObjective(event.target.value)} placeholder="Vender, comprar, rentar o evaluar" /></div>
        <div className="pg-field cf-span"><label htmlFor="message">Zona o propiedad</label><textarea id="message" name="message" value={message} onChange={event => setMessage(event.target.value)} rows={3} placeholder="Cuéntanos el contexto inicial" /></div>
      </div>
      {error ? <p role="alert" className="pg-notice" style={{ marginTop: 16, color: "var(--primary-text, #8a1634)" }}>{error}</p> : null}
      <button type="submit" disabled={enviando} className="pg-btn" style={{ marginTop: 20 }}>{enviando ? "Enviando…" : submitLabel}</button>
      <p className="pg-muted" style={{ marginTop: 12, fontSize: 14 }}>Sin compromiso. Usamos tus datos solo para dar seguimiento a tu solicitud.</p>
    </PublicLeadForm>
  );
}
