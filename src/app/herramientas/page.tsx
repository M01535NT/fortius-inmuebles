import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calculator, ReceiptText } from "lucide-react";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  alternates: { canonical: "/herramientas" },
  title: "Herramientas",
  description:
    "Calcula una mensualidad hipotecaria y estima gastos de compraventa en Tijuana y Baja California.",
};

const TOOLS = [
  {
    icon: Calculator,
    title: "Calculadora de hipoteca",
    text: "Estima tu mensualidad con enganche, plazo y tasa editables. Sin registrarte.",
    href: "/herramientas/hipoteca",
  },
  {
    icon: ReceiptText,
    title: "Gastos de cierre",
    text: "Estima los gastos de comprar o vender en Tijuana, desglosados por concepto.",
    href: "/herramientas/gastos-de-cierre",
  },
];

export default function HerramientasPage() {
  return (
    <main className="bg-background pt-28 md:pt-32">
      <Container className="pb-20 md:pb-28">
        <h1 className="display-title max-w-[16ch] text-5xl text-foreground md:text-6xl">
          Calculadoras inmobiliarias.
        </h1>
        <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
          Estima una mensualidad o los gastos de compraventa, sin registrarte.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {TOOLS.map(({ icon: Icon, title, text, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between rounded-lg border border-border bg-card p-7 transition-colors hover:border-primary/50"
            >
              <div>
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                <h2 className="display-soft mt-5 text-2xl text-foreground">{title}</h2>
                <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-1.5 text-base font-medium text-primary">
                Abrir herramienta
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-base text-muted-foreground">
          ¿Quieres vender tu propiedad?{" "}
          <Link href="/#evaluar" className="font-medium text-primary underline-offset-4 hover:underline">
            Solicita una evaluación sin compromiso
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}
