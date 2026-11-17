import type { Metadata } from "next";
import Link from "next/link";

import { FlechaDiagonal } from "@/components/sitio/iconos";
import { CabezaPagina, Nota } from "@/components/sitio/pagina";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./herramientas-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/herramientas",
  title: "Calculadoras inmobiliarias en Tijuana",
  description:
    "Calcula la mensualidad de tu crédito hipotecario y los gastos de compraventa en Tijuana, Rosarito, Tecate y Ensenada. Gratis, sin registro y en minutos.",
});

/*
  Herramientas, Fortius II (etapa 5, 17/11/2026): dos tarjetas grandes, cada una con una vista
  previa de lo que calcula. La de hipoteca va en banda oscura y la de gastos en tarjeta clara.
*/
export default function HerramientasPage() {
  return (
    <main className="s-pagina he">
      <CabezaPagina titulo="Haz los números antes de decidir." entrada="Mensualidad y gastos, sin registro." />

      <div className="s-contenedor he-cuerpo">
        <ul className="he-tarjetas">
          <li>
            <Link href="/herramientas/hipoteca" className="he-tarjeta s-banda">
              <span className="he-tarjeta-cabeza">
                <span className="he-tarjeta-titulo">Calculadora de hipoteca</span>
                <FlechaDiagonal size={28} />
              </span>
              <span className="he-tarjeta-texto">Escenarios, abonos y tabla de pagos.</span>
              <span className="he-vista">
                <span className="he-vista-dato"><span>Mensualidad de ejemplo</span><span className="he-vista-cifra">$23,961</span></span>
                <svg viewBox="0 0 200 80" aria-hidden="true" className="he-curva"><path d="M0 8 C60 14 120 34 200 76" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M0 79.5 H200" stroke="currentColor" strokeOpacity="0.25" /></svg>
              </span>
            </Link>
          </li>
          <li>
            <Link href="/herramientas/gastos-de-cierre" className="he-tarjeta he-tarjeta-clara">
              <span className="he-tarjeta-cabeza">
                <span className="he-tarjeta-titulo">Gastos de cierre</span>
                <FlechaDiagonal size={28} />
              </span>
              <span className="he-tarjeta-texto">Efectivo para comprar o neto al vender.</span>
              <span className="he-vista">
                <span className="he-vista-dato"><span>Incluye</span><span className="he-vista-lista">ISAI · Notaría · Registro · Avalúo</span></span>
              </span>
            </Link>
          </li>
        </ul>
        <Nota>¿Vendes? <Link href="/vender-propiedad">Empieza con la entrevista</Link>.</Nota>
      </div>
    </main>
  );
}
