import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MortgageCalculator } from "@/components/property/mortgage-calculator";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas/hipoteca" },
  title: "Calculadora de hipoteca",
  description:
    "Estima la mensualidad de tu crédito hipotecario con enganche, plazo y tasa editables.",
};

export default function HipotecaPage() {
  return (
    <main className="pg-page">
      <section className="pg-hero">
        <div className="pg-container pg-hero-body tl-tool-head">
          <Link href="/herramientas" className="ba-back"><ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />Herramientas</Link>
          <p className="pg-eyebrow">Crédito hipotecario</p>
          <h1 className="pg-title pg-title-sm">Calculadora de hipoteca.</h1>
          <p className="pg-lead">Compara hasta tres escenarios y descarga cada pago.</p>
        </div>
      </section>
      <div className="pg-container tl-tool-body">
        <MortgageCalculator precio={3000000} moneda="MXN" precioEditable />
        <p className="tl-tool-foot pg-muted">¿Ya sabes qué buscas? <Link href="/inventario">Explora el inventario</Link>.</p>
      </div>
    </main>
  );
}
