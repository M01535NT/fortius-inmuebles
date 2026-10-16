"use client";

import * as React from "react";
import Link from "next/link";
import { SetupChecklist } from "@/components/admin/workspace/setup-checklist";
import { TodayWorkspace } from "@/components/admin/workspace/today";
import { ArrowRight, Plus } from "lucide-react";
import { InventoryScope } from "@/components/admin/workspace/inventory-scope";
import { operationalInventory } from "@/lib/admin/operational-inventory";

import { Badge, btnGhost, btnPrimary } from "@/components/admin/ui";
import { operationalDate } from "@/lib/admin/operational-date";
import {
  LEAD_ESTADO_LABELS,
  LEAD_ORIGEN_LABELS,
  apiRequest,
  db,
  fechaCorta,
  useCollection,
} from "@/lib/admin/store";
import { INTENTS, type OperationalInterview } from "@/lib/intake/interview";
import { formatDate } from "@/lib/utils";

/*
  Resumen coach: una acción principal (Nueva operación), entrevistas
  pendientes y el trabajo del día. El detalle denso queda en «Más información».
*/
export default function AdminDashboard() {
  const propiedades = useCollection(db.propiedades);
  const [includeDemo, setIncludeDemo] = React.useState(false);
  const leads = useCollection(db.leads).filter(lead => !lead.clienteId);
  const eventos = useCollection(db.eventos);
  const [pendingInterviews, setPendingInterviews] = React.useState<OperationalInterview[]>([]);

  const hoy = operationalDate();
  const proximos = eventos
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? "")));
  const vistaPrevia = proximos.filter((e) => e.fecha > hoy).slice(0, 5);
  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;
  const disponibles = operationalInventory(propiedades, includeDemo).filter((p) => p.estado === "disponible").length;

  React.useEffect(() => {
    let active = true;
    apiRequest<{ entrevistas: OperationalInterview[] }>("/api/admin/entrevistas")
      .then((response) => {
        if (!active || !Array.isArray(response.entrevistas)) return;
        setPendingInterviews(response.entrevistas.filter((item) => item.estado === "borrador"));
      })
      .catch(() => {
        if (active) setPendingInterviews([]);
      });
    return () => { active = false; };
  }, []);

  const kpis = [
    { label: "Inmuebles disponibles", value: disponibles, href: "/admin/propiedades" },
    { label: "Prospectos nuevos", value: leadsNuevos, href: "/admin/leads" },
    { label: "Eventos próximos", value: proximos.length, href: "/admin/calendario" },
  ];

  return (
    <div className="admin-dashboard min-w-0 space-y-5">
      <header className="admin-coach-header">
        <div>
          <h1>¿Qué vas a hacer hoy?</h1>
          <p>
            Empieza por la captación guiada. El panel se adapta al perfil del
            prospecto: vender, arrendar, comprar, rentar o invertir.
          </p>
          <p className="admin-coach-date">
            <time dateTime={hoy}>{formatDate(hoy)}</time>
          </p>
        </div>
        <div className="admin-coach-actions">
          <Link href="/admin/operaciones/nueva" className={btnPrimary}>
            <Plus size={18} /> Nueva operación
          </Link>
          {pendingInterviews.length > 0 ? (
            <Link
              href={`/admin/entrevistas/${pendingInterviews[0].id}`}
              className={btnGhost}
            >
              Continuar entrevista pendiente ({pendingInterviews.length})
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/admin/expedientes" className={btnGhost}>
              Ver operaciones
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {pendingInterviews.length > 0 ? (
        <section className="admin-card admin-coach-pending" aria-labelledby="pending-interviews">
          <div className="admin-card-heading flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
            <h2 id="pending-interviews" className="display-soft text-lg text-foreground">
              Entrevistas por terminar
            </h2>
            <Link href="/admin/operaciones/nueva" className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary-ink hover:text-foreground">
              Nueva operación
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {pendingInterviews.slice(0, 5).map((interview) => (
              <li key={interview.id}>
                <Link
                  href={`/admin/entrevistas/${interview.id}`}
                  className="flex min-w-0 flex-col gap-1 px-4 py-3 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <span className="min-w-0 text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                    {interview.contacto?.nombre || "Contacto sin nombre"}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {INTENTS[interview.intencion]?.label ?? interview.intencion}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="admin-executive-metrics admin-coach-metrics" aria-label="Indicadores rápidos">
        {kpis.map(({ label, value, href }) => (
          <Link key={label} href={href} aria-label={`${String(value).padStart(2, "0")} ${label}`}>
            <small>{label}</small>
            <strong>{String(value).padStart(2, "0")}</strong>
          </Link>
        ))}
      </div>

      <InventoryScope count={propiedades.filter(p => p.demo).length} included={includeDemo} onChange={setIncludeDemo}/>
      <TodayWorkspace/>
      <details className="admin-dashboard-more"><summary>Más información del equipo</summary>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2">
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
