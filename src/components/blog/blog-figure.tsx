import { ArrowDown, BookOpen, ChartNoAxesColumnIncreasing } from "lucide-react";

import { calculateFigureChart, formatFigureAmount, type BlogFigure } from "@/data/blog-figures";

export function BlogFigureView({ figure }: { figure: BlogFigure }) {
  const { data } = figure;
  const isInfographic = data.type === "infographic";
  const Icon = isInfographic ? BookOpen : ChartNoAxesColumnIncreasing;

  return (
    <figure
      aria-labelledby={`${figure.id}-title`}
      aria-describedby={`${figure.id}-caption`}
      className="my-10 min-w-0 overflow-hidden rounded-lg border border-border bg-card font-sans text-foreground [overflow-wrap:anywhere]"
    >
      <div className="border-b border-border p-5 sm:p-7">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-primary-ink">
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          {isInfographic ? "GUÍA VISUAL" : data.type === "monthly-comparison" ? "EJEMPLO FICTICIO" : "EJEMPLO ILUSTRATIVO"}
        </p>
        <h3 id={`${figure.id}-title`} className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {figure.title}
        </h3>
      </div>

      {data.type === "infographic" ? (
        <ol className={`grid list-none gap-0 p-5 sm:p-7 ${data.layout === "grid" ? "sm:grid-cols-2 sm:gap-x-7" : ""}`}>
          {data.items.map((item, index) => (
            <li key={item.label} className="relative min-w-0 border-b border-border py-5 last:border-b-0 first:pt-0 sm:first:pt-5">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className="shrink-0 text-2xl font-semibold tabular-nums leading-tight text-primary-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-snug">{item.label}</p>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              {data.layout === "sequence" && index < data.items.length - 1 && (
                <ArrowDown aria-hidden="true" className="mt-4 size-5 text-primary-ink" />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <FigureChart figure={{ ...figure, data }} />
      )}

      <figcaption id={`${figure.id}-caption`} className="border-t border-border bg-muted/40 px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-7">
        <p>{figure.caption}</p>
        <p className="mt-2 font-medium">{figure.source}.</p>
      </figcaption>
    </figure>
  );
}

function FigureChart({ figure }: { figure: BlogFigure & { data: Exclude<BlogFigure["data"], { type: "infographic" }> } }) {
  const { data } = figure;
  const { rows, max } = calculateFigureChart(data);
  const monthly = data.type === "monthly-comparison";
  const unit = monthly ? "MXN" : "USD";
  const valueHeading = monthly ? "Salida mensual (MXN)" : "Pago equivalente (USD)";

  return (
    <div className="min-w-0 p-5 sm:p-7">
      {!monthly && <p className="mb-6 text-base leading-relaxed">Obligación fija: <strong>{formatFigureAmount(data.paymentMxn)} MXN</strong>.</p>}
      <div aria-hidden="true" className="space-y-6">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-base font-semibold">{row.label}</span>
              <span className="text-xl font-semibold tabular-nums text-primary-ink">{formatFigureAmount(row.value)} {unit}</span>
            </div>
            <div className="h-5 border-l border-foreground/40 bg-muted">
              <div className="h-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{row.detail}</p>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-border pt-2 text-sm tabular-nums text-muted-foreground">
          <span>0</span>
          <span>{formatFigureAmount(max)} {unit}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Escala común desde 0; valores en {unit}.</p>

      <div className="sr-only">
        <table>
          <caption>{figure.title}. {figure.caption}</caption>
          <thead><tr><th scope="col">Escenario</th><th scope="col">{valueHeading}</th><th scope="col">Cálculo</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{formatFigureAmount(row.value)} {unit}</td><td>{row.detail}</td></tr>)}</tbody>
        </table>
      </div>

      {monthly && (
        <p className="mt-6 border-l-2 border-primary pl-4 text-base leading-relaxed">
          Diferencia de salida de efectivo: <strong className="text-primary-ink">{formatFigureAmount(rows[0].value - rows[1].value)} MXN al mes</strong>. Este cálculo no mide patrimonio.
        </p>
      )}
    </div>
  );
}
