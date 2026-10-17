"use client";
import * as React from "react";
import { ArrowLeft, ArrowRight, Check, FileDown, FileText, X } from "lucide-react";
import { Button, Eyebrow, Notice } from "@/components/admin/kit";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { copiaEditable, downloadFormatoCopia } from "@/lib/admin/download-word";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { cn } from "@/lib/utils";
import type { Documento } from "./documents-tab";
import { FormatoImages, WITH_IMAGES, type Adjunto } from "./formato-images";

/*
  Captura guiada de un formato desde su etapa (decisión del titular, 16/10/2026):
  una sección por pantalla, se guarda al avanzar y, al terminar, se genera el PDF
  y se puede descargar una copia en Word. Sirve para la entrevista inicial (02)
  y, en las fases siguientes, para levantamiento, dictamen jurídico y opinión de valor.
*/

export type Emision = { id: string; draft_version: number; created_at: string; plantillaVersion?: string };
const post = (body: unknown, method = "POST") => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const IMAGES = "Fotografías y croquis";
const safeName = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function FormatoCapture({ document: initial, folio, cliente, onSaved, onEmitted, onClose }: {
  document: Documento; folio: string; cliente?: string;
  onSaved: (document: Documento) => void; onEmitted: (emision: Emision) => void; onClose: () => void;
}) {
  const definition = formatoById(initial.formato_id);
  const [doc, setDoc] = React.useState(initial);
  const [values, setValues] = React.useState<Record<string, unknown>>(initial.data);
  const [emisiones, setEmisiones] = React.useState<Emision[] | null>(null);
  const [busy, setBusy] = React.useState(""), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  // Las imágenes se suben antes de la sección que las usa (el reporte fotográfico del 07); si ninguna las usa, van al final.
  const sections = React.useMemo(() => {
    const names = [...new Set(definition.fields.map(f => f.section ?? "Datos"))];
    if (!WITH_IMAGES.includes(definition.id)) return names;
    const user = definition.fields.find(f => f.key === "fotografias")?.section;
    const at = user ? names.indexOf(user) : -1;
    return at < 0 ? [...names, IMAGES] : [...names.slice(0, at), IMAGES, ...names.slice(at)];
  }, [definition]);
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[]>([]);
  const [index, setIndex] = React.useState(0);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(doc.data);
  const data = { ...values, folio };
  const missing = validateFormato(definition.id, data);
  const sectionOf = React.useMemo(() => new Map(definition.fields.map(f => [f.label, f.section ?? "Datos"])), [definition]);
  const pendingBySection = sections.map(section => missing.filter(label => (sectionOf.get(label) ?? (label.startsWith("Selecciona") ? IMAGES : "")) === section).length);
  const section = sections[index], last = index === sections.length - 1;
  const current = emisiones?.find(e => e.draft_version === doc.version);

  React.useEffect(() => {
    let alive = true;
    json<{ emisiones: Emision[] }>(`/api/admin/formatos/${doc.id}`).then(r => { if (alive) setEmisiones(r.emisiones); }).catch(() => { if (alive) setEmisiones([]); });
    return () => { alive = false; };
  }, [doc.id]);
  // Lista de imágenes para los campos que las eligen (p. ej. «Fotografías pertinentes» del 07); se renueva al salir de la sección de imágenes.
  const withImages = WITH_IMAGES.includes(definition.id), onImages = section === IMAGES;
  React.useEffect(() => {
    if (!withImages || onImages) return;
    let alive = true;
    json<{ adjuntos: Adjunto[] }>(`/api/admin/formatos/${doc.id}/adjuntos`).then(r => { if (alive) setAdjuntos(r.adjuntos); }).catch(() => { /* la sección de imágenes muestra el error */ });
    return () => { alive = false; };
  }, [doc.id, withImages, onImages]);
  React.useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);

  async function persist() {
    if (!dirty) return doc;
    const result = await json<{ documento: Documento }>(`/api/admin/formatos/${doc.id}`, post({ version: doc.version, data: values }, "PUT"));
    setDoc(result.documento); setValues(result.documento.data); onSaved(result.documento);
    return result.documento;
  }
  async function run(label: string, task: () => Promise<void>) {
    if (busy) return;
    setBusy(label); setError(""); setNotice("");
    try { await task(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(""); }
  }
  function go(next: number) {
    void run("Guardando…", async () => {
      await persist();
      setIndex(next);
      requestAnimationFrame(() => { heading.current?.focus(); heading.current?.closest("[data-scroll]")?.scrollTo({ top: 0 }); });
    });
  }
  async function close() {
    if (dirty && !await confirmAction("Hay respuestas sin guardar. ¿Guardarlas y cerrar? (Cancela para seguir capturando)")) return;
    await run("Guardando…", async () => { await persist(); onClose(); });
  }
  function pdf() {
    void run("Preparando PDF…", async () => {
      const saved = await persist();
      if (validateFormato(definition.id, { ...saved.data, folio }).length) throw new Error("Faltan respuestas obligatorias para generar el PDF.");
      let emision = emisiones?.find(e => e.draft_version === saved.version);
      if (!emision) {
        emision = (await json<{ emision: Emision }>(`/api/admin/formatos/${saved.id}/emitir`, post({ version: saved.version }))).emision;
        const created = emision;
        setEmisiones(items => [created, ...(items ?? [])]); onEmitted(created);
      }
      await downloadAdminPdf(`/api/admin/emisiones/${emision.id}/descargar`, `Fortius-${definition.id}-${safeName(definition.title)}-${folio}-v${saved.version}.pdf`);
      setNotice("PDF generado y descargado. Queda guardado en Documentos.");
    });
  }
  const copia = copiaEditable(definition.id);
  function word() {
    void run(`Preparando ${copia}…`, async () => {
      const saved = await persist();
      await downloadFormatoCopia(saved, folio, cliente);
      setNotice(`Copia en ${copia} descargada.`);
    });
  }

  const sectionDefinition = { ...definition, fields: definition.fields.filter(f => (f.section ?? "Datos") === section) };
  return <div role="dialog" aria-modal="true" aria-labelledby="captura-titulo" className="fixed inset-0 z-[70] flex flex-col bg-background text-foreground">
    <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow>{definition.id} · {folio}{cliente ? ` · ${cliente}` : ""}</Eyebrow>
        <h2 id="captura-titulo" className="m-0 text-lg font-bold">{definition.title}</h2>
      </div>
      <Button variant="ghost" iconOnly aria-label="Cerrar" disabled={!!busy} onClick={() => void close()}><X size={20} aria-hidden="true" /></Button>
    </header>
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Secciones" className="hidden w-72 shrink-0 overflow-auto border-r border-border p-4 lg:block">
        <ol className="flex flex-col gap-1">{sections.map((name, i) => <li key={name}>
          <button type="button" aria-current={i === index ? "step" : undefined} disabled={!!busy} onClick={() => i !== index && go(i)}
            className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm", i === index ? "bg-secondary font-semibold" : "hover:bg-secondary/60")}>
            {pendingBySection[i] === 0 ? <Check size={15} aria-hidden="true" className="shrink-0 text-[var(--success,#2f7d4f)]" /> : <span className="w-[15px] shrink-0 text-center font-mono text-xs">{i + 1}</span>}
            <span className="flex-1">{name}</span>
            {pendingBySection[i] > 0 && <span className="font-mono text-xs text-muted-foreground" aria-label={`${pendingBySection[i]} pendientes`}>{pendingBySection[i]}</span>}
          </button>
        </li>)}</ol>
      </nav>
      <div data-scroll className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <p className="font-mono text-xs text-muted-foreground lg:hidden">Sección {index + 1} de {sections.length}</p>
          <h3 ref={heading} tabIndex={-1} className="m-0 text-xl font-bold">{section}</h3>
          {index === 0 && !!values.origenDatos && <Notice tone="info">Algunas respuestas vienen del primer contacto. Confírmalas con el propietario: lo declarado todavía debe comprobarse.</Notice>}
          {section === IMAGES ? <FormatoImages documentId={doc.id} values={values} disabled={!!busy} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            : <fieldset disabled={!!busy} className="min-w-0">
              <FormatoEditor key={`${doc.id}-${section}`} definition={sectionDefinition} extras={sections.filter(name => name !== IMAGES).at(-1) === section} values={data} images={adjuntos} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            </fieldset>}
          {last && <div className="flex flex-col gap-3 rounded-[12px] border border-border p-4">
            <p className="font-semibold">{missing.length ? `Para generar el PDF faltan ${missing.length} ${missing.length === 1 ? "respuesta" : "respuestas"}:` : "Captura completa. Ya puedes generar el PDF."}</p>
            {missing.length > 0 && <p className="text-sm text-muted-foreground">{missing.slice(0, 12).join(" · ")}{missing.length > 12 ? ` y ${missing.length - 12} más` : ""}</p>}
            {!definition.readyForEmission && <p className="text-sm text-muted-foreground">El PDF de este formato sigue bloqueado hasta cotejar el modelo registrado. Usa «Descargar Word».</p>}
            {current && <p className="text-sm">Ya hay un PDF de esta versión. <a className="font-semibold underline" href={`/api/admin/emisiones/${current.id}/descargar`}>Descargarlo otra vez</a></p>}
          </div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        </div>
      </div>
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-8">
      <div className="flex gap-2">
        {index > 0 && <Button variant="ghost" disabled={!!busy} onClick={() => go(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Atrás</Button>}
        <Button disabled={!!busy || !dirty} onClick={() => void run("Guardando…", async () => { await persist(); setNotice("Guardado"); })}>{busy === "Guardando…" ? busy : "Guardar"}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" disabled={!!busy} onClick={word}><FileText size={16} aria-hidden="true" />{busy === `Preparando ${copia}…` ? busy : `Descargar ${copia}`}</Button>
        {/* La opinión de valor se descarga en PDF desde cualquier sección, aunque falten datos. */}
        {!last && definition.id === "07" && <Button variant="ghost" disabled={!!busy} onClick={pdf}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Descargar PDF"}</Button>}
        {last ? <Button variant="primary" disabled={!!busy || missing.length > 0 || !definition.readyForEmission} onClick={pdf}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Terminar y descargar PDF"}</Button>
          : <Button variant="primary" disabled={!!busy} onClick={() => go(index + 1)}>Siguiente sección<ArrowRight size={16} aria-hidden="true" /></Button>}
      </div>
    </footer>
  </div>;
}
