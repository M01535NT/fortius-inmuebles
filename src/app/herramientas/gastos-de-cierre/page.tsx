import type { Metadata } from "next";
import Link from "next/link";

import { CabezaPagina, Nota } from "@/components/sitio/pagina";
import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "../herramientas-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/herramientas/gastos-de-cierre",
  title: "Gastos de cierre al comprar en Tijuana",
  description:
    "Calcula los gastos de cierre de tu compra o venta en Tijuana, Rosarito, Tecate o Ensenada: ISAI, honorarios de notaría y derechos de registro, desglosados.",
});

/* Gastos de cierre, rediseño del sitio (etapa 5, 17/11/2026): la calculadora de siempre bajo la cabeza nueva. */
export default function GastosDeCierrePage() {
  return (
    <main className="s-pagina he">
      <CabezaPagina chico titulo="Gastos de cierre." entrada="Cuánto necesitas para comprar o cuánto recibes al vender." volver={{ href: "/herramientas", etiqueta: "Herramientas" }} />
      <div className="s-contenedor he-calculadora">
        <ClosingCostsCalculator />
        <Nota>¿Vendes? <Link href="/vender-propiedad">Empieza con la entrevista</Link>.</Nota>
      </div>
    </main>
  );
}
