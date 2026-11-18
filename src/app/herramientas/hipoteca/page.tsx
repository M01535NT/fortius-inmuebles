import type { Metadata } from "next";
import Link from "next/link";

import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { CabezaPagina, Nota } from "@/components/sitio/pagina";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "../herramientas-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/herramientas/hipoteca",
  title: "Calculadora de hipoteca en México",
  description:
    "Estima la mensualidad de tu crédito hipotecario con enganche, plazo y tasa editables. Compara hasta tres escenarios y descarga cada tabla de pagos en PDF.",
});

/* Hipoteca, rediseño del sitio (etapa 5, 17/11/2026): la calculadora de siempre bajo la cabeza nueva. */
export default function HipotecaPage() {
  return (
    <main className="s-pagina he">
      <CabezaPagina chico titulo="Calculadora de hipoteca." entrada="Compara hasta tres escenarios y descarga cada pago." volver={{ href: "/herramientas", etiqueta: "Herramientas" }} />
      <div className="s-contenedor he-calculadora">
        <MortgageCalculator precio={3000000} moneda="MXN" precioEditable />
        <Nota>¿Ya sabes qué buscas? <Link href="/inventario">Ver propiedades</Link>.</Nota>
      </div>
    </main>
  );
}
