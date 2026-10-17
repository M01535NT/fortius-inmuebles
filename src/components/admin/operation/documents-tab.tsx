"use client";
import * as React from "react";
import Link from "next/link";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { Card, EmptyBox } from "@/components/admin/kit";
import { btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calcularPresupuesto } from "@/lib/formatos/presupuesto";
import { CARGOS_NETO, calcularNeto } from "@/lib/formatos/neto";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { copiaEditable, downloadFormatoCopia } from "@/lib/admin/download-word";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
import { formatAmount } from "@/lib/finance/money";
import { shortDate } from "@/lib/admin/today";
import type { OperationRecord } from "@/lib/admin/operation-view";

/*
  Documentos de la operación: crear un borrador de formato, capturarlo, generar su
  PDF, adjuntar la copia firmada y las fotografías. Misma lógica que la pantalla
  anterior de expedientes, en su propia pestaña.
*/

export type Documento = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; updated_at: string };
type Emision = { id: string; draft_version: number; created_at: string; sha256: string; plantillaVersion?: string };
type Copia = { id: string; emission_id: string; created_at: string; sha256: string };
type Adjunto = { id: string; draft_id: string; kind: "foto" | "croquis" | "soporte"; caption: string; source: string; observed_on: string | null; mime: string; sha256: string; created_at: string };
const WITH_IMAGES = ["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"];
const post = (body: unknown, method = "POST") => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function DocumentsTab({ op, documents, onDocumentsChange, initialDocument, onDirtyChange }: { op: OperationRecord; documents: Documento[]; onDocumentsChange: (update: (items: Documento[]) => Documento[]) => void; initialDocument?: string | null; onDirtyChange: (dirty: boolean) => void }) {
  const [documento, setDocumento] = React.useState<Documento | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [emisiones, setEmisiones] = React.useState<Emision[]>([]);
  const [copias, setCopias] = React.useState<Record<string, Copia[]>>({});
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[]>([]);
  const [error, setError] = React.useState("");
  const [busy, updateBusy] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const working = React.useRef(false), generation = React.useRef(0), opened = React.useRef(false);
  const dirty = documento ? JSON.stringify(values) !== JSON.stringify(documento.data) : false;
  function setBusy(value: boolean) { working.current = value; updateBusy(value); }
  React.useEffect(() => { onDirtyChange(dirty || busy); }, [dirty, busy, onDirtyChange]);
  React.useEffect(() => () => { generation.current++; }, []);

  async function open(id: string) {
    if (working.current) return;
    if (dirty) { setError("Guarda o descarta los cambios antes de abrir otro documento."); return; }
    setError(""); setBusy(true);
    const request = ++generation.current;
    try {
      const result = await json<{ documento: Documento; emisiones: Emision[] }>(`/api/admin/formatos/${id}`);
      const images = WITH_IMAGES.includes(result.documento.formato_id) ? (await json<{ adjuntos: Adjunto[] }>(`/api/admin/formatos/${id}/adjuntos`)).adjuntos : [];
      const pairs = await Promise.all(result.emisiones.map(async item => [item.id, (await json<{ copias: Copia[] }>(`/api/admin/emisiones/${item.id}/firmado`)).copias] as const));
      if (request !== generation.current) return;
      setDocumento(result.documento); setValues(result.documento.data); setEmisiones(result.emisiones); setAdjuntos(images); setCopias(Object.fromEntries(pairs));
    } catch (cause) { if (request === generation.current) setError(errorMessage(cause)); }
    finally { if (request === generation.current) setBusy(false); }
  }
  React.useEffect(() => {
    if (opened.current || !initialDocument || !documents.some(d => d.id === initialDocument)) return;
    opened.current = true;
    void open(initialDocument);
    // Abre una sola vez el documento pedido en la dirección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, initialDocument]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (working.current || dirty) return; setError(""); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const formatoId = String(form.get("formatoId"));
      const valor = formatoId === "08" ? String(form.get("valorReferencia") ?? "") : "";
      const now = new Date();
      const data = formatoId === "01" ? {
        fechaEmision: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente", transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente",
      } : formatoId === "08" ? { erogaciones: CARGOS_NETO.map(item => ({ concepto: item.key, estado: "Pendiente", justificacion: "" })) } : {};
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${op.id}/formatos`, post({ formatoId, data, ...(valor ? { valorReferencia: { id: valor.split(":")[0], version: Number(valor.split(":")[1]) } } : {}) }));
      onDocumentsChange(items => [result.documento, ...items]);
      setDocumento(result.documento); setValues(result.documento.data); setEmisiones([]); setCopias({}); setAdjuntos([]);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function persist(target: Documento) {
    const result = await json<{ documento: Documento }>(`/api/admin/formatos/${target.id}`, post({ version: target.version, data: values }, "PUT"));
    setDocumento(result.documento); setValues(result.documento.data);
    onDocumentsChange(items => items.map(item => item.id === result.documento.id ? result.documento : item));
    return result.documento;
  }
  async function save() {
    if (!documento || working.current) return;
    setError(""); setBusy(true);
    try { await persist(documento); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function emit() {
    if (!documento || working.current || dirty) return;
    setError(""); setBusy(true);
    try { const result = await json<{ emision: Emision }>(`/api/admin/formatos/${documento.id}/emitir`, post({ version: documento.version })); setEmisiones(items => [result.emision, ...items]); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function saveAndDownloadAviso() {
    if (!documento || documento.formato_id !== "01" || working.current) return;
    if (validateFormato("01", { ...values, folio: op.folio }).length) return;
    setError(""); setBusy(true); setPdfBusy(true);
    try {
      const saved = dirty ? await persist(documento) : documento;
      let emission = emisiones.find(item => item.draft_version === saved.version && item.plantillaVersion === AVISO_TEMPLATE_VERSION);
      if (!emission) { emission = (await json<{ emision: Emision }>(`/api/admin/formatos/${saved.id}/emitir`, post({ version: saved.version }))).emision; const created = emission; setEmisiones(items => [created, ...items]); }
      await downloadAdminPdf(`/api/admin/emisiones/${emission.id}/descargar`, `Fortius-Aviso-de-privacidad-v${saved.version}.pdf`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo descargar el aviso"); }
    finally { setBusy(false); setPdfBusy(false); }
  }
  async function downloadWord() {
    if (!documento || working.current || dirty) return;
    setError(""); setBusy(true);
    try { await downloadFormatoCopia(documento, op.folio); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function uploadSigned(emissionId: string, event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget; event.preventDefault(); setError(""); setBusy(true);
    try { const result = await json<{ copia: Copia }>(`/api/admin/emisiones/${emissionId}/firmado`, { method: "POST", body: new FormData(form) }); setCopias(current => ({ ...current, [emissionId]: [result.copia, ...(current[emissionId] ?? [])] })); form.reset(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget; event.preventDefault(); if (!documento) return; setError(""); setBusy(true);
    try { const result = await json<{ adjunto: Adjunto }>(`/api/admin/formatos/${documento.id}/adjuntos`, { method: "POST", body: new FormData(form) }); setAdjuntos(current => [...current, result.adjunto]); form.reset(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  const definition = documento ? formatoById(documento.formato_id) : null;
  const avisoPdf = emisiones.find(item => item.draft_version === documento?.version && item.plantillaVersion === AVISO_TEMPLATE_VERSION);
  const missing = definition ? validateFormato(definition.id, { ...values, folio: op.folio }) : [];
  const budget = definition?.id === "19" && !missing.length ? calcularPresupuesto(values) : null;
  const net = definition?.id === "08" && !missing.length ? calcularNeto({ ...values, folio: op.folio }) : null;

  return <div className="flex min-w-0 flex-col gap-5">
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Card className="flex flex-col gap-4 p-5" aria-label="Documentos de la operación">
      <div className="flex flex-col gap-1"><h2 className="m-0 text-lg">Documentos de la operación</h2><p className="text-sm text-muted-foreground">Elige un formato para empezar su borrador. Cada vez que guardas se crea una versión nueva.</p></div>
      <details className="text-sm text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">Sobre los formatos y su PDF</summary><div className="mt-2 flex flex-col gap-1.5"><p>{FORMATOS.filter(item => item.readyForEmission && !item.globalRoute).length} formatos generan su PDF desde la operación, cuando su captura y revisión están completas.</p><p>El <Link href="/admin/control-comercial" className="font-semibold text-foreground underline">03 · Control comercial</Link> reúne carteras, historial y PDF en su propia sección.</p><p>09 · Contrato de intermediación: puedes preparar la captura; su PDF espera el registro y el cotejo del modelo registrado.</p></div></details>
      <form id="exp-documentos" onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 w-full flex-1 text-sm">Formato<select name="formatoId" required className={selectClass}>{FORMATOS.filter(item => !item.globalRoute).map(item => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label>
        <button type="submit" disabled={busy || dirty} className={btnPrimary}>Crear borrador</button>
        {documents.some(d => d.formato_id === "07") && <label className="w-full text-sm">Solo para el neto (08): usar una opinión de valor (07) revisada<select name="valorReferencia" className={selectClass}><option value="">No usarla · conservar lo capturado</option>{documents.filter(d => d.formato_id === "07").map(d => <option key={d.id} value={`${d.id}:${d.version}`}>Opinión de valor · versión {d.version}</option>)}</select><span className="mt-1 block text-muted-foreground">El valor sugerido se distingue del precio acordado.</span></label>}
      </form>
      {documents.length ? <ul className="flex flex-wrap gap-2">{documents.map(item => <li key={item.id}><button type="button" disabled={busy} aria-pressed={documento?.id === item.id} onClick={() => void open(item.id)} className={btnGhost}>{item.formato_id} · {formatoById(item.formato_id).title} · versión {item.version}</button></li>)}</ul>
        : <EmptyBox title="Todavía no hay documentos">Crea el primero con el formato que necesites.</EmptyBox>}
    </Card>
    {documento && definition && <Card className="p-5" aria-label={definition.title}>
      <h2 className="m-0 text-xl">{definition.title}</h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">Versión {documento.version} · Actualizado el {shortDate(documento.updated_at)}</p>
      {!!values.origenDatos && <p className="mb-4 rounded-md border border-border bg-secondary/20 p-3 text-sm">Este borrador usa datos de la operación y de la entrevista. Lo declarado necesita comprobarse: revisa diferencias y datos pendientes antes de generar el PDF. Llenarlo así no registra consentimiento, aprobación ni firmas.</p>}
      <fieldset disabled={busy} className="min-w-0">
        <FormatoEditor key={documento.id} definition={definition} values={{ ...values, folio: op.folio }} images={adjuntos} onChange={(key, value) => setValues(current => ({ ...current, [key]: value }))} />
        {WITH_IMAGES.includes(definition.id) && <div className="mt-6 rounded-lg border border-border p-4">
          <h3 className="font-semibold">Fotografías y croquis privados</h3>
          <p className="mt-1 text-sm text-muted-foreground">Registra de dónde viene cada imagen y su fecha. Elige la fotografía principal y el croquis que irán en el PDF y guarda antes de generarlo. La opinión de valor (07) exige fecha en sus fotografías.</p>
          <form onSubmit={uploadImage} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">Tipo<select name="tipo" required className={selectClass}><option value="foto">Fotografía</option><option value="croquis">Croquis o plano</option><option value="soporte">Soporte gráfico</option></select></label>
            <label className="text-sm">Fecha en que se tomó<input name="fechaObservacion" type="date" className={inputClass} /></label>
            <label className="text-sm">Descripción<input name="descripcion" required maxLength={240} className={inputClass} /></label>
            <label className="text-sm">Fuente o autor<input name="fuente" required maxLength={240} className={inputClass} /></label>
            <label className="text-sm md:col-span-2">Imagen JPEG o PNG, máximo 10 MB<input name="archivo" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" required className={inputClass} /></label>
            <button type="submit" disabled={busy} className={btnGhost}>Guardar imagen</button>
          </form>
          {adjuntos.length > 0 && <ul className="mt-4 space-y-2 text-sm">{adjuntos.map(item => <li key={item.id}><a className="text-primary-ink underline" href={`/api/admin/adjuntos/${item.id}/descargar`} target="_blank" rel="noreferrer">{item.caption}</a> · {item.kind} · {item.source}{item.observed_on ? ` · ${item.observed_on}` : ""}</li>)}</ul>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">{[{ key: "fotoPrincipalId", kind: "foto", label: "Fotografía principal del PDF" }, { key: "croquisId", kind: "croquis", label: "Croquis del PDF" }].map(slot => <label key={slot.key} className="text-sm">{slot.label}<select value={String(values[slot.key] ?? "")} onChange={event => setValues(current => ({ ...current, [slot.key]: event.target.value }))} className={selectClass}><option value="">Elige una imagen</option>{adjuntos.filter(item => item.kind === slot.kind).map(item => <option key={item.id} value={item.id}>{item.caption}</option>)}</select></label>)}</div>
        </div>}
        {missing.length > 0 && <p className="mt-5 text-sm text-muted-foreground">Para generar el PDF faltan: {missing.join(", ")}.</p>}
        {budget && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Resumen calculado</h3><p>Subtotal cotizado: {formatAmount(budget.subtotalCotizado)} {String(values.moneda)}</p><p>Autorizado: {budget.autorizadoMenosPagado === null ? "Sin partidas autorizadas" : `${formatAmount(budget.importeAutorizado)} ${String(values.moneda)}`}</p><p>Estimación con reserva: {formatAmount(budget.estimacionConReserva)} {String(values.moneda)}</p><p>Pagado: {formatAmount(budget.totalPagado)} {String(values.moneda)}</p></div>}
        {net && <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm"><h3 className="font-semibold">Neto estimado</h3><p>Precio usado: {formatAmount(net.precioBase)} MXN</p><p>Gastos: {formatAmount(net.erogaciones)} MXN</p><p className="font-semibold">Neto: {formatAmount(net.netoEstimado)} MXN</p></div>}
        {dirty && <p className="mt-5 text-sm text-muted-foreground">{definition.id === "01" ? "Al descargar el PDF se guardan los datos que estás viendo." : "Guarda los cambios antes de generar el PDF."}</p>}
        {dirty && <button type="button" disabled={busy} className={btnGhost + " mt-3"} onClick={async () => { if (await confirmAction("¿Descartar los cambios sin guardar de este borrador?")) { setValues(documento.data); setError(""); } }}>Descartar cambios sin guardar</button>}
        {!definition.readyForEmission && <p className="mt-5 text-sm text-muted-foreground">Este formato todavía se está cotejando con el original; por ahora no se puede generar su PDF.</p>}
        <div className="mt-5 flex flex-wrap gap-3">{definition.id === "01" ? <>
          <button type="button" onClick={() => void saveAndDownloadAviso()} disabled={busy || missing.length > 0} className={btnPrimary}>{pdfBusy ? "Preparando PDF…" : "Guardar y descargar PDF"}</button>
          <button type="button" onClick={() => void save()} disabled={busy} className={btnGhost}>Guardar borrador</button>
          <button type="button" onClick={() => void downloadWord()} disabled={busy || dirty} className={btnGhost}>Descargar {copiaEditable(documento.formato_id)}</button>
        </> : <>
          <button type="button" onClick={() => void save()} disabled={busy} className={btnPrimary}>Guardar borrador</button>
          <button type="button" onClick={() => void emit()} disabled={busy || dirty || missing.length > 0 || !definition.readyForEmission} className={btnGhost}>Generar PDF</button>
          <button type="button" onClick={() => void downloadWord()} disabled={busy || dirty} className={btnGhost}>Descargar {copiaEditable(documento.formato_id)}</button>
        </>}</div>
        <p className="mt-2 text-sm text-muted-foreground">{dirty ? `Guarda los cambios para descargar el ${copiaEditable(documento.formato_id)}.` : `Descárgalo en PDF o en ${copiaEditable(documento.formato_id)}, como prefieras. La copia editable sale de la versión guardada; el PDF queda archivado con su huella.`}</p>
        {definition.id === "01" && !dirty && avisoPdf && <p role="status" className="mt-3 text-sm"><a className="text-primary-ink underline" href={`/api/admin/emisiones/${avisoPdf.id}/descargar`}>Descargar PDF del aviso</a> · Versión {documento.version}</p>}
        {emisiones.length > 0 && <div className="mt-6 border-t border-border pt-4"><h3 className="font-semibold">PDF generados</h3><ul className="mt-2 space-y-5">{emisiones.map(item => <li key={item.id} className="rounded-md border border-border p-3">
          <a className="text-primary-ink underline" href={`/api/admin/emisiones/${item.id}/descargar`}>PDF de la versión {item.draft_version} · {new Date(item.created_at).toLocaleString("es-MX")}</a>
          <form onSubmit={event => void uploadSigned(item.id, event)} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">Agregar la copia firmada<input name="archivo" type="file" accept="application/pdf,.pdf" required className={inputClass} /></label><button type="submit" disabled={busy} className={btnGhost}>Guardar copia firmada</button></form>
          {(copias[item.id] ?? []).map(copy => <a key={copy.id} className="mt-2 block text-sm text-primary-ink underline" href={`/api/admin/copias-firmadas/${copy.id}/descargar`}>Copia firmada · {new Date(copy.created_at).toLocaleString("es-MX")}</a>)}
        </li>)}</ul></div>}
      </fieldset>
    </Card>}
  </div>;
}
