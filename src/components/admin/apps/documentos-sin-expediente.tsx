"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileDown, FileText, X } from "@/components/admin/icons";
import { Button, Card, EmptyBox, Eyebrow, Notice, Segmented } from "@/components/admin/kit";
import { PageHeader, inputClass } from "@/components/admin/ui";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { FormatoImages, WITH_IMAGES, type Adjunto, type ImagesSource } from "@/components/admin/operation/formato-images";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { apiRequest, errorMessage, uploadFile } from "@/lib/admin/store";
import { adjuntosDe, DOCUMENTOS_APP, FOLIO_INDEPENDIENTE, FORMATOS_INDEPENDIENTES, gruposDeFormatos, WORD_LLENO_EXCLUIDOS } from "@/lib/apps/documentos";
import type { AppRun } from "@/lib/apps/types";
import { emiteIncompleto, formatoById, validateFormato, type FormatoDefinition } from "@/lib/formatos/catalog";
import { VALOR_DEFAULTS } from "@/lib/formatos/valor-fields";
import { downloadValorExcel } from "@/lib/admin/download-word";
import { cn, humanDateTime } from "@/lib/utils";

/*
  Documentos sueltos (HER-02): cualquier formato sin abrir una operación ni un prospecto.
  «Llenar con datos» abre el formato en su propia ventana, con la misma captura por secciones y el
  mismo diseño de plantilla que en el expediente; «En blanco» descarga el machote con el membrete
  para que el cliente lo revise o se llene a mano. Nada se bloquea por datos faltantes (RP-77):
  el PDF sale marcado como incompleto, salvo el aviso de privacidad (01) y la promesa (15), que
  conservan sus reglas. El contrato 09 sale en Word mientras su PDF siga pendiente (DOC-09).
  Lo lleno se guarda como trabajo de Herramientas (con versiones); el PDF no se archiva.
*/

type Values = Record<string, unknown>;
type Open = { run: AppRun | null; formatoId: string; title: string; seccion?: string };
type Vista = "llenar" | "blanco";
const IMAGES = "Fotografías y croquis";
const safeName = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const imageUrl = (id: string) => `/api/admin/apps/media?id=${encodeURIComponent(id)}`;
const formatoOf = (run: AppRun) => String(run.input.formatoId ?? "");
const isFormato = (id: string | null): id is typeof FORMATOS_INDEPENDIENTES[number] => !!id && (FORMATOS_INDEPENDIENTES as readonly string[]).includes(id);
/** Copia editable de un formato: la opinión de valor en Excel (su plantilla original); los demás en Word. */
const copiaDe = (id: string) => id === "07" ? "Excel" : "Word";

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = window.document.createElement("a");
  link.href = url; link.download = name;
  window.document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function wordDe(definition: FormatoDefinition, data: Values, nombre: string) {
  if (definition.id === "07") return downloadValorExcel(data, nombre);
  const { formatoDocxBlob } = await import("@/lib/formatos/docx");
  saveBlob(await formatoDocxBlob(definition, data, { folio: String(data.folio ?? ""), imageUrl }), `${nombre}.docx`);
}

