"use client";

import * as React from "react";
import Link from "next/link";
import { SetupChecklist } from "@/components/admin/workspace/setup-checklist";
import { TodayWorkspace } from "@/components/admin/workspace/today";
import { Plus } from "lucide-react";
import { InventoryScope } from "@/components/admin/workspace/inventory-scope";
import { operationalInventory } from "@/lib/admin/operational-inventory";

import { Badge, btnPrimary } from "@/components/admin/ui";
import { operationalDate } from "@/lib/admin/operational-date";
import {
  LEAD_ESTADO_LABELS,
  LEAD_ORIGEN_LABELS,
  db,
  fechaCorta,
  useCollection,
} from "@/lib/admin/store";

/*
  Dashboard: lectura rápida del negocio. KPIs reales de la capa de datos,
  leads recientes y agenda próxima.
*/
export default function AdminDashboard() {
  const propiedades = useCollection(db.propiedades);
  const [includeDemo, setIncludeDemo] = React.useState(false);
  const leads = useCollection(db.leads).filter(lead => !lead.clienteId);
  const eventos = useCollection(db.eventos);

  const hoy = operationalDate();
  // "Próximos" incluye todo el día operativo, incluso eventos sin hora.
  const proximos = eventos
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const vistaPrevia = proximos.filter((e) => e.fecha > hoy).slice(0, 5);
  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;
  const disponibles = operationalInventory(propiedades, includeDemo).filter((p) => p.estado === "disponible").length;

  const kpis = [
    { label: "Inmuebles disponibles", value: disponibles, href: "/admin/propiedades" },
    { label: "Prospectos nuevos", value: leadsNuevos, href: "/admin/leads" },
    { label: "Eventos próximos", value: proximos.length, href: "/admin/calendario" },
  ];

  return (
    <div className="admin-dashboard min-w-0 space-y-5">
      <header className="admin-executive-header">
        <div><h1>Resumen ejecutivo</h1><p><time dateTime={hoy}>{hoy.split("-").reverse().join("/")}</time></p></div>
        <div className="admin-executive-metrics">{kpis.map(({ label, value, href }) => <Link key={label} href={href} aria-label={`${String(value).padStart(2,"0")} ${label}`}><small>{label}</small><strong>{String(value).padStart(2, "0")}</strong></Link>)}<Link href="/admin/finanzas"><small>Comisiones previstas</small><span>Pendiente</span></Link></div>
        <Link href="/admin/expedientes?nuevo=1#nuevo-expediente" className={btnPrimary}><Plus size={18} /> Nueva operación</Link>
      </header>
      <InventoryScope count={propiedades.filter(p => p.demo).length} included={includeDemo} onChange={setIncludeDemo}/>
      <TodayWorkspace includeDemo={includeDemo}/>
      <details className="admin-dashboard-more"><summary>Más información del equipo</summary>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Agenda primero para priorizar la operación en móvil. */}
        <section aria-labelledby="dashboard-agenda" className="admin-card min-w-0 rounded-lg border border-border bg-card">
          <div className="admin-card-heading flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
            <h2 id="dashboard-agenda" className="min-w-0 display-soft text-lg text-foreground">Próximos días</h2>
            <Link href="/admin/calendario" className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary-ink hover:text-foreground">
              Calendario
            </Link>
          </div>
          {vistaPrevia.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground sm:p-5">Sin eventos próximos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {vistaPrevia.map((evento) => (
                <li key={evento.id} className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 sm:px-5">
                  <span className="shrink-0 font-mono text-xs text-primary-ink">
                    {evento.fecha.slice(8, 10)}/{evento.fecha.slice(5, 7)}
                    {evento.hora ? ` ${evento.hora}` : ""}
                  </span>
                  <Link href={`/admin/calendario?fecha=${evento.fecha}&evento=${evento.id}`} className="min-w-0 text-sm text-foreground underline-offset-4 hover:underline [overflow-wrap:anywhere]">{evento.titulo}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Prospectos recientes */}
        <section aria-labelledby="dashboard-leads" className="admin-card min-w-0 rounded-lg border border-border bg-card">
          <div className="admin-card-heading flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
            <h2 id="dashboard-leads" className="min-w-0 display-soft text-lg text-foreground">Prospectos recientes</h2>
            <Link href="/admin/leads" className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary-ink hover:text-foreground">
              Ver todos
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sin prospectos aún.</p>
          ) : (
            <ul className="divide-y divide-border">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="flex min-w-0 flex-col items-start gap-2 px-4 py-3 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">{lead.nombre}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                        {LEAD_ORIGEN_LABELS[lead.origen]} · {fechaCorta(lead.creadoEl)}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <Badge tone={lead.estado === "nuevo" ? "green" : "neutral"}>
                        {LEAD_ESTADO_LABELS[lead.estado]}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <SetupChecklist />
      </details>
    </div>
  );
}
