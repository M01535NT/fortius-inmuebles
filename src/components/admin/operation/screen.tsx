"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button, EmptyBox, Notice, Surface, TabPanel, Tabs } from "@/components/admin/kit";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { apiRequest, db, fetchJson as json, useCollection, useSession, errorMessage } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isOwnerRoute, SALE_PROCESS, type SalePhase } from "@/lib/formatos/operation-workflow";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import type { OperationalInterview } from "@/lib/intake/interview";
import { flowOf, isGuided, routeStages, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { DocumentsTab } from "./documents-tab";
import { HistoryTab } from "./history-tab";
import { NextStepTab } from "./next-step";
import { SettingsTab } from "./settings-tab";
import { StageCard, StageCardCompact, StagesSheet } from "./stages";
import { useOperationDocuments } from "./use-documents";
import { useLeaveGuard, useOperation } from "./use-operation";
import s from "./operation.module.css";

/*
  Operación guiada (boceto C, aprobado por el titular el 17/10/2026). Encabezado en una línea,
  avance con «Ver etapas», y pestañas: Esta etapa · Expediente · Tareas · Historial · Ajustes.
  Los documentos se capturan en su propia ventana. La dirección conserva ?tab=documentos y
  ?documento=<id> para los enlaces que ya existen.
*/

const TABS = [
  { id: "sigue", label: "Esta etapa" }, { id: "documentos", label: "Expediente" }, { id: "tareas", label: "Tareas" },
  { id: "historial", label: "Historial" }, { id: "ajustes", label: "Ajustes" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const VERB: Record<string, string> = { captacion: "Vende", arrendador: "Renta su inmueble", compra: "Compra", arrendatario: "Busca una renta", inversion: "Invierte" };

export function OperationScreen({ id }: { id: string }) {
  const operation = useOperation(id);
  const { op, loadError, reload } = operation;
  if (op === undefined) return <p role="status" className="p-4 text-sm text-muted-foreground">Consultando la operación…</p>;
  if (op === null) return <div className="flex flex-col gap-4"><BackLink />{loadError ? <div role="alert" className="flex flex-wrap items-center gap-3"><span>{loadError}</span><Button onClick={reload}>Reintentar</Button></div> : <EmptyBox title="No encontramos esta operación">Puede que ya no exista o que no tengas acceso a ella.</EmptyBox>}</div>;
  return <OperationView key={op.id} op={op} operation={operation} />;
}

function OperationView({ op, operation }: { op: OperationRecord; operation: ReturnType<typeof useOperation> }) {
  const { setOp, all, save } = operation;
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const session = useSession();
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades), advisers = useCollection(db.asesores), tasks = useCollection(db.tareas);
  const today = operationalDate();
  const requested = params.get("tab") as TabId | null;
  const tab: TabId = TABS.some(t => t.id === requested) ? requested! : params.has("documento") ? "documentos" : "sigue";
  const [dirty, setDirty] = React.useState<Partial<Record<TabId, boolean>>>({});
  const anyDirty = Object.values(dirty).some(Boolean);
  useLeaveGuard(anyDirty);
  const [interview, setInterview] = React.useState<OperationalInterview | null>(null);
  const [me, setMe] = React.useState<string | undefined>(undefined);
  const [changes, setChanges] = React.useState(0);
  const [notice, setNotice] = React.useState("");
  const [stagesOpen, setStagesOpen] = React.useState<{ focus?: SalePhase } | null>(null);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ entrevistas?: OperationalInterview[] }>(`/api/admin/entrevistas?expedienteId=${encodeURIComponent(op.id)}`).then(r => { if (alive) setInterview((r.entrevistas ?? []).find(i => i.estado === "completada") ?? null); }).catch(() => { if (alive) setInterview(null); });
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => { if (alive) setMe(r.asesorId ?? undefined); }).catch(() => undefined);
    return () => { alive = false; };
  }, [op.id]);

  const client = clients.find(c => c.id === op.cliente_id);
  const property = properties.find(p => p.slug === op.propiedad_slug);
  const adviser = advisers.find(a => a.id === op.asesor_id);
  const checklist = tasks.find(t => t.id === checklistTaskId(op.id));
  const flow = flowOf(op);
  const docs = useOperationDocuments({ op, checklist, interviewAnswers: (interview?.respuestas ?? {}) as Record<string, unknown>, cliente: client?.nombre });
  const view: OperationRecord = { ...op, inicial: {
    iniciada: !!docs.latest("02"), emitida: docs.status("02") === "terminado",
    levantamiento: docs.latest("04") ? (docs.status("04") === "terminado" ? "emitido" : "borrador") : undefined,
    documentos: checklist ? (checklist.pasos.length > 0 && checklist.pasos.every(p => p.hecho) ? "completo" : "pendiente") : undefined,
  } };
  const { phase } = routeStages(view, today);
  const track = stageTrack(view, today);
  const markDirty = React.useMemo(() => Object.fromEntries(TABS.map(t => [t.id, (value: boolean) => setDirty(old => old[t.id] === value ? old : { ...old, [t.id]: value })])) as Record<TabId, (value: boolean) => void>, []);

  // ?documento=<id> abre ese documento en su ventana una sola vez.
  const opened = React.useRef(false);
  const wanted = params.get("documento");
  React.useEffect(() => {
    if (opened.current || !wanted || !docs.documents) return;
    const doc = docs.documents.find(d => d.id === wanted);
    if (doc) { opened.current = true; docs.openDocument(doc); }
  }, [wanted, docs]);

  async function changeTab(next: TabId) {
    if (next === tab) return true;
    if (dirty[tab] && !await confirmAction("Hay cambios sin guardar en esta pestaña. ¿Descartarlos y cambiar de pestaña?")) return false;
    setDirty(old => ({ ...old, [tab]: false }));
    const query = new URLSearchParams(params.toString()); query.delete("documento");
    if (next === "sigue") query.delete("tab"); else query.set("tab", next);
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
    return true;
  }
  async function saveAndTrack(changesToSave: Parameters<typeof save>[1]) {
    const saved = await save(op, changesToSave);
    setChanges(n => n + 1);
    return saved;
  }
  async function changeLifecycle(remove: boolean) {
    const result = await json<{ expediente: OperationRecord }>(`/api/admin/expedientes/${op.id}`, { method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: op.version }) });
    setOp(result.expediente); setDirty({}); setChanges(n => n + 1);
    setNotice(remove ? "Operación eliminada. Puedes restaurarla aquí o desde «Operaciones eliminadas»." : "Operación restaurada.");
  }

  const laterPhase = !!phase && SALE_PROCESS.findIndex(p => p.key === phase) >= 2;
  const price = laterPhase && property?.precio.modalidad === "publico" && property.precio.monto ? `Precio de salida ${money(property.precio.monto)} ${property.precio.moneda}`
    : interview?.respuestas.presupuestoEstado === "conocido" && interview.respuestas.importe ? `${isOwnerRoute(flow.ruta) ? "Espera" : "Presupuesto"} ${money(Number(interview.respuestas.importe))} ${interview.respuestas.moneda ?? ""}`.trim() : null;
  const reviewer = advisers.find(a => a.id === me)?.nombre ?? session?.name ?? session?.email ?? "";
  const docsCount = docs.list.length, taskCount = tasks.filter(t => t.expedienteId === op.id && !["completada", "cancelada"].includes(t.estado)).length;
  const verb = isGuided(op) ? VERB[flow.ruta] : EXPEDIENTE_OPERACIONES[op.operacion as keyof typeof EXPEDIENTE_OPERACIONES] ?? op.operacion;
  const facts = [verb, property?.titulo ?? (op.propiedad_slug ? "Inmueble no disponible" : "Sin inmueble vinculado"), price, adviser ? `Responsable ${adviser.nombre}` : "Sin responsable"].filter(Boolean);
  const stageName = track.stages[track.current]?.label;

  return <Surface className="-mx-4 -mt-5 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-6">
    <header className="mb-5 flex flex-col gap-1">
      <BackLink stage={phase ? SALE_PROCESS.find(p => p.key === phase)?.slug : undefined} />
      <h1 className="m-0 [overflow-wrap:anywhere]">{client?.nombre ?? op.folio}</h1>
      <p className="text-[0.9375rem] text-muted-foreground [overflow-wrap:anywhere]">{facts.join(" · ")} · <span className="font-mono text-[0.8125rem]">{op.folio}</span></p>
    </header>
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}
    {op.deleted_at ? <Notice title="Esta operación está eliminada" actions={<Button variant="primary" onClick={() => void changeLifecycle(false).catch(cause => setNotice(errorMessage(cause)))}>Restaurar operación</Button>}>Sus documentos, PDF y tareas se conservan. Restáurala para seguir trabajando en ella.</Notice> : <>
      {isGuided(op) && <div className="mb-5">
        <div className="hidden lg:block"><StageCard op={view} today={today} docs={docs} checklist={checklist} onOpenStages={focus => setStagesOpen({ focus })} /></div>
        <div className="lg:hidden"><StageCardCompact op={view} today={today} docs={docs} onOpenStages={() => setStagesOpen({})} /></div>
      </div>}
      <div className="mb-5"><Tabs idPrefix="operacion" label="Secciones de la operación" value={tab} onChange={id => void changeTab(id)} items={TABS.map(t => ({ id: t.id, label: t.label, ...(t.id === "documentos" ? { count: docsCount } : t.id === "tareas" ? { count: taskCount } : {}) }))} /></div>
      <TabPanel idPrefix="operacion" id={tab} className="min-w-0">
        {tab === "sigue" && <NextStepTab key={op.id} op={view} today={today} docs={docs} checklist={checklist}
          evidence={{ documents: docs.list, interview: interview ? { id: interview.id, version: interview.version } : null, reviewer }} interview={interview}
          onSave={saveAndTrack} onSavedLegacy={value => { setOp(value); setChanges(n => n + 1); }} onGoTo={next => void changeTab(next)} onDirtyChange={markDirty.sigue} />}
        {tab === "documentos" && <DocumentsTab op={op} docs={docs} />}
        {tab === "tareas" && <RelatedWork expedienteId={op.id} clienteId={op.cliente_id} propertySlug={op.propiedad_slug ?? undefined} />}
        {tab === "historial" && <HistoryTab operationId={op.id} refresh={changes} onDirtyChange={markDirty.historial} />}
        {tab === "ajustes" && <SettingsTab key={op.version} op={op} all={all} today={today} onSave={saveAndTrack} onRemove={() => changeLifecycle(true)} onDirtyChange={markDirty.ajustes} />}
      </TabPanel>
    </>}
    {stagesOpen && isGuided(op) && <StagesSheet op={view} today={today} docs={docs} checklist={checklist} focus={stagesOpen.focus} onClose={() => setStagesOpen(null)} />}
    {docs.capture({ cliente: client?.nombre, inmueble: property?.titulo, etapa: stageName })}
  </Surface>;
}

function BackLink({ stage }: { stage?: string }) {
  return <Link href={stage ? `/admin/operaciones?etapa=${stage}` : "/admin/operaciones"} className={s.back}><ChevronLeft size={18} aria-hidden="true" />Operaciones</Link>;
}