export function DocumentosSinExpediente() {
  const search = useSearchParams();
  const [runs, setRuns] = React.useState<AppRun[] | null>(null), [next, setNext] = React.useState<number | null>(null);
  const [deleted, setDeleted] = React.useState(false), [error, setError] = React.useState("");
  const [name, setName] = React.useState(""), [open, setOpen] = React.useState<Open | null>(null);
  const [vista, setVista] = React.useState<Vista>(() => search.get("vista") === "machotes" ? "blanco" : "llenar");
  const [busy, setBusy] = React.useState(""), [notice, setNotice] = React.useState("");

  // Accesos directos (HER-01): «?formato=07» abre la opinión de valor; «&seccion=comparables», sus comparables.
  const pedido = React.useRef(false);
  React.useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    const id = search.get("formato");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abre una sola vez lo que pide la dirección.
    if (isFormato(id)) setOpen({ run: null, formatoId: id, title: formatoById(id).title, seccion: search.get("seccion") ?? undefined });
  }, [search]);

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
  async function machote(definition: FormatoDefinition, formato: "pdf" | "word") {
    const label = `${definition.id}-${formato}`;
    if (busy) return;
    setBusy(label); setError(""); setNotice("");
    try {
      const nombre = `Fortius-${definition.id}-${safeName(definition.title)}-en-blanco`;
      if (formato === "pdf") await downloadAdminPdf(`/api/admin/apps/machote?formato=${encodeURIComponent(definition.id)}`, `${nombre}.pdf`);
      else await wordDe(definition, definition.id === "07" ? { ...VALOR_DEFAULTS } : {}, nombre);
      setNotice(`${definition.title}: machote descargado.`);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(""); }
  }

  const grupos = gruposDeFormatos();
  return <div className="flex flex-col gap-6">
    <Link href="/admin/herramientas" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium underline-offset-4 hover:underline"><ArrowLeft size={16} aria-hidden="true" />Más</Link>
    <PageHeader title="Documentos sueltos" description="Cualquier formato en blanco o lleno con los datos que dé el cliente, sin abrir una operación." />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

    <section aria-labelledby="formatos" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="formatos" className="m-0 text-lg font-semibold">{vista === "blanco" ? "Machotes en blanco" : "Llenar un documento"}</h2>
        <Segmented label="Cómo lo necesitas" value={vista} onChange={value => { setVista(value); setNotice(""); }} options={[{ id: "llenar", label: "Llenar con datos" }, { id: "blanco", label: "En blanco" }]} />
      </div>
      {vista === "llenar"
        ? <label className="flex max-w-md flex-col gap-1.5 text-sm font-semibold">Nombre para encontrarlo después (opcional)
          <input className={inputClass} value={name} maxLength={120} placeholder="Ej. Casa en Playas, Sr. López" onChange={e => setName(e.target.value)} />
        </label>
        : <p className="max-w-[62ch] text-sm text-muted-foreground">Con el membrete de Fortius y los espacios vacíos, para que el cliente lo revise o se llene a mano. No se guarda.</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      <div className="flex flex-col gap-5">{grupos.map(grupo => <Card key={grupo.titulo} className="flex min-w-0 flex-col p-0" aria-label={grupo.titulo}>
        <h3 className="m-0 border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground sm:px-5">{grupo.titulo}</h3>
        <ul className="flex flex-col divide-y divide-border">{grupo.formatos.map(definition => <li key={definition.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5">
          <span className="flex min-w-0 items-baseline gap-2.5"><span className="w-8 shrink-0 tabular-nums text-xs text-muted-foreground">{definition.id}</span><span className="font-medium [overflow-wrap:anywhere]">{definition.title}</span></span>
          {vista === "llenar"
            ? <Button variant="ghost" aria-label={`Llenar ${definition.title}`} onClick={() => setOpen({ run: null, formatoId: definition.id, title: name.trim() ? `${definition.title} · ${name.trim()}` : definition.title })}>Llenar<ArrowRight size={16} aria-hidden="true" /></Button>
            : <span className="flex flex-wrap gap-2">
              {definition.readyForEmission && <Button variant="ghost" disabled={!!busy} aria-label={`${definition.title} en blanco, PDF`} onClick={() => void machote(definition, "pdf")}><FileDown size={16} aria-hidden="true" />{busy === `${definition.id}-pdf` ? "Preparando…" : "PDF"}</Button>}
              <Button variant="ghost" disabled={!!busy} aria-label={`${definition.title} en blanco, ${copiaDe(definition.id)}`} onClick={() => void machote(definition, "word")}><FileText size={16} aria-hidden="true" />{busy === `${definition.id}-word` ? "Preparando…" : copiaDe(definition.id)}</Button>
            </span>}
        </li>)}</ul>
      </Card>)}</div>
    </section>

    <section aria-labelledby="mis-documentos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="mis-documentos" className="m-0 text-lg font-semibold">{deleted ? "Documentos eliminados" : "Mis documentos"}</h2>
        <Button variant="ghost" onClick={() => setDeleted(!deleted)}>{deleted ? "Ver activos" : "Ver eliminados"}</Button>
      </div>
      {runs === null ? <p role="status" className="text-sm text-muted-foreground">Consultando documentos…</p>
        : runs.length === 0 ? (deleted ? <p className="text-sm text-muted-foreground">No hay documentos eliminados.</p>
          : <EmptyBox icon={<FileText size={28} aria-hidden="true" />} title="Todavía no hay documentos llenos">Lo que llenes aquí se guarda solo y lo encuentras en esta lista para seguirlo o descargarlo otra vez.</EmptyBox>)
        : <Card as="ul" className="flex flex-col divide-y divide-border p-0">{runs.map(run => <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
          <div className="min-w-0"><p className="m-0 font-semibold [overflow-wrap:anywhere]">{run.title}</p>
            <p className="m-0 text-xs text-muted-foreground">{formatoOf(run)} · Guardado · {humanDateTime(run.updatedAt)}</p></div>
          <div className="flex gap-2">{!deleted && <Button variant="ghost" onClick={() => void openRun(run)}>Abrir</Button>}<Button variant="ghost" onClick={() => void toggle(run)}>{deleted ? "Restaurar" : "Eliminar"}</Button></div>
        </li>)}</Card>}
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
  const [index, setIndex] = React.useState(() => {
    const wanted = open.seccion?.toLowerCase();
    const at = wanted ? sections.findIndex(item => item.toLowerCase().includes(wanted)) : -1;
    return Math.max(at, 0);
  });
  const heading = React.useRef<HTMLHeadingElement>(null);
  const dirty = !run || JSON.stringify(values) !== JSON.stringify(saved);
  const data = { ...values, folio: FOLIO_INDEPENDIENTE };
  const missing = validateFormato(definition.id, data);
  const sectionOf = React.useMemo(() => new Map(definition.fields.map(f => [f.label, f.section ?? "Datos"])), [definition]);
  const pendingBySection = sections.map(s => missing.filter(label => (sectionOf.get(label) ?? (label.startsWith("Selecciona") ? IMAGES : "")) === s).length);
  const section = sections[index], last = index === sections.length - 1;
  const adjuntos = adjuntosDe(values) as Adjunto[];
  // RP-77: con datos faltantes el PDF sale igual, marcado; el 01 y la 15 conservan sus reglas.
  const pdfPosible = definition.readyForEmission && (missing.length === 0 || emiteIncompleto(definition.id));
  const copia = WORD_LLENO_EXCLUIDOS.has(definition.id) ? null : copiaDe(definition.id);
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
  async function pdf() {
    // La opinión de valor nunca cuenta faltantes; los demás avisan antes de salir incompletos.
    if (missing.length && !await confirmAction(`Faltan ${missing.length} ${missing.length === 1 ? "dato" : "datos"}. El PDF saldrá con esos espacios en blanco y marcado como incompleto. ¿Descargarlo así?`)) return;
    void task("Preparando PDF…", async () => {
      const current = await persist();
      await downloadAdminPdf(`/api/admin/apps/runs/${current.id}/documento?version=${current.version}${missing.length ? "&incompleto=1" : ""}`, `Fortius-${definition.id}-${safeName(open.title)}-v${current.version}.pdf`);
      setNotice(missing.length ? "PDF descargado como incompleto. No se archiva en ningún expediente." : "PDF descargado. Como no pertenece a un expediente, no se archiva en Documentos.");
    });
  }
  function word() {
    if (!copia) return;
    void task(`Preparando ${copia}…`, async () => {
      const current = await persist();
      await wordDe(definition, { ...(current.input.data as Values), folio: FOLIO_INDEPENDIENTE }, `Fortius-${definition.id}-${safeName(open.title)}-v${current.version}`);
      setNotice(`Copia en ${copia} descargada.`);
    });
  }

  const sectionDefinition = { ...definition, fields: definition.fields.filter(f => (f.section ?? "Datos") === section) };
  const pdfTitle = !definition.readyForEmission ? "Este formato todavía no genera PDF; descarga el Word" : !pdfPosible ? "Este formato necesita todos sus datos para el PDF" : missing.length ? "Faltan datos: el PDF saldrá marcado como incompleto" : undefined;
  return <div role="dialog" aria-modal="true" aria-labelledby="documento-titulo" className="fixed inset-0 z-[70] flex flex-col bg-background text-foreground">
    <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow>{definition.id} · Documento suelto{run ? ` · Guardado ${humanDateTime(run.updatedAt).toLowerCase()}` : ""}</Eyebrow>
        <h2 id="documento-titulo" className="m-0 text-lg font-bold [overflow-wrap:anywhere]">{open.title}</h2>
      </div>
      <Button variant="ghost" iconOnly aria-label="Cerrar" disabled={!!busy} onClick={() => void close()}><X size={20} aria-hidden="true" /></Button>
    </header>
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Secciones" className="hidden w-72 shrink-0 overflow-auto border-r border-border p-4 lg:block">
        <ol className="flex flex-col gap-1">{sections.map((item, i) => <li key={item}>
          <button type="button" aria-current={i === index ? "step" : undefined} disabled={!!busy} onClick={() => i !== index && go(i)}
            className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm", i === index ? "bg-secondary font-semibold" : "hover:bg-secondary/60")}>
            {pendingBySection[i] === 0 ? <Check size={15} aria-hidden="true" className="shrink-0 text-[var(--success,#2f7d4f)]" /> : <span className="w-[15px] shrink-0 text-center tabular-nums text-xs">{i + 1}</span>}
            <span className="flex-1">{item}</span>
            {pendingBySection[i] > 0 && <span className="tabular-nums text-xs text-muted-foreground" aria-label={`${pendingBySection[i]} por llenar`}>{pendingBySection[i]}</span>}
          </button>
        </li>)}</ol>
      </nav>
      <div data-scroll className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <p className="tabular-nums text-xs text-muted-foreground lg:hidden">Sección {index + 1} de {sections.length}</p>
          <h3 ref={heading} tabIndex={-1} className="m-0 text-xl font-bold">{section}</h3>
          {section === IMAGES ? <FormatoImages documentId={run?.id ?? draftId} values={values} disabled={!!busy} source={images} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            : <fieldset disabled={!!busy} className="min-w-0">
              <FormatoEditor key={`${definition.id}-${section}`} definition={sectionDefinition} images={adjuntos} extras={sections.filter(item => item !== IMAGES).at(-1) === section} values={data} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
            </fieldset>}
          {last && <Notice tone="info" title={missing.length ? `Faltan ${missing.length} ${missing.length === 1 ? "dato" : "datos"}` : "Captura completa"}>
            {missing.length > 0 && <p className="text-muted-foreground">{missing.slice(0, 12).join(" · ")}{missing.length > 12 ? ` y ${missing.length - 12} más` : ""}</p>}
            <p>{!definition.readyForEmission ? "El PDF de este formato sigue pendiente de cotejo. Descarga el Word."
              : !pdfPosible ? "Este formato necesita todos sus datos para el PDF. Mientras tanto puedes descargar su machote en blanco."
              : missing.length ? "Puedes descargarlo así: los espacios quedan en blanco y el PDF sale marcado como incompleto." : "Ya puedes descargar el PDF."}</p>
          </Notice>}
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
        {copia && <Button variant="ghost" disabled={!!busy} onClick={word}><FileText size={16} aria-hidden="true" />{busy === `Preparando ${copia}…` ? busy : copia}</Button>}
        {/* RP-77: el PDF se descarga desde cualquier sección, aunque falten datos. */}
        {!last && pdfPosible && <Button variant="ghost" disabled={!!busy} title={pdfTitle} onClick={() => void pdf()}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "PDF"}</Button>}
        {last ? <Button variant="primary" disabled={!!busy || !pdfPosible} title={pdfTitle} onClick={() => void pdf()}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Terminar y descargar PDF"}</Button>
          : <Button variant="primary" disabled={!!busy} onClick={() => go(index + 1)}>Siguiente sección<ArrowRight size={16} aria-hidden="true" /></Button>}
      </div>
    </footer>
  </div>;
}
