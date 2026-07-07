import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Gastos de cierre",
  description:
    "Estima los gastos de cierre al comprar o vender en Tijuana: impuestos, notario, registro y avalúo, con rangos de referencia.",
};

export default function GastosDeCierrePage() {
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
          Gastos de cierre.
        </h1>
        <p className="mt-5 max-w-[56ch] text-[15.5px] leading-relaxed text-muted-foreground">
          La sorpresa clásica de una operación son los gastos que nadie
          explicó. Aquí tienes los rangos de referencia para Tijuana, por
          concepto, según si compras o vendes.
        </p>

        <div className="mt-9">
          <ClosingCostsCalculator />
        </div>

        <p className="mt-8 text-[14.5px] text-muted-foreground">
          En cada operación entregamos este cálculo por escrito y afinado a tu
          caso (documento GAS-CIE-001).{" "}
          <a href="/#evaluar" className="font-medium text-primary underline-offset-4 hover:underline">
            Empieza con una evaluación
          </a>
          .
        </p>
      </Container>
    </main>
  );
}
