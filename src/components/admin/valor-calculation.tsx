"use client";
import { calcularValor } from "@/lib/formatos/valor";
import { formatAmount } from "@/lib/finance/money";

/** Resultados de la opinión con las fórmulas de la plantilla; lo que falta se avisa, no bloquea. */
export function ValorCalculation({ values }: { values: Record<string, unknown> }) {
  const result = calcularValor(values);
  const cash = (value: number | null | undefined) => value === null || value === undefined ? "Pendiente" : `$${formatAmount(value)}`;
  return <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
    <h2 className="font-semibold">Resultados</h2>
    <dl className="grid gap-3 md:grid-cols-2">
      <div><dt>Comparativo de mercado</dt><dd>{cash(result.mercado)}</dd></div>
      <div><dt>Ingresos (capitalización)</dt><dd>{cash(result.ingresos?.valor)}</dd></div>
      <div><dt>Físico (neto de reposición)</dt><dd>{cash(result.fisico?.valor)}</dd></div>
      <div><dt>Valor comercial concluido (MXN)</dt><dd className="font-semibold">{cash(result.concluido)}</dd></div>
    </dl>
    {result.pendientes.length > 0 && <p className="text-sm text-muted-foreground">Para calcular el valor: {result.pendientes.join(". ")}. Puedes descargar el PDF y el Excel con lo que lleves.</p>}
  </section>;
}
