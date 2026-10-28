"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileDown, FileText, X } from "@/components/admin/icons";
import { Button, Eyebrow } from "@/components/admin/kit";
import { PageHeader, inputClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { FormatoImages, WITH_IMAGES, type Adjunto, type ImagesSource } from "@/components/admin/operation/formato-images";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { apiRequest, errorMessage, uploadFile } from "@/lib/admin/store";
import { adjuntosDe, DOCUMENTOS_APP, FOLIO_INDEPENDIENTE, FORMATOS_INDEPENDIENTES } from "@/lib/apps/documentos";
import type { AppRun } from "@/lib/apps/types";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { VALOR_DEFAULTS } from "@/lib/formatos/valor-fields";
import { copiaEditable, downloadValorExcel } from "@/lib/admin/download-word";
import { cn } from "@/lib/utils";

/*
  Documentos sin expediente: acceso directo a opiniones, contratos y propuestas sin recorrer
  las etapas de una operación. Misma captura por secciones y mismo diseño de plantilla que en
  el expediente; se guarda como trabajo de Herramientas y el PDF no se archiva.
*/

type Values = Record<string, unknown>;
type Open = { run: AppRun | null; formatoId: string; title: string };
const IMAGES = "Fotografías y croquis";
const safeName = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const imageUrl = (id: string) => `/api/admin/apps/media?id=${encodeURIComponent(id)}`;
const formatoOf = (run: AppRun) => String(run.input.formatoId ?? "");

export function DocumentosSinExpediente() {
  const [runs, setRuns] = React.useState<AppRun[] | null>(null), [next, setNext] = React.useState<number | null>(null);
  const [deleted, setDeleted] = React.useState(false), [error, setError] = React.useState("");
  const [name, setName] = React.useState(""), [open, setOpen] = React.useState<Open | null>(null);

  const load = React.useCallback(async (offset = 0) => {
    const response = await apiRequest<{ runs: AppRun[]; nextOffset: number | null }>(`/api/admin/apps/runs?slug=${DOCUMENTOS_APP}&offset=${offset}&deleted=${deleted}`);
    setRuns(old => offset ? [...(old ?? []), ...response.runs] : response.runs); setNext(response.nextOffset);
  }, [deleted]);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ runs: AppRun[]; nextOffset: number | null }>(`/api/admin/apps/runs?slug=${DOCUMENTOS_APP}&offset=0&deleted=${deleted}`)
      .then(response => { if (active) { setRuns(response.runs); setNext(response.nextOffset); } })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [deleted]);

  async function openRun(run: AppRun) {
    try { const response = await apiRequest<{ run: AppRun }>(`/api/admin/apps/runs/${run.id}`); setOpen({ run: response.run, formatoId: formatoOf(response.run), title: response.run.title }); }
    catch (e) { setError(errorMessage(e)); }
  }
  async function toggle(run: AppRun) {
    if (!await confirmAction(deleted ? "¿Restaurar este documento?" : "¿Mover este documento a Eliminados? Podrás restaurarlo.")) return;
    try { await apiRequest(`/api/admin/apps/runs/${run.id}`, "PATCH", { version: run.version, deleted: !deleted }); await load(); }
    catch (e) { setError(errorMessage(e)); }
  }

  return <div className="flex flex-col gap-6">
    <Link href="/admin/herramientas" className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} aria-hidden="true" />Todas las aplicaciones</Link>
    <PageHeader title="Documentos sin expediente" description="Prepara una opinión, un contrato o una propuesta sin pasar por las etapas de una operación. Se captura igual y sale con el diseño de su plantilla." />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

    <section aria-labelledby="nuevo-documento" className="flex flex-col gap-3">
      <h2 id="nuevo-documento" className="m-0 text-lg font-bold">Nuevo documento</h2>
      <label className="flex max-w-md flex-col gap-1 text-sm">Nombre para encontrarlo después (opcional)
        <input className={inputClass} value={name} maxLength={120} placeholder="Ej. Casa en Playas, Sr. López" onChange={e => setName(e.target.value)} />
      </label>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{FORMATOS_INDEPENDIENTES.map(id => {
        const definition = formatoById(id);
        return <li key={id}><button type="button" className="flex w-full flex-col items-start gap-0.5 rounded-[12px] border border-border p-3 text-left hover:bg-secondary/60"
          onClick={() => setOpen({ run: null, formatoId: id, title: name.trim() ? `${definition.title} · ${name.trim()}` : definition.title })}>
          <span className="font-mono text-xs text-muted-foreground">{id}{definition.readyForEmission ? "" : " · solo Word"}</span>
          <span className="font-semibold">{definition.title}</span>
        </button></li>;
      })}</ul>
    </section>

    <section aria-labelledby="mis-documentos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="mis-documentos" className="m-0 text-lg font-bold">{deleted ? "Documentos eliminados" : "Mis documentos"}</h2>
        <Button variant="ghost" onClick={() => setDeleted(!deleted)}>{deleted ? "Ver activos" : "Ver eliminados"}</Button>
      </div>
      {runs === null ? <p role="status" className="text-sm text-muted-foreground">Consultando documentos…</p>
        : runs.length === 0 ? <p className="text-sm text-muted-foreground">{deleted ? "No hay documentos eliminados." : "Todavía no hay documentos. Elige un formato arriba para empezar."}</p>
        : <ul className="flex flex-col divide-y divide-border rounded-[12px] border border-border">{runs.map(run => <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0"><p className="m-0 font-semibold [overflow-wrap:anywhere]">{run.title}</p>
            <p className="m-0 text-xs text-muted-foreground">{formatoOf(run)} · versión {run.version} · {new Date(run.updatedAt).toLocaleDateString("es-MX")}</p></div>
          <div className="flex gap-2">{!deleted && <Button variant="ghost" onClick={() => void openRun(run)}>Abrir</Button>}<Button variant="ghost" onClick={() => void toggle(run)}>{deleted ? "Restaurar" : "Eliminar"}</Button></div>
        </li>)}</ul>}
      {next !== null && <Button variant="ghost" className="self-start" onClick={() => load(next).catch(e => setError(errorMessage(e)))}>Cargar más</Button>}
    </section>

    {open && <Captura key={open.run?.id ?? open.formatoId} open={open} onSaved={() => void load().catch(() => undefined)} onClose={() => { setOpen(null); setName(""); }} />}
  </div>;
}

