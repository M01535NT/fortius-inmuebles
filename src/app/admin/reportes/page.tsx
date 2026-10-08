"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { apiRequest, db, useCollection, useLoadState, useSession } from "@/lib/admin/store";
import { commercialMetrics, type StageRecord } from "@/lib/admin/commercial-metrics";
import { operationalDate } from "@/lib/admin/operational-date";

const stageLabels: Record<string, string> = {
  captacion: "Captación", documentacion: "Documentación", comercializacion: "Comercialización",
  negociacion: "Negociación", cierre: "Cierre", cerrado: "Cerrado", "sin-etapa": "Sin etapa",
};

export default function ReportesPage() {
  const session = useSession();
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const tareas = useCollection(db.tareas);
  const asesores = useCollection(db.asesores);
  const leadState = useLoadState(db.leads);
  const clientState = useLoadState(db.clientes);
  const propertyState = useLoadState(db.propiedades);
  const taskState = useLoadState(db.tareas);
  const adviserState = useLoadState(db.asesores);
  const [expedientes, setExpedientes] = React.useState<StageRecord[]>([]);
  const [expedientStatus, setExpedientStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    if (session?.role !== "admin") return;
    let active = true;
    apiRequest<{ expedientes: StageRecord[] }>("/api/admin/expedientes")
      .then(result => { if (active) { setExpedientes(result.expedientes); setExpedientStatus("ready"); } })
      .catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "No se pudieron cargar expedientes."); setExpedientStatus("error"); } });
    return () => { active = false; };
  }, [session?.role]);
  if (session?.role !== "admin") return <p role="alert" className="rounded-md border border-border p-6">Los reportes requieren acceso de administrador.</p>;
  const states = [leadState, clientState, propertyState, taskState, adviserState];
  if (states.some(state => state.status === "error")) return <p role="alert" className="rounded-md border border-destructive p-6">No se pudieron cargar los datos del reporte. Revisa la conexión y recarga la página.</p>;
  if (states.some(state => !state.loaded) || expedientStatus === "loading") return <p role="status" className="p-6">Cargando indicadores…</p>;
  if (expedientStatus === "error") return <p role="alert" className="rounded-md border border-destructive p-6">{error}</p>;
  const metrics = commercialMetrics({ leads, clientes, propiedades, tareas, asesores, expedientes, today: operationalDate() });
  const cards = [
    { label: "Contactos vencidos", value: metrics.overdueContacts, href: "/admin/leads" },
    { label: "Tareas vencidas", value: metrics.overdueTasks, href: "/admin/tareas?vence=vencidas" },
    { label: "Leads convertidos", value: metrics.converted, href: "/admin/leads" },
    { label: "Conversión histórica", value: metrics.conversionPercent === null ? "Sin base" : `${metrics.conversionPercent}%`, href: "/admin/leads" },
  ];
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Reportes comerciales" description={`Corte operativo ${operationalDate()} · datos actuales del panel.`} />
    <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => <Link key={card.label} href={card.href} className="rounded-lg border border-border bg-card p-5 hover:border-primary/50"><h2 className="text-sm text-muted-foreground">{card.label}</h2><p className="mt-2 font-mono text-3xl">{card.value}</p></Link>)}
    </section>
    <p className="text-sm text-muted-foreground">Conversión histórica = leads convertidos a cliente / {metrics.capturedLeads} leads capturados desde el inicio del registro. Incluye los descartados; no mide cierres ni ingresos. Los contactos vencidos se calculan con la fecha de Tijuana y excluyen leads convertidos o cerrados.</p>
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Cartera por asesor</h2>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className="p-2">Asesor</th><th scope="col" className="p-2">Leads activos</th><th scope="col" className="p-2">Clientes</th><th scope="col" className="p-2">Inmuebles</th><th scope="col" className="p-2">Expedientes</th><th scope="col" className="p-2">Contactos vencidos</th><th scope="col" className="p-2">Tareas vencidas</th></tr></thead><tbody>
        {metrics.portfolio.map(row => <tr key={row.id} className="border-b border-border"><th scope="row" className="p-2 font-medium">{row.nombre}</th><td className="p-2">{row.leads}</td><td className="p-2">{row.clientes}</td><td className="p-2">{row.inmuebles}</td><td className="p-2">{row.expedientes}</td><td className="p-2">{row.contactosVencidos}</td><td className="p-2">{row.tareasVencidas}</td></tr>)}
        <tr><th scope="row" className="p-2 font-medium">Sin asesor</th><td className="p-2">{metrics.unassigned.leads}</td><td className="p-2">{metrics.unassigned.clientes}</td><td className="p-2">{metrics.unassigned.inmuebles}</td><td className="p-2">{metrics.unassigned.expedientes}</td><td className="p-2">{metrics.unassigned.contactosVencidos}</td><td className="p-2">{metrics.unassigned.tareasVencidas}</td></tr>
      </tbody></table></div>
    </section>
    <section className="rounded-lg border border-border bg-card p-5"><h2 className="text-xl font-semibold">Etapas de operación</h2>{metrics.stages.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.stages.map(([stage, count]) => <li key={stage} className="flex justify-between rounded-md border border-border p-3"><span>{stageLabels[stage] ?? stage}</span><strong className="font-mono">{count}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sin expedientes activos.</p>}<Link href="/admin/expedientes" className="mt-4 inline-block text-sm text-primary-ink underline">Abrir expedientes</Link></section>
  </div>;
}
