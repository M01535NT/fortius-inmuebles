"use client";
import * as React from "react";
import { ArrowLeft, ArrowRight, Check, FileDown, FileText, Save, X } from "@/components/admin/icons";
import { Button, Notice, Pill, Ring } from "@/components/admin/kit";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { inputClass, selectClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { downloadAdminPdf } from "@/lib/admin/download-pdf";
import { copiaEditable, downloadFormatoCopia } from "@/lib/admin/download-word";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { shortDate } from "@/lib/admin/today";
import { AVISO_TEMPLATE_VERSION } from "@/lib/formatos/aviso";
import { emiteIncompleto, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { calcularPresupuesto } from "@/lib/formatos/presupuesto";
import { calcularNeto } from "@/lib/formatos/neto";
import { formatAmount } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import type { Documento } from "./documents-tab";
import { FormatoImages, WITH_IMAGES, type Adjunto } from "./formato-images";
import { DocumentoEnVivo, EN_VIVO } from "./documento-en-vivo";
import s from "./operation.module.css";

/*
  Ventana de captura de un documento de trabajo (boceto «Captura de un documento», aprobado
  el 17/10/2026). La operación queda detrás, limpia: a la izquierda las secciones con su
  avance («2 de 5 completas»), al centro la sección en curso, se guarda al cambiar de sección
  y se descarga en Word o PDF. La pestaña «PDF y copias firmadas» reúne los PDF generados y
  sus copias firmadas. Los formatos de EN_VIVO (04B) se capturan sobre el documento: la
  pestaña «Documento» muestra la plantilla y cada parte pulsable abre su campo.
*/

export type Emision = { id: string; draft_version: number; created_at: string; plantillaVersion?: string };
type Copia = { id: string; emission_id: string; created_at: string; sha256: string };
export type CaptureContext = { cliente?: string; inmueble?: string; etapa?: string };
const post = (body: unknown, method = "POST") => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const IMAGES = "Fotografías y croquis", WHOLE = "Aviso de privacidad";
const IMAGE_KEYS = ["fotoPrincipalId", "croquisId"];
const safeName = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const two = (n: number) => String(n).padStart(2, "0");
/** Algunas secciones ya traen su número («01 / Encargo…»); en el índice se muestra una sola vez. */
const plain = (name: string) => name.replace(/^\d+\s*\/\s*/, "");

export function FormatoCapture({ document: initial, folio, context, onSaved, onEmitted, onClose }: {
  document: Documento; folio: string; context: CaptureContext;
  onSaved: (document: Documento) => void; onEmitted: (emision: Emision) => void; onClose: () => void;
}) {
  const definition = formatoById(initial.formato_id);
  const [doc, setDoc] = React.useState(initial);
  const [values, setValues] = React.useState<Record<string, unknown>>(initial.data);
  const [emisiones, setEmisiones] = React.useState<Emision[] | null>(null);
  const [busy, setBusy] = React.useState(""), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [view, setView] = React.useState<"captura" | "pdf">("captura");
  // Las imágenes se suben antes de la sección que las usa (el reporte fotográfico del 07); si ninguna las usa, van al final.
  // El aviso (01) tiene su propio editor, que agrupa todo el formulario en una sola pantalla.
  const whole = definition.id === "01";
  const live = EN_VIVO.has(definition.id);
  // Captura abierta sobre el documento con cambios todavía sin aceptar.
  const liveDraft = React.useRef(false);
  const onLiveDraft = React.useCallback((dirty: boolean) => { liveDraft.current = dirty; }, []);
  const sections = React.useMemo(() => {
    if (definition.id === "01") return [WHOLE];
    const all = [...new Set(definition.fields.map(f => f.section ?? "Datos"))];
    if (!WITH_IMAGES.includes(definition.id)) return all;
    // Las imágenes van antes de la sección que las usa (el reporte fotográfico del 07); si esa sección
    // solo tenía las imágenes (levantamientos), ocupan su lugar. Si ninguna las usa, van al final.
    const imageSection = (definition.fields.find(f => f.key === "fotografias") ?? definition.fields.find(f => f.key === "fotoPrincipalId"))?.section;
    const visible = new Set(definition.fields.filter(f => !IMAGE_KEYS.includes(f.key)).map(f => f.section ?? "Datos"));
    const names = all.flatMap(name => name === imageSection ? (visible.has(name) ? [IMAGES, name] : [IMAGES]) : [name]);
    return names.includes(IMAGES) ? names : [...names, IMAGES];
  }, [definition]);
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[]>([]);
  const [index, setIndex] = React.useState(0);
  const heading = React.useRef<HTMLHeadingElement>(null), scroller = React.useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(doc.data);
  const data = React.useMemo(() => ({ ...values, folio }), [values, folio]);
  const missing = validateFormato(definition.id, data);
  const sectionOf = React.useMemo(() => new Map(definition.fields.map(f => [f.label, IMAGE_KEYS.includes(f.key) ? IMAGES : f.section ?? "Datos"])), [definition]);
  const pendingBySection = whole ? [missing.length] : sections.map(section => missing.filter(label => (sectionOf.get(label) ?? (label.startsWith("Selecciona") ? IMAGES : "")) === section).length);
  const section = sections[index], last = index === sections.length - 1;
  const valid = (e: Emision) => e.draft_version === doc.version && (definition.id !== "01" || e.plantillaVersion === AVISO_TEMPLATE_VERSION);
  const current = emisiones?.find(valid);
  const copia = copiaEditable(definition.id);
  // Con datos faltantes se descarga avisando y pidiendo confirmación, salvo el aviso (01) y la promesa (15).
  const canPdf = definition.readyForEmission && (missing.length === 0 || emiteIncompleto(definition.id));

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
    const before = (event: BeforeUnloadEvent) => { if (dirty || liveDraft.current) event.preventDefault(); };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  // La página de atrás no se desplaza mientras la ventana está abierta; el foco empieza en el título de la sección.
  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    heading.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);

  async function persist(next = values) {
    if (JSON.stringify(next) === JSON.stringify(doc.data)) return doc;
    const result = await json<{ documento: Documento }>(`/api/admin/formatos/${doc.id}`, post({ version: doc.version, data: next }, "PUT"));
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
      requestAnimationFrame(() => { heading.current?.focus(); scroller.current?.scrollTo({ top: 0 }); });
    });
  }
  const closing = React.useRef(false);
  async function close() {
    if (busy || closing.current) return;
    closing.current = true;
    try {
      if (live && liveDraft.current && !await confirmAction("Hay un dato abierto sin aceptar. ¿Cerrar y descartarlo? (Cancela para seguir capturando)")) return;
      if (dirty && !await confirmAction("Hay respuestas sin guardar. ¿Guardarlas y cerrar? (Cancela para seguir capturando)")) return;
      await run("Guardando…", async () => { await persist(); onClose(); });
    } finally { closing.current = false; }
  }
  async function pdf() {
    if (busy) return;
    if (missing.length) {
      const lista = `${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` y ${missing.length - 5} más` : ""}`;
      if (!await confirmAction(`Faltan ${missing.length} ${missing.length === 1 ? "dato" : "datos"}: ${lista}. El PDF saldrá marcado «Documento incompleto» en cada hoja. ¿Descargarlo de todos modos?`)) return;
    }
    void run("Preparando PDF…", async () => {
      const saved = await persist();
      const faltan = validateFormato(definition.id, { ...saved.data, folio }).length;
      if (faltan && !emiteIncompleto(definition.id)) throw new Error("Faltan respuestas obligatorias para generar el PDF.");
      let emision = emisiones?.find(e => e.draft_version === saved.version && (definition.id !== "01" || e.plantillaVersion === AVISO_TEMPLATE_VERSION));
      if (!emision) {
        emision = (await json<{ emision: Emision }>(`/api/admin/formatos/${saved.id}/emitir`, post({ version: saved.version, ...(faltan ? { incompleto: true } : {}) }))).emision;
        const created = emision;
        setEmisiones(items => [created, ...(items ?? [])]); onEmitted(created);
      }
      await downloadAdminPdf(`/api/admin/emisiones/${emision.id}/descargar`, `Fortius-${definition.id}-${safeName(definition.title)}-${folio}-v${saved.version}.pdf`);
      setNotice(faltan ? "PDF incompleto en «PDF y copias firmadas». Completa los datos para el definitivo." : "PDF generado y descargado. Queda guardado en «PDF y copias firmadas».");
    });
  }
  function word() {
    void run(`Preparando ${copia}…`, async () => {
      const saved = await persist();
      await downloadFormatoCopia(saved, folio, context.cliente);
      setNotice(`Copia en ${copia} descargada.`);
    });
  }
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented) void close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const budget = definition.id === "19" && !missing.length ? calcularPresupuesto(values) : null;
  const net = definition.id === "08" && !missing.length ? calcularNeto(data) : null;
  const sectionDefinition = whole ? definition : { ...definition, fields: definition.fields.filter(f => (f.section ?? "Datos") === section) };
  const saveState = busy === "Guardando…" ? "Guardando…" : dirty ? "Sin guardar" : "Guardado";
  const where = [context.etapa, context.cliente, folio].filter(Boolean).join(" · ");
  const completeSections = pendingBySection.filter(count => count === 0).length;

  return <>
    <div className={s.windowScrim} aria-hidden="true" />
    <div role="dialog" aria-modal="true" aria-labelledby="captura-titulo" aria-describedby="captura-contexto" className={s.window}>
      <header className="flex flex-wrap items-start gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-7">
        <span className={s.formatBadge} aria-hidden="true">{definition.id}</span>
        <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
          <h2 id="captura-titulo" className="m-0 text-xl font-bold leading-tight [overflow-wrap:anywhere]">{definition.title}</h2>
          <p id="captura-contexto" className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{where}</p>
        </div>
        <div className="flex items-center gap-3">
          {current ? <a className={cn(s.pill, s.pillDone)} aria-label="Descargar el PDF de esta versión" href={`/api/admin/emisiones/${current.id}/descargar`}><FileDown size={14} aria-hidden="true" /><span className="ml-1 hidden sm:inline">PDF de esta versión</span><span className="ml-1 sm:hidden">PDF</span></a> : <span className={cn(s.pill, s.pillDraft, "hidden sm:inline-flex")}>Borrador</span>}
          <Pill tone={saveState === "Sin guardar" ? "warn" : "success"} size="sm" className="hidden sm:inline-flex">{saveState}</Pill>
        </div>
        <Button variant="ghost" iconOnly aria-label="Cerrar" disabled={!!busy} className="order-first ml-auto sm:order-none sm:ml-0" onClick={() => void close()}><X size={20} aria-hidden="true" /></Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 sm:px-7">
        <div role="tablist" aria-label="Partes del documento" className="flex">
          <button type="button" role="tab" aria-selected={view === "captura"} className={s.windowTab} onClick={() => setView("captura")}><FileText size={16} aria-hidden="true" />{live ? "Documento" : "Captura"}</button>
          <button type="button" role="tab" aria-selected={view === "pdf"} className={s.windowTab} onClick={() => setView("pdf")}><FileDown size={16} aria-hidden="true" />PDF y copias firmadas{emisiones && emisiones.length > 0 && <span className="font-mono text-xs">{emisiones.length}</span>}</button>
        </div>
        <p className="py-2 text-sm text-muted-foreground">{definition.id === "07" ? "El PDF se descarga aunque falten datos." : missing.length ? `Faltan ${missing.length} ${missing.length === 1 ? "dato" : "datos"}${emiteIncompleto(definition.id) ? "; el PDF sale como incompleto" : " para el PDF"}` : "Captura completa"}</p>
      </div>

      {view === "pdf" ? <div className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-7"><Emissions emisiones={emisiones} current={current} disabled={!!busy} /></div>
        : live ? <DocumentoEnVivo definition={definition} documentId={doc.id} expedienteId={doc.expediente_id || undefined} values={data} missing={missing} disabled={!!busy} onDraft={onLiveDraft}
          onAccept={async patch => {
            // Se integra al documento y se guarda con la versión del borrador (un conflicto 409 deja la captura abierta con el aviso).
            const next = { ...values, ...patch };
            setValues(next); setError(""); setNotice("");
            await persist(next);
          }}
          // Al confirmar datos del expediente desde la ventana, el servidor ya llenó este borrador: se vuelve a leer para no pisarlo con una versión vieja.
          onExpedienteSaved={async () => {
            const result = await json<{ documento: Documento }>(`/api/admin/formatos/${doc.id}`);
            setDoc(result.documento); setValues(result.documento.data); onSaved(result.documento);
          }} />
        : <div className="flex min-h-0 flex-1">
          <nav aria-label="Secciones del documento" className={cn(s.sectionsNav, "hidden lg:flex")}>
            <div className={s.sectionsProgress}>
              <Ring value={completeSections} max={sections.length} size={48} stroke={6} label={`${completeSections} de ${sections.length} secciones completas`} />
              <span className="flex flex-col"><strong className="text-lg leading-tight">{completeSections} de {sections.length}</strong><span className="text-xs text-muted-foreground">secciones completas</span></span>
            </div>
            <ol className="flex flex-1 flex-col gap-0.5 overflow-auto px-2">{sections.map((name, i) => <li key={name}>
              <button type="button" aria-current={i === index ? "step" : undefined} disabled={!!busy} onClick={() => i !== index && go(i)} className={s.sectionLink}>
                {pendingBySection[i] === 0 ? <Check size={15} aria-hidden="true" className={s.sectionDone} /> : <span className={s.sectionNumber}>{i + 1}</span>}
                <span className="flex-1">{plain(name)}</span>
                {pendingBySection[i] === 0 ? <Pill size="sm" tone="success">Listo</Pill> : <Pill size="sm" tone="muted" aria-label={`${pendingBySection[i]} pendientes`}>{pendingBySection[i]}</Pill>}
              </button>
            </li>)}</ol>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Se guarda al cambiar de sección. Puedes cerrar y seguir después.</p>
          </nav>

          <div ref={scroller} className="min-w-0 flex-1 overflow-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-8">
              <label className="text-sm font-semibold lg:hidden">Sección<select className={selectClass} value={index} disabled={!!busy} onChange={e => go(Number(e.target.value))}>{sections.map((name, i) => <option key={name} value={i}>{two(i + 1)} · {plain(name)}{pendingBySection[i] ? ` (${pendingBySection[i]} pendientes)` : ""}</option>)}</select></label>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-muted-foreground">Sección {two(index + 1)} de {two(sections.length)}</p>
                <h3 ref={heading} tabIndex={-1} className={cn(s.sectionTitle, "focus:outline-none")}>{plain(section)}</h3>
              </div>
              {index === 0 && !!values.origenDatos && <Notice tone="info">Algunas respuestas vienen del primer contacto. Confírmalas: lo declarado aún no está comprobado.</Notice>}
              {section === IMAGES ? <FormatoImages documentId={doc.id} values={values} disabled={!!busy} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
                : <fieldset disabled={!!busy} className="min-w-0">
                  <FormatoEditor key={`${doc.id}-${section}`} definition={sectionDefinition} extras={sections.filter(name => name !== IMAGES).at(-1) === section} values={data} images={adjuntos} onChange={(key, value) => setValues(old => ({ ...old, [key]: value }))} />
                </fieldset>}
              {last && <div className="flex flex-col gap-2 rounded-[12px] border border-border p-4">
                <p className="font-semibold">{definition.id === "07" ? "Puedes generar el PDF cuando quieras." : missing.length ? `Para generar el PDF faltan ${missing.length} ${missing.length === 1 ? "respuesta" : "respuestas"}:` : "Captura completa. Ya puedes generar el PDF."}</p>
                {missing.length > 0 && <p className="text-sm text-muted-foreground">{missing.slice(0, 12).join(" · ")}{missing.length > 12 ? ` y ${missing.length - 12} más` : ""}</p>}
                {!definition.readyForEmission && <p className="text-sm text-muted-foreground">El PDF de este formato sigue bloqueado hasta cotejar el modelo registrado. Usa «{copia}».</p>}
                {budget && <p className="text-sm">Subtotal cotizado: {formatAmount(budget.subtotalCotizado)} {String(values.moneda)} · Estimación con reserva: {formatAmount(budget.estimacionConReserva)} {String(values.moneda)}</p>}
                {net && <p className="text-sm">Neto estimado: <strong>{formatAmount(net.netoEstimado)} MXN</strong> (precio {formatAmount(net.precioBase)} menos gastos {formatAmount(net.erogaciones)})</p>}
              </div>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                {index > 0 ? <Button variant="ghost" disabled={!!busy} onClick={() => go(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Anterior</Button> : <span />}
                <span className="font-mono text-xs text-muted-foreground">{index + 1} de {sections.length}</span>
                {!last ? <Button disabled={!!busy} onClick={() => go(index + 1)}>Siguiente<ArrowRight size={16} aria-hidden="true" /></Button> : <span />}
              </div>
            </div>
          </div>

          <aside aria-label="Datos de la operación" className="hidden w-72 shrink-0 flex-col gap-4 overflow-auto border-l border-border px-5 py-6 xl:flex">
            <dl className="flex flex-col gap-3 text-sm">
              {context.cliente && <div><dt className={s.asideLabel}>Cliente</dt><dd className="m-0">{context.cliente}</dd></div>}
              <div><dt className={s.asideLabel}>Inmueble</dt><dd className="m-0">{context.inmueble ?? "Sin inmueble vinculado"}</dd></div>
              {context.etapa && <div><dt className={s.asideLabel}>Etapa</dt><dd className="m-0">{context.etapa}</dd></div>}
              <div><dt className={s.asideLabel}>Folio</dt><dd className="m-0 font-mono">{folio}</dd></div>
              <div><dt className={s.asideLabel}>Versión</dt><dd className="m-0">Versión {doc.version} · {shortDate(doc.updated_at)}</dd></div>
            </dl>
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">El panel guarda lo que capturas. Generar el archivo no sustituye la revisión del profesional responsable.</p>
          </aside>
        </div>}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-7">
        <p className="text-sm text-muted-foreground sm:hidden" role="status">{saveState}</p>
        <p className="hidden text-sm text-muted-foreground sm:block">Versión {doc.version}{current ? " · con PDF" : ""}</p>
        {/* Sobre el documento no hay pie de sección: el aviso de un PDF o guardado fallido va aquí. */}
        {live && error && <p role="alert" className="basis-full text-sm text-destructive sm:order-none sm:basis-auto sm:flex-1">{error}</p>}
        {live && !error && notice && <p role="status" className="basis-full text-sm text-muted-foreground sm:basis-auto sm:flex-1">{notice}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          {copia && <Button variant="ghost" disabled={!!busy} onClick={word}><FileText size={16} aria-hidden="true" />{busy === `Preparando ${copia}…` ? busy : copia}</Button>}
          <Button disabled={!!busy || !dirty} onClick={() => void run("Guardando…", async () => { await persist(); setNotice("Guardado"); })}><Save size={16} aria-hidden="true" />Guardar borrador</Button>
          <Button variant="primary" disabled={!!busy || !canPdf} title={!definition.readyForEmission ? "Este formato todavía no genera PDF" : missing.length ? (emiteIncompleto(definition.id) ? "Faltan datos: el PDF saldrá marcado como incompleto" : "Faltan datos para generar el PDF") : undefined} onClick={() => void pdf()}><FileDown size={16} aria-hidden="true" />{busy === "Preparando PDF…" ? busy : "Generar PDF"}</Button>
        </div>
      </footer>
    </div>
  </>;

}

/** PDF generados de este documento, con la copia firmada que se le agregue a cada uno. */
function Emissions({ emisiones, current, disabled }: { emisiones: Emision[] | null; current?: Emision; disabled: boolean }) {
  const [copias, setCopias] = React.useState<Record<string, Copia[]>>({});
  const [message, setMessage] = React.useState("");
  const key = (emisiones ?? []).map(e => e.id).join(",");
  React.useEffect(() => {
    let alive = true;
    for (const id of key ? key.split(",") : []) json<{ copias: Copia[] }>(`/api/admin/emisiones/${id}/firmado`).then(r => { if (alive) setCopias(old => ({ ...old, [id]: r.copias })); }).catch(() => undefined);
    return () => { alive = false; };
  }, [key]);
  async function upload(emissionId: string, event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget; event.preventDefault(); setMessage("");
    try { const result = await json<{ copia: Copia }>(`/api/admin/emisiones/${emissionId}/firmado`, { method: "POST", body: new FormData(form) }); setCopias(old => ({ ...old, [emissionId]: [result.copia, ...(old[emissionId] ?? [])] })); form.reset(); setMessage("Copia firmada guardada."); }
    catch (cause) { setMessage(`No se pudo guardar: ${errorMessage(cause)}`); }
  }
  if (emisiones === null) return <p role="status" className="text-sm text-muted-foreground">Consultando los PDF…</p>;
  if (!emisiones.length) return <p className="text-sm text-muted-foreground">Sin PDF. Usa «Generar PDF» al completar la captura.</p>;
  return <div className="mx-auto flex max-w-3xl flex-col gap-4">
    {message && <p role="status" className="text-sm">{message}</p>}
    <ul className="flex flex-col gap-3">{emisiones.map(item => <li key={item.id} className="flex flex-col gap-3 rounded-[12px] border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">PDF de la versión {item.draft_version}{item.id === current?.id ? " · la actual" : ""}</span>
        <a className="text-sm font-semibold underline underline-offset-4" href={`/api/admin/emisiones/${item.id}/descargar`}>Descargar · {new Date(item.created_at).toLocaleString("es-MX")}</a>
      </div>
      {(copias[item.id] ?? []).map(copy => <a key={copy.id} className="text-sm underline underline-offset-4" href={`/api/admin/copias-firmadas/${copy.id}/descargar`}>Copia firmada · {new Date(copy.created_at).toLocaleString("es-MX")}</a>)}
      <form onSubmit={event => void upload(item.id, event)} className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm">Agregar la copia firmada (PDF)<input name="archivo" type="file" accept="application/pdf,.pdf" required disabled={disabled} className={inputClass} /></label>
        <Button type="submit" disabled={disabled}>Guardar copia firmada</Button>
      </form>
    </li>)}</ul>
  </div>;
}
