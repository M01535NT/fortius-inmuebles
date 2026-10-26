import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas" },
  title: "Herramientas",
  description:
    "Calcula una mensualidad hipotecaria y estima gastos de compraventa en Tijuana y Baja California.",
};

/* Boceto Herramientas: dos tarjetas grandes con vista previa de cada calculadora. */
export default function HerramientasPage() {
  return (
    <main className="pg-page">
      <section className="pg-hero">
        <div className="pg-container pg-hero-body">
          <p className="pg-eyebrow">Herramientas · sin registro</p>
          <h1 className="pg-title">Haz los números antes de decidir.</h1>
          <p className="pg-lead">Estima una mensualidad o los gastos de compraventa, sin registrarte.</p>
          <div className="tl-grid">
            <Link href="/herramientas/hipoteca" className="tl-card">
              <span className="tl-card-head"><span className="pg-chip">01 · Crédito</span><span className="tl-open">Abrir</span></span>
              <span className="tl-card-title">Calculadora de hipoteca</span>
              <span className="tl-card-text">Compara escenarios, prueba abonos anticipados y descarga la amortización completa.</span>
              <span className="tl-preview">
                <span><span className="tl-preview-label">Mensualidad de ejemplo</span><span className="tl-preview-value">$23,961</span></span>
                <svg viewBox="0 0 200 80" width="200" height="80" aria-hidden="true"><path d="M0 8 C60 14 120 34 200 76" fill="none" stroke="#E5829B" strokeWidth="3" /><path d="M0 8 C60 14 120 34 200 76 L200 80 L0 80Z" fill="rgba(229,130,155,.12)" /></svg>
              </span>
            </Link>
            <Link href="/herramientas/gastos-de-cierre" className="tl-card">
              <span className="tl-card-head"><span className="pg-chip">02 · Operación</span><span className="tl-open">Abrir</span></span>
              <span className="tl-card-title">Gastos de cierre</span>
              <span className="tl-card-text">Prepara el efectivo de compra o el neto de venta, con impuestos locales y tus cotizaciones.</span>
              <span className="tl-preview">
                <span className="tl-bars" aria-hidden="true"><span style={{ flex: 4 }} /><span style={{ flex: 3 }} /><span style={{ flex: 1.2 }} /><span style={{ flex: 1 }} /></span>
                <span className="tl-legend" aria-hidden="true"><span>ISAI</span><span>Notaría</span><span>Registro</span><span>Avalúo</span></span>
              </span>
            </Link>
          </div>
          <p className="tl-foot">¿Quieres vender tu propiedad? <Link href="/vender-propiedad">Solicita una evaluación sin compromiso</Link>.</p>
        </div>
      </section>
    </main>
  );
}
