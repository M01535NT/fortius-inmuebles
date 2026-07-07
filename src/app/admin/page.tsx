"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Newspaper, Users } from "lucide-react";

import { Badge, DemoBanner, PageHeader } from "@/components/admin/ui";
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
  const leads = useCollection(db.leads);
  const eventos = useCollection(db.eventos);
  const posts = useCollection(db.posts);

  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = eventos
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")))
    .slice(0, 5);
  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;
  const disponibles = propiedades.filter((p) => p.estado === "disponible").length;

  const kpis = [
    { icon: Users, label: "Leads nuevos", value: leadsNuevos, href: "/admin/leads" },
    { icon: Building2, label: "Inmuebles disponibles", value: disponibles, href: "/admin/propiedades" },
    { icon: CalendarDays, label: "Eventos próximos", value: proximos.length, href: "/admin/calendario" },
    { icon: Newspaper, label: "Borradores de blog", value: posts.filter((p) => p.estado === "borrador").length, href: "/admin/blog" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel."
        description="Lectura rápida de la operación: leads, inventario y agenda."
      />
      <DemoBanner />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <Icon className="size-5 text-primary" strokeWidth={1.5} />
            <p className="mt-4 font-mono text-3xl text-foreground">{String(value).padStart(2, "0")}</p>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
              {label}
              <ArrowUpRight
                className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={1.5}
              />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads recientes */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="display-soft text-lg text-foreground">Leads recientes</h2>
            <Link href="/admin/leads" className="text-[13px] font-medium text-primary hover:text-foreground">
              Ver todos
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="p-5 text-[13.5px] text-muted-foreground">Sin leads aún.</p>
          ) : (
            <ul className="divide-y divide-border">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-foreground">{lead.nombre}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                        {LEAD_ORIGEN_LABELS[lead.origen]} · {fechaCorta(lead.creadoEl)}
                      </p>
                    </div>
                    <Badge tone={lead.estado === "nuevo" ? "green" : "neutral"}>
                      {LEAD_ESTADO_LABELS[lead.estado]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Agenda */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="display-soft text-lg text-foreground">Agenda próxima</h2>
            <Link href="/admin/calendario" className="text-[13px] font-medium text-primary hover:text-foreground">
              Calendario
            </Link>
          </div>
          {proximos.length === 0 ? (
            <p className="p-5 text-[13.5px] text-muted-foreground">Sin eventos próximos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {proximos.map((evento) => (
                <li key={evento.id} className="flex items-baseline gap-4 px-5 py-3.5">
                  <span className="shrink-0 font-mono text-[12px] text-primary">
                    {evento.fecha.slice(8, 10)}/{evento.fecha.slice(5, 7)}
                    {evento.hora ? ` ${evento.hora}` : ""}
                  </span>
                  <p className="min-w-0 truncate text-[14px] text-foreground">{evento.titulo}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
