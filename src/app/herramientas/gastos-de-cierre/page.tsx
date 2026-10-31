import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas/gastos-de-cierre" },
  title: "Gastos de cierre",
  description:
    "Prepara tu presupuesto de compra o venta en Tijuana, Rosarito, Tecate o Ensenada con impuestos municipales y gastos desglosados.",
};

export default function GastosDeCierrePage() {
  return (
    <main className="pg-page">
      <section className="pg-hero">
        <div className="pg-container pg-hero-body tl-tool-head">
          <Link href="/herramientas" className="ba-back"><ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />Herramientas</Link>
          <p className="pg-eyebrow">Gastos de compraventa</p>
          <h1 className="pg-title pg-title-sm">Gastos de cierre.</h1>
          <p className="pg-lead">Cuánto necesitas para comprar o cuánto recibes al vender.</p>
        </div>
      </section>
      <div className="pg-container tl-tool-body">
        <ClosingCostsCalculator />
        <p className="tl-tool-foot pg-muted">¿Vendes? <Link href="/vender-propiedad">Empieza con la entrevista</Link>.</p>
      </div>
    </main>
  );
}
