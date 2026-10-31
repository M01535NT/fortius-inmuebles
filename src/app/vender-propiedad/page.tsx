import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, FileText } from "lucide-react";

import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { SellerProcess } from "@/components/sections/seller-process";
import { SellerStarter } from "@/components/sections/seller-starter";
import "./vender.css";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/vender-propiedad",
  title: "Vender tu casa en Tijuana con asesoría",
  description:
    "Vende tu casa en Tijuana, Rosarito, Tecate o Ensenada. Revisamos documentos y precio antes de publicar y te damos seguimiento por escrito hasta la firma.",
});

const TRUST = ["Sin compromiso", "Respuesta por WhatsApp", "Tijuana, Rosarito, Tecate y Ensenada"];
const PENDIENTES = [
  { Icon: CircleAlert, text: "Qué pendiente afecta el precio o el cierre" },
  { Icon: FileText, text: "Qué documento se necesita para resolverlo" },
  { Icon: Check, text: "Si conviene publicar ya o esperar" },
];

/*
  Vender (30/10/2026, boceto aprobado): poca lectura y una acción por sección.
  Portada con el arranque de dos preguntas, cuatro pasos, pendientes, checklist,
  herramientas y, al final, la solicitud de entrevista: el único lugar que pide todos los datos.
*/
export default function VenderInmueblePage() {
  return (
    <main className="pg-page vd">
      <section className="vd-hero" aria-labelledby="vd-title">
        <div className="pg-container vd-hero-grid">
          <div className="vd-hero-copy">
            <h1 id="vd-title" className="vd-title">Vende con todo en orden.</h1>
            <p className="vd-lead">Documentos y precio en orden antes de publicar.</p>
            <div className="vd-actions">
              <Link href="/vender-propiedad/#diagnostico" className="pg-btn">Agendar entrevista</Link>
              <Link href="/vender-propiedad/#pasos" className="pg-btn pg-btn-ghost">Ver cómo funciona</Link>
            </div>
            <ul className="vd-trust">
              {TRUST.map((item) => <li key={item}><Check size={18} strokeWidth={2} aria-hidden="true" />{item}</li>)}
            </ul>
          </div>
          <SellerStarter />
        </div>
      </section>

      <SellerProcess />

      <section className="vd-cream" aria-labelledby="vd-pendientes">
        <div className="pg-container vd-split">
          <h2 id="vd-pendientes" className="pg-h2">Si algo falta, lo sabes antes de anunciar.</h2>
          <ul className="vd-rows">
            {PENDIENTES.map(({ Icon, text }) => <li key={text}><Icon size={24} strokeWidth={1.6} aria-hidden="true" />{text}</li>)}
          </ul>
        </div>
      </section>

      <LeadMagnet />

      <nav className="pg-container vd-tools" aria-label="Herramientas para propietarios">
        <Link href="/herramientas/gastos-de-cierre">Estimar gastos y neto de venta <ArrowRight size={20} aria-hidden="true" /></Link>
        <Link href="/avisos">Documentos para vender <ArrowRight size={20} aria-hidden="true" /></Link>
      </nav>

      <DiagnosticCTA />
    </main>
  );
}
