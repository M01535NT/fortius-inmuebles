"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, FileText, History, ListChecks, Settings2, Trash2, Upload } from "@/components/admin/icons";
import { Button, Notice, Segmented, Sheet, Surface, TabPanel, Tabs } from "@/components/admin/kit";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { confirmAction, confirmDeleteOperation } from "@/components/admin/workspace/confirm";
import { apiRequest, db, fetchJson as json, useCollection, useSession, errorMessage } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isOwnerRoute, ownerProcess, type SalePhase } from "@/lib/formatos/operation-workflow";
import { EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import type { OperationalInterview } from "@/lib/intake/interview";
import { conditionOf } from "@/lib/intake/condition";
import { flowOf, initialStatus, isGuided, operationTags, routeStages, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { checklistTaskId } from "@/lib/formatos/checklist-documentos";
import { TIPO_LABELS } from "@/data/propiedades";
import { ClientDocumentsTab } from "./client-documents-tab";
import { DocumentsTab } from "./documents-tab";
import { HistoryTab } from "./history-tab";
import { NextStepTab } from "./next-step";
import { SettingsTab } from "./settings-tab";
import { initialsOf, StagePanel, StagesSheet } from "./stages";
import { useOperationDocuments } from "./use-documents";
import { useLeaveGuard, useOperation } from "./use-operation";
import s from "./operation.module.css";

/*
  Una operación (boceto D «Moderno», LV-06, construido el 31/10/2026 con las reglas de LV-08):
  pantalla partida. A la izquierda el panel azul (quién, número de etapa, las diez etapas como
  barras y la persona con Llamar y WhatsApp); a la derecha las piezas de la etapa (documentos,
  próxima tarea, confirmaciones e inmueble) y, abajo, la barra flotante con lo que toca y un solo
  botón. La operación tiene tres partes (SIM-18, 11/11/2026): «Etapa», «Documentos» (los del
  expediente y los que entrega el cliente) y «Actividad» (tareas e historial); en las dos últimas
  el panel azul va compacto con la lista de partes. Los datos de la operación (ruta, situación,
  inmueble, contraparte y decisión del encargo), corregir la etapa y eliminar viven en «Más
  opciones» del panel (DEC-37, DEC-38). Los documentos se capturan en su propia ventana. Las
  direcciones anteriores siguen funcionando: ?tab=cliente abre Documentos, ?tab=tareas y
  ?tab=historial abren Actividad, ?tab=ajustes abre los datos de la operación.
*/

const TABS = [
  { id: "sigue", label: "Etapa", icon: ListChecks }, { id: "documentos", label: "Documentos", icon: FileText }, { id: "actividad", label: "Actividad", icon: History },
] as const;
type TabId = (typeof TABS)[number]["id"];
/** Direcciones anteriores (seis pestañas) llevadas a las tres partes. */
const LEGACY_TAB: Record<string, TabId> = { cliente: "documentos", tareas: "actividad", historial: "actividad" };
type DirtyKey = TabId | "ajustes";
const DIRTY_KEYS: DirtyKey[] = ["sigue", "documentos", "actividad", "ajustes"];
/** «vende su casa», «renta su departamento», «invierte». */
const VERB: Record<string, string> = { captacion: "vende", arrendador: "renta", compra: "compra", arrendatario: "busca una renta", inversion: "invierte" };

export function OperationScreen({ id }: { id: string }) {
  const operation = useOperation(id);
  const { op, loadError, reload } = operation;
  if (op === undefined) return <p role="status" className="p-4 text-sm text-muted-foreground">Consultando la operación…</p>;
  if (op === null) return <div className="flex flex-col gap-4"><BackLink />{loadError ? <div role="alert" className="flex flex-wrap items-center gap-3"><span>{loadError}</span><Button onClick={reload}>Reintentar</Button></div> : <p className="text-sm text-muted-foreground">No encontramos esta operación.</p>}</div>;
  return <OperationView key={op.id} op={op} operation={operation} />;
}

function OperationView({ op, operation }: { op: OperationRecord; operation: ReturnType<typeof useOperation> }) {
  const { setOp, all, save } = operation;
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const session = useSession();
  const clients = useCollection(db.clientes), properties = useCollection(db.propiedades), advisers = useCollection(db.asesores), tasks = useCollection(db.tareas);
  const today = operationalDate();
  const requested = params.get("tab");
  const tab: TabId = TABS.some(t => t.id === requested) ? requested as TabId : requested && LEGACY_TAB[requested] ? LEGACY_TAB[requested] : params.has("documento") ? "documentos" : "sigue";
  // Documentos: los del expediente o los que entrega el cliente (titular, 29/10/2026).
  const [docKind, setDocKind] = React.useState<"expediente" | "cliente">(requested === "cliente" ? "cliente" : "expediente");
  // «Agregar documento»: los archivos elegidos pasan a los documentos del cliente, que los sube uno por uno.
  const addFile = React.useRef<HTMLInputElement>(null);
  const [incoming, setIncoming] = React.useState<{ files: File[]; n: number } | undefined>();
  // Datos de la operación: se abren desde «Más opciones»; ?tab=ajustes los abre al llegar.
  const [settings, setSettings] = React.useState(requested === "ajustes");
  const [dirty, setDirty] = React.useState<Partial<Record<DirtyKey, boolean>>>({});
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
  const view: OperationRecord = { ...op, inicial: initialStatus(new Map(["02", "04"].filter(f => docs.latest(f)).map(f => [f, docs.status(f) === "terminado"])), checklist) };
  const { phase } = routeStages(view, today);
  const track = stageTrack(view, today);
  const markDirty = React.useMemo(() => Object.fromEntries(DIRTY_KEYS.map(key => [key, (value: boolean) => setDirty(old => old[key] === value ? old : { ...old, [key]: value })])) as Record<DirtyKey, (value: boolean) => void>, []);

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
  /** La etapa manda a otra parte con los nombres de antes (documentos, cliente, tareas, ajustes). */
  function goTo(place: "documentos" | "ajustes" | "tareas" | "cliente") {
    if (place === "ajustes") { setSettings(true); return; }
    if (place !== "tareas") setDocKind(place === "cliente" ? "cliente" : "expediente");
    void changeTab(place === "tareas" ? "actividad" : "documentos");
  }
  async function closeSettings() {
    if (dirty.ajustes && !await confirmAction("Hay cambios sin guardar en los datos de la operación. ¿Descartarlos?")) return;
    setDirty(old => ({ ...old, ajustes: false })); setSettings(false);
    if (params.get("tab") === "ajustes") { const query = new URLSearchParams(params.toString()); query.delete("tab"); router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false }); }
  }
  async function saveAndTrack(changesToSave: Parameters<typeof save>[1]) {
    const saved = await save(op, changesToSave);
    setChanges(n => n + 1);
    return saved;
  }
  /** Eliminar desde «Más opciones»: pide confirmar en su ventana y no pierde cambios sin guardar. */
  async function removeFromPanel() {
    if (anyDirty) { setNotice("Guarda o descarta los cambios antes de eliminar la operación."); return; }
    if (!await confirmDeleteOperation(op.folio, client?.nombre)) return;
    await changeLifecycle(true).catch(cause => setNotice(errorMessage(cause)));
  }
  async function changeLifecycle(remove: boolean) {
    const result = await json<{ expediente: OperationRecord }>(`/api/admin/expedientes/${op.id}`, { method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: op.version }) });
    setOp(result.expediente); setDirty({}); setChanges(n => n + 1);
    setNotice(remove ? "Operación eliminada. Puedes restaurarla aquí o desde «Operaciones eliminadas»." : "Operación restaurada.");
  }

  const reviewer = advisers.find(a => a.id === me)?.nombre ?? session?.name ?? session?.email ?? "";
  const docsCount = docs.list.length, taskCount = tasks.filter(t => t.expedienteId === op.id && !["completada", "cancelada"].includes(t.estado)).length;
  const verb = isGuided(op) ? VERB[flow.ruta] : (EXPEDIENTE_OPERACIONES[op.operacion as keyof typeof EXPEDIENTE_OPERACIONES] ?? op.operacion).toLowerCase();
  const thing = property && TIPO_LABELS[property.tipo] ? `su ${TIPO_LABELS[property.tipo].toLowerCase()}` : isOwnerRoute(flow.ruta) ? "su inmueble" : "";
  const wants = [verb, isOwnerRoute(flow.ruta) ? thing : ""].filter(Boolean).join(" ");
  const stageName = track.stages[track.current]?.label;
  // COR-14: la situación (con su motivo) y la condición de la llamada (con lo que contó).
  const condition = conditionOf(interview?.respuestas);
  const tags = operationTags(op, condition).map(text => ({ text, detail: text === condition?.text ? condition.detail : flow.motivo || undefined }));
  const digits = (client?.telefono ?? "").replace(/\D/g, "");
  const role = isOwnerRoute(flow.ruta) ? "Propietario" : flow.ruta === "inversion" ? "Inversionista" : flow.ruta === "arrendatario" ? "Arrendatario" : "Comprador";
  const tabItems = TABS.map(t => ({ id: t.id, label: t.label, icon: <t.icon size={18} aria-hidden="true" />, ...(t.id === "documentos" ? { count: docsCount } : t.id === "actividad" ? { count: taskCount } : {}) }));
  const menu = [
    { label: "Datos de la operación", icon: <Settings2 size={16} aria-hidden="true" />, onSelect: () => setSettings(true) },
    ...(isGuided(op) && op.etapa && op.etapa !== "captacion" ? [{ label: "Corregir etapa", icon: <ChevronLeft size={16} aria-hidden="true" />, onSelect: () => setSettings(true) }] : []),
    { label: "Eliminar operación", icon: <Trash2 size={16} aria-hidden="true" />, onSelect: () => void removeFromPanel() },
  ];
  const back = phase ? `/admin/operaciones?etapa=${ownerProcess(op.flujo?.ruta).find(p => p.key === phase)?.slug ?? ""}` : "/admin/operaciones";
  const tabs = <Tabs orientation={tab === "sigue" ? "horizontal" : "vertical"} className={tab === "sigue" ? s.footTabs : s.navyTabs} idPrefix="operacion" label="Secciones de la operación" value={tab} onChange={id => void changeTab(id)} items={tabItems} />;

  return <Surface className={s.screen}>
    {notice && <p role="status" className="mb-3 text-sm">{notice}</p>}
    {op.deleted_at ? <div className="flex flex-col gap-4"><BackLink /><Notice title="Esta operación está eliminada" actions={<Button variant="primary" onClick={() => void changeLifecycle(false).catch(cause => setNotice(errorMessage(cause)))}>Restaurar operación</Button>}>Sus documentos, PDF y tareas se conservan. Restáurala para seguir trabajando en ella.</Notice></div> : <>
    {["compra", "arrendatario"].includes(op.flujo?.ruta ?? "") && <div className="mb-4"><Notice title="Operación histórica">Operación de comprador o arrendatario anterior al cambio; se conserva completa. Los interesados nuevos van en Contactos.</Notice></div>}
    <div className={s.split}>
      <StagePanel op={view} today={today} docs={docs} checklist={checklist} compact={tab !== "sigue"} back={back}
        who={{ name: client?.nombre ?? op.folio, wants, href: client ? `/admin/clientes/${encodeURIComponent(client.id)}` : undefined }}
        tags={tags}
        person={client ? { name: client.nombre, role, digits, email: client.email, href: `/admin/clientes/${encodeURIComponent(client.id)}` } : undefined}
        onOpenStages={focus => setStagesOpen({ focus })} menu={menu}>
        {tab !== "sigue" && tabs}
      </StagePanel>
      <div className={s.main}>
        {tab === "sigue" && <div data-tour="operacion-pestanas" className={s.foot}>
          {tabs}
          <span className={s.footWho}>{adviser ? <><span className={s.footAvatar} aria-hidden="true">{initialsOf(adviser.nombre)}</span>Responsable {adviser.nombre}</> : "Sin responsable"}</span>
        </div>}
        <TabPanel idPrefix="operacion" id={tab} className="min-w-0">
          {tab === "sigue" && <NextStepTab key={op.id} op={view} today={today} docs={docs} checklist={checklist} property={property}
            evidence={{ documents: docs.list, interview: interview ? { id: interview.id, version: interview.version } : null, reviewer, expedienteId: op.id }} interview={interview}
            onSave={saveAndTrack} onSavedLegacy={value => { setOp(value); setChanges(n => n + 1); }} onGoTo={goTo} onDirtyChange={markDirty.sigue} />}
          {tab === "documentos" && <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Qué documentos ver" value={docKind} onChange={setDocKind} options={[{ id: "expediente", label: "Del expediente" }, { id: "cliente", label: "Del cliente" }]} />
              <Button variant="primary" onClick={() => addFile.current?.click()}><Upload size={16} aria-hidden="true" />Agregar documento</Button>
              {/* Escrituras, predial, identificaciones, certificados…: desde la computadora o, en el celular, también con la cámara. */}
              <input ref={addFile} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" aria-label="Elegir documentos del cliente" tabIndex={-1}
                onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) { setIncoming(old => ({ files, n: (old?.n ?? 0) + 1 })); setDocKind("cliente"); } }} />
            </div>
            {docKind === "expediente" ? <DocumentsTab op={op} docs={docs} /> : <ClientDocumentsTab operationId={op.id} incoming={incoming} />}
          </div>}
          {tab === "actividad" && <div className="flex min-w-0 flex-col gap-5">
            <RelatedWork expedienteId={op.id} clienteId={op.cliente_id} propertySlug={op.propiedad_slug ?? undefined} />
            <HistoryTab operationId={op.id} refresh={changes} onDirtyChange={markDirty.actividad} />
          </div>}
        </TabPanel>
      </div>
    </div></>}
    {!op.deleted_at && <Sheet open={settings} onClose={() => void closeSettings()} title="Datos de la operación" description="Ruta, situación, inmueble, contraparte, decisión del encargo y corrección de etapa.">
      <SettingsTab key={op.version} op={op} all={all} today={today} onSave={saveAndTrack} onDirtyChange={markDirty.ajustes} />
    </Sheet>}
    {stagesOpen && isGuided(op) && <StagesSheet op={view} today={today} docs={docs} checklist={checklist} focus={stagesOpen.focus} onClose={() => setStagesOpen(null)} />}
    {docs.capture({ cliente: client?.nombre, inmueble: property?.titulo, etapa: stageName })}
  </Surface>;
}

function BackLink() {
  return <Link href="/admin/operaciones" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold"><ChevronLeft size={16} aria-hidden="true" />Operaciones</Link>;
}
