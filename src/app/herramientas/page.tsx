import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas" },
  title: "Herramientas",
  description:
    "Calcula una mensualidad hipotecaria y estima gastos de compraventa en Tijuana y Baja California.",
};

/* Boceto Herramientas: tarjetas grandes con vista previa de cada calculadora. La opinión de valor no es una herramienta: se entrega dentro del método (30/10/2026). */
export default function HerramientasPage() {
  return (
    <main className="pg-page">
      <section className="pg-hero">
        <div className="pg-container pg-hero-body">
          <h1 className="pg-title">Haz los números antes de decidir.</h1>
          <p className="pg-lead">Mensualidad y gastos, sin registro.</p>
          <div className="tl-grid">
            <Link href="/herramientas/hipoteca" className="tl-card">
              <span className="tl-card-head"><span className="pg-chip">Crédito</span><span className="tl-open">Abrir</span></span>
              <span className="tl-card-title">Calculadora de hipoteca</span>
              <span className="tl-card-text">Escenarios, abonos y tabla de pagos.</span>
              <span className="tl-preview">
                <span><span className="tl-preview-label">Mensualidad de ejemplo</span><span className="tl-preview-value">$23,961</span></span>
                <svg viewBox="0 0 200 80" width="200" height="80" aria-hidden="true"><path d="M0 8 C60 14 120 34 200 76" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M0 79.5 H200" stroke="currentColor" strokeOpacity="0.2" /></svg>
              </span>
            </Link>
            <Link href="/herramientas/gastos-de-cierre" className="tl-card">
              <span className="tl-card-head"><span className="pg-chip">Operación</span><span className="tl-open">Abrir</span></span>
              <span className="tl-card-title">Gastos de cierre</span>
              <span className="tl-card-text">Efectivo para comprar o neto al vender.</span>
              <span className="tl-preview">
                <span className="tl-preview-label">Incluye</span>
                <span className="tl-legend"><span>ISAI</span><span>Notaría</span><span>Registro</span><span>Avalúo</span></span>
              </span>
            </Link>
          </div>
          <p className="tl-foot">¿Vendes? <Link href="/vender-propiedad">Empieza con la entrevista</Link>.</p>
        </div>
      </section>
    </main>
  );
}
