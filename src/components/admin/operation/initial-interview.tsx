"use client";
import * as React from "react";
import { CheckCircle2, Circle, ClipboardList, FileDown, FileText, PlayCircle, ShieldCheck } from "lucide-react";
import { Button, ButtonLink, Notice } from "@/components/admin/kit";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { answerLabel, type OperationalInterview } from "@/lib/intake/interview";
import { shortDate } from "@/lib/admin/today";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { FormatoCapture, type Emision } from "./formato-capture";
import type { Documento } from "./documents-tab";
import s from "./operation.module.css";

/*
  Etapas «Prospecto» y «Entrevista inicial» del propietario (decisión del titular, 16/10/2026).
  Prospecto: lo que se supo en el primer contacto y el botón para iniciar la entrevista.
  Entrevista inicial: el formato 02 capturado en pantalla, el aviso de privacidad (01)
  y el checklist de documentos que se le pide al propietario.
*/

const post = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const latest = (documents: Documento[], formato: string) => documents.filter(d => d.formato_id === formato).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

export function InitialInterviewCard({ op, phase, cliente, interview, documents, emissions, onDocumentsChange, onEmitted, onOpenDocument, disabled }: {
  op: OperationRecord; phase: "prospecto" | "captacion"; cliente?: string; interview: OperationalInterview | null;
  documents: Documento[]; emissions: Emision[]; disabled: boolean;
  onDocumentsChange: (update: (items: Documento[]) => Documento[]) => void; onEmitted: (emision: Emision) => void; onOpenDocument: (id: string) => void;
}) {
  const [open, setOpen] = React.useState<Documento | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const entrevista = latest(documents, "02"), aviso = latest(documents, "01");
  const emitted = !!entrevista && emissions.some(e => e.draft_version === entrevista.version);
  const pdf = entrevista ? emissions.find(e => e.draft_version === entrevista.version) : undefined;

  async function create(formatoId: "01" | "02") {
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
  async function start() {
    const doc = entrevista ?? await create("02");
    if (doc) setOpen(doc);
  }
  async function openAviso() {
    const doc = aviso ?? await create("01");
    if (doc) onOpenDocument(doc.id);
  }

  const a = interview?.respuestas ?? {};
  const capture = open && <FormatoCapture document={open} folio={op.folio} cliente={cliente}
    onSaved={doc => onDocumentsChange(items => items.map(item => item.id === doc.id ? doc : item))}
    onEmitted={onEmitted} onClose={() => setOpen(null)} />;

  if (phase === "prospecto") return <div className="flex flex-col gap-4">
    {interview && <dl className={s.facts}>
      {a.ubicacion && <><dt>Inmueble</dt><dd>{a.ubicacion}{a.zona ? ` · ${a.zona}` : ""}</dd></>}
      {a.tipoInmueble && <><dt>Tipo</dt><dd>{answerLabel(a.tipoInmueble)}</dd></>}
      {a.objetivo && <><dt>Qué quiere</dt><dd>{a.objetivo}{a.plazo ? ` · ${a.plazo}` : ""}</dd></>}
      {a.presupuestoEstado === "conocido" && a.importe && <><dt>Precio que mencionó</dt><dd className="font-mono">${Math.round(Number(a.importe)).toLocaleString("en-US")} {a.moneda}</dd></>}
      {a.siguienteFecha && <><dt>{a.siguienteAccion || "Lo que sigue"}</dt><dd>{shortDate(a.siguienteFecha)}</dd></>}
      {a.condiciones && <><dt>Notas</dt><dd className="whitespace-pre-line">{a.condiciones}</dd></>}
    </dl>}
    <div className="flex flex-col gap-2 rounded-[12px] border border-border bg-secondary/30 p-4">
      <p className="font-semibold">¿Ya estás con el propietario?</p>
      <p className="text-sm text-muted-foreground">La entrevista inicial (formato 02) ya trae sus preguntas: solo capturas las respuestas. Lo que se dijo en el primer contacto aparece ya llenado para confirmarlo.</p>
      <Button variant="primary" className="self-start" disabled={disabled || busy} onClick={() => void start()}><PlayCircle size={18} aria-hidden="true" />{busy ? "Preparando…" : "Iniciar entrevista inicial"}</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
  </div>;

  return <div className="flex flex-col gap-1">
    <h3 className="m-0 border-b border-border pb-3 text-base font-bold">Lo que se hace en esta etapa</h3>
    <ul className="flex flex-col">
      <Step done={emitted} icon={<ClipboardList size={18} aria-hidden="true" />} title="Entrevista inicial (02)"
        detail={!entrevista ? "Todavía no empieza." : emitted ? `Terminada · PDF de la versión ${entrevista.version}` : `En captura · versión ${entrevista.version} · actualizada el ${shortDate(entrevista.updated_at)}`}>
        <Button variant={emitted ? "secondary" : "primary"} disabled={disabled || busy} onClick={() => void start()}><PlayCircle size={16} aria-hidden="true" />{!entrevista ? "Iniciar entrevista" : emitted ? "Abrir entrevista" : "Continuar entrevista"}</Button>
        {pdf && <ButtonLink prefetch={false} href={`/api/admin/emisiones/${pdf.id}/descargar`}><FileDown size={16} aria-hidden="true" />PDF</ButtonLink>}
      </Step>
      <Step done={!!aviso} icon={<ShieldCheck size={18} aria-hidden="true" />} title="Aviso de privacidad (01)"
        detail={aviso ? `Preparado · versión ${aviso.version}. Entrégalo y guarda la copia firmada en Documentos.` : "Se le entrega en la entrevista. En la sección «Datos de la entrevista» del 02 anota cuándo y por qué medio."}>
        <Button disabled={disabled || busy} onClick={() => void openAviso()}><FileText size={16} aria-hidden="true" />{aviso ? "Abrir aviso" : "Preparar aviso"}</Button>
      </Step>
      <Step done={false} icon={<ClipboardList size={18} aria-hidden="true" />} title="Checklist de documentos"
        detail="Dáselo al propietario para que reúna sus documentos. En la sección 08 de la entrevista anota cuáles entregará y cuándo; con ellos se hace el dictamen jurídico.">
        <ButtonLink prefetch={false} href="/descargas/checklist-venta-fortius.pdf" target="_blank" rel="noreferrer"><FileDown size={16} aria-hidden="true" />Descargar checklist</ButtonLink>
      </Step>
    </ul>
    {!emitted && entrevista && <Notice tone="info" className="mt-2">Para pasar a la siguiente etapa, termina la entrevista y genera su PDF (botón «Terminar y descargar PDF» en la última sección).</Notice>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {capture}
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
