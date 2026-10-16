"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { apiRequest, db, loadAllDossiers, useCollection, errorMessage } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { ownerReportApplies, ownerReportStatus, processPhase, processStageText, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { PageHeader, btnGhost, btnPrimary } from "@/components/admin/ui";
import { getProcessStage, PROCESS_STAGES } from "./module-catalog";
import { formatDate } from "@/lib/utils";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";

type ProcessDossier = { cliente_id?: string; id: string; folio: string; etapa?: WorkflowStage | null; operacion?: string; fecha_objetivo?: string | null; deleted_at?: string | null; flujo?:OperationWorkflow|null };
function reportText(last: string | undefined, today: string) {
  const status = ownerReportStatus(last, today);
  return status.estado === "sin_informe" ? "Informe al propietario: sin informe registrado" : status.estado === "vencido" ? `Informe al propietario: vencido desde ${formatDate(status.proximo!)}` : `Informe al propietario: al día · próximo ${formatDate(status.proximo!)}`;
}

export function ProcessStageWorkspace({ stage }: { stage: string }) {
  const definition = getProcessStage(stage);
  const clients = useCollection(db.clientes);
  const today = operationalDate();
  const [state, setState] = React.useState<{ loading: boolean; error: string; records: ProcessDossier[] }>({ loading: true, error: "", records: [] });
  const [reports, setReports] = React.useState<Record<string, string> | null | undefined>(undefined);
  const [attempt, setAttempt] = React.useState(0);
  const tracksReports = definition?.key === "publicacion" || definition?.key === "visitas";
  React.useEffect(() => {
    let active = true;
    async function load() {
      setState({ loading: true, error: "", records: [] });
      try {
        const records = await loadAllDossiers<ProcessDossier>();
        if (active) setState({ loading: false, error: "", records });
      } catch (cause) { if (active) setState({ loading: false, error: errorMessage(cause), records: [] }); }
    }
    async function loadReports() {
      setReports(undefined);
      try { const r = await apiRequest<{ ultimos?: Record<string, string> }>("/api/admin/apps/runs?slug=informe-propietario&vista=ultimo-por-expediente"); if (active) setReports(r.ultimos ?? {}); }
      catch { if (active) setReports(null); }
    }
    if (definition) void load();
    if (tracksReports) void loadReports();
    return () => { active = false; };
  }, [stage, definition, attempt, tracksReports]);
  if (!definition) return <p role="alert">Esta vista del proceso no está disponible.</p>;
  const records = state.records.filter(record => !record.deleted_at && !!record.etapa && processPhase(record.etapa, record.flujo, today) === definition.key);
  return <div className="min-w-0 space-y-6">
    <PageHeader title={`${definition.numero}. ${definition.label}`} description={definition.hace} actions={<Link href={definition.action.href} className={btnPrimary}>{definition.action.label}</Link>} />
    <nav aria-label="Etapas del proceso de venta"><ol className="flex gap-2 overflow-x-auto pb-1">{PROCESS_STAGES.map(phase => <li key={phase.key}><Link href={`/admin/proceso/${phase.slug}`} aria-current={phase.key === definition.key ? "page" : undefined} className={`block whitespace-nowrap rounded-md border px-3 py-2 text-sm ${phase.key === definition.key ? "border-primary bg-primary/10 text-primary-ink" : "border-border text-muted-foreground hover:bg-secondary"}`}>{phase.numero}. {phase.label}</Link></li>)}</ol></nav>
    <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">¿Por qué?</h2>
      <p className="max-w-[75ch] text-sm leading-relaxed">{definition.para}</p>
      {definition.key === "cierre" && <p className="max-w-[75ch] text-sm leading-relaxed text-muted-foreground">Esta etapa reúne sus pasos: firma y pago, entrega, postventa y archivo. La guía de cada expediente distingue cada paso.</p>}
      {tracksReports && <p className="max-w-[75ch] text-sm leading-relaxed text-muted-foreground">El propietario recibe un informe mensual de consultas y avance. Se considera la fecha del último informe preparado en la app «Informe al propietario».</p>}
      <p className="text-sm text-muted-foreground">Se muestran únicamente expedientes disponibles para tu cuenta. Los compradores aparecen en «Visitas y ofertas» mientras buscan y negocian. Abrir esta vista no modifica la etapa.</p>
      <div className="flex flex-wrap gap-3"><Link href="/admin/expedientes" className={btnGhost}>Todas las operaciones</Link>{definition.action.href !== "/admin/tareas" && <Link href="/admin/tareas" className={btnGhost}>Ver tareas</Link>}</div>
    </section>
    {state.loading ? <p role="status" className="p-4 text-sm text-muted-foreground">Consultando expedientes…</p> : state.error ? <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4"><p>{state.error}</p><button type="button" className={btnGhost} onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div> : <section className="min-w-0 space-y-4"><p className="text-sm text-muted-foreground">{records.length} expediente{records.length === 1 ? "" : "s"} en esta etapa.</p>{records.length ? <ul className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label={`Expedientes en ${definition.label}`}>{records.map(record => <li key={record.id} className="min-w-0"><Link href={`/admin/expedientes?expediente=${encodeURIComponent(record.id)}`} className="flex min-h-24 min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"><FolderOpen className="mt-1 shrink-0 text-primary-ink" size={22} aria-hidden="true" /><span className="min-w-0 flex-1"><strong className="block break-words">{clients.find(c=>c.id===record.cliente_id)?.nombre ?? record.folio}</strong><span className="block text-sm text-muted-foreground">{record.folio}</span><span className="mt-1 block text-sm text-muted-foreground">{processStageText(record.etapa, record.flujo, today)} · {(EXPEDIENTE_OPERACIONES as Record<string, string>)[record.operacion ?? ""] ?? "Operación sin indicar"}</span><span className="mt-2 block text-sm text-muted-foreground">{record.fecha_objetivo ? `Fecha objetivo: ${formatDate(record.fecha_objetivo)}` : "Sin fecha objetivo"}</span>{tracksReports && ownerReportApplies(record.etapa, record.flujo) && <span className="mt-1 block text-sm">{reports ? reportText(reports[record.id], today) : reports === null ? "Informe al propietario: no se pudo consultar" : "Informe al propietario: consultando…"}</span>}</span><ArrowUpRight size={18} className="shrink-0" aria-hidden="true" /></Link></li>)}</ul> : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No hay expedientes en esta etapa dentro de tu alcance actual.</p>}</section>}
  </div>;
}
