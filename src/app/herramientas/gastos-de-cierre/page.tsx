import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas/gastos-de-cierre" },
  title: "Gastos de cierre",
  description:
    "Prepara tu presupuesto de compra o venta en Tijuana, Rosarito, Tecate o Ensenada con impuestos municipales y gastos desglosados.",
};

export default function GastosDeCierrePage() {
  return (
    <main className="bg-background pt-28 md:pt-32">
      <Container className="pb-20 md:pb-28">
        <Link
          href="/herramientas"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Herramientas
        </Link>
        <h1 className="display-title mt-6 max-w-[16ch] text-4xl text-foreground md:text-5xl">
          Gastos de cierre.
        </h1>
        <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-muted-foreground">
          Calcula cuánto efectivo necesitas para comprar o cuánto recibirías
          al vender. Completa las cotizaciones y descarga tu presupuesto.
        </p>

        <div className="mt-9">
          <ClosingCostsCalculator />
        </div>

        <p className="mt-8 text-base text-muted-foreground">
          ¿Quieres preparar los números de tu operación?{" "}
          <Link href="/#evaluar" className="font-medium text-primary-ink underline-offset-4 hover:underline">
            Empieza con una evaluación
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}
