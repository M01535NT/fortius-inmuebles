"use client";
import * as React from "react";
import { ArrowRight, CheckCircle2, Circle, ClipboardList, FileDown, FileText, Home, PlayCircle, ShieldCheck, Trash2 } from "lucide-react";
import { Button, ButtonLink, Notice } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { db, errorMessage, fetchJson as json, upsert } from "@/lib/admin/store";
import { answerLabel, type OperationalInterview } from "@/lib/intake/interview";
import { shortDate } from "@/lib/admin/today";
import { checklistFor, checklistTaskId, levantamientoFor } from "@/lib/formatos/checklist-documentos";
import { LEVANTAMIENTO_TITLES, type LevantamientoId } from "@/lib/formatos/levantamiento";
import type { OperationRecord } from "@/lib/admin/operation-view";
import type { Task } from "@/lib/tasks";
import { FormatoCapture, type Emision } from "./formato-capture";
import type { Documento } from "./documents-tab";
import s from "./operation.module.css";

/*
  Etapas del propietario antes de verificación (decisión del titular, 16/10/2026):
  Prospecto → Entrevista inicial (02) → Levantamiento (04A–04G) → Checklist de documentos.
  Cada etapa tiene su botón «Iniciar …»; la captura se hace por secciones y al terminar
  se descarga el PDF y una copia en Word.
*/

