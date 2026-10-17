"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button, EmptyBox, Notice, StageProgress, Surface, TabPanel, Tabs } from "@/components/admin/kit";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { apiRequest, db, errorMessage, fetchJson as json, useCollection, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import type { OperationalInterview } from "@/lib/intake/interview";
import { flowOf, isGuided, routeStages, type OperationRecord } from "@/lib/admin/operation-view";
import { DocumentsTab, type Documento } from "./documents-tab";
import { HistoryTab } from "./history-tab";
import { NextStepTab } from "./next-step";
import type { Emision } from "./formato-capture";
import { latestInterview, latestSurvey } from "./initial-interview";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { SettingsTab } from "./settings-tab";
import { useLeaveGuard, useOperation } from "./use-operation";
import s from "./operation.module.css";

/*
  Operación guiada (lienzo: OperacionEscritorio* y OperacionMovil*). Encabezado,
  avance de etapas y pestañas: Lo que sigue · Documentos · Tareas · Historial · Ajustes.
*/

const TABS = [
  { id: "sigue", label: "Lo que sigue" }, { id: "documentos", label: "Documentos" }, { id: "tareas", label: "Tareas" },
  { id: "historial", label: "Historial" }, { id: "ajustes", label: "Ajustes" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

export function OperationScreen({ id }: { id: string }) {
  const { op, setOp, all, loadError, reload, save } = useOperation(id);
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const session = useSession();
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades), advisers = useCollection(db.asesores), tasks = useCollection(db.tareas);
  const today = operationalDate();
  const requested = params.get("tab") as TabId | null;
  const tab: TabId = TABS.some(t => t.id === requested) ? requested! : params.has("documento") ? "documentos" : "sigue";
  const [dirty, setDirty] = React.useState<Partial<Record<TabId, boolean>>>({});
  const anyDirty = Object.values(dirty).some(Boolean);
  useLeaveGuard(anyDirty);
  const [documents, setDocuments] = React.useState<Documento[]>([]);
  const [interview, setInterview] = React.useState<OperationalInterview | null>(null);
  const [me, setMe] = React.useState<string | undefined>(undefined);
  const [changes, setChanges] = React.useState(0);
  const [notice, setNotice] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ documentos?: Documento[] }>(`/api/admin/expedientes/${id}/formatos`).then(r => { if (alive) setDocuments(r.documentos ?? []); }).catch(() => { if (alive) setDocuments([]); });
    apiRequest<{ entrevistas?: OperationalInterview[] }>(`/api/admin/entrevistas?expedienteId=${encodeURIComponent(id)}`).then(r => { if (alive) setInterview((r.entrevistas ?? []).find(i => i.estado === "completada") ?? null); }).catch(() => { if (alive) setInterview(null); });
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => { if (alive) setMe(r.asesorId ?? undefined); }).catch(() => undefined);
    return () => { alive = false; };
  }, [id]);
  // Borrador más reciente de cada formato del avance del propietario (01, 02, 04, 05–10) y sus PDF.
  const interview02 = latestInterview(documents), survey04 = latestSurvey(documents);
  const tracked = [interview02, survey04, ...["01", "05", "06", "07", "08", "09", "10"].map(f => documents.filter(d => d.formato_id === f).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0])].flatMap(d => d ? [d.id] : []);
  const [emissions, addEmission] = useEmissions(tracked);
  const emissions02 = interview02 ? emissions[interview02.id] ?? [] : [], emissions04 = survey04 ? emissions[survey04.id] ?? [] : [];
  const markDirty = React.useMemo(() => Object.fromEntries(TABS.map(t => [t.id, (value: boolean) => setDirty(old => old[t.id] === value ? old : { ...old, [t.id]: value })])) as Record<TabId, (value: boolean) => void>, []);

  async function changeTab(next: TabId) {
    if (next === tab) return;
    if (dirty[tab] && !await confirmAction("Hay cambios sin guardar en esta pestaña. ¿Descartarlos y cambiar de pestaña?")) return;
    setDirty(old => ({ ...old, [tab]: false }));
    const query = new URLSearchParams(params.toString()); query.delete("documento");
    if (next === "sigue") query.delete("tab"); else query.set("tab", next);
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  }
  async function saveAndTrack(changesToSave: Parameters<typeof save>[1]) {
    if (!op) throw new Error("La operación no está disponible.");
    const saved = await save(op, changesToSave);
    setChanges(n => n + 1);
    return saved;
  }
  async function changeLifecycle(remove: boolean) {
    if (!op) return;
    const result = await json<{ expediente: OperationRecord }>(`/api/admin/expedientes/${op.id}`, { method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: op.version }) });
    setOp(result.expediente); setDirty({}); setChanges(n => n + 1);
    setNotice(remove ? "Operación eliminada. Puedes restaurarla aquí o desde «Operaciones eliminadas»." : "Operación restaurada.");
  }

  if (op === undefined) return <p role="status" className="p-4 text-sm text-muted-foreground">Consultando la operación…</p>;
  if (op === null) return <div className="flex flex-col gap-4"><BackLink />{loadError ? <div role="alert" className="flex flex-wrap items-center gap-3"><span>{loadError}</span><Button onClick={reload}>Reintentar</Button></div> : <EmptyBox title="No encontramos esta operación">Puede que ya no exista o que no tengas acceso a ella.</EmptyBox>}</div>;

  const checklist = tasks.find(t => t.id === checklistTaskId(op.id));
  const view: OperationRecord = { ...op, inicial: {
    iniciada: !!interview02, emitida: !!interview02 && emissions02.some(e => e.draft_version === interview02.version),
    levantamiento: survey04 ? (emissions04.some(e => e.draft_version === survey04.version) ? "emitido" : "borrador") : undefined,
    documentos: checklist ? (checklist.pasos.length > 0 && checklist.pasos.every(p => p.hecho) ? "completo" : "pendiente") : undefined,
  } };
  const flow = flowOf(op);
  const client = clients.find(c => c.id === op.cliente_id);
  const property = properties.find(p => p.slug === op.propiedad_slug);
  const adviser = advisers.find(a => a.id === op.asesor_id);
  const { labels, current, phase } = routeStages(view, today);
  const laterPhase = !!phase && SALE_PROCESS.findIndex(p => p.key === phase) >= 2;
  const price = laterPhase && property?.precio.modalidad === "publico" && property.precio.monto ? { label: "Precio de salida", value: `${money(property.precio.monto)} ${property.precio.moneda}` }
    : interview?.respuestas.presupuestoEstado === "conocido" && interview.respuestas.importe ? { label: flow.ruta === "captacion" || flow.ruta === "arrendador" ? "Precio que espera" : "Presupuesto", value: `${money(Number(interview.respuestas.importe))} ${interview.respuestas.moneda ?? ""}`.trim() } : null;
  const reviewer = advisers.find(a => a.id === me)?.nombre ?? session?.name ?? session?.email ?? "";
  const docsCount = documents.length, taskCount = tasks.filter(t => t.expedienteId === op.id && !["completada", "cancelada"].includes(t.estado)).length;

  return <Surface className="-mx-4 -mt-5 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    <header className="mb-6 flex flex-col gap-2">
      <BackLink stage={phase ? SALE_PROCESS.find(p => p.key === phase)?.slug : undefined} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="m-0 [overflow-wrap:anywhere]">{client?.nombre ?? op.folio}</h1>
        <span className={s.mono}>{op.folio}</span>
      </div>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
        <span>{property?.titulo ?? (op.propiedad_slug ? "Inmueble no disponible" : "Sin inmueble vinculado")}</span>
        {price && <span>{price.label} <strong className="font-mono text-foreground">{price.value}</strong></span>}
        <span>Responsable <strong className="text-foreground">{adviser?.nombre ?? "Sin asignar"}</strong></span>
      </p>
    </header>
    {notice && <p role="status" className="mb-4 text-sm">{notice}</p>}
    {op.deleted_at ? <Notice title="Esta operación está eliminada" actions={<Button variant="primary" onClick={() => void changeLifecycle(false).catch(cause => setNotice(errorMessage(cause)))}>Restaurar operación</Button>}>Sus documentos, PDF y tareas se conservan. Restáurala para seguir trabajando en ella.</Notice> : <>
      {isGuided(op) && <div className="mb-6">
        <div className="hidden lg:block"><StageProgress stages={labels} current={current + 1} /></div>
        <div className="lg:hidden"><StageProgress compact stages={labels} current={current + 1} /></div>
      </div>}
      <div className="mb-5"><Tabs idPrefix="operacion" label="Secciones de la operación" value={tab} onChange={id => void changeTab(id)} items={TABS.map(t => ({ id: t.id, label: t.label, ...(t.id === "documentos" ? { count: docsCount } : t.id === "tareas" ? { count: taskCount } : {}) }))} /></div>
      <TabPanel idPrefix="operacion" id={tab} className="min-w-0">
        {tab === "sigue" && <NextStepTab key={op.id} op={view} today={today} cliente={client?.nombre}
          initial={{ documents, emissions, checklist, onDocumentsChange: setDocuments, onEmitted: addEmission, onOpenDocument: documentId => router.replace(`${pathname}?tab=documentos&documento=${encodeURIComponent(documentId)}`, { scroll: false }) }} evidence={{ documents, interview: interview ? { id: interview.id, version: interview.version } : null, reviewer }} interview={interview} onSave={saveAndTrack} onSavedLegacy={value => { setOp(value); setChanges(n => n + 1); }} onGoTo={next => void changeTab(next === "documentos" ? "documentos" : next)} onDirtyChange={markDirty.sigue} />}
        {tab === "documentos" && <div className="flex flex-col gap-5">
          <InterviewAccess key={op.id} expedienteId={op.id} clienteId={op.cliente_id} intencion={flow.ruta === "inversion" ? "invertir" : op.operacion === "renta" ? (flow.ruta === "arrendatario" ? "rentar" : "arrendar") : flow.ruta === "compra" ? "comprar" : "vender"} disabled={anyDirty} />
          <DocumentsTab op={op} documents={documents} onDocumentsChange={setDocuments} initialDocument={params.get("documento")} onDirtyChange={markDirty.documentos} />
        </div>}
        {tab === "tareas" && <RelatedWork expedienteId={op.id} clienteId={op.cliente_id} propertySlug={op.propiedad_slug ?? undefined} />}
        {tab === "historial" && <HistoryTab operationId={op.id} refresh={changes} onDirtyChange={markDirty.historial} />}
        {tab === "ajustes" && <SettingsTab key={op.version} op={op} all={all} today={today} onSave={saveAndTrack} onRemove={() => changeLifecycle(true)} onDirtyChange={markDirty.ajustes} />}
      </TabPanel>
    </>}
  </Surface>;
}

/** PDF emitidos de cada borrador seguido; se consultan una vez por borrador. */
function useEmissions(drafts: string[]): [Record<string, Emision[]>, (draft: string, emision: Emision) => void] {
  const [loaded, setLoaded] = React.useState<Record<string, Emision[]>>({});
  const key = drafts.join(",");
  React.useEffect(() => {
    let alive = true;
    for (const draft of key ? key.split(",") : []) {
      apiRequest<{ emisiones?: Emision[] }>(`/api/admin/formatos/${draft}`).then(r => { if (alive) setLoaded(old => ({ ...old, [draft]: r.emisiones ?? [] })); }).catch(() => { if (alive) setLoaded(old => ({ ...old, [draft]: [] })); });
    }
    return () => { alive = false; };
  }, [key]);
  return [loaded, (draft, emision) => setLoaded(old => ({ ...old, [draft]: [emision, ...(old[draft] ?? [])] }))];
}

function BackLink({ stage }: { stage?: string }) {
  return <Link href={stage ? `/admin/operaciones?etapa=${stage}` : "/admin/operaciones"} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-foreground no-underline"><ChevronLeft size={18} aria-hidden="true" />Operaciones</Link>;
}


