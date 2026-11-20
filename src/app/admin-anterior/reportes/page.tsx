"use client";

import * as React from "react";
import Link from "next/link";
import { PeriodReport } from "@/components/admin/workspace/period-report";
import { SectionBoundary } from "@/components/admin/section-boundary";
import { InventoryScope } from "@/components/admin/workspace/inventory-scope";
import { ToolUsage } from "@/components/admin/apps/tool-usage";
import { useOperationFormats } from "@/components/admin/operation/use-operation-formats";
import { followupLabel, overdueFollowups, projectFollowups } from "@/lib/admin/followups";
import { clientStatus } from "@/lib/admin/person-status";
import { PageHeader } from "@/components/admin/ui";
import { Silhouette } from "@/components/admin/workspace/silhouette";
import { apiRequest, db, useCollection, useLoadState, useSession } from "@/lib/admin/store";
import { commercialMetrics, type StageRecord } from "@/lib/admin/commercial-metrics";
import { operationalDate } from "@/lib/admin/operational-date";
import { initialStatus, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { longDate } from "@/lib/admin/today";
import { humanDate } from "@/lib/utils";
import { isShared, sharedCommissionEstimate } from "@/lib/admin/shared-property";
import { Avatar, Thumb } from "@/components/admin/kit";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StageChart } from "./stage-chart";
import s from "@/components/admin/workspace/reports.module.css";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

type ReportRecord = StageRecord & Partial<OperationRecord>;

