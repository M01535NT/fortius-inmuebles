"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { captureLead } from "@/lib/admin/store";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

/* Boceto Comprar: «Cuéntanos qué buscas» en tarjeta con campos grandes. */
export function BuyerBrief() {
  const { publicLeadsEnabled } = usePublicFeatures();
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();
    setSending(true);
    setError(null);
    try {
      await captureLead({
        website: read("website"),
        nombre: read("nombre"),
        telefono: read("telefono"),
        origen: "contacto",
        mensaje: [
          "Búsqueda de inmueble",
          `Uso: ${read("uso")}`,
          `Presupuesto aproximado: ${read("presupuesto") || "por definir"}`,
          `Plazo: ${read("plazo") || "por definir"}`,
          `Forma de pago: ${read("pago") || "por definir"}`,
        ].join(" · "),
      });
      setSent(true);
    } catch {
      setError("No pudimos recibir tu solicitud. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="busqueda" className="pg-container pg-section pg-section-last bb-section">
      <div className="bb-grid">
        <div>
          <p className="pg-eyebrow pg-eyebrow-ink">Tu búsqueda</p>
          <h2 className="pg-h2">Cuéntanos qué buscas.</h2>
          <p className="pg-muted bb-text">
            {publicLeadsEnabled
              ? "El uso, presupuesto y momento de compra nos ayudan a descartar opciones que no te sirven. Puedes dejar el presupuesto o la forma de pago por definir."
              : "Define el uso, el presupuesto total y tu momento de compra. Con esos datos podrás comparar inmuebles con más claridad."}
          </p>
          <p className="pg-muted bb-text" style={{ fontSize: 14 }}>También puedes <Link href="/inventario" className="bb-inline-link">explorar las propiedades publicadas</Link> antes de escribirnos.</p>
        </div>
        {!publicLeadsEnabled ? (
          <div className="pg-card pg-card-pad">
            <h3 className="pg-h3">Tres datos para empezar</h3>
            <ol className="bb-list">
              <li><span className="pg-number" aria-hidden="true">01</span><div><strong>Uso</strong><p>Vivir, invertir o instalar un negocio: cada objetivo cambia qué conviene revisar.</p></div></li>
              <li><span className="pg-number" aria-hidden="true">02</span><div><strong>Presupuesto total</strong><p>Incluye gastos de cierre y, si usarás crédito, una mensualidad sostenible.</p></div></li>
              <li><span className="pg-number" aria-hidden="true">03</span><div><strong>Plazo y pago</strong><p>Una fecha tentativa y la forma de pago ayudan a ordenar las visitas y ofertas.</p></div></li>
            </ol>
            <Link href="/inventario" className="pg-btn" style={{ marginTop: 24 }}>Explorar inventario <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        ) : sent ? (
          <div role="status" className="pg-card pg-card-pad bb-sent">
            <CheckCircle2 size={32} strokeWidth={1.5} aria-hidden="true" />
            <h3 className="pg-h3">Recibimos tu búsqueda.</h3>
            <p className="pg-muted">Revisaremos lo que nos compartiste y te contactaremos para precisar las opciones.</p>
          </div>
        ) : (
          <PublicLeadForm onSubmit={onSubmit} className="pg-card pg-card-pad bb-form">
            <div className="pg-field"><label htmlFor="bb-nombre">Nombre</label><input id="bb-nombre" name="nombre" required autoComplete="name" /></div>
            <div className="pg-field"><label htmlFor="bb-telefono">Teléfono o WhatsApp</label><input id="bb-telefono" name="telefono" type="tel" required autoComplete="tel" /></div>
            <div className="pg-field bb-span"><label htmlFor="bb-uso">¿Para qué necesitas el inmueble?</label><input id="bb-uso" name="uso" required placeholder="Vivir, invertir o instalar un negocio" /></div>
            <div className="pg-field"><label htmlFor="bb-presupuesto">Presupuesto aproximado</label><input id="bb-presupuesto" name="presupuesto" placeholder="Monto y moneda, si ya lo tienes" /></div>
            <div className="pg-field"><label htmlFor="bb-plazo">¿Cuándo quieres comprar?</label><select id="bb-plazo" name="plazo" defaultValue=""><option value="">Por definir</option><option>En 3 meses</option><option>Entre 3 y 6 meses</option><option>Después de 6 meses</option></select></div>
            <div className="pg-field bb-span"><label htmlFor="bb-pago">Forma de pago prevista</label><select id="bb-pago" name="pago" defaultValue=""><option value="">Por definir</option><option>Recursos propios</option><option>Crédito</option><option>Combinación de ambos</option></select></div>
            {error ? <p role="alert" className="bb-span pg-notice" style={{ color: "var(--primary-text, #8a1634)" }}>{error}</p> : null}
            <div className="bb-span">
              <button type="submit" disabled={sending} className="pg-btn">{sending ? "Enviando…" : "Enviar mi búsqueda"}</button>
              <p className="pg-muted" style={{ marginTop: 12, fontSize: 14 }}>Usamos estos datos para responder a tu búsqueda.</p>
            </div>
          </PublicLeadForm>
        )}
      </div>
    </section>
  );
}
