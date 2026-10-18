"use client";

import * as React from "react";
import { ArrowDownToLine, FileCheck2 } from "lucide-react";

import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

/*
  Lead magnet: checklist de venta a cambio de nombre y WhatsApp.
  La descarga se libera solo tras confirmar la persistencia en el backend de MNT.
  Boceto Vender: banda azul noche «¿Está lista tu propiedad para venderse?».
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
    <section className="pg-container pg-section" aria-labelledby="lead-magnet">
      <div className="lm-band">
        <div>
          <p className="pg-eyebrow">Guía para propietarios</p>
          <h2 id="lead-magnet" className="pg-h2">¿Está lista tu propiedad para venderse?</h2>
          <p className="lm-text">Diez preguntas para preparar una venta. Algunas se resuelven de inmediato; otras requieren revisar documentos o consultar a un especialista antes de publicar.</p>
          <ul className="lm-list">
            {PREVIEW.map((item) => <li key={item}><FileCheck2 size={18} strokeWidth={1.5} aria-hidden="true" />{item}</li>)}
            <li className="lm-more">…y 7 puntos más en el PDF.</li>
          </ul>
        </div>
        <div className="lm-card">
          {sent ? (
            <div>
              <p className="pg-h3">Listo. Aquí está tu checklist.</p>
              <p className="pg-muted" style={{ marginTop: 8, fontSize: 14 }}>También lo usaremos para dar seguimiento a tu caso, sin spam y sin compartir tus datos.</p>
              <a href="/descargas/checklist-venta-fortius.pdf" download className="pg-btn" style={{ marginTop: 20 }}>
                <ArrowDownToLine size={18} strokeWidth={1.5} aria-hidden="true" />Descargar PDF
              </a>
            </div>
          ) : (
            <PublicLeadForm onSubmit={onSubmit}>
              <div className="lm-fields">
                <div className="pg-field"><label htmlFor="lm-nombre">Nombre</label><input id="lm-nombre" name="nombre" required autoComplete="name" placeholder="Tu nombre" /></div>
                <div className="pg-field"><label htmlFor="lm-telefono">Teléfono o WhatsApp</label><input id="lm-telefono" name="telefono" type="tel" required autoComplete="tel" placeholder="664 000 0000" /></div>
              </div>
              <button type="submit" disabled={enviando} className="pg-btn" style={{ width: "100%", marginTop: 16 }}>
                <ArrowDownToLine size={18} strokeWidth={1.5} aria-hidden="true" />{enviando ? "Enviando…" : "Obtener el checklist"}
              </button>
              {error ? <p role="alert" className="pg-notice" style={{ marginTop: 12, color: "var(--primary-text, #8a1634)" }}>{error}</p> : null}
              <p className="pg-muted" style={{ marginTop: 12, fontSize: 14 }}>Sin costo. Usamos tus datos solo para dar seguimiento; no los compartimos.</p>
            </PublicLeadForm>
          )}
        </div>
      </div>
    </section>
  );
}
