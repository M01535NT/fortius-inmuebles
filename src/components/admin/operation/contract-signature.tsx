"use client";
import * as React from "react";
import { FileDown, Plus, Trash2 } from "@/components/admin/icons";
import { Button, Card, Notice, Pill } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { db, fetchJson, useCollection, useSession } from "@/lib/admin/store";
import { CONTRACT_TYPES, contractTypeFor, SIGNATURE_STATE_LABEL, SIGNER_ROLES, signatureState, type ContractSignature, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { shortDate } from "@/lib/admin/today";
import type { ArchivoCliente } from "./client-documents-tab";
import { saveError } from "./use-operation";

/*
  Firma del contrato con Fortius (COR-10, RP-90, RP-91, RP-97). Desde que el propietario firma la
  intermediación es cliente y el inmueble está captado; sin la firma completa y revisada por el
  director no se publica. El asesor registra el contrato firmado (subido a los documentos del
  cliente; vale el firmado fuera del panel), la fecha y quién firmó. El servidor anota quién la
  registró y cuándo, y una firma corregida vuelve a quedar por revisar.
*/

type Save = (changes: { flujo?: OperationWorkflow }) => Promise<unknown>;
type Signer = ContractSignature["firmantes"][number];
type Form = { tipo: ContractSignature["tipo"]; fecha: string; firmantes: Signer[]; archivo: string; completa: boolean; faltan: string };
const SIGNER_SHORT = { propietario: "propietario", representante: "representante", fortius: "Fortius", otro: "otra parte" } as const;
const TONE = { sin_firma: "warn", incompleta: "warn", por_revisar: "warn", vigente: "success", terminada: "muted" } as const;

export function ContractSignatureCard({ op, today, disabled, onSave, onGoToFiles, className }: {
  op: OperationRecord; today: string; disabled: boolean; onSave: Save; onGoToFiles: () => void; className?: string;
}) {
  const session = useSession(), admin = session?.role === "admin";
  const clients = useCollection(db.clientes), advisers = useCollection(db.asesores);
  const flow = flowOf(op), firma = flow.firmaContrato, state = signatureState(flow);
  const [files, setFiles] = React.useState<ArchivoCliente[] | null | undefined>(undefined);
  const [form, setForm] = React.useState<Form | null>(null);
  const [ending, setEnding] = React.useState<{ fecha: string; motivo: string } | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const lock = disabled || busy;

  // Los documentos del cliente se consultan al abrir el formulario: ahí se elige el contrato firmado.
  const loadFiles = React.useCallback(() => {
    fetchJson<{ archivos?: ArchivoCliente[] }>(`/api/admin/expedientes/${op.id}/archivos`).then(r => setFiles(r.archivos ?? [])).catch(() => setFiles(null));
  }, [op.id]);
  React.useEffect(() => { if (firma) loadFiles(); }, [firma, loadFiles]);
  const file = files?.find(f => f.id === firma?.archivo);

  const reload = () => { setFiles(undefined); loadFiles(); };
  /** Abre el registro: corrige la firma actual o, si el contrato terminó, registra uno nuevo. */
  function open(fresh = false) {
    setError(""); setNotice(""); setEnding(null);
    const owner = clients.find(c => c.id === op.cliente_id)?.nombre ?? "", adviser = advisers.find(a => a.id === op.asesor_id)?.nombre ?? "";
    setForm(firma && !fresh
      ? { tipo: firma.tipo, fecha: firma.fecha, firmantes: firma.firmantes.map(f => ({ ...f })), archivo: firma.archivo, completa: firma.completa, faltan: firma.faltan ?? "" }
      : { tipo: contractTypeFor(flow.ruta), fecha: today, firmantes: [{ nombre: owner, parte: "propietario" }, { nombre: adviser, parte: "fortius" }], archivo: "", completa: true, faltan: "" });
    reload();
  }
  async function save(next: ContractSignature, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await onSave({ flujo: { ...flow, firmaContrato: next } }); setForm(null); setEnding(null); setNotice(done); }
    catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  const signers = form?.firmantes.filter(f => f.nombre.trim().length >= 3) ?? [];
  const ready = !!form && !!form.fecha && !!form.archivo && signers.length > 0 && (form.completa || form.faltan.trim().length >= 3);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !ready || lock) return;
    const next: ContractSignature = { tipo: form.tipo, fecha: form.fecha, firmantes: signers.map(f => ({ nombre: f.nombre.trim().slice(0, 160), parte: f.parte })), archivo: form.archivo, completa: form.completa,
      ...(!form.completa ? { faltan: form.faltan.trim().slice(0, 1000) } : {}), revisada: false };
    void save(next, form.completa ? "Firma registrada. Falta que el director la revise." : "Firma registrada como incompleta.");
  }
  const setSigner = (i: number, patch: Partial<Signer>) => form && setForm({ ...form, firmantes: form.firmantes.map((f, n) => n === i ? { ...f, ...patch } : f) });

  return <Card id="firma-contrato" className={`flex flex-col gap-3 p-5 ${className ?? ""}`} aria-labelledby="firma-contrato-titulo">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="firma-contrato-titulo" className="m-0 text-base">Firma del contrato</h2>
      <Pill tone={TONE[state]}>{SIGNATURE_STATE_LABEL[state]}</Pill>
    </div>

    {!firma && !form && <p className="text-sm text-muted-foreground">Desde que el propietario firma la intermediación es cliente y el inmueble queda captado. Sube el contrato firmado a los documentos del cliente y regístralo aquí; vale el que se firmó fuera del panel.</p>}

    {firma && !form && <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Contrato</dt><dd>{CONTRACT_TYPES[firma.tipo]}</dd>
        <dt className="text-muted-foreground">Firmado el</dt><dd>{shortDate(firma.fecha)}</dd>
        <dt className="text-muted-foreground">Firmaron</dt><dd>{firma.firmantes.map(f => `${f.nombre} (${SIGNER_SHORT[f.parte]})`).join(", ")}</dd>
        {!firma.completa && <><dt className="text-muted-foreground">Falta</dt><dd>{firma.faltan}</dd></>}
        <dt className="text-muted-foreground">Archivo</dt><dd>{file ? <a className="inline-flex items-center gap-1 underline underline-offset-4" href={`/api/admin/archivos-cliente/${file.id}/descargar`} target="_blank" rel="noopener"><FileDown size={15} aria-hidden="true" />{file.titulo}</a> : files === undefined ? "Consultando…" : "No está entre los documentos del cliente."}</dd>
        {firma.registradoEl && <><dt className="text-muted-foreground">Registrada</dt><dd>{shortDate(firma.registradoEl)}</dd></>}
        {firma.revisada && firma.revisadoEl && <><dt className="text-muted-foreground">Revisada</dt><dd>{shortDate(firma.revisadoEl)}</dd></>}
        {firma.terminacion && <><dt className="text-muted-foreground">Terminó</dt><dd>{shortDate(firma.terminacion.fecha)} · {firma.terminacion.motivo}</dd></>}
      </dl>
      {state === "por_revisar" && !admin && <p className="text-sm text-muted-foreground">El director la revisa antes de publicar. Mientras tanto el inmueble está «Captado, por revisar».</p>}
      {state === "incompleta" && <p className="text-sm text-muted-foreground">Cuando firmen todos, corrígela y márcala completa.</p>}
    </>}

    {form && <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" aria-label="Registrar la firma del contrato">
      <label className="text-sm">Contrato<select className={selectClass} value={form.tipo} disabled={lock} onChange={e => setForm({ ...form, tipo: e.target.value as Form["tipo"] })}>
        {Object.entries(CONTRACT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="text-sm">Fecha de firma<input type="date" className={inputClass} required max={today} value={form.fecha} disabled={lock} onChange={e => setForm({ ...form, fecha: e.target.value })} /></label>
      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <legend className="mb-1 text-sm font-semibold">Quién firmó</legend>
        {form.firmantes.map((f, i) => <div key={i} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 text-sm">Nombre<input className={inputClass} required={i === 0} maxLength={160} value={f.nombre} disabled={lock} onChange={e => setSigner(i, { nombre: e.target.value })} /></label>
          <label className="text-sm">Firma como<select className={selectClass} value={f.parte} disabled={lock} onChange={e => setSigner(i, { parte: e.target.value as Signer["parte"] })}>
            {Object.entries(SIGNER_ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          {form.firmantes.length > 1 && <Button iconOnly aria-label={`Quitar a ${f.nombre || "este firmante"}`} disabled={lock} onClick={() => setForm({ ...form, firmantes: form.firmantes.filter((_, n) => n !== i) })}><Trash2 size={16} aria-hidden="true" /></Button>}
        </div>)}
        {form.firmantes.length < 12 && <span><Button disabled={lock} onClick={() => setForm({ ...form, firmantes: [...form.firmantes, { nombre: "", parte: "propietario" }] })}><Plus size={16} aria-hidden="true" />Agregar firmante</Button></span>}
      </fieldset>
      <div className="flex flex-col gap-1 sm:col-span-2">
        {files === undefined ? <p className="text-sm text-muted-foreground">Consultando los documentos del cliente…</p>
          : files === null ? <p role="alert" className="text-sm text-destructive">No pudimos consultar los documentos del cliente. <button type="button" className="underline underline-offset-4" onClick={reload}>Reintentar</button></p>
          : files.length === 0 ? <Notice tone="info" title="Primero sube el contrato firmado" actions={<Button onClick={onGoToFiles}>Ir a los documentos del cliente</Button>}>Escanéalo o tómale foto y súbelo a los documentos del cliente; después elígelo aquí.</Notice>
          : <label className="text-sm">Contrato firmado<select className={selectClass} required value={form.archivo} disabled={lock} onChange={e => setForm({ ...form, archivo: e.target.value })}>
            <option value="">Elige el archivo…</option>{files.map(f => <option key={f.id} value={f.id}>{f.titulo}</option>)}
          </select></label>}
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="size-5" checked={form.completa} disabled={lock} onChange={e => setForm({ ...form, completa: e.target.checked })} />Firmaron todos los que deben firmar</label>
      {!form.completa && <label className="text-sm sm:col-span-2">Quién falta por firmar<input className={inputClass} required maxLength={1000} value={form.faltan} disabled={lock} onChange={e => setForm({ ...form, faltan: e.target.value })} /></label>}
      <span className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={lock || !ready}>Guardar la firma</Button>
        <Button disabled={lock} onClick={() => setForm(null)}>Cancelar</Button>
      </span>
    </form>}

    {ending && firma && <form onSubmit={e => { e.preventDefault(); if (ending.fecha && ending.motivo.trim().length >= 3) void save({ ...firma, terminacion: { fecha: ending.fecha, motivo: ending.motivo.trim().slice(0, 1000) } }, "Terminación registrada."); }} className="grid gap-2 sm:grid-cols-3" aria-label="Registrar la terminación del contrato">
      <label className="text-sm">Terminó el<input type="date" className={inputClass} required max={today} value={ending.fecha} disabled={lock} onChange={e => setEnding({ ...ending, fecha: e.target.value })} /></label>
      <label className="text-sm sm:col-span-2">Motivo<input className={inputClass} required maxLength={1000} placeholder="Venció, se rescindió…" value={ending.motivo} disabled={lock} onChange={e => setEnding({ ...ending, motivo: e.target.value })} /></label>
      <span className="flex flex-wrap gap-2 sm:col-span-3"><Button type="submit" disabled={lock || !ending.fecha || ending.motivo.trim().length < 3}>Guardar terminación</Button><Button disabled={lock} onClick={() => setEnding(null)}>Cancelar</Button></span>
    </form>}

    {!form && !ending && <span className="flex flex-wrap gap-2">
      {!firma && <Button disabled={lock} onClick={() => open()}>Registrar la firma</Button>}
      {state === "terminada" && <Button disabled={lock} onClick={() => open(true)}>Registrar un contrato nuevo</Button>}
      {firma && admin && state === "por_revisar" && <Button disabled={lock} onClick={() => void save({ ...firma, revisada: true }, "Firma revisada. El inmueble queda captado.")}>Marcar la firma revisada</Button>}
      {firma && state !== "terminada" && <Button disabled={lock} onClick={() => open()}>Corregir la firma</Button>}
      {firma && (state === "vigente" || state === "por_revisar") && <Button disabled={lock} onClick={() => { setNotice(""); setError(""); setEnding({ fecha: today, motivo: "" }); }}>Registrar terminación</Button>}
    </span>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Card>;
}
