"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import * as React from "react";
import { InterviewAccess } from "@/components/admin/intake/interview-access";
import { FolderOpen } from "lucide-react";
import { emptyWorkflow, WORKFLOW_ROUTES, stageLabel, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { OperationBrief } from "@/components/admin/workspace/operation-brief";
import { DossierTabs, type DossierView } from "@/components/admin/workspace/dossier-tabs";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { EXPEDIENTE_ETAPAS, EXPEDIENTE_DOCUMENTOS, EXPEDIENTE_OPERACIONES } from "@/lib/formatos/expediente-operations";
import { PageHeader, btnDanger, btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { db, fetchJson as json, useCollection } from "@/lib/admin/store";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calcularPresupuesto } from "@/lib/formatos/presupuesto";
import { CARGOS_NETO, calcularNeto } from "@/lib/formatos/neto";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
import { ExpedienteClientList } from "@/components/admin/expediente-client-list";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";
import type { ExpedienteOperativo } from "@/components/admin/expediente-operation-panel";
import { formatAmount } from "@/lib/finance/money";

type Expediente = ExpedienteOperativo & { cliente_id: string; propiedad_slug: string | null; folio: string; operacion: string; unidad: string; deleted_at?: string | null };
type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };
type Emision = { id: string; draft_version: number; created_at: string; sha256: string; plantillaVersion?: string };
type Copia = { id: string; emission_id: string; created_at: string; sha256: string };
type Adjunto = { id: string; draft_id: string; kind: "foto" | "croquis" | "soporte"; caption: string; source: string; observed_on: string | null; mime: string; sha256: string; created_at: string };


