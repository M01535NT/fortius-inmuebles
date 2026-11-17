"use client";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipValueType } from "recharts";
import { cn } from "@/lib/utils";

/*
  Gráficas del panel (shadcn/ui «Chart» sobre Recharts 3, DEC-52). Cada serie toma su color de
  `config` (con su variante para oscuro) y se usa en las gráficas como `var(--color-<clave>)`.
  Colores de estado del panel (RP-70): azul `--info`, verde `--success`, ámbar `--warning`,
  bermellón `--destructive`; el borgoña solo para lo que se resalta. Toda gráfica lleva su cifra
  escrita cerca: la gráfica acompaña, no sustituye (RP-72).
*/
const THEMES = { light: "", dark: ".dark" } as const;
const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart debe usarse dentro de <ChartContainer />");
  return context;
}

export function ChartContainer({ id, className, children, config, initialDimension = INITIAL_DIMENSION, ...props }: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  initialDimension?: { width: number; height: number };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  return <ChartContext.Provider value={{ config }}>
    <div data-slot="chart" data-chart={chartId} className={cn(
      "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[var(--muted-foreground)] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[var(--card-edge)] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--card-edge)] [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[var(--card-edge)] [&_.recharts-radial-bar-background-sector]:fill-[var(--secondary)] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--secondary)] [&_.recharts-reference-line_[stroke='#ccc']]:stroke-[var(--card-edge)] [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
      className,
    )} {...props}>
      <ChartStyle id={chartId} config={config} />
      <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>{children}</RechartsPrimitive.ResponsiveContainer>
    </div>
  </ChartContext.Provider>;
}

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme ?? item.color);
  if (!colorConfig.length) return null;
  const css = Object.entries(THEMES).map(([theme, prefix]) => `${prefix} [data-chart=${id}] {\n${colorConfig.map(([key, item]) => {
    const color = item.theme?.[theme as keyof typeof item.theme] ?? item.color;
    return color ? `  --color-${key}: ${color};` : null;
  }).join("\n")}\n}`).join("\n");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey }:
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & React.ComponentProps<"div"> & { hideLabel?: boolean; hideIndicator?: boolean; indicator?: "line" | "dot" | "dashed"; nameKey?: string; labelKey?: string }
  & Omit<RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer">) {
  const { config } = useChart();
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = configFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label;
    if (labelFormatter) return <div className={cn("font-semibold", labelClassName)}>{labelFormatter(value, payload)}</div>;
    if (!value) return null;
    return <div className={cn("font-semibold", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);
  if (!active || !payload?.length) return null;
  const nestLabel = payload.length === 1 && indicator !== "dot";
  return <div className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-[8px] border border-[var(--card-edge)] bg-card px-2.5 py-1.5 text-[0.8125rem] text-foreground shadow-[var(--shadow-raised)]", className)}>
    {!nestLabel ? tooltipLabel : null}
    <div className="grid gap-1.5">
      {payload.filter(item => item.type !== "none").map((item, index) => {
        const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
        const itemConfig = configFromPayload(config, item, key);
        const indicatorColor = color ?? item.payload?.fill ?? item.color;
        return <div key={index} className={cn("flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground", indicator === "dot" && "items-center")}>
          {formatter && item?.value !== undefined && item.name ? formatter(item.value, item.name, item, index, item.payload) : <>
            {itemConfig?.icon ? <itemConfig.icon /> : !hideIndicator && <div className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
              "h-2.5 w-2.5": indicator === "dot", "w-1": indicator === "line",
              "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed", "my-0.5": nestLabel && indicator === "dashed",
            })} style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor } as React.CSSProperties} />}
            <div className={cn("flex flex-1 justify-between gap-3 leading-none", nestLabel ? "items-end" : "items-center")}>
              <div className="grid gap-1.5">{nestLabel ? tooltipLabel : null}<span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span></div>
              {item.value != null && <span className="font-semibold tabular-nums text-foreground">{typeof item.value === "number" ? item.value.toLocaleString("es-MX") : String(item.value)}</span>}
            </div>
          </>}
        </div>;
      })}
    </div>
  </div>;
}

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }: React.ComponentProps<"div"> & { hideIcon?: boolean; nameKey?: string } & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();
  if (!payload?.length) return null;
  return <div className={cn("flex flex-wrap items-center justify-center gap-4 text-[0.8125rem]", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
    {payload.filter(item => item.type !== "none").map((item, index) => {
      const key = `${nameKey ?? item.dataKey ?? "value"}`;
      const itemConfig = configFromPayload(config, item, key);
      return <div key={index} className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
        {itemConfig?.icon && !hideIcon ? <itemConfig.icon /> : <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />}
        {itemConfig?.label}
      </div>;
    })}
  </div>;
}

function configFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;
  const inner = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : undefined;
  let labelKey: string = key;
  if (key in payload && typeof payload[key as keyof typeof payload] === "string") labelKey = payload[key as keyof typeof payload] as string;
  else if (inner && key in inner && typeof inner[key as keyof typeof inner] === "string") labelKey = inner[key as keyof typeof inner] as string;
  return labelKey in config ? config[labelKey] : config[key];
}
