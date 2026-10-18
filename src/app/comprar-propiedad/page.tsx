import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { BuyerBrief } from "@/components/sections/buyer-brief";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/comprar-propiedad" },
  title: "Comprar inmueble",
  description: routePages.comprar.description,
};

const STEPS = [
  { title: "Tu búsqueda", text: "Uso, presupuesto total y momento de compra." },
  { title: "Alternativas", text: "Inmuebles con costo total estimado." },
  { title: "Revisión", text: "Datos disponibles y pendientes de cada uno." },
  { title: "Oferta y cierre", text: "Condiciones por escrito hasta la entrega." },
];

/* Boceto Comprar: cabecera con los cuatro pasos y el brief del comprador. */
export default function ComprarInmueblePage() {
  const leadsEnabled = process.env.FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED === "true";
  return <main className="pg-page">
    <InteriorPage {...routePages.comprar} eyebrow="Para compradores" title="Encuentra una propiedad que se ajuste a tus planes."
      primary={{ href: "/comprar-propiedad/#busqueda", label: leadsEnabled ? "Contar qué busco" : "Preparar mi búsqueda" }} secondary={{ href: "/inventario", label: "Ver propiedades" }}
      aside={<ol className="ip-steps" aria-label="Cómo acompañamos la compra">
        {STEPS.map((step, index) => <li key={step.title} className={index === 0 ? "is-current" : undefined}>
          <span className="ip-step-dot" aria-hidden="true" /><span className="ip-step-number">0{index + 1}</span>
          <strong>{step.title}</strong><span>{step.text}</span>
        </li>)}
      </ol>} />
    <BuyerBrief />
  </main>;
}
