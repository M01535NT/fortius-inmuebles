"use client";

import Link from "next/link";
import { DashboardTasks } from "@/components/admin/dashboard-tasks";
import { TodayWorkspace } from "@/components/admin/workspace/today";
import { ArrowUpRight, Building2, CalendarDays, Newspaper, Users } from "lucide-react";

import { Badge, DemoBanner, PageHeader } from "@/components/admin/ui";
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
  const leads = useCollection(db.leads).filter(lead => !lead.clienteId);
  const eventos = useCollection(db.eventos);
  const posts = useCollection(db.posts);

  const hoy = operationalDate();
  // "Próximos" incluye todo el día operativo, incluso eventos sin hora.
  const proximos = eventos
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const vistaPrevia = proximos.slice(0, 5);
  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;
  const disponibles = propiedades.filter((p) => p.estado === "disponible").length;

  const kpis = [
    { icon: Users, label: "Leads nuevos", value: leadsNuevos, href: "/admin/leads" },
    { icon: Building2, label: "Inmuebles disponibles", value: disponibles, href: "/admin/propiedades" },
    { icon: CalendarDays, label: "Eventos próximos", value: proximos.length, href: "/admin/calendario" },
    { icon: Newspaper, label: "Borradores de blog", value: posts.filter((p) => p.estado === "borrador").length, href: "/admin/blog" },
  ];

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader
        title="Panel."
        description="Lectura rápida de la operación: leads, inventario y agenda."
      />
      <DemoBanner />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="group min-w-0 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-2xl text-foreground sm:text-3xl">{String(value).padStart(2, "0")}</p>
              <Icon className="size-5 shrink-0 text-primary-ink" strokeWidth={1.5} />
            </div>
            <p className="mt-2 flex items-start gap-1 text-sm leading-snug text-muted-foreground">
              <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
              <ArrowUpRight
                className="mt-0.5 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={1.5}
              />
            </p>
          </Link>
        ))}
      </div>

      <DashboardTasks />
      <TodayWorkspace />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Agenda primero para priorizar la operación en móvil. */}
        <section aria-labelledby="dashboard-agenda" className="min-w-0 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
            <h2 id="dashboard-agenda" className="min-w-0 display-soft text-lg text-foreground">Agenda próxima</h2>
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

        {/* Leads recientes */}
        <section aria-labelledby="dashboard-leads" className="min-w-0 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
            <h2 id="dashboard-leads" className="min-w-0 display-soft text-lg text-foreground">Leads recientes</h2>
            <Link href="/admin/leads" className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary-ink hover:text-foreground">
              Ver todos
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sin leads aún.</p>
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
    </div>
  );
}
