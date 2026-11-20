"use client";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

/*
  Reportes · Asuntos por etapa (LV-10, bloque g): una sola serie, barras horizontales en el orden del
  riel de etapas, con la cifra escrita al final de cada barra (RP-72: la gráfica acompaña, no
  sustituye). La lista de abajo, para lectores de pantalla, es la tabla de la gráfica. Sin animación
  de Recharts: el panel anima solo con Motion.
*/
const config = { count: { label: "Asuntos", color: "var(--info)" } } satisfies ChartConfig;

export function StageChart({ rows }: { rows: Array<{ label: string; count: number }> }) {
  const height = Math.max(rows.length * 44 + 8, 96);
  return <figure className="min-w-0">
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} initialDimension={{ width: 640, height }} aria-hidden="true">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }} barCategoryGap={10} accessibilityLayer={false}>
        <XAxis type="number" dataKey="count" hide allowDecimals={false} domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="label" width={168} tickLine={false} axisLine={false} tick={{ fontSize: 13 }} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" offset={8} className="fill-[var(--foreground)] font-semibold tabular-nums" fontSize={14} />
        </Bar>
      </BarChart>
    </ChartContainer>
    <figcaption className="sr-only">Asuntos abiertos por etapa: {rows.map(row => `${row.label}, ${row.count}`).join("; ")}.</figcaption>
  </figure>;
}
