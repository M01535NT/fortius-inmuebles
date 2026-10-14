"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { apiRequest, db, useCollection, errorMessage } from "@/lib/admin/store";
import { stageLabel, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";
import { PageHeader, btnGhost, btnPrimary } from "@/components/admin/ui";
import { getProcessStage } from "./module-catalog";

type ProcessDossier = { cliente_id?: string; id: string; folio: string; etapa?: keyof typeof EXPEDIENTE_ETAPAS | null; operacion?: string; fecha_objetivo?: string | null; deleted_at?: string | null; flujo?:OperationWorkflow|null };
export function ProcessStageWorkspace({ stage }: { stage: string }) {
  const definition = getProcessStage(stage);
  const clients = useCollection(db.clientes);
  const [state, setState] = React.useState<{ loading: boolean; error: string; records: ProcessDossier[] }>({ loading: true, error: "", records: [] });
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    async function load() {
      setState({ loading: true, error: "", records: [] });
      try {
        const records: ProcessDossier[] = []; let offset: number | null = 0;
        while (offset !== null) {
          const page: { expedientes: ProcessDossier[]; nextOffset: number | null } = await apiRequest(`/api/admin/expedientes?limit=200&offset=${offset}`);
          if (!active) return;
          if (!Array.isArray(page.expedientes) || (page.nextOffset !== null && (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset || page.nextOffset > 100000))) throw new Error("No se pudo completar la consulta de expedientes. Vuelve a intentarlo.");
          records.push(...page.expedientes); offset = page.nextOffset;
        }
        if (active) setState({ loading: false, error: "", records });
      } catch (cause) { if (active) setState({ loading: false, error: errorMessage(cause), records: [] }); }
    }
    if (definition) void load();
    return () => { active = false; };
  }, [stage, definition, attempt]);
  if (!definition) return <p role="alert">Esta vista del procedimiento no está disponible.</p>;
  const records = state.records.filter(record => !record.deleted_at && (record.etapa === definition.etapa || stage==="postventa"&&["entrega","postventa"].includes(record.etapa??"")));
  return <div className="min-w-0 space-y-6">
    <PageHeader title={definition.label} description={definition.description} actions={<Link href={definition.action.href} className={btnPrimary}>{definition.action.label}</Link>} />
    <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{stage === "postventa" ? "Entrega, postventa y archivo" : `Etapa registrada: ${EXPEDIENTE_ETAPAS[definition.etapa]}`}</h2>
      {stage === "postventa" && <p className="max-w-[75ch] text-sm leading-relaxed text-muted-foreground">Esta vista reúne entrega, postventa y expedientes cerrados. La guía distingue la firma y el pago de la entrega y del archivo final.</p>}
      <p className="text-sm text-muted-foreground">Se muestran únicamente expedientes disponibles para tu cuenta. La etapa se conserva tal como está registrada; abrir esta vista no la modifica.</p>
      <div className="flex flex-wrap gap-3"><Link href="/admin/expedientes" className={btnGhost}>Todas las operaciones</Link>{definition.action.href !== "/admin/tareas" && <Link href="/admin/tareas" className={btnGhost}>Ver tareas</Link>}</div>
    </section>
    {state.loading ? <p role="status" className="p-4 text-sm text-muted-foreground">Consultando expedientes…</p> : state.error ? <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4"><p>{state.error}</p><button type="button" className={btnGhost} onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div> : <section className="min-w-0 space-y-4"><p className="text-sm text-muted-foreground">{records.length} expediente{records.length === 1 ? "" : "s"} en esta vista.</p>{records.length ? <ul className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label={`Expedientes en ${definition.label}`}>{records.map(record => <li key={record.id} className="min-w-0"><Link href={`/admin/expedientes?expediente=${encodeURIComponent(record.id)}`} className="flex min-h-24 min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"><FolderOpen className="mt-1 shrink-0 text-primary-ink" size={22} aria-hidden="true" /><span className="min-w-0 flex-1"><strong className="block break-words">{clients.find(c=>c.id===record.cliente_id)?.nombre ?? record.folio}</strong><span className="block text-sm text-muted-foreground">{record.folio}</span><span className="mt-1 block text-sm text-muted-foreground">{record.flujo?stageLabel(record.etapa??"captacion",record.flujo.ruta):EXPEDIENTE_ETAPAS[record.etapa??definition.etapa]} · {({ venta: "Venta", renta: "Renta", inversion: "Inversión", administracion: "Administración", otra: "Otra operación" } as Record<string, string>)[record.operacion ?? ""] ?? "Operación sin indicar"}</span><span className="mt-2 block text-sm text-muted-foreground">{record.fecha_objetivo ? `Fecha objetivo: ${record.fecha_objetivo.split("-").reverse().join("/")}` : "Sin fecha objetivo"}</span></span><ArrowUpRight size={18} className="shrink-0" aria-hidden="true" /></Link></li>)}</ul> : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No hay expedientes en esta etapa dentro de tu alcance actual.</p>}</section>}
  </div>;
}
