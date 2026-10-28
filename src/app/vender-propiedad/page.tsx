import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, FileCheck2 } from "lucide-react";

import { InteriorPage } from "@/components/sections/interior-page";
import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { SellerProcess } from "@/components/sections/seller-process";
import { SellerStarter } from "@/components/sections/seller-starter";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/vender-propiedad" },
  title: "Vender inmueble",
  description: routePages.vender.description,
};

/* Boceto Vender: cabecera con el asistente, línea de tiempo, autoevaluación,
   herramientas y la evaluación inicial. */
export default function VenderInmueblePage() {
  return (
    <main className="pg-page">
      <InteriorPage {...routePages.vender} eyebrow="Para propietarios" title="Prepara tu propiedad para vender."
        primary={{ href: "/vender-propiedad/#diagnostico", label: "Contar mi caso" }} secondary={{ href: "/#metodo", label: "Conocer el método" }}
        aside={<SellerStarter />} className="ip-hero-seller" />
      <SellerProcess />
      <LeadMagnet />
      <section className="pg-container pg-section" aria-label="Herramientas para propietarios">
        <div className="pg-grid-3 vp-tools">
          <Link href="/herramientas/gastos-de-cierre" className="pg-card pg-card-pad pg-card-hover vp-tool">
            <span className="bp-tool-icon"><Calculator size={22} aria-hidden="true" /></span>
            <strong>Estima gastos y neto de venta</strong>
            <span className="pg-muted">Impuestos, comisión y otros gastos para calcular cuánto podrías recibir.</span>
          </Link>
          <Link href="/avisos" className="pg-card pg-card-pad pg-card-hover vp-tool">
            <span className="bp-tool-icon"><FileCheck2 size={22} aria-hidden="true" /></span>
            <strong>Documentos para vender</strong>
            <span className="pg-muted">Avisos y documentos que normalmente intervienen en una venta en Baja California.</span>
          </Link>
          <Link href="/contacto" className="pg-card pg-card-pad pg-card-wine vp-tool">
            <span className="pg-eyebrow">Siguiente paso</span>
            <strong>Habla con un asesor</strong>
            <span className="pg-muted">Escribir ahora</span>
          </Link>
        </div>
      </section>
      <DiagnosticCTA />
    </main>
  );
}
