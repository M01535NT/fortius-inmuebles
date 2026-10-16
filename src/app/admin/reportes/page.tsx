"use client";

import * as React from "react";
import { PeriodReport } from "@/components/admin/workspace/period-report";
import { InventoryScope } from "@/components/admin/workspace/inventory-scope";
import { overdueFollowups, projectFollowups } from "@/lib/admin/followups";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { apiRequest, db, useCollection, useLoadState, useSession } from "@/lib/admin/store";
import { commercialMetrics, type StageRecord } from "@/lib/admin/commercial-metrics";
import { operationalDate } from "@/lib/admin/operational-date";
import { EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";

const stageLabels: Record<string, string> = { ...EXPEDIENTE_ETAPAS, "sin-etapa": "Sin etapa" };

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
  const [includeDemo,setIncludeDemo]=React.useState(false);
  const [detail,setDetail]=React.useState<"contacts"|"converted"|null>(null);
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
  const metrics = commercialMetrics({ leads, clientes, propiedades, tareas, asesores, expedientes, today: operationalDate(), includeDemo });
  const overdue=overdueFollowups(projectFollowups(leads,clientes),operationalDate());
  const converted=leads.flatMap(lead=>{
    const client=clientes.find(item=>item.id===lead.clienteId||item.leadId===lead.id);
    return lead.clienteId||client ? [{id:lead.id,name:lead.nombre,href:client?`/admin/clientes/${encodeURIComponent(client.id)}`:`/admin/leads/${encodeURIComponent(lead.id)}`}] : [];
  });
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Reportes comerciales" description={`Corte operativo ${operationalDate()} · cada indicador conserva su alcance.`} />
    <section className="admin-card p-4 sm:p-5" aria-labelledby="report-current">
      <h2 id="report-current">Situación actual</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">Pendientes de hoy. Los filtros de periodo no cambian estas cifras.</p>
      <div className="admin-report-metrics">
        <button type="button" className="admin-metric-action" aria-expanded={detail==="contacts"} aria-controls="report-contacts" onClick={()=>setDetail(detail==="contacts"?null:"contacts")}><span>Contactos vencidos</span><strong>{metrics.overdueContacts}</strong><small>Ver personas que requieren atención</small></button>
        <Link className="admin-metric-action" href="/admin/tareas?vence=vencidas"><span>Tareas vencidas</span><strong>{metrics.overdueTasks}</strong><small>Abrir las tareas vencidas</small></Link>
      </div>
      {detail==="contacts" && <div id="report-contacts" className="admin-report-detail"><h3>Contactos vencidos</h3>{overdue.length?<ul>{overdue.map(contact=><li key={contact.id}><Link href={contact.href}>{contact.personName}<small>{contact.kind==="cliente"?"Cliente":"Prospecto"} · {contact.fecha}</small></Link></li>)}</ul>:<p>No hay contactos vencidos.</p>}</div>}
    </section>
    <PeriodReport/>
    <section className="admin-card p-4 sm:p-5" aria-labelledby="report-historic">
      <h2 id="report-historic">Histórico del CRM</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">Desde el inicio del registro; independiente del periodo seleccionado arriba.</p>
      <div className="admin-report-metrics">
        <button type="button" className="admin-metric-action" aria-expanded={detail==="converted"} aria-controls="report-converted" onClick={()=>setDetail(detail==="converted"?null:"converted")}><span>Prospectos convertidos</span><strong>{metrics.converted}</strong><small>Abrir sus fichas</small></button>
        <div className="admin-metric-action"><span>Conversión histórica</span><strong>{metrics.conversionPercent===null?"Sin base":`${metrics.conversionPercent}%`}</strong><small>{metrics.converted} de {metrics.capturedLeads} prospectos capturados</small></div>
      </div>
      {detail==="converted" && <div id="report-converted" className="admin-report-detail"><h3>Fichas convertidas</h3>{converted.length?<ul>{converted.map(person=><li key={person.id}><Link href={person.href}>{person.name}</Link></li>)}</ul>:<p>Sin prospectos convertidos registrados.</p>}</div>}
    </section>
    <p className="text-sm text-muted-foreground">Conversión histórica = prospectos convertidos a cliente / {metrics.capturedLeads} prospectos capturados desde el inicio del registro. Incluye los descartados; no mide cierres ni ingresos. Los contactos vencidos se calculan con la fecha de Tijuana y excluyen prospectos convertidos o cerrados.</p>
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Cartera por asesor</h2>
      <p className="my-3 text-sm text-muted-foreground">Distribución actual del equipo; no se limita al periodo del reporte.</p>
      <InventoryScope count={propiedades.filter(property=>property.demo).length} included={includeDemo} onChange={setIncludeDemo}/>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th scope="col" className="p-2">Asesor</th><th scope="col" className="p-2">Prospectos activos</th><th scope="col" className="p-2">Clientes</th><th scope="col" className="p-2">Inmuebles</th><th scope="col" className="p-2">Expedientes</th><th scope="col" className="p-2">Contactos vencidos</th><th scope="col" className="p-2">Tareas vencidas</th></tr></thead><tbody>
        {metrics.portfolio.map(row => <tr key={row.id} className="border-b border-border"><th scope="row" className="p-2 font-medium">{row.nombre}</th><td className="p-2">{row.leads}</td><td className="p-2">{row.clientes}</td><td className="p-2">{row.inmuebles}</td><td className="p-2">{row.expedientes}</td><td className="p-2">{row.contactosVencidos}</td><td className="p-2">{row.tareasVencidas}</td></tr>)}
        <tr><th scope="row" className="p-2 font-medium">Sin asesor</th><td className="p-2">{metrics.unassigned.leads}</td><td className="p-2">{metrics.unassigned.clientes}</td><td className="p-2">{metrics.unassigned.inmuebles}</td><td className="p-2">{metrics.unassigned.expedientes}</td><td className="p-2">{metrics.unassigned.contactosVencidos}</td><td className="p-2">{metrics.unassigned.tareasVencidas}</td></tr>
      </tbody></table></div>
    </section>
    <section className="rounded-lg border border-border bg-card p-5"><h2 className="text-xl font-semibold">Etapas de operación</h2>{metrics.stages.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.stages.map(([stage, count]) => <li key={stage} className="flex justify-between rounded-md border border-border p-3"><span>{stageLabels[stage] ?? stage}</span><strong className="font-mono">{count}</strong></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Sin expedientes activos.</p>}<Link href="/admin/expedientes" className="mt-4 inline-block text-sm text-primary-ink underline">Abrir expedientes</Link></section>
  </div>;
}
