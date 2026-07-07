import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";

export const metadata: Metadata = {
  title: "Calculadora de hipoteca",
  description:
    "Estima la mensualidad de tu crédito hipotecario con enganche, plazo y tasa editables. Estimación informativa.",
};

export default function HipotecaPage() {
  return (
    <main className="bg-background pt-28 md:pt-32">
      <Container className="max-w-3xl pb-20 md:pb-28">
        <Link
          href="/herramientas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Herramientas
        </Link>
        <h1 className="display-title mt-6 max-w-[16ch] text-4xl text-foreground md:text-5xl">
          Calculadora de hipoteca.
        </h1>
        <p className="mt-5 max-w-[54ch] text-[15.5px] leading-relaxed text-muted-foreground">
          Captura el precio y juega con enganche, plazo y tasa. Si una
          propiedad de nuestro inventario te interesa, la calculadora también
          vive en su página con el precio ya cargado.
        </p>

        <div className="mt-9">
          <MortgageCalculator precio={3000000} moneda="MXN" precioEditable />
        </div>

        <p className="mt-8 text-[14.5px] text-muted-foreground">
          ¿Ya sabes qué buscas?{" "}
          <Link href="/inventario" className="font-medium text-primary underline-offset-4 hover:underline">
            Explora el inventario
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}