function Captura({ open, onSaved, onClose }: { open: Open; onSaved: () => void; onClose: () => void }) {
  const definition = formatoById(open.formatoId);
  const [run, setRun] = React.useState(open.run);
  // Un documento nuevo trae los textos que su plantilla ya tiene escritos (07: empresa, contacto, supuestos…).
  const saved = (run?.input.data ?? (definition.id === "07" ? VALOR_DEFAULTS : {})) as Values;
  const [values, setValues] = React.useState<Values>(saved);
  const [draftId] = React.useState(() => crypto.randomUUID());
  const [busy, setBusy] = React.useState(""), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const sections = React.useMemo(() => {
    const list = [...new Set(definition.fields.map(f => f.section ?? "Datos"))];
    if (!WITH_IMAGES.includes(definition.id)) return list;
    // Las imágenes se suben antes del reporte fotográfico (07), para poder elegirlas en él.
    const photos = definition.fields.find(f => f.key === "fotografias")?.section;
    const at = photos ? list.indexOf(photos) : -1;
    return at < 0 ? [...list, IMAGES] : [...list.slice(0, at), IMAGES, ...list.slice(at)];
  }, [definition]);
  const [index, setIndex] = React.useState(0);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const dirty = !run || JSON.stringify(values) !== JSON.stringify(saved);
  const data = { ...values, folio: FOLIO_INDEPENDIENTE };
  const missing = validateFormato(definition.id, data);
  const sectionOf = React.useMemo(() => new Map(definition.fields.map(f => [f.label, f.section ?? "Datos"])), [definition]);
  const pendingBySection = sections.map(s => missing.filter(label => (sectionOf.get(label) ?? (label.startsWith("Selecciona") ? IMAGES : "")) === s).length);
  const section = sections[index], last = index === sections.length - 1;
  const adjuntos = adjuntosDe(values) as Adjunto[];
  const images: ImagesSource = {
    list: adjuntos, href: imageUrl,
    async upload(form) {
      const file = form.get("archivo");
      if (!(file instanceof File) || !file.size) throw new Error("Elige una imagen JPEG o PNG.");
      const uploaded = await uploadFile(file, "private");
      const stored = await apiRequest<{ file: { id: string } }>("/api/admin/apps/media", "POST", { name: file.name.slice(0, 160), mime: file.type, storagePath: uploaded.path });
      const kind = String(form.get("tipo")) as Adjunto["kind"], observed = String(form.get("fechaObservacion") ?? "");
      return { id: stored.file.id, kind, caption: String(form.get("descripcion") ?? "").trim(), source: String(form.get("fuente") ?? "").trim(), observed_on: observed || null };
    },
  };

  React.useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (dirty && Object.keys(values).length) event.preventDefault(); };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, values]);

  async function persist() {
    if (!dirty) return run!;
    const body = { slug: DOCUMENTOS_APP, title: open.title.slice(0, 160), input: { formatoId: definition.id, data: values }, result: null, context: {}, ...(run ? { id: run.id, version: run.version } : { id: draftId }) };
    const response = await apiRequest<{ run: AppRun }>("/api/admin/apps/runs", "POST", body);
    setRun(response.run); setValues(response.run.input.data as Values); onSaved();
    return response.run;
  }
  async function task(label: string, work: () => Promise<void>) {
    if (busy) return;
    setBusy(label); setError(""); setNotice("");
    try { await work(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(""); }
  }
  function go(target: number) {
    void task("Guardando…", async () => {
      await persist(); setIndex(target);
      requestAnimationFrame(() => { heading.current?.focus(); heading.current?.closest("[data-scroll]")?.scrollTo({ top: 0 }); });
    });
  }
  async function close() {
    if (dirty && Object.keys(values).length && !await confirmAction("Hay respuestas sin guardar. ¿Guardarlas y cerrar? (Cancela para seguir capturando)")) return;
    if (!dirty || !Object.keys(values).length) return onClose();
    await task("Guardando…", async () => { await persist(); onClose(); });
  }
  function pdf() {
    void task("Preparando PDF…", async () => {
      const current = await persist();
      await downloadAdminPdf(`/api/admin/apps/runs/${current.id}/documento?version=${current.version}`, `Fortius-${definition.id}-${safeName(open.title)}-v${current.version}.pdf`);
      setNotice("PDF descargado. Como no pertenece a un expediente, no se archiva en Documentos.");
    });
  }
  const copia = copiaEditable(definition.id);
  function word() {
    void task(`Preparando ${copia}…`, async () => {
      const current = await persist();
      if (definition.id === "07") {
        await downloadValorExcel({ ...(current.input.data as Values), folio: FOLIO_INDEPENDIENTE }, `Fortius-07-${safeName(open.title)}-v${current.version}`);
        setNotice("Copia en Excel descargada.");
        return;
      }
      const { formatoDocxBlob } = await import("@/lib/formatos/docx");
      const blob = await formatoDocxBlob(definition, { ...(current.input.data as Values), folio: FOLIO_INDEPENDIENTE }, { folio: FOLIO_INDEPENDIENTE, imageUrl });
      const url = URL.createObjectURL(blob), link = window.document.createElement("a");
      link.href = url; link.download = `Fortius-${definition.id}-${safeName(open.title)}-v${current.version}.docx`;
      window.document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setNotice("Copia en Word descargada.");
    });
  }

  const sectionDefinition = { ...definition, fields: definition.fields.filter(f => (f.section ?? "Datos") === section) };
  return <div role="dialog" aria-modal="true" aria-labelledby="documento-titulo" className="fixed inset-0 z-[70] flex flex-col bg-background text-foreground">
    <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow>{definition.id} · {FOLIO_INDEPENDIENTE}{run ? ` · versión ${run.version}` : ""}</Eyebrow>
        <h2 id="documento-titulo" className="m-0 text-lg font-bold [overflow-wrap:anywhere]">{open.title}</h2>
      </div>
      <Button variant="ghost" iconOnly aria-label="Cerrar" disabled={!!busy} onClick={() => void close()}><X size={20} aria-hidden="true" /></Button>
    </header>
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Secciones" className="hidden w-72 shrink-0 overflow-auto border-r border-border p-4 lg:block">
        <ol className="flex flex-col gap-1">{sections.map((item, i) => <li key={item}>
          <button type="button" aria-current={i === index ? "step" : undefined} disabled={!!busy} onClick={() => i !== index && go(i)}
            className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm", i === index ? "bg-secondary font-semibold" : "hover:bg-secondary/60")}>
            {pendingBySection[i] === 0 ? <Check size={15} aria-hidden="true" className="shrink-0 text-[var(--success,#2f7d4f)]" /> : <span className="w-[15px] shrink-0 text-center font-mono text-xs">{i + 1}</span>}
            <span className="flex-1">{item}</span>
            {pendingBySection[i] > 0 && <span className="font-mono text-xs text-muted-foreground" aria-label={`${pendingBySection[i]} pendientes`}>{pendingBySection[i]}</span>}
          </button>
        </li>)}</ol>
      </nav>
      <div data-scroll className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <p className="font-mono text-xs text-muted-foreground lg:hidden">Sección {index + 1} de {sections.length}</p>
          <h3 ref={heading} tabIndex={-1} className="m-0 text-xl font-bold">{section}</h3>
          {section === IMAGES ? <FormatoImages documentId={run?.id ?? draftId} values={values} disabled={!!busy} source={images} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            : <fieldset disabled={!!busy} className="min-w-0">
              <FormatoEditor key={`${definition.id}-${section}`} definition={sectionDefinition} images={adjuntos} extras={sections.filter(item => item !== IMAGES).at(-1) === section} values={data} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            </fieldset>}
          {last && <div className="flex flex-col gap-3 rounded-[12px] border border-border p-4">
            <p className="font-semibold">{missing.length ? `Para generar el PDF faltan ${missing.length} ${missing.length === 1 ? "respuesta" : "respuestas"}:` : "Captura completa. Ya puedes generar el PDF."}</p>
            {missing.length > 0 && <p className="text-sm text-muted-foreground">{missing.slice(0, 12).join(" · ")}{missing.length > 12 ? ` y ${missing.length - 12} más` : ""}</p>}
            {!definition.readyForEmission && <p className="text-sm text-muted-foreground">El PDF de este formato sigue bloqueado hasta cotejar el modelo registrado. Usa «Descargar Word».</p>}
          </div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        </div>
      </div>
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-8">
      <div className="flex gap-2">
        {index > 0 && <Button variant="ghost" disabled={!!busy} onClick={() => go(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Atrás</Button>}
        <Button disabled={!!busy || !dirty} onClick={() => void task("Guardando…", async () => { await persist(); setNotice("Guardado"); })}>{busy === "Guardando…" ? busy : "Guardar"}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {copia && <Button variant="ghost" disabled={!!busy} onClick={word}><FileText size={16} aria-hidden="true" />{busy === `Preparando ${copia}…` ? busy : `Descargar ${copia}`}</Button>}
        {/* La opinión de valor se descarga en PDF desde cualquier sección, aunque falten datos. */}
        {!last && definition.id === "07" && <Button variant="ghost" disabled={!!busy} onClick={pdf}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Descargar PDF"}</Button>}
        {last ? <Button variant="primary" disabled={!!busy || missing.length > 0 || !definition.readyForEmission} onClick={pdf}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Terminar y descargar PDF"}</Button>
          : <Button variant="primary" disabled={!!busy} onClick={() => go(index + 1)}>Siguiente sección<ArrowRight size={16} aria-hidden="true" /></Button>}
      </div>
    </footer>
  </div>;
}
