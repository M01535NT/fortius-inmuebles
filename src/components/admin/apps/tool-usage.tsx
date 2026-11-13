"use client";
import * as React from "react";
import { apiRequest, errorMessage } from "@/lib/admin/store";
import type { UsoHerramientas } from "@/lib/apps/uso";
import s from "@/components/admin/workspace/reports.module.css";

const monthLabel = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("es-MX", { month: "short", year: "2-digit", timeZone: "UTC" });

/*
  Reportes · Uso de herramientas (HER-05): trabajos empezados con cada herramienta en los últimos
  seis meses. Plegado; se consulta al abrirlo. Sirve para decidir qué más se retira del catálogo.
*/
export function ToolUsage() {
  const [data, setData] = React.useState<UsoHerramientas | null>(null), [error, setError] = React.useState(""), [asked, setAsked] = React.useState(false);
  React.useEffect(() => {
    if (!asked) return;
    let active = true;
    apiRequest<UsoHerramientas>("/api/admin/apps/uso").then(result => { if (active) { setData(result); setError(""); } }).catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [asked]);
  const total = data?.rows.reduce((sum, row) => sum + row.total, 0);
  return <details className={s.fold} onToggle={event => { if ((event.currentTarget as HTMLDetailsElement).open) setAsked(true); }}>
    <summary>Uso de herramientas <span className={s.summaryNote}>{data ? `${total} ${total === 1 ? "trabajo" : "trabajos"} en seis meses` : "Por herramienta y mes"}</span></summary>
    <div className={s.foldBody}>
      {error ? <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="font-semibold underline underline-offset-4" onClick={() => { setError(""); setAsked(false); requestAnimationFrame(() => setAsked(true)); }}>Reintentar</button></p>
        : !data ? <p role="status" className={s.note}>Consultando el uso…</p>
        : <div className="overflow-x-auto" tabIndex={0} aria-label="Tabla de uso de herramientas"><table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Trabajos empezados con cada herramienta por mes</caption>
          <thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className="p-2 font-medium">Herramienta</th>{data.months.map(m => <th key={m} scope="col" className="p-2 text-right font-medium capitalize">{monthLabel(m)}</th>)}<th scope="col" className="p-2 text-right font-medium">Total</th></tr></thead>
          <tbody>{data.rows.map(row => <tr key={row.slug} className="border-b border-border">
            <th scope="row" className="p-2 font-medium">{row.title}{row.retired && <span className="ml-2 text-xs font-normal text-muted-foreground">fuera del catálogo</span>}</th>
            {row.byMonth.map((count, i) => <td key={data.months[i]} className="p-2 text-right tabular-nums">{count || <span className="text-muted-foreground">·</span>}</td>)}
            <td className="p-2 text-right font-semibold tabular-nums">{row.total}</td>
          </tr>)}</tbody>
        </table></div>}
      <p className={s.note}>Cuenta cada trabajo que se empezó y se guardó con la herramienta, también los que después se eliminaron. Abrirla sin guardar no se cuenta.</p>
    </div>
  </details>;
}
