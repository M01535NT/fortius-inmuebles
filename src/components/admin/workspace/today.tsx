"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, FileText, MoreHorizontal, MapPin, Users } from "lucide-react";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { ownerReportApplies, ownerReportStatus, processPhase, processStageText, SALE_PROCESS, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { AttentionQueue } from "./attention-queue";

type Dossier = { id: string; folio: string; etapa?: WorkflowStage; fecha_objetivo?: string; propiedad_slug?: string | null; asesor_id?: string; cliente_id?: string; flujo?: OperationWorkflow | null };
const dateLabel = (date: string | undefined, today: string) => !date ? "Sin fecha" : date === today ? "Hoy" : date.split("-").reverse().slice(0, 2).join("/");

export function TodayWorkspace() {
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), events = useCollection(db.eventos), tasks = useCollection(db.tareas);
  const properties = useCollection(db.propiedades), advisers = useCollection(db.asesores);
  const today = operationalDate();
  const visits = events.filter(e => e.fecha === today).sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
  const [dossiers, setDossiers] = React.useState<Dossier[]>([]);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [reports, setReports] = React.useState<Record<string, string> | null | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ expedientes: Dossier[] }>("/api/admin/expedientes")
      .then(r => { if (active) { setDossiers(r.expedientes ?? []); setState("ready"); } })
      .catch(() => { if (active) setState("error"); });
    apiRequest<{ ultimos?: Record<string, string> }>("/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente")
      .then(r => { if (active) setReports(r.ultimos ?? {}); })
      .catch(() => { if (active) setReports(null); });
    return () => { active = false; };
  }, []);
  const activeTasks = tasks.filter(t => t.estado !== "completada" && t.estado !== "cancelada").sort((a, b) => (a.vence ?? "9999").localeCompare(b.vence ?? "9999"));
  const pending = activeTasks.filter(t => t.vence && t.vence <= today);
  const due = dossiers.filter(d => d.etapa !== "cerrado" && d.fecha_objetivo && d.fecha_objetivo < today);
  const reportsDue = reports ? dossiers.filter(d => ownerReportApplies(d.etapa, d.flujo) && ownerReportStatus(reports[d.id], today).estado !== "al_dia").map(d => ({ ...d, report: ownerReportStatus(reports[d.id], today) })) : [];
  const rows = activeTasks.slice(0, 3).map(task => {
    const property = properties.find(p => p.slug === task.propiedadSlug);
    const dossier = task.expedienteId ? dossiers.find(d => d.id === task.expedienteId && d.etapa !== "cerrado") : undefined;
    const adviser = advisers.find(a => a.id === (task.asesorId || dossier?.asesor_id));
    const person = clients.find(c => c.id === (task.clienteId || dossier?.cliente_id))?.nombre ?? leads.find(l => l.id === task.leadId)?.nombre;
    return { id: task.id, title: person ?? property?.titulo ?? "Tarea del equipo", detail: property?.titulo ?? dossier?.folio ?? "Atención inicial · sin inmueble", photo: property?.galeria[0]?.src, stage: dossier?.etapa, stageText: dossier ? processStageText(dossier.etapa, dossier.flujo, today) : undefined, action: task.titulo, adviser: adviser?.nombre ?? "Sin asignar", date: task.vence, href: `/admin/tareas/${task.id}` };
  });
  const operationRows = rows.length ? rows : dossiers.filter(d => d.etapa !== "cerrado").slice(0, 3).map(dossier => {
    const property = properties.find(p => p.slug === dossier.propiedad_slug);
    return { id: dossier.id, title: clients.find(c=>c.id===dossier.cliente_id)?.nombre ?? property?.titulo ?? dossier.folio, detail: property?.titulo ?? dossier.folio, photo: property?.galeria[0]?.src, stage: dossier.etapa, stageText: processStageText(dossier.etapa, dossier.flujo, today), action: "Abrir expediente", adviser: advisers.find(a => a.id === dossier.asesor_id)?.nombre ?? "Sin asignar", date: dossier.fecha_objetivo, href: `/admin/expedientes?expediente=${dossier.id}` };
  });
  return <div className="admin-daily-layout">
    <AttentionQueue today={today}/>
    <section className="admin-card admin-cycle-card" aria-label="Proceso de venta">
      <div className="admin-card-heading"><h2>Proceso de venta</h2><Link href="/admin/expedientes">Ver operaciones <ArrowRight size={16}/></Link></div>
      {state === "error" ? <p role="alert" className="p-5 text-sm text-muted-foreground">No se pudieron consultar las etapas. Recarga el módulo para reintentar.</p> : <ol className="admin-cycle" aria-busy={state === "loading"}>
        {SALE_PROCESS.map((phase, index) => <li key={phase.key} className="admin-cycle-step"><span className="admin-cycle-number" aria-hidden="true">{index}</span><div className="min-w-0"><p><Link href={`/admin/proceso/${phase.slug}`}>{phase.label}</Link></p><strong>{state === "loading" ? "—" : dossiers.filter(d => d.etapa !== "cerrado" && processPhase(d.etapa, d.flujo, today) === phase.key).length}</strong><span className="ml-1 text-xs text-muted-foreground">expedientes</span></div></li>)}
      </ol>}
      <span className="sr-only">Etapas del proceso de venta de expedientes activos; no incluye expedientes archivados.</span>
      {state === "ready" && <div className="px-4 pb-3 text-sm" aria-label="Informes mensuales al propietario">{reports === null ? <p className="text-muted-foreground">No se pudo consultar el seguimiento de informes al propietario.</p> : reports && (reportsDue.length ? <details><summary className="cursor-pointer"><strong>{reportsDue.length} {reportsDue.length === 1 ? "operación necesita" : "operaciones necesitan"} su informe mensual al propietario</strong></summary><ul className="mt-2 space-y-1">{reportsDue.map(d => <li key={d.id}><Link className="text-primary-ink underline" href={`/admin/expedientes?expediente=${encodeURIComponent(d.id)}`}>{clients.find(c => c.id === d.cliente_id)?.nombre ?? d.folio}</Link> · {d.report.estado === "sin_informe" ? "sin informe registrado" : `vencido desde ${d.report.proximo!.split("-").reverse().join("/")}`}</li>)}</ul></details> : <p className="text-muted-foreground">Informes mensuales al propietario al día.</p>)}</div>}
    </section>
    <section className="admin-card admin-attention-card" aria-label="Atención de hoy">
      <div className="admin-card-heading"><h2>Operaciones que requieren atención</h2><Link href="/admin/tareas">Ver todas <ArrowRight size={16}/></Link></div>
      <div className="admin-operations-scroll"><table className="admin-operations-table"><thead><tr><th>Persona y operación</th><th>Etapa</th><th>Próximo paso</th><th>Responsable</th><th>Fecha</th><th><span className="sr-only">Detalle</span></th></tr></thead><tbody>
        {operationRows.map(row => <tr key={row.id}><td><Link href={row.href} className="admin-operation-property">{row.photo ? <Image unoptimized src={row.photo} width={84} height={56} alt=""/> : <Building2 size={24} aria-hidden="true"/>}<span><strong title={row.title}>{row.title}</strong><small>{row.detail}</small></span></Link></td><td><span data-stage={row.stage} className="admin-operation-stage" aria-label={row.stageText ?? "Sin etapa registrada"}>{row.stageText ?? "Sin etapa registrada"}</span></td><td><Link href={row.href} title={row.action} className="admin-next-action">{row.action}</Link></td><td><span className="admin-responsible" title={row.adviser}><span aria-hidden="true">{row.adviser === "Sin asignar" ? "—" : row.adviser.split(/\s+/).slice(0, 2).map(w => w[0]).join("")}</span><span>{row.adviser}</span></span></td><td className={row.date && row.date <= today ? "text-primary-ink font-semibold" : ""}>{dateLabel(row.date, today)}</td><td><Link className="admin-row-detail" href={row.href} aria-label={`Abrir detalle de ${row.title}`}><MoreHorizontal size={18}/></Link></td></tr>)}
      </tbody></table></div>
      {!operationRows.length && <p className="admin-table-empty">{state === "loading" ? "Cargando operaciones…" : state === "error" ? "No se pudieron consultar los expedientes." : "Sin tareas ni operaciones activas registradas."}</p>}
    </section>
    <section className="admin-card admin-agenda-card" aria-label="Agenda de hoy">
      <div className="admin-card-heading"><h2>Agenda de hoy</h2><Link href="/admin/calendario">Ver agenda <ArrowRight size={16}/></Link></div>
      {visits.length ? <ul className="admin-agenda-list">{visits.slice(0, 3).map(event => {
        const context = properties.find(p => p.slug === event.propiedadSlug)?.titulo
          ?? clients.find(c => c.id === event.clienteId)?.nombre
          ?? leads.find(l => l.id === event.leadId)?.nombre
          ?? dossiers.find(d => d.id === event.expedienteId)?.folio;
        const Icon = event.tipo === "visita" ? MapPin : event.tipo === "llamada" ? Users : FileText;
        return <li key={event.id}><time>{event.hora ?? "Sin hora"}</time><span className="admin-agenda-dot" aria-hidden="true"/><Icon size={19} aria-hidden="true"/><Link href={`/admin/calendario?fecha=${today}&evento=${event.id}`}>{event.titulo}{context && <small>{context}</small>}</Link></li>;
      })}</ul> : <p className="admin-table-empty">Sin eventos programados para hoy.</p>}
      {visits.length > 3 && <Link href={`/admin/calendario?fecha=${today}`} className="admin-agenda-more">Ver los {visits.length} pendientes</Link>}
    </section>
    <details className="admin-daily-details"><summary>Seguimiento del equipo</summary><div className="admin-followup-grid">
      <section><h3>Tareas prioritarias {pending.length || ""}</h3>{pending.length ? pending.map(t => <Link key={t.id} href={`/admin/tareas/${t.id}`}>{t.titulo}<small>{t.vence === today ? "Hoy" : `Vencida · ${t.vence}`}</small></Link>) : <p>No hay tareas vencidas ni previstas para hoy.</p>}</section>
      <section><h3>Expedientes por retomar</h3>{due.length ? due.map(d => <Link key={d.id} href={`/admin/expedientes?expediente=${d.id}`}>{d.folio}<small>Fecha objetivo: {d.fecha_objetivo}</small></Link>) : <p>{state === "error" ? "No se pudo consultar el seguimiento de expedientes." : "Sin expedientes con fecha objetivo vencida."}</p>}</section>
    </div></details>
  </div>;
}
