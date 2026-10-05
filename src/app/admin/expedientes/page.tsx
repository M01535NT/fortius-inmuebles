"use client";
import * as React from "react";
import { PageHeader, btnDanger, btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { db, useCollection } from "@/lib/admin/store";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calcularPresupuesto } from "@/lib/formatos/presupuesto";
import { CARGOS_NETO, calcularNeto } from "@/lib/formatos/neto";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
import { ExpedienteOperationPanel } from "@/components/admin/expediente-operation-panel";
import type { ExpedienteOperativo } from "@/components/admin/expediente-operation-panel";

type Expediente = ExpedienteOperativo & { cliente_id: string; propiedad_slug: string | null; folio: string; operacion: string; unidad: string; deleted_at?: string | null };
type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };
type Emision = { id: string; draft_version: number; created_at: string; sha256: string; plantillaVersion?: string };
type Copia = { id: string; emission_id: string; created_at: string; sha256: string };
type Adjunto = { id: string; draft_id: string; kind: "foto" | "croquis" | "soporte"; caption: string; source: string; observed_on: string | null; mime: string; sha256: string; created_at: string };

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "No se pudo completar la operación");
  return body as T;
}

export default function ExpedientesPage() {
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const [expedientes, setExpedientes] = React.useState<Expediente[]>([]);
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [notice, setNotice] = React.useState("");
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
  const [operationalDirty, setOperationalDirty] = React.useState(false);
  const working = React.useRef(false);
  const generation = React.useRef(0);
  const hasUnsavedChanges = documento ? JSON.stringify(values) !== JSON.stringify(documento.data) : false;
  function setBusy(value: boolean) { working.current = value; updateBusy(value); }
  function canNavigate() {
    if (working.current) return false;
    if (hasUnsavedChanges || operationalDirty) { setError("Guarda o descarta los cambios antes de cambiar de documento o expediente."); return false; }
    return true;
  }
  function selectExpediente(id: string) {
    if (!canNavigate()) return;
    generation.current++;
    setSelectedId(id); setOperationalDirty(false); setDocumento(null); setValues({}); setDocumentos([]); setEmisiones([]); setCopias({}); setAdjuntos([]); setError("");
  }
  React.useEffect(() => () => { generation.current++; }, []);
  React.useEffect(() => {
    if (!hasUnsavedChanges && !operationalDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, operationalDirty]);

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
      .then((result) => { if (active) setDocumentos(result.documentos); })
      .catch((cause) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [selectedId, showDeleted]);

  function changeList(deleted: boolean) {
    if (!canNavigate() || pdfBusy) return;
    selectExpediente(""); setExpedientes([]); setShowDeleted(deleted); setNotice("");
  }
  async function changeExpedienteState() {
    if (!selected || !canNavigate() || pdfBusy) return;
    const remove = !selected.deleted_at;
    if (remove && !window.confirm(
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
    event.preventDefault(); if (!canNavigate()) return; setError(""); setBusy(true);
    try {
      const data = new FormData(event.currentTarget);
      const clienteId = String(data.get("clienteId") ?? "");
      const cliente = clientes.find((item) => item.id === clienteId);
      if (!cliente?.asesorId) throw new Error("Asigna un asesor responsable al cliente antes de abrir su expediente.");
      const result = await json<{ expediente: Expediente }>("/api/admin/expedientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, asesorId: cliente.asesorId, folio: String(data.get("folio") ?? "").trim(), operacion: String(data.get("operacion") ?? "venta"), propiedadSlug: String(data.get("propiedadSlug") ?? "") || undefined, unidad: String(data.get("unidad") ?? "") }),
      });
      setExpedientes((items) => [result.expediente, ...items]); setSelectedId(result.expediente.id); setDocumento(null);
      formElement.reset();
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function createDocumento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canNavigate()) return; setError(""); setBusy(true);
    try {
      const formatoId = String(new FormData(event.currentTarget).get("formatoId"));
      const cliente = clientes.find(item => item.id === selected?.cliente_id);
      const today = new Date();
      const initialData = formatoId === "01" ? {
        titular: cliente?.nombre ?? "",
        tipoTitular: cliente && ["propietario", "comprador", "arrendatario"].includes(cliente.tipo) ? cliente.tipo : "otro",
        operacion: ({ venta: "Venta", renta: "Renta", administracion: "Administración", otra: "Otra" } as Record<string, string>)[selected?.operacion ?? ""] ?? "",
        fechaEmision: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
        consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente",
        transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente",
      } : formatoId === "08" ? { erogaciones: CARGOS_NETO.map((item) => ({ concepto: item.key, estado: "Pendiente", justificacion: "" })) } : {};
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${selectedId}/formatos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formatoId, data: initialData }),
      });
      setDocumentos((items) => [result.documento, ...items]); setDocumento(result.documento); setValues(result.documento.data); setEmisiones([]); setCopias({}); setAdjuntos([]);
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
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
  return <div className="space-y-8">
    <PageHeader title="Expedientes y formatos" description="Catálogo de 25 formatos exclusivos. Cada PDF requiere captura completa y cotejo con el original." />
    <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"><p>{FORMATOS.filter(item => item.readyForEmission && !item.globalRoute).length} formatos admiten emisión por expediente, sujeta a captura y revisión completas.</p><p><a href="/admin/control-comercial" className="text-primary underline">03 · Control comercial global</a>: carteras, historial y PDF desde su propio módulo.</p><p>09 · Intermediación: puedes preparar la captura; su PDF requiere registro y cotejo del modelo registrado.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-md border border-border p-3 text-sm">{notice}</p>}
    {!showDeleted && <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="display-soft mb-4 text-xl">Nuevo expediente</h2>
      <form onSubmit={createExpediente} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Cliente<select name="clienteId" required className={selectClass}><option value="">Selecciona</option>{clientes.map((item) => <option key={item.id} value={item.id}>{item.nombre}{item.asesorId ? "" : " · sin asesor"}</option>)}</select></label>
        <label className="text-sm">Folio<input name="folio" required maxLength={80} className={inputClass} /></label>
        <label className="text-sm">Operación<select name="operacion" className={selectClass}><option value="venta">Venta</option><option value="renta">Renta</option><option value="administracion">Administración</option><option value="otra">Otra</option></select></label>
        <label className="text-sm">Inmueble<select name="propiedadSlug" className={selectClass}><option value="">Sin vincular</option>{propiedades.map((item) => <option key={item.slug} value={item.slug}>{item.titulo}</option>)}</select></label>
        <label className="text-sm">Unidad, si aplica<input name="unidad" className={inputClass} /></label>
        <button type="submit" disabled={busy || hasUnsavedChanges} className={btnPrimary + " self-end"}>Crear expediente</button>
      </form>
    </section>}
    <section className="grid gap-6 lg:grid-cols-[minmax(240px,340px)_1fr]">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="display-soft mb-4 text-xl">Expedientes</h2>
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Estado de los expedientes">
          <button type="button" className={showDeleted ? btnGhost : btnPrimary} aria-pressed={!showDeleted} disabled={busy || pdfBusy} onClick={() => { if (showDeleted) changeList(false); }}>Activos</button>
          <button type="button" className={showDeleted ? btnPrimary : btnGhost} aria-pressed={showDeleted} disabled={busy || pdfBusy} onClick={() => { if (!showDeleted) changeList(true); }}>Eliminados</button>
        </div>
        {expedientes.length === 0 && <p className="text-sm text-muted-foreground">{showDeleted ? "No hay expedientes eliminados visibles para tu cuenta." : "Aún no hay expedientes activos visibles para tu cuenta."}</p>}
        <div className="space-y-2">{expedientes.map((item) => <button key={item.id} type="button" disabled={busy} onClick={() => selectExpediente(item.id)} className={`w-full rounded-md border p-3 text-left text-sm ${item.id === selectedId ? "border-primary" : "border-border"}`}><strong className="block">{item.folio}</strong><span>{clientes.find((client) => client.id === item.cliente_id)?.nombre ?? item.cliente_id}</span></button>)}</div>
      </div>
      <div className="space-y-6">{selected && <>
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="display-soft text-xl">{selected.folio}</h2>
            <div className="flex flex-wrap gap-2">
              {!selected.deleted_at && <a className={btnGhost} href={`/admin/calendario?expediente=${encodeURIComponent(selected.id)}`}>Programar evento</a>}
              <button type="button" disabled={busy || pdfBusy} onClick={changeExpedienteState} className={selected.deleted_at ? btnPrimary : btnDanger}>{selected.deleted_at ? "Restaurar expediente" : "Eliminar expediente"}</button>
            </div>
          </div>
          {selected.deleted_at ? <p className="text-sm text-muted-foreground">Este expediente está en Eliminados. Restaúralo para consultar o editar sus formatos y PDF.</p> : <>
          <div className="mb-5"><ExpedienteOperationPanel key={selected.id} expediente={selected}
            responsable={asesores.find(item => item.id === selected.asesor_id)?.nombre ?? selected.asesor_id}
            onDirtyChange={setOperationalDirty}
            onSaved={saved => setExpedientes(items => items.map(item => item.id === saved.id ? saved : item))} /></div>
          <form onSubmit={createDocumento} className="flex flex-wrap items-end gap-3">
            <label className="min-w-[240px] flex-1 text-sm">Formato<select name="formatoId" required className={selectClass}>{FORMATOS.filter(item => !item.globalRoute).map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label>
            <button type="submit" disabled={busy || hasUnsavedChanges} className={btnPrimary}>Crear borrador</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">{documentos.map((item) => <button key={item.id} type="button" disabled={busy} onClick={() => openDocumento(item.id)} className={btnGhost}>{item.formato_id} · {formatoById(item.formato_id).title} · v{item.version}</button>)}</div>
          </>}
        </section>
        {documento && definition && <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft mb-2 text-xl">{definition.title}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{definition.source} · Borrador v{documento.version}</p>
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
            {adjuntos.length > 0 && <ul className="mt-4 space-y-2 text-sm">{adjuntos.map((item) => <li key={item.id}><a className="text-primary underline" href={`/api/admin/adjuntos/${item.id}/descargar`} target="_blank" rel="noreferrer">{item.caption}</a> · {item.kind} · {item.source}{item.observed_on ? ` · ${item.observed_on}` : ""}</li>)}</ul>}
            <div className="mt-4 grid gap-3 md:grid-cols-2">{[{ key: "fotoPrincipalId", kind: "foto", label: "Fotografía principal del PDF" }, { key: "croquisId", kind: "croquis", label: "Croquis del PDF" }].map((slot) => <label key={slot.key} className="text-sm">{slot.label}<select value={String(values[slot.key] ?? "")} onChange={(event) => setValues((current) => ({ ...current, [slot.key]: event.target.value }))} className={selectClass}><option value="">Selecciona un adjunto</option>{adjuntos.filter((item) => item.kind === slot.kind).map((item) => <option key={item.id} value={item.id}>{item.caption}</option>)}</select></label>)}</div>
          </div>}
          {missing.length > 0 && <p className="mt-5 text-sm text-muted-foreground">Para emitir faltan: {missing.join(", ")}.</p>}
          {budgetTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Resumen calculado</h3><p>Subtotal cotizado: {budgetTotals.subtotalCotizado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p><p>Autorizado: {budgetTotals.autorizadoMenosPagado === null ? "Sin partidas autorizadas" : `${budgetTotals.importeAutorizado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${String(values.moneda)}`}</p><p>Estimación con reserva: {budgetTotals.estimacionConReserva.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p><p>Pagado: {budgetTotals.totalPagado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {String(values.moneda)}</p></div>}
          {netTotals && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Neto estimado</h3><p>Precio usado: {netTotals.precioBase.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p><p>Erogaciones: {netTotals.erogaciones.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p><p className="font-semibold">Neto: {netTotals.netoEstimado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</p></div>}
          {hasUnsavedChanges && <p className="mt-5 text-sm text-muted-foreground">{definition.id === "01" ? "Al descargar el PDF se guardarán los datos que estás viendo." : "Guarda los cambios antes de emitir el PDF."}</p>}
          {hasUnsavedChanges && <button type="button" disabled={busy} className={btnGhost + " mt-3"} onClick={() => { if (window.confirm("¿Descartar los cambios sin guardar de este borrador?")) { setValues(documento.data); setError(""); } }}>Descartar cambios sin guardar</button>}
          {!definition.readyForEmission && <p className="mt-5 text-sm text-muted-foreground">Este formato está pendiente de cotejo con el original; la emisión permanece bloqueada.</p>}
          <div className="mt-5 flex flex-wrap gap-3">{definition.id === "01" ? <>
            <button type="button" onClick={saveAndDownloadAviso} disabled={busy || missing.length > 0} className={btnPrimary}>{pdfBusy ? "Preparando PDF…" : "Guardar y descargar PDF"}</button>
            <button type="button" onClick={saveDocumento} disabled={busy} className={btnGhost}>Guardar borrador</button>
          </> : <><button type="button" onClick={saveDocumento} disabled={busy} className={btnPrimary}>Guardar borrador</button><button type="button" onClick={emitDocumento} disabled={busy || hasUnsavedChanges || missing.length > 0 || !definition.readyForEmission} className={btnGhost}>Emitir PDF de los datos guardados</button></>}</div>
          {definition.id === "01" && !hasUnsavedChanges && currentAvisoEmission && <p role="status" className="mt-3 text-sm"><a className="text-primary underline" href={`/api/admin/emisiones/${currentAvisoEmission.id}/descargar`}>Descargar PDF del aviso</a> · Versión {documento.version}</p>}
          {emisiones.length > 0 && <div className="mt-6 border-t border-border pt-4"><h3 className="font-semibold">Emisiones archivadas</h3><ul className="mt-2 space-y-5">{emisiones.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><a className="text-primary underline" href={`/api/admin/emisiones/${item.id}/descargar`}>PDF emitido · versión {item.draft_version} · {new Date(item.created_at).toLocaleString("es-MX")}</a><form onSubmit={(event) => uploadSignedCopy(item.id, event)} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">Adjuntar copia firmada externamente<input name="archivo" type="file" accept="application/pdf,.pdf" required className={inputClass} /></label><button type="submit" disabled={busy} className={btnGhost}>Archivar copia</button></form>{(copias[item.id] ?? []).map((copy) => <a key={copy.id} className="mt-2 block text-sm text-primary underline" href={`/api/admin/copias-firmadas/${copy.id}/descargar`}>Copia firmada adjunta · {new Date(copy.created_at).toLocaleString("es-MX")}</a>)}</li>)}</ul></div>}
          </fieldset>
        </section>}
      </>}</div>
    </section>
  </div>;
}
