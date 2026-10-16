"use client";
import { calcularValor, valorReviewSnapshot } from "@/lib/formatos/valor";
import { btnGhost } from "./ui";
import { formatAmount } from "@/lib/finance/money";

export function ValorCalculation({ values, onChange }: { values: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const result = calcularValor(values);
  const cash = (value: number | null | undefined) => value === null || value === undefined ? "Pendiente" : `${formatAmount(value)} MXN`;
  return <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
    <h2 className="font-semibold">Cálculos de la opinión</h2>
    <dl className="grid gap-3 md:grid-cols-2">
      <div><dt>Mercado</dt><dd>{cash(result.mercado)}</dd></div><div><dt>Ingresos</dt><dd>{cash(result.ingresos?.valor)}</dd></div><div><dt>Físico</dt><dd>{cash(result.fisico?.valor)}</dd></div><div><dt>Indicador previo al redondeo</dt><dd>{cash(result.indicador)}</dd></div><div><dt>Valor concluido después de revisión</dt><dd className="font-semibold">{cash(result.concluido)}</dd></div>
    </dl>
    {result.errors.length > 0 && <p className="text-sm text-muted-foreground">Pendientes de cálculo: {result.errors.join(". ")}.</p>}
    <p className="text-sm text-muted-foreground">Revisa fuentes, ajustes, límites y justificación antes de registrar. Cambiar los datos exige repetir la revisión. La captura de revisión no es una firma.</p>
    <button type="button" className={btnGhost} disabled={result.indicador === null || !Number.isInteger(values.versionInforme)} onClick={() => { onChange("indicadorRevisado", result.indicador); onChange("versionRevisada", values.versionInforme); onChange("revisionEstado", "revisada"); onChange("revisionDatos", valorReviewSnapshot(values)); }}>Registrar revisión de estos cálculos</button>
  </section>;
}