export default function ExpedientesPage() {
  const [createOpen,setCreateOpen] = React.useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("nuevo") === "1");
  const [newClient,setNewClient]=React.useState(()=>typeof window!=="undefined"?new URLSearchParams(window.location.search).get("clienteId")??"":"");
  const [newProperty,setNewProperty]=React.useState(()=>typeof window!=="undefined"?new URLSearchParams(window.location.search).get("inmueble")??"":"");
  const [newOperation,setNewOperation]=React.useState("venta");
  const [newRoute,setNewRoute]=React.useState<OperationWorkflow["ruta"]>(()=>typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("ruta")==="compra"?"compra":"captacion");
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const [expedientes, setExpedientes] = React.useState<Expediente[]>([]);
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [query,setQuery] = React.useState("");
  const [view,setView]=React.useState<DossierView>(()=>typeof window!=="undefined"&&new URLSearchParams(window.location.search).has("documento")?"documents":"summary");
  const [selectedId, setSelectedId] = React.useState("");
  const [documentos, setDocumentos] = React.useState<Documento[]>([]);
  const [documento, setDocumento] = React.useState<Documento | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [emisiones, setEmisiones] = React.useState<Emision[]>([]);
  const [copias, setCopias] = React.useState<Record<string, Copia[]>>({});
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[]>([]);
  const [error, setError] = React.useState("");
  const [busy, updateBusy] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [creationDirty,setCreationDirty]=React.useState(false);
  const creationForm=React.useRef<HTMLFormElement>(null);
  const [operationalDirty, setOperationalDirty] = React.useState(false);
  const working = React.useRef(false);
  const allowLeave=React.useRef(false),leavePending=React.useRef(false);
  const generation = React.useRef(0);
  const hasUnsavedChanges = documento ? JSON.stringify(values) !== JSON.stringify(documento.data) : false;
  function setBusy(value: boolean) { working.current = value; updateBusy(value); }
  function canNavigate(ignoreCreation=false) {
    if (working.current) return false;
    if (hasUnsavedChanges || operationalDirty || !ignoreCreation && creationDirty) { setError("Guarda o descarta los cambios antes de cambiar de documento o expediente."); return false; }
    return true;
  }
  function selectExpediente(id: string) {
    if (!canNavigate()) return;
    generation.current++;
    setSelectedId(id); setView("summary"); setOperationalDirty(false); setDocumento(null); setValues({}); setDocumentos([]); setEmisiones([]); setCopias({}); setAdjuntos([]); setError("");
  }
  async function openDocumento(id: string) {
    if (!canNavigate()) return;
    setError(""); setBusy(true);
    const requestGeneration = ++generation.current;
    try {
      const result = await json<{ documento: Documento; emisiones: Emision[] }>(`/api/admin/formatos/${id}`);
      let images: Adjunto[] = [];
      if (["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"].includes(result.documento.formato_id)) {
        const assets = await json<{ adjuntos: Adjunto[] }>(`/api/admin/formatos/${id}/adjuntos`);
        images = assets.adjuntos;
      }
      const pairs = await Promise.all(result.emisiones.map(async (item) => {
        const response = await json<{ copias: Copia[] }>(`/api/admin/emisiones/${item.id}/firmado`);
        return [item.id, response.copias] as const;
      }));
      if (requestGeneration !== generation.current) return;
      setDocumento(result.documento); setValues(result.documento.data); setEmisiones(result.emisiones);
      setAdjuntos(images); setCopias(Object.fromEntries(pairs));
    } catch (cause) { if (requestGeneration === generation.current) setError(String(cause)); }
    finally { if (requestGeneration === generation.current) setBusy(false); }
  }
  React.useEffect(() => () => { generation.current++; }, []);
  React.useEffect(() => {
    if (!hasUnsavedChanges && !operationalDirty && !creationDirty) return;
    const warn = (event: BeforeUnloadEvent) => { if(allowLeave.current)return;event.preventDefault(); event.returnValue = ""; };
    const protect=(event:MouseEvent)=>{
      if(allowLeave.current||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;
      if(!anchor||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
      const target=new URL(anchor.href,window.location.href);
      if(!["http:","https:"].includes(target.protocol)||target.origin===window.location.origin&&target.pathname===window.location.pathname&&target.search===window.location.search)return;
      event.preventDefault();event.stopImmediatePropagation();if(leavePending.current)return;leavePending.current=true;
      void confirmAction("Hay captura sin guardar. ¿Descartar los cambios y salir de esta operación?").then(approved=>{if(approved){allowLeave.current=true;window.location.assign(target.href);}}).finally(()=>{leavePending.current=false;});
    };
    window.addEventListener("beforeunload", warn);document.addEventListener("click",protect,true);
    return () => {window.removeEventListener("beforeunload",warn);document.removeEventListener("click",protect,true);};
  }, [hasUnsavedChanges, operationalDirty, creationDirty]);

  React.useEffect(() => {
    let active = true;
    json<{ expedientes: Expediente[] }>(showDeleted ? "/api/admin/expedientes?estado=eliminados" : "/api/admin/expedientes")
      .then((result) => {
        if (!active) return;
        setExpedientes(result.expedientes);
        if (!showDeleted) {
          const linked = new URLSearchParams(window.location.search).get("expediente");
          if (linked && result.expedientes.some(item => item.id === linked)) setSelectedId(current => current || linked);
        }
      })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [showDeleted]);
  React.useEffect(() => {
    if (!selectedId || showDeleted) return;
    let active = true;
    json<{ documentos: Documento[] }>(`/api/admin/expedientes/${selectedId}/formatos`)
      .then((result) => {
        if (!active) return;
        setDocumentos(result.documentos);
        const requested=new URLSearchParams(window.location.search).get("documento");
        if(requested&&result.documentos.some(item=>item.id===requested)) void openDocumento(requested);
      })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
    // Apply the incoming document once per dossier; editing state is not a reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, showDeleted]);

  function changeList(deleted: boolean) {
    if (!canNavigate() || pdfBusy) return;
    selectExpediente(""); setExpedientes([]); setShowDeleted(deleted); setNotice("");
  }
  async function changeExpedienteState() {
    if (!selected || !canNavigate() || pdfBusy) return;
    const remove = !selected.deleted_at;
    if (remove && !await confirmAction(
      "¿Eliminar el expediente " + selected.folio + "? Se moverá a Eliminados con sus formatos y PDF. Podrás restaurarlo desde esa vista."
    )) return;
    setError(""); setNotice(""); setBusy(true);
    try {
      await json<{ expediente: Expediente }>("/api/admin/expedientes/" + selected.id, {
        method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: selected.version }),
      });
      generation.current++;
      setExpedientes(items => items.filter(item => item.id !== selected.id));
      setSelectedId(""); setOperationalDirty(false); setDocumento(null); setValues({}); setDocumentos([]); setEmisiones([]); setCopias({}); setAdjuntos([]);
      setNotice(remove ? "Expediente eliminado. Puedes recuperarlo en Eliminados." : "Expediente restaurado. Está disponible en Activos.");
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function createExpediente(event: React.FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget;
    event.preventDefault(); if (!canNavigate(true)) return; setError(""); setBusy(true);
    try {
      const data = new FormData(event.currentTarget);
      const clienteId = String(data.get("clienteId") ?? "");
      const cliente = clientes.find((item) => item.id === clienteId);
      if (!cliente?.asesorId) throw new Error("Asigna un asesor responsable al cliente antes de abrir su expediente.");
      const result = await json<{ expediente: Expediente }>("/api/admin/expedientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, asesorId: cliente.asesorId, operacion: String(data.get("operacion") ?? "venta"), propiedadSlug: String(data.get("propiedadSlug") ?? "") || undefined, unidad: String(data.get("unidad") ?? ""), ...(["venta","renta","inversion"].includes(newOperation)?{flujo:emptyWorkflow(newRoute)}:{}) }),
      });
      setExpedientes((items) => [result.expediente, ...items]); setSelectedId(result.expediente.id); setDocumento(null);
      setCreateOpen(false); setCreationDirty(false);
      setNotice(`Expediente creado: ${result.expediente.folio}.`);
      formElement.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function createDocumento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canNavigate()) return; setError(""); setBusy(true);
    try {
      const draftForm = new FormData(event.currentTarget);
      const formatoId = String(draftForm.get("formatoId"));
      const valorReference = formatoId === "08" ? String(draftForm.get("valorReferencia") ?? "") : "";
      const today = new Date();
      const initialData = formatoId === "01" ? {
        fechaEmision: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
        consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente",
        transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente",
      } : formatoId === "08" ? { erogaciones: CARGOS_NETO.map((item) => ({ concepto: item.key, estado: "Pendiente", justificacion: "" })) } : {};
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${selectedId}/formatos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formatoId, data: initialData, ...(valorReference ? {valorReferencia:{id:valorReference.split(":")[0],version:Number(valorReference.split(":")[1])}} : {}) }),
      });
      setDocumentos((items) => [result.documento, ...items]); setDocumento(result.documento); setValues(result.documento.data); setEmisiones([]); setCopias({}); setAdjuntos([]);
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function saveDocumento() {
    if (!documento || working.current) return;
    setError(""); setBusy(true);
    try {
      const result = await json<{ documento: Documento }>(`/api/admin/formatos/${documento.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: documento.version, data: values }),
      });
      setDocumento(result.documento);
      setValues(result.documento.data);
      setDocumentos((items) => items.map((item) => item.id === result.documento.id ? result.documento : item));
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function emitDocumento() {
    if (!documento || working.current || hasUnsavedChanges) return;
    setError(""); setBusy(true);
    try {
      const result = await json<{ emision: Emision }>(`/api/admin/formatos/${documento.id}/emitir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: documento.version }) });
      setEmisiones((items) => [result.emision, ...items]);
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function saveAndDownloadAviso() {
    if (!documento || documento.formato_id !== "01" || working.current) return;
    if (validateFormato("01", { ...values, folio: selected?.folio }).length) return;
    setError(""); setBusy(true); setPdfBusy(true);
    try {
      let saved = documento;
      if (hasUnsavedChanges) {
        const result = await json<{ documento: Documento }>(`/api/admin/formatos/${documento.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: documento.version, data: values }),
        });
        saved = result.documento;
        setDocumento(saved); setValues(saved.data);
        setDocumentos(items => items.map(item => item.id === saved.id ? saved : item));
      }
      let emission = emisiones.find(item => item.draft_version === saved.version && item.plantillaVersion === AVISO_TEMPLATE_VERSION);
      if (!emission) {
        const result = await json<{ emision: Emision }>(`/api/admin/formatos/${saved.id}/emitir`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: saved.version }),
        });
        emission = result.emision;
        setEmisiones(items => [result.emision, ...items]);
      }
      await downloadAdminPdf(`/api/admin/emisiones/${emission.id}/descargar`, `Fortius-Aviso-de-privacidad-v${saved.version}.pdf`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo descargar el aviso"); }
    finally { setBusy(false); setPdfBusy(false); }
  }
  async function uploadSignedCopy(emissionId: string, event: React.FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget;
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const result = await json<{ copia: Copia }>(`/api/admin/emisiones/${emissionId}/firmado`, { method: "POST", body: form });
      setCopias((current) => ({ ...current, [emissionId]: [result.copia, ...(current[emissionId] ?? [])] }));
      formElement.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function uploadAdjunto(event: React.FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget;
    event.preventDefault(); if (!documento) return; setError(""); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const result = await json<{ adjunto: Adjunto }>(`/api/admin/formatos/${documento.id}/adjuntos`, { method: "POST", body: form });
      setAdjuntos((current) => [...current, result.adjunto]);
      formElement.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  const selected = expedientes.find((item) => item.id === selectedId);
  const definition = documento ? formatoById(documento.formato_id) : null;
  const currentAvisoEmission = emisiones.find(item => item.draft_version === documento?.version && item.plantillaVersion === AVISO_TEMPLATE_VERSION);
  const missing = definition ? validateFormato(definition.id, { ...values, folio: selected?.folio }) : [];
  const budgetTotals = definition?.id === "19" && missing.length === 0 ? calcularPresupuesto(values) : null;
  const netTotals = definition?.id === "08" && missing.length === 0 ? calcularNeto({ ...values, folio: selected?.folio }) : null;
  return <div className="admin-operations-page min-w-0 space-y-5">
    <PageHeader title="Operaciones" description="Una operación a la vez: siguiente paso, documentos y seguimiento." actions={!showDeleted&&<button type="button" className={btnGhost} aria-expanded={createOpen} aria-controls="nuevo-expediente" disabled={busy||pdfBusy} onClick={()=>setCreateOpen(!createOpen)}>{createOpen?"Cerrar alta directa":"Alta directa"}</button>}/>
    <details className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><summary className="cursor-pointer font-semibold">Formatos y requisitos de emisión</summary><p className="mt-3">{FORMATOS.filter(item => item.readyForEmission && !item.globalRoute).length} formatos admiten emisión por expediente, sujeta a captura y revisión completas.</p><p><a href="/admin/control-comercial" className="text-primary-ink underline">03 · Control comercial global</a>: carteras, historial y PDF desde su propio módulo.</p><p>09 · Intermediación: puedes preparar la captura; su PDF requiere registro y cotejo del modelo registrado.</p></details>
    {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-md border border-border p-3 text-sm">{notice}</p>}
    {!showDeleted && <details id="nuevo-expediente" hidden={!createOpen} className="admin-operation-create rounded-lg border border-border bg-card p-5" open={createOpen} onToggle={event=>setCreateOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer font-semibold">Nuevo expediente</summary>
      <form ref={creationForm} hidden={!createOpen} onChange={()=>setCreationDirty(true)} onSubmit={createExpediente} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Cliente<select name="clienteId" required disabled={busy} value={newClient} onChange={e=>{setNewClient(e.target.value);setNewRoute(clientes.find(c=>c.id===e.target.value)?.tipo==="comprador"?"compra":"captacion");}} className={selectClass}><option value="">Selecciona</option>{clientes.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.asesorId ? "" : " · sin asesor"}</option>)}</select></label>
        <div className="text-sm"><label htmlFor="nuevo-expediente-folio">Folio del expediente</label><input id="nuevo-expediente-folio" aria-describedby="nuevo-expediente-folio-ayuda" readOnly value="Se asignará al guardar" className={inputClass + " bg-secondary text-muted-foreground"} /><p id="nuevo-expediente-folio-ayuda" className="mt-1 text-xs text-muted-foreground">Fortius lo asigna automáticamente al crear el expediente.</p></div>
        <label className="text-sm">Operación<select name="operacion" disabled={busy} value={newOperation} onChange={e=>{setNewOperation(e.target.value);setNewRoute(e.target.value==="inversion"?"inversion":e.target.value==="renta"?"arrendador":"captacion");}} className={selectClass}>{Object.entries(EXPEDIENTE_OPERACIONES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm">Inmueble<select name="propiedadSlug" disabled={busy} value={newProperty} onChange={e=>setNewProperty(e.target.value)} className={selectClass}><option value="">Sin vincular</option>{propiedades.filter(item=>newRoute==="compra"||!newClient||item.asesorId===clientes.find(c=>c.id===newClient)?.asesorId).map((item) => <option key={item.slug} value={item.slug}>{item.titulo}</option>)}</select></label>
        {["venta","renta","inversion"].includes(newOperation)&&<label className="text-sm">Ruta de la nueva operación<select disabled={busy} value={newRoute} onChange={e=>setNewRoute(e.target.value as OperationWorkflow["ruta"])} className={selectClass}>{Object.entries(WORKFLOW_ROUTES).filter(([k])=>newOperation==="inversion"?k==="inversion":newOperation==="renta"?["arrendador","arrendatario"].includes(k):["captacion","compra"].includes(k)).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}
        <p className="text-sm text-muted-foreground md:col-span-2">Puedes iniciar con documentos pendientes y vincular el inmueble después. Cada avance indicará qué falta.</p>
        <label className="text-sm">Unidad, si aplica<input name="unidad" disabled={busy} className={inputClass} /></label>
        <button type="submit" disabled={busy || hasUnsavedChanges || operationalDirty} className={btnPrimary + " self-end"}>Crear expediente</button>
        {creationDirty&&<button type="button" disabled={busy} className={btnGhost} onClick={async()=>{if(await confirmAction("¿Descartar la nueva operación sin guardar?")){creationForm.current?.reset();setNewClient("");setNewProperty("");setNewOperation("venta");setNewRoute("captacion");setCreationDirty(false);setError("");}}}>Descartar nueva operación</button>}
      </form>
    </details>}
    <section className="admin-operation-layout">
      <ExpedienteClientList expedientes={expedientes} clientes={clientes} propiedades={propiedades} selectedId={selectedId}
        showDeleted={showDeleted} busy={busy || pdfBusy} query={query} onQueryChange={setQuery} onStateChange={changeList}
        onSelect={selectExpediente} />
      <div className="min-w-0 space-y-5">        {!selected&&<section className="admin-card admin-operation-welcome"><FolderOpen size={32} aria-hidden="true"/><h2>Elige una operación o empieza una nueva</h2><p>Usa <strong>Nueva operación</strong> en la lista para la captación guiada. Si necesitas un expediente sin entrevista, usa <strong>Alta directa</strong> arriba.</p></section>}{selected && <>
        {!selected.deleted_at&&<OperationBrief operation={selected} onReview={()=>{if(view!=="all"&&view!=="summary"){if(!canNavigate())return;setView("summary");}requestAnimationFrame(()=>{const target=document.getElementById("exp-guia");target?.scrollIntoView({block:"start"});target?.focus();});}}/>}
        {!selected.deleted_at && <DossierTabs value={view} onChange={setView} disabled={busy||pdfBusy}/>}
        <div id="exp-tab-content" role="tabpanel" aria-labelledby={`exp-tab-${view}`} tabIndex={0} className="min-w-0 space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="display-soft text-xl">{selected.folio}</h2>
            <div className="flex flex-wrap gap-2">
              {!selected.deleted_at && <a className={btnGhost} href={`/admin/calendario?expediente=${encodeURIComponent(selected.id)}`}>Programar evento</a>}
              <button type="button" disabled={busy || pdfBusy} onClick={changeExpedienteState} className={selected.deleted_at ? btnPrimary : btnDanger}>{selected.deleted_at ? "Restaurar expediente" : "Eliminar expediente"}</button>
            </div>
          </div>
          {selected.deleted_at ? <p className="text-sm text-muted-foreground">Este expediente está en Eliminados. Restaúralo para consultar o editar sus formatos y PDF.</p> : <>
          <div id="exp-resumen" hidden={view!=="all"&&view!=="summary"} className="mb-4 scroll-mt-24 rounded-lg bg-secondary/30 p-4">
            <p className="text-sm font-semibold">{selected.flujo?stageLabel(selected.etapa??"captacion",selected.flujo.ruta):EXPEDIENTE_ETAPAS[selected.etapa??"captacion"]} · {selected.fecha_objetivo??"Sin fecha objetivo"}</p>
            <p hidden={!!selected.flujo} className="mt-2 text-sm">Próximo pendiente documental: {Object.entries(EXPEDIENTE_DOCUMENTOS).find(([key])=>!selected.checklist?.[key as keyof typeof EXPEDIENTE_DOCUMENTOS] || selected.checklist[key as keyof typeof EXPEDIENTE_DOCUMENTOS]==="pendiente")?.[1]??"Recepción registrada; consulta las revisiones en Actividad."}</p>
          </div>
          <div className="mb-5" hidden={view!=="all"&&view!=="summary"}><InterviewAccess key={selected.id} expedienteId={selected.id} clienteId={selected.cliente_id} intencion={selected.flujo?.ruta==="inversion"?"invertir":selected.operacion==="renta"?(selected.flujo?.ruta==="arrendatario"?"rentar":"arrendar"):selected.flujo?.ruta==="compra"?"comprar":"vender"} disabled={hasUnsavedChanges||operationalDirty||creationDirty||busy}/></div>
          <div className="mb-5" hidden={view==="documents"||view==="tasks"}><ExpedienteOperationPanel key={selected.id} expediente={selected} view={view==="activity"?"activity":view==="summary"?"summary":"all"}
            responsable={asesores.find(item => item.id === selected.asesor_id)?.nombre ?? selected.asesor_id}
            onDirtyChange={setOperationalDirty}
            onSaved={saved => setExpedientes(items => items.map(item => item.id === saved.id ? saved : item))} /></div>
          <div hidden={view!=="all"&&view!=="documents"}><form id="exp-documentos" onSubmit={createDocumento} className="scroll-mt-24 flex flex-wrap items-end gap-3">
            <label className="min-w-0 w-full flex-1 text-sm">Formato<select name="formatoId" required className={selectClass}>{FORMATOS.filter(item => !item.globalRoute).map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label>
            <button type="submit" disabled={busy || hasUnsavedChanges} className={btnPrimary}>Crear borrador</button>
            {documentos.some(d=>d.formato_id==="07")&&<label className="w-full text-sm">Solo para neto 08: incorporar una opinión 07 revisada<select name="valorReferencia" className={selectClass}><option value="">Sin incorporar · conservar captura manual</option>{documentos.filter(d=>d.formato_id==="07").map(d=><option key={d.id} value={`${d.id}:${d.version}`}>Opinión 07 · v{d.version} · {d.id}</option>)}</select><span className="mt-1 block text-muted-foreground">Se validan versión y revisión. El valor sugerido se distingue del precio acordado.</span></label>}
          </form>
          <div className="mt-5 flex flex-wrap gap-2">{documentos.map((item) => <button key={item.id} type="button" disabled={busy} onClick={() => openDocumento(item.id)} className={btnGhost}>{item.formato_id} · {formatoById(item.formato_id).title} · v{item.version}</button>)}</div></div>
          </>}
        </section>
        {documento && definition && <section hidden={view!=="all"&&view!=="documents"} className="rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft mb-2 text-xl">{definition.title}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{definition.source} · Borrador v{documento.version}</p>
          {!!values.origenDatos&&<p className="mb-4 rounded-md border border-border bg-secondary/20 p-3 text-sm">Este borrador reutiliza información del expediente y de la entrevista. Las declaraciones requieren comprobación; revisa diferencias y datos pendientes antes de emitir. El prellenado no registra consentimiento, aprobación ni firmas.</p>}
          <fieldset disabled={busy} className="min-w-0">
          <FormatoEditor key={documento.id} definition={definition} values={{ ...values, folio: selected.folio }} images={adjuntos} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} />
          {["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"].includes(definition.id) && <div className="mt-6 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Fotografías y croquis privados</h3>
            <p className="mt-1 text-sm text-muted-foreground">Registra la procedencia y fecha de cada imagen. Selecciona la fotografía principal y el croquis que aparecerán en el PDF, y guarda esa selección antes de emitir. La opinión 07 exige fecha para sus fotografías.</p>
            <form onSubmit={uploadAdjunto} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">Tipo<select name="tipo" required className={selectClass}><option value="foto">Fotografía</option><option value="croquis">Croquis o plano</option><option value="soporte">Soporte gráfico</option></select></label>
              <label className="text-sm">Fecha observada<input name="fechaObservacion" type="date" className={inputClass} /></label>
              <label className="text-sm">Descripción<input name="descripcion" required maxLength={240} className={inputClass} /></label>
              <label className="text-sm">Fuente o autor<input name="fuente" required maxLength={240} className={inputClass} /></label>
              <label className="text-sm md:col-span-2">Imagen JPEG o PNG, máximo 10 MB<input name="archivo" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" required className={inputClass} /></label>
              <button type="submit" disabled={busy} className={btnGhost}>Archivar imagen</button>
            </form>
            {adjuntos.length > 0 && <ul className="mt-4 space-y-2 text-sm">{adjuntos.map((item) => <li key={item.id}><a className="text-primary-ink underline" href={`/api/admin/adjuntos/${item.id}/descargar`} target="_blank" rel="noreferrer">{item.caption}</a> · {item.kind} · {item.source}{item.observed_on ? ` · ${item.observed_on}` : ""}</li>)}</ul>}
            <div className="mt-4 grid gap-3 md:grid-cols-2">{[{ key: "fotoPrincipalId", kind: "foto", label: "Fotografía principal del PDF" }, { key: "croquisId", kind: "croquis", label: "Croquis del PDF" }].map((slot) => <label key={slot.key} className="text-sm">{slot.label}<select value={String(values[slot.key] ?? "")} onChange={(event) => setValues((current) => ({ ...current, [slot.key]: event.target.value }))} className={selectClass}><option value="">Selecciona un adjunto</option>{adjuntos.filter((item) => item.kind === slot.kind).map((item) => <option key={item.id} value={item.id}>{item.caption}</option>)}</select></label>)}</div>
          </div>}
          {missing.length > 0 && <p className="mt-5 text-sm text-muted-foreground">Para emitir faltan: {missing.join(", ")}.</p>}
          {budgetTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Resumen calculado</h3><p>Subtotal cotizado: {formatAmount(budgetTotals.subtotalCotizado)} {String(values.moneda)}</p><p>Autorizado: {budgetTotals.autorizadoMenosPagado === null ? "Sin partidas autorizadas" : `${formatAmount(budgetTotals.importeAutorizado)} ${String(values.moneda)}`}</p><p>Estimación con reserva: {formatAmount(budgetTotals.estimacionConReserva)} {String(values.moneda)}</p><p>Pagado: {formatAmount(budgetTotals.totalPagado)} {String(values.moneda)}</p></div>}
          {netTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Neto estimado</h3><p>Precio usado: {formatAmount(netTotals.precioBase)} MXN</p><p>Erogaciones: {formatAmount(netTotals.erogaciones)} MXN</p><p className="font-semibold">Neto: {formatAmount(netTotals.netoEstimado)} MXN</p></div>}
          {hasUnsavedChanges && <p className="mt-5 text-sm text-muted-foreground">{definition.id === "01" ? "Al descargar el PDF se guardarán los datos que estás viendo." : "Guarda los cambios antes de emitir el PDF."}</p>}
          {hasUnsavedChanges && <button type="button" disabled={busy} className={btnGhost + " mt-3"} onClick={async () => { if (await confirmAction("¿Descartar los cambios sin guardar de este borrador?")) { setValues(documento.data); setError(""); } }}>Descartar cambios sin guardar</button>}
          {!definition.readyForEmission && <p className="mt-5 text-sm text-muted-foreground">Este formato está pendiente de cotejo con el original; la emisión permanece bloqueada.</p>}
          <div className="mt-5 flex flex-wrap gap-3">{definition.id === "01" ? <>
            <button type="button" onClick={saveAndDownloadAviso} disabled={busy || missing.length > 0} className={btnPrimary}>{pdfBusy ? "Preparando PDF…" : "Guardar y descargar PDF"}</button>
            <button type="button" onClick={saveDocumento} disabled={busy} className={btnGhost}>Guardar borrador</button>
          </> : <><button type="button" onClick={saveDocumento} disabled={busy} className={btnPrimary}>Guardar borrador</button><button type="button" onClick={emitDocumento} disabled={busy || hasUnsavedChanges || missing.length > 0 || !definition.readyForEmission} className={btnGhost}>Emitir PDF de los datos guardados</button></>}</div>
          {definition.id === "01" && !hasUnsavedChanges && currentAvisoEmission && <p role="status" className="mt-3 text-sm"><a className="text-primary-ink underline" href={`/api/admin/emisiones/${currentAvisoEmission.id}/descargar`}>Descargar PDF del aviso</a> · Versión {documento.version}</p>}
          {emisiones.length > 0 && <div className="mt-6 border-t border-border pt-4"><h3 className="font-semibold">Emisiones archivadas</h3><ul className="mt-2 space-y-5">{emisiones.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><a className="text-primary-ink underline" href={`/api/admin/emisiones/${item.id}/descargar`}>PDF emitido · versión {item.draft_version} · {new Date(item.created_at).toLocaleString("es-MX")}</a><form onSubmit={(event) => uploadSignedCopy(item.id, event)} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">Adjuntar copia firmada externamente<input name="archivo" type="file" accept="application/pdf,.pdf" required className={inputClass} /></label><button type="submit" disabled={busy} className={btnGhost}>Archivar copia</button></form>{(copias[item.id] ?? []).map((copy) => <a key={copy.id} className="mt-2 block text-sm text-primary-ink underline" href={`/api/admin/copias-firmadas/${copy.id}/descargar`}>Copia firmada adjunta · {new Date(copy.created_at).toLocaleString("es-MX")}</a>)}</li>)}</ul></div>}
          </fieldset>
        </section>}
      {!selected.deleted_at && <div id="exp-tareas" hidden={view!=="all"&&view!=="tasks"} className="scroll-mt-24"><RelatedWork expedienteId={selected.id} clienteId={selected.cliente_id} propertySlug={selected.propiedad_slug??undefined}/></div>}
      </div></>}</div>
    </section>
  </div>;
}