export type IntakePhase = "prospecto" | "captacion" | "levantamiento" | "documentos";
const post = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const latest = (documents: Documento[], match: (formato: string) => boolean) => documents.filter(d => match(d.formato_id)).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
export const latestInterview = (documents: Documento[]) => latest(documents, f => f === "02");
export const latestSurvey = (documents: Documento[]) => latest(documents, f => f.startsWith("04"));
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function InitialInterviewCard({ op, phase, cliente, interview, documents, emissions, checklist, onDocumentsChange, onEmitted, onOpenDocument, disabled }: {
  op: OperationRecord; phase: IntakePhase; cliente?: string; interview: OperationalInterview | null;
  documents: Documento[]; emissions: { entrevista: Emision[]; levantamiento: Emision[] }; checklist?: Task; disabled: boolean;
  onDocumentsChange: (update: (items: Documento[]) => Documento[]) => void; onEmitted: (kind: "entrevista" | "levantamiento", emision: Emision) => void; onOpenDocument: (id: string) => void;
}) {
  const [open, setOpen] = React.useState<Documento | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const entrevista = latestInterview(documents), levantamiento = latestSurvey(documents), aviso = latest(documents, f => f === "01");
  const pdf02 = entrevista ? emissions.entrevista.find(e => e.draft_version === entrevista.version) : undefined;
  const pdf04 = levantamiento ? emissions.levantamiento.find(e => e.draft_version === levantamiento.version) : undefined;
  const a = interview?.respuestas ?? {};
  const answers02 = (entrevista?.data ?? {}) as Record<string, unknown>;
  const [surveyType, setSurveyType] = React.useState<LevantamientoId>(() => levantamientoFor(answers02.tipoInmueble ?? a.tipoInmueble));

  async function create(formatoId: string) {
    setBusy(true); setError("");
    try {
      const today = new Date();
      const data = formatoId === "01" ? {
        fechaEmision: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
        consentimientoPatrimonial: "pendiente", consentimientoPublicidad: "pendiente", transferenciaAsesor: "pendiente", transferenciaFinanciera: "pendiente", transferenciaOperacion: "pendiente", acuseEstado: "pendiente",
      } : {};
      const result = await json<{ documento: Documento }>(`/api/admin/expedientes/${op.id}/formatos`, post({ formatoId, data }));
      onDocumentsChange(items => [result.documento, ...items]);
      return result.documento;
    } catch (cause) { setError(errorMessage(cause)); return null; }
    finally { setBusy(false); }
  }
  async function startInterview() { const doc = entrevista ?? await create("02"); if (doc) setOpen(doc); }
  async function startSurvey() { const doc = levantamiento ?? await create(surveyType); if (doc) setOpen(doc); }
  async function openAviso() { const doc = aviso ?? await create("01"); if (doc) onOpenDocument(doc.id); }
  async function startChecklist() {
    setBusy(true); setError("");
    try {
      const vence = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      await upsert(db.tareas, { id: checklistTaskId(op.id), titulo: "Reunir los documentos del propietario", descripcion: "Checklist de documentos de la operación. Marca cada documento al recibirlo; con ellos se hace el dictamen jurídico.", categoria: "documentacion", estado: "en-curso", prioridad: "normal", pasos: checklistFor(answers02).map(item => ({ ...item, hecho: false })), asesorId: op.asesor_id, expedienteId: op.id, clienteId: op.cliente_id, propiedadSlug: op.propiedad_slug ?? "", vence }, null);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function download(kind: "pdf" | "docx") {
    setBusy(true); setError("");
    try {
      const items = checklist?.pasos.map(p => ({ id: p.id, texto: p.texto })) ?? checklistFor(answers02);
      const context = { folio: op.folio, cliente, recibidos: checklist?.pasos.filter(p => p.hecho).map(p => p.id) };
      const { checklistPdf, checklistDocx } = await import("@/lib/formatos/checklist-print");
      if (kind === "pdf") saveBlob(new Blob([new Uint8Array(await checklistPdf(items, context))], { type: "application/pdf" }), `Fortius-Checklist-documentos-${op.folio}.pdf`);
      else saveBlob(await checklistDocx(items, context), `Fortius-Checklist-documentos-${op.folio}.docx`);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  const capture = open && <FormatoCapture document={open} folio={op.folio} cliente={cliente}
    onSaved={doc => onDocumentsChange(items => items.map(item => item.id === doc.id ? doc : item))}
    onEmitted={emision => onEmitted(open.formato_id === "02" ? "entrevista" : "levantamiento", emision)} onClose={() => setOpen(null)} />;
  const lock = disabled || busy;
  const checklistDownloads = <>
    <Button disabled={lock} onClick={() => void download("pdf")}><FileDown size={16} aria-hidden="true" />Checklist PDF</Button>
    <Button variant="ghost" disabled={lock} onClick={() => void download("docx")}><FileText size={16} aria-hidden="true" />Word</Button>
  </>;

  if (phase === "prospecto") return <div className="flex flex-col gap-4">
    {interview && <dl className={s.facts}>
      {a.ubicacion && <><dt>Inmueble</dt><dd>{a.ubicacion}{a.zona ? ` · ${a.zona}` : ""}</dd></>}
      {a.tipoInmueble && <><dt>Tipo</dt><dd>{answerLabel(a.tipoInmueble)}</dd></>}
      {a.objetivo && <><dt>Qué quiere</dt><dd>{a.objetivo}{a.plazo ? ` · ${a.plazo}` : ""}</dd></>}
      {a.presupuestoEstado === "conocido" && a.importe && <><dt>Precio que mencionó</dt><dd className="font-mono">${Math.round(Number(a.importe)).toLocaleString("en-US")} {a.moneda}</dd></>}
      {a.siguienteFecha && <><dt>{a.siguienteAccion || "Lo que sigue"}</dt><dd>{shortDate(a.siguienteFecha)}</dd></>}
      {a.condiciones && <><dt>Notas</dt><dd className="whitespace-pre-line">{a.condiciones}</dd></>}
    </dl>}
    <NextBox title="¿Ya estás con el propietario?" text="La entrevista inicial (formato 02) ya trae sus preguntas: solo capturas las respuestas. Lo que se dijo en el primer contacto aparece ya llenado para confirmarlo.">
      <Button variant="primary" disabled={lock} onClick={() => void startInterview()}><PlayCircle size={18} aria-hidden="true" />{busy ? "Preparando…" : "Iniciar entrevista inicial"}</Button>
    </NextBox>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
  </div>;

  if (phase === "captacion") return <div className="flex flex-col gap-1">
    <h3 className="m-0 border-b border-border pb-3 text-base font-bold">Lo que se hace en esta etapa</h3>
    <ul className="flex flex-col">
      <Step done={!!pdf02} icon={<ClipboardList size={18} aria-hidden="true" />} title="Entrevista inicial (02)"
        detail={!entrevista ? "Todavía no empieza." : pdf02 ? `Terminada · PDF de la versión ${entrevista.version}` : `En captura · versión ${entrevista.version} · actualizada el ${shortDate(entrevista.updated_at)}`}>
        <Button variant={pdf02 ? "secondary" : "primary"} disabled={lock} onClick={() => void startInterview()}><PlayCircle size={16} aria-hidden="true" />{!entrevista ? "Iniciar entrevista" : pdf02 ? "Abrir entrevista" : "Continuar entrevista"}</Button>
        {pdf02 && <ButtonLink prefetch={false} href={`/api/admin/emisiones/${pdf02.id}/descargar`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
      </Step>
      <Step done={!!aviso} icon={<ShieldCheck size={18} aria-hidden="true" />} title="Aviso de privacidad (01)"
        detail={aviso ? `Preparado · versión ${aviso.version}. Entrégalo y guarda la copia firmada en Documentos.` : "Se le entrega en la entrevista. En la sección «Datos de la entrevista» del 02 anota cuándo y por qué medio."}>
        <Button disabled={lock} onClick={() => void openAviso()}><FileText size={16} aria-hidden="true" />{aviso ? "Abrir aviso" : "Preparar aviso"}</Button>
      </Step>
      <Step done={false} icon={<ClipboardList size={18} aria-hidden="true" />} title="Checklist de documentos para el propietario"
        detail="Se arma con lo que contestó en la entrevista (estado civil, crédito, tipo de inmueble…). Entrégaselo para que reúna sus documentos.">
        {checklistDownloads}
      </Step>
    </ul>
    {pdf02 ? <NextBox title="Siguiente: levantamiento del inmueble" text="Elige el levantamiento según el tipo de inmueble. Se captura en la visita, con fotografías y croquis.">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">Tipo de levantamiento<select className={selectClass} value={surveyType} disabled={lock} onChange={e => setSurveyType(e.target.value as LevantamientoId)}>{(Object.keys(LEVANTAMIENTO_TITLES) as LevantamientoId[]).map(id => <option key={id} value={id}>{id} · {LEVANTAMIENTO_TITLES[id]}</option>)}</select></label>
        <Button variant="primary" disabled={lock} onClick={() => void startSurvey()}><Home size={18} aria-hidden="true" />{busy ? "Preparando…" : "Iniciar levantamiento"}</Button>
      </div>
    </NextBox> : entrevista && <Notice tone="info" className="mt-2">Para seguir, termina la entrevista y genera su PDF (botón «Terminar y descargar PDF» en la última sección).</Notice>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
  </div>;

  if (phase === "levantamiento") return <div className="flex flex-col gap-1">
    <h3 className="m-0 border-b border-border pb-3 text-base font-bold">Lo que se hace en esta etapa</h3>
    <ul className="flex flex-col">
      <Step done={!!pdf04} icon={<Home size={18} aria-hidden="true" />} title={levantamiento ? `${levantamiento.formato_id} · ${LEVANTAMIENTO_TITLES[levantamiento.formato_id as LevantamientoId] ?? "Levantamiento"}` : "Levantamiento"}
        detail={!levantamiento ? "Todavía no empieza." : pdf04 ? `Terminado · PDF de la versión ${levantamiento.version}` : `En captura · versión ${levantamiento.version} · actualizado el ${shortDate(levantamiento.updated_at)}. Superficies, niveles, recámaras, baños, estacionamientos, instalaciones, fotografías y croquis.`}>
        <Button variant={pdf04 ? "secondary" : "primary"} disabled={lock} onClick={() => void startSurvey()}><PlayCircle size={16} aria-hidden="true" />{pdf04 ? "Abrir levantamiento" : "Continuar levantamiento"}</Button>
        {pdf04 && <ButtonLink prefetch={false} href={`/api/admin/emisiones/${pdf04.id}/descargar`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
      </Step>
      <Step done={!!pdf02} icon={<ClipboardList size={18} aria-hidden="true" />} title="Entrevista inicial (02)" detail={pdf02 ? "Terminada." : "Tiene cambios sin PDF: genera su PDF otra vez."}>
        {entrevista && <Button variant="ghost" disabled={lock} onClick={() => void startInterview()}>Abrir</Button>}
      </Step>
    </ul>
    {pdf04 ? <NextBox title="Siguiente: checklist de documentos" text="Se crea la lista de documentos que le corresponde al propietario. Ahí marcas cada uno al recibirlo.">
      <Button variant="primary" disabled={lock} onClick={() => void startChecklist()}><ArrowRight size={18} aria-hidden="true" />{busy ? "Preparando…" : "Iniciar checklist"}</Button>
    </NextBox> : levantamiento && <Notice tone="info" className="mt-2">Para seguir, termina el levantamiento y genera su PDF. Necesita la fotografía principal y el croquis (última sección).</Notice>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
  </div>;

  return <div className="flex flex-col gap-3">
    {checklist ? <Checklist task={checklist} disabled={lock} onError={setError} /> : <NextBox title="Checklist de documentos" text="Todavía no se crea la lista de esta operación.">
      <Button variant="primary" disabled={lock} onClick={() => void startChecklist()}>Iniciar checklist</Button>
    </NextBox>}
    <div className="flex flex-wrap gap-2">{checklistDownloads}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
  </div>;
}

/** Lista de documentos guardada como pasos de la tarea de la operación; al recibir todos, la tarea se completa. */
function Checklist({ task, disabled, onError }: { task: Task; disabled: boolean; onError: (message: string) => void }) {
  const [busy, setBusy] = React.useState(false), [extra, setExtra] = React.useState("");
  const received = task.pasos.filter(p => p.hecho).length, total = task.pasos.length;
  async function save(pasos: Task["pasos"]) {
    setBusy(true); onError("");
    try {
      const complete = pasos.length > 0 && pasos.every(p => p.hecho);
      await upsert(db.tareas, { ...task, pasos, estado: complete ? "completada" : task.estado === "completada" ? "en-curso" : task.estado }, db.tareas.version(task));
    } catch (cause) { onError(`No se pudo guardar: ${errorMessage(cause)}`); } finally { setBusy(false); }
  }
  function add(event: React.FormEvent) {
    event.preventDefault();
    const texto = extra.trim(); if (!texto) return;
    let n = 1; while (task.pasos.some(p => p.id === `X${n}`)) n++;
    void save([...task.pasos, { id: `X${n}`, texto: `D22 · ${texto}`, hecho: false }]).then(() => setExtra(""));
  }
  const lock = disabled || busy;
  return <div className="flex flex-col gap-1">
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
      <h3 className="m-0 text-base font-bold">Documentos del propietario</h3>
      <span className={s.mono}>{received} de {total} recibidos</span>
    </div>
    <ul className="flex flex-col">{task.pasos.map(paso => <li key={paso.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-5 shrink-0" checked={paso.hecho} disabled={lock} onChange={e => void save(task.pasos.map(p => p.id === paso.id ? { ...p, hecho: e.target.checked } : p))} />
        <span className={paso.hecho ? "text-muted-foreground" : ""}>{paso.texto}</span>
      </label>
      <Button variant="ghost" iconOnly aria-label={`Quitar ${paso.texto} (no aplica)`} disabled={lock} onClick={() => void save(task.pasos.filter(p => p.id !== paso.id))}><Trash2 size={16} aria-hidden="true" /></Button>
    </li>)}</ul>
    <form onSubmit={add} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">Agregar otro documento<input className={inputClass} maxLength={200} value={extra} disabled={lock} onChange={e => setExtra(e.target.value)} placeholder="Ej. Constancia de no adeudo de mantenimiento" /></label>
      <Button type="submit" disabled={lock || !extra.trim()}>Agregar</Button>
    </form>
    <p className="mt-1 text-sm text-muted-foreground">{received === total && total > 0 ? "Todos los documentos están recibidos. Ya puedes pasar a la revisión de documentos y precio." : "Marca cada documento cuando lo recibas. Si uno no aplica, quítalo de la lista. «Recibido» no quiere decir revisado: eso se hace en el dictamen jurídico."}</p>
  </div>;
}

function NextBox({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div className="mt-2 flex flex-col gap-2 rounded-[12px] border border-border bg-secondary/30 p-4">
    <p className="font-semibold">{title}</p>
    <p className="text-sm text-muted-foreground">{text}</p>
    <div className="self-start">{children}</div>
  </div>;
}

function Step({ done, icon, title, detail, children }: { done: boolean; icon: React.ReactNode; title: string; detail: string; children: React.ReactNode }) {
  return <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{done ? <CheckCircle2 size={18} aria-label="Hecho" className="text-[var(--success,#2f7d4f)]" /> : icon ?? <Circle size={18} aria-hidden="true" />}</span>
      <span className="flex min-w-0 flex-col gap-0.5"><strong>{title}</strong><span className="text-sm text-muted-foreground">{detail}</span></span>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
  </li>;
}
