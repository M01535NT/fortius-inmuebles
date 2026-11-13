"use client";
import * as React from "react";
import Link from "next/link";
import { Landmark, Wallet } from "@/components/admin/icons";
import { ButtonLink, Card } from "@/components/admin/kit";
import { apiRequest, errorMessage } from "@/lib/admin/store";
import { getApp } from "@/lib/apps/catalog";
import { hipotecaHref, netoHref } from "@/lib/apps/contexto";
import type { AppRun } from "@/lib/apps/types";
import { humanDateTime } from "@/lib/utils";

/*
  Cálculos del inmueble (HER-05): los trabajos de Herramientas hechos para este inmueble
  (hipoteca, neto, ofertas…) se ven en su ficha; desde aquí se abren la hipoteca y, si está en venta,
  el ISR y neto del vendedor (HER-03) con su precio.
*/
export function PropertyToolWork({ slug, precio, moneda }: { slug: string; precio?: number; moneda?: string }) {
  const [runs, setRuns] = React.useState<AppRun[] | null>(null), [error, setError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    apiRequest<{ runs: AppRun[] }>(`/api/admin/apps/runs?inmuebleId=${encodeURIComponent(slug)}`)
      .then(result => { if (active) setRuns(Array.isArray(result?.runs) ? result.runs : []); })
      .catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [slug]);
  return <Card className="flex min-w-0 flex-col gap-3 p-4 sm:p-5" aria-labelledby="calculos-inmueble">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="calculos-inmueble" className="text-lg font-semibold">Cálculos de este inmueble</h2>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={hipotecaHref({ precio, moneda, inmueble: slug })}><Landmark size={16} aria-hidden="true" />Calcular hipoteca</ButtonLink>
        {precio !== undefined && <ButtonLink href={netoHref({ precio, moneda, inmueble: slug })}><Wallet size={16} aria-hidden="true" />ISR y neto</ButtonLink>}
      </div>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p>
      : runs === null ? <p role="status" className="text-sm text-muted-foreground">Consultando cálculos…</p>
      : runs.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay cálculos guardados para este inmueble. Lo que guardes desde aquí aparecerá en esta lista.</p>
      : <ul className="flex flex-col divide-y divide-border">{runs.map(run => <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
        <div className="min-w-0"><p className="font-semibold [overflow-wrap:anywhere]">{run.title}</p><p className="text-xs text-muted-foreground">{getApp(run.slug)?.title ?? run.slug} · {humanDateTime(run.updatedAt)}</p></div>
        <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4" href={`/admin/apps/${run.slug}?abrir=${encodeURIComponent(run.id)}`} aria-label={`Abrir ${run.title}`}>Abrir</Link>
      </li>)}</ul>}
  </Card>;
}