/*
  Reportes (SIM-11, C29): arriba los cuatro números del periodo; después lo pendiente de hoy y las
  operaciones con las mismas etapas que Operaciones (C12). El reparto por asesor y lo acumulado
  desde el inicio van plegados. Las definiciones de los indicadores no cambian.
*/
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
  const formats = useOperationFormats();
  const [expedientes, setExpedientes] = React.useState<ReportRecord[]>([]);
  const [expedientStatus, setExpedientStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState("");
  const [includeDemo, setIncludeDemo] = React.useState(false);
  const [detail, setDetail] = React.useState<"contacts" | "converted" | null>(null);
  React.useEffect(() => {
    if (session?.role !== "admin") return;
    let active = true;
    apiRequest<{ expedientes: ReportRecord[] }>("/api/admin/expedientes")
      .then(result => { if (active) { setExpedientes(result.expedientes); setExpedientStatus("ready"); } })
      .catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "No se pudieron cargar los asuntos."); setExpedientStatus("error"); } });
    return () => { active = false; };
  }, [session?.role]);
  if (session?.role !== "admin") return <p role="alert" className="rounded-md border border-border p-6">Los reportes son solo para administradores.</p>;
  const states = [leadState, clientState, propertyState, taskState, adviserState];
  if (states.some(state => state.status === "error")) return <p role="alert" className="rounded-md border border-destructive p-6">No se pudieron cargar los datos del reporte. Revisa la conexión y recarga la página.</p>;
  if (states.some(state => !state.loaded) || expedientStatus === "loading") return <Silhouette label="Cargando reportes…" />;
  if (expedientStatus === "error") return <p role="alert" className="rounded-md border border-destructive p-6">{error}</p>;
  const today = operationalDate();
  // PUB-02 (RP-95): la comisión de un compartido es una estimación; no se suma a nada ni es lo cobrado.
  const shared = propiedades.filter(property => isShared(property) && (includeDemo || !property.demo));
  const metrics = commercialMetrics({ leads, clientes, propiedades, tareas, asesores, expedientes, today, includeDemo });
  const overdue = overdueFollowups(projectFollowups(leads, clientes, expedientes, tareas), today);
  const converted = leads.flatMap(lead => {
    // COR-10: solo cuenta quien firmó su contrato con Fortius.
    const client = clientes.find(item => (item.id === lead.clienteId || item.leadId === lead.id) && clientStatus(item.id, expedientes) !== "prospecto");
    return client ? [{ id: lead.id, name: lead.nombre, href: client ? `/admin-anterior/clientes/${encodeURIComponent(client.id)}` : `/admin-anterior/leads/${encodeURIComponent(lead.id)}` }] : [];
  });
  // SIM-04 (C12): el mismo nombre y número de etapa que la lista de Operaciones, también para un registro sin tipo de operación.
  const stageCounts = new Map<string, { n: number; count: number }>();
  for (const record of expedientes) {
    const view = { ...record, inicial: initialStatus(formats.get(record.id), tareas.find(t => t.id === checklistTaskId(record.id))) } as OperationRecord;
    const { stages, current } = stageTrack(view, today);
    const label = stages[current]?.label ?? "Sin etapa", n = current + 1;
    const entry = stageCounts.get(label) ?? { n, count: 0 };
    stageCounts.set(label, { n: Math.min(entry.n, n), count: entry.count + 1 });
  }
  const stageRows = [...stageCounts].sort((a, b) => a[1].n - b[1].n || a[0].localeCompare(b[0], "es"));
  return <div className="min-w-0 space-y-8">
    <PageHeader title="Reportes comerciales" description={`Datos al ${longDate(today).toLowerCase()}.`} />
    <SectionBoundary what="los resultados del periodo"><PeriodReport /></SectionBoundary>
    <section className={s.block} aria-labelledby="report-today">
      <h2 id="report-today" className="text-xl font-semibold">Pendientes de hoy</h2>
      <div className={s.pending}>
        <button type="button" className={s.pendingItem} aria-expanded={detail === "contacts"} aria-controls="report-contacts" onClick={() => setDetail(detail === "contacts" ? null : "contacts")}><span>Contactos vencidos</span><strong>{metrics.overdueContacts}</strong></button>
        <Link className={s.pendingItem} href="/admin-anterior/agenda?tab=tareas&vence=vencidas"><span>Tareas vencidas</span><strong>{metrics.overdueTasks}</strong></Link>
      </div>
      {detail === "contacts" && <div id="report-contacts" className={s.detail}>{overdue.length ? <ul>{overdue.map(contact => <li key={contact.id}><Link href={contact.href}>{contact.personName}<small>{followupLabel(contact)} · desde {humanDate(contact.fecha)}</small></Link></li>)}</ul> : <p className={s.note}>Nadie espera contacto.</p>}</div>}
    </section>
    <section className={s.block} aria-labelledby="report-stages">
      <h2 id="report-stages" className="text-xl font-semibold">Asuntos por etapa</h2>
      {stageRows.length ? <StageChart rows={stageRows.map(([label, { count }]) => ({ label, count }))} /> : <p className={s.note}>Todavía no hay asuntos abiertos.</p>}
      <Link href="/admin-anterior/operaciones" className="inline-flex min-h-11 items-center self-start text-sm font-medium text-foreground underline underline-offset-4">Abrir asuntos</Link>
    </section>
    <details className={s.fold}>
      <summary>Por asesor <span className={s.summaryNote}>Lo que lleva cada quien hoy</span></summary>
      <div className={s.foldBody}>
        <InventoryScope count={propiedades.filter(property => property.demo).length} included={includeDemo} onChange={setIncludeDemo} />
        <Table className="min-w-[760px] [&_:is(th,td):last-child]:!static [&_:is(th,td):last-child]:!shadow-none"><TableCaption className="sr-only">Cartera actual por asesor</TableCaption>
          <TableHeader><TableRow className="hover:bg-transparent">{["Asesor", "Prospectos activos", "Clientes", "Inmuebles", "Asuntos", "Contactos vencidos", "Tareas vencidas", "Cierres · reparto estimado"].map((label, i) => <TableHead key={label} scope="col" className={i ? "text-right" : undefined}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {metrics.portfolio.map(row => <TableRow key={row.id}><TableHead scope="row" className="h-auto text-[0.9375rem] font-medium text-foreground"><span className="inline-flex items-center gap-2.5"><Avatar name={row.nombre} size={28} />{row.nombre}</span></TableHead>{[row.leads, row.clientes, row.inmuebles, row.expedientes].map((n, i) => <TableCell key={i} className="text-right tabular-nums">{n}</TableCell>)}<TableCell className={`text-right tabular-nums ${row.contactosVencidos ? "font-semibold text-destructive" : ""}`}>{row.contactosVencidos}</TableCell><TableCell className={`text-right tabular-nums ${row.tareasVencidas ? "font-semibold text-destructive" : ""}`}>{row.tareasVencidas}</TableCell><TableCell className="text-right tabular-nums">{row.cierres ? `${row.cierres}${row.repartoEstimado !== null ? ` · ${money.format(row.repartoEstimado)}` : ""}` : "—"}</TableCell></TableRow>)}
            <TableRow><TableHead scope="row" className="h-auto text-[0.9375rem] font-medium text-foreground">Sin asesor</TableHead>{[metrics.unassigned.leads, metrics.unassigned.clientes, metrics.unassigned.inmuebles, metrics.unassigned.expedientes, metrics.unassigned.contactosVencidos, metrics.unassigned.tareasVencidas].map((n, i) => <TableCell key={i} className="text-right tabular-nums">{n}</TableCell>)}<TableCell className="text-right tabular-nums">—</TableCell></TableRow>
          </TableBody>
        </Table>
        <p className={s.note}>El reparto es una estimación: 25 % al que capta y 25 % al que vende (50 % si es el mismo), sobre la comisión del contrato de intermediación. No es lo cobrado.</p>
      </div>
    </details>
    <ToolUsage />
    {shared.length > 0 && <details className={s.fold}>
      <summary>Inmuebles compartidos <span className={s.summaryNote}>{shared.length === 1 ? "1 de otra inmobiliaria" : `${shared.length} de otras inmobiliarias`}</span></summary>
      <div className={s.foldBody}>
        <Table className="min-w-[560px]"><TableCaption className="sr-only">Inmuebles compartidos y su comisión estimada</TableCaption>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead scope="col">Inmueble</TableHead><TableHead scope="col">Inmobiliaria</TableHead><TableHead scope="col" className="text-right">Comisión acordada</TableHead><TableHead scope="col" className="text-right">Estimación</TableHead></TableRow></TableHeader>
          <TableBody>
            {shared.map(property => { const estimate = sharedCommissionEstimate(property); return <TableRow key={property.slug}><TableHead scope="row" className="h-auto whitespace-normal text-[0.9375rem] font-medium text-foreground"><span className="inline-flex items-center gap-2.5"><Thumb src={property.galeria?.[0]?.src} size={36} /><span><Link href={`/admin-anterior/propiedades/${encodeURIComponent(property.slug)}/editar`} className="underline underline-offset-4">{property.titulo}</Link>{property.demo ? " · ejemplo" : ""}</span></span></TableHead><TableCell>{property.aliado?.inmobiliaria ?? "—"}</TableCell><TableCell className="text-right tabular-nums">{property.aliado?.porcentaje != null ? `${property.aliado.porcentaje} %` : "—"}</TableCell><TableCell className="text-right tabular-nums">{estimate ? new Intl.NumberFormat("es-MX", { style: "currency", currency: estimate.moneda, maximumFractionDigits: 0 }).format(estimate.monto) : "—"}</TableCell></TableRow>; })}
          </TableBody>
        </Table>
        <p className={s.note}>Estimación: precio publicado por la comisión acordada con la inmobiliaria. No se suma a los cierres ni es lo cobrado; un precio a consulta no se estima.</p>
      </div>
    </details>}
    <details className={s.fold}>
      <summary>Desde el inicio <span className={s.summaryNote}>{metrics.conversionPercent === null ? "Sin prospectos" : `${metrics.conversionPercent}% se volvieron clientes`}</span></summary>
      <div className={s.foldBody}>
        <div className={s.pending}>
          <button type="button" className={s.pendingItem} aria-expanded={detail === "converted"} aria-controls="report-converted" onClick={() => setDetail(detail === "converted" ? null : "converted")}><span>Prospectos que se volvieron clientes</span><strong>{metrics.converted}</strong></button>
          <div className={s.pendingItem}><span>De {metrics.capturedLeads} prospectos registrados</span><strong>{metrics.conversionPercent === null ? "—" : `${metrics.conversionPercent}%`}</strong></div>
        </div>
        {detail === "converted" && <div id="report-converted" className={s.detail}>{converted.length ? <ul>{converted.map(person => <li key={person.id}><Link href={person.href}>{person.name}</Link></li>)}</ul> : <p className={s.note}>Todavía ningún prospecto se volvió cliente.</p>}</div>}
        <p className={s.note}>Cuenta todos los prospectos registrados, también los descartados; no mide cierres ni ingresos. Cliente es quien firmó su contrato con Fortius. Los contactos vencidos usan la fecha de Tijuana y no incluyen prospectos que se cerraron.</p>
      </div>
    </details>
  </div>;
}
