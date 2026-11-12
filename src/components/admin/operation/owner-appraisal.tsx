"use client";
import * as React from "react";
import { FileDown } from "@/components/admin/icons";
import { Button, Card, Notice, Pill } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { fetchJson } from "@/lib/admin/store";
import { appraisalState, valueFromAppraisal, type OperationWorkflow, type OwnerAppraisal } from "@/lib/formatos/operation-workflow";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import type { ArchivoCliente } from "./client-documents-tab";
import { saveError } from "./use-operation";

/*
  Avalúo del propietario (COR-17, RP-96). Si el propietario ya trae un avalúo no hace falta la
  opinión de valor (07): se sube a los documentos del cliente y aquí se registran perito, fecha,
  valor y vigencia. Al guardarlo, el requisito «Opinión de valor» queda revisado con ese archivo
  y la estimación del neto (08) toma su valor. Vencido, la operación vuelve a pedir el valor.
*/

type Save = (changes: { flujo?: OperationWorkflow }) => Promise<unknown>;
type Form = { archivo: string; perito: string; fecha: string; valor: string; vigenteHasta: string };
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
export const appraisalMoney = (value: number) => money.format(value);
const longDate = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** Con año: una vigencia sin año se presta a confusión. */
const withYear = (date: string) => longDate.format(new Date(`${date}T00:00:00Z`));

export function OwnerAppraisalCard({ op, today, reviewer, disabled, onSave, onGoToFiles, className }: {
  op: OperationRecord; today: string; reviewer: string; disabled: boolean; onSave: Save; onGoToFiles: () => void; className?: string;
}) {
  const flow = flowOf(op), avaluo = flow.avaluo, state = appraisalState(flow, today);
  const [files, setFiles] = React.useState<ArchivoCliente[] | null | undefined>(undefined);
  const [form, setForm] = React.useState<Form | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const lock = disabled || busy;

  const loadFiles = React.useCallback(() => {
    fetchJson<{ archivos?: ArchivoCliente[] }>(`/api/admin/expedientes/${op.id}/archivos`).then(r => setFiles(r.archivos ?? [])).catch(() => setFiles(null));
  }, [op.id]);
  React.useEffect(() => { if (avaluo) loadFiles(); }, [avaluo, loadFiles]);
  const file = files?.find(f => f.id === avaluo?.archivo);
  const reload = () => { setFiles(undefined); loadFiles(); };

  function open() {
    setError(""); setNotice("");
    setForm(avaluo ? { archivo: avaluo.archivo, perito: avaluo.perito, fecha: avaluo.fecha, valor: String(avaluo.valor), vigenteHasta: avaluo.vigenteHasta } : { archivo: "", perito: "", fecha: "", valor: "", vigenteHasta: "" });
    reload();
  }
  async function save(next: OperationWorkflow, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await onSave({ flujo: next }); setForm(null); setNotice(done); }
    catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  const valor = form ? Number(form.valor.replace(/[^\d.]/g, "")) : 0;
  const problem = !form ? "" : !form.archivo ? "Elige el archivo del avalúo." : form.perito.trim().length < 3 ? "Escribe quién hizo el avalúo." : !form.fecha ? "Indica la fecha del avalúo."
    : !(valor > 0) ? "Escribe el valor del avalúo." : !form.vigenteHasta ? "Indica hasta cuándo está vigente." : form.vigenteHasta < form.fecha ? "La vigencia no puede ser anterior a la fecha del avalúo."
    : form.vigenteHasta < today ? "Ese avalúo ya venció: pide uno actualizado o haz la opinión de valor." : "";
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || problem || lock) return;
    const next: OwnerAppraisal = { archivo: form.archivo, perito: form.perito.trim().slice(0, 160), fecha: form.fecha, valor: Math.round(valor), vigenteHasta: form.vigenteHasta };
    const resultado = `Valor de ${appraisalMoney(next.valor)} según el avalúo de ${next.perito} del ${withYear(next.fecha)}, vigente hasta el ${withYear(next.vigenteHasta)}.`;
    const previous = flow.requisitos.valor;
    // El requisito queda revisado con el mismo archivo; el servidor comprueba que sea de esta operación.
    void save({ ...flow, avaluo: next, requisitos: { ...flow.requisitos, valor: { estado: "revisado", soporte: resultado, evidencia: { tipo: "cliente", referencia: next.archivo, fecha: today, responsable: (reviewer.trim() || "Asesor").slice(0, 160), resultado }, ...(previous?.bloquea ? { bloquea: previous.bloquea } : {}) } } },
      "Avalúo registrado. La opinión de valor ya no hace falta.");
  }
  function remove() {
    const requisitos = { ...flow.requisitos };
    if (valueFromAppraisal(flow)) delete requisitos.valor;
    const rest = { ...flow, requisitos };
    delete rest.avaluo;
    void save(rest, "Avalúo quitado. La etapa vuelve a pedir la opinión de valor.");
  }

  return <Card id="avaluo-propietario" className={`flex flex-col gap-3 p-5 ${className ?? ""}`} aria-labelledby="avaluo-titulo">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="avaluo-titulo" className="m-0 text-base">Avalúo del propietario</h2>
      {avaluo && state && <Pill tone={state === "vigente" ? "success" : "warn"}>{state === "vigente" ? "Vigente" : `Venció el ${withYear(avaluo.vigenteHasta)}`}</Pill>}
    </div>

    {!avaluo && !form && <p className="text-sm text-muted-foreground">Si el propietario ya tiene un avalúo, súbelo a sus documentos y regístralo aquí. Con eso no hace falta la opinión de valor.</p>}

    {avaluo && !form && <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Valor</dt><dd className="font-semibold">{appraisalMoney(avaluo.valor)}</dd>
        <dt className="text-muted-foreground">Perito</dt><dd>{avaluo.perito}</dd>
        <dt className="text-muted-foreground">Fecha</dt><dd>{withYear(avaluo.fecha)}</dd>
        <dt className="text-muted-foreground">Vigente hasta</dt><dd>{withYear(avaluo.vigenteHasta)}</dd>
        <dt className="text-muted-foreground">Archivo</dt><dd>{file ? <a className="inline-flex items-center gap-1 underline underline-offset-4" href={`/api/admin/archivos-cliente/${file.id}/descargar`} target="_blank" rel="noopener"><FileDown size={15} aria-hidden="true" />{file.titulo}</a> : files === undefined ? "Consultando…" : "No está entre los documentos del cliente."}</dd>
      </dl>
      {state === "vencido" && <p className="text-sm text-muted-foreground">Un avalúo vencido ya no respalda el precio. Registra uno actualizado o haz la opinión de valor.</p>}
    </>}

    {form && <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" aria-label="Registrar el avalúo del propietario">
      <div className="flex flex-col gap-1 sm:col-span-2">
        {files === undefined ? <p className="text-sm text-muted-foreground">Consultando los documentos del cliente…</p>
          : files === null ? <p role="alert" className="text-sm text-destructive">No pudimos consultar los documentos del cliente. <button type="button" className="underline underline-offset-4" onClick={reload}>Reintentar</button></p>
          : files.length === 0 ? <Notice tone="info" title="Primero sube el avalúo" actions={<Button onClick={onGoToFiles}>Ir a los documentos del cliente</Button>}>Súbelo a los documentos del cliente en PDF o foto; después elígelo aquí.</Notice>
          : <label className="text-sm">Archivo del avalúo<select className={selectClass} required value={form.archivo} disabled={lock} onChange={e => setForm({ ...form, archivo: e.target.value })}>
            <option value="">Elige el archivo…</option>{files.map(f => <option key={f.id} value={f.id}>{f.titulo}</option>)}
          </select></label>}
      </div>
      <label className="text-sm sm:col-span-2">Perito o unidad de valuación<input className={inputClass} required maxLength={160} value={form.perito} disabled={lock} onChange={e => setForm({ ...form, perito: e.target.value })} /></label>
      <label className="text-sm">Valor del avalúo (MXN)<input className={inputClass} required inputMode="numeric" value={form.valor} disabled={lock} onChange={e => setForm({ ...form, valor: e.target.value })} /></label>
      <label className="text-sm">Fecha del avalúo<input type="date" className={inputClass} required max={today} value={form.fecha} disabled={lock} onChange={e => setForm({ ...form, fecha: e.target.value })} /></label>
      <label className="text-sm">Vigente hasta<input type="date" className={inputClass} required min={form.fecha || undefined} value={form.vigenteHasta} disabled={lock} onChange={e => setForm({ ...form, vigenteHasta: e.target.value })} /></label>
      <p className="self-end text-sm text-muted-foreground">La vigencia es la que dice el avalúo.</p>
      {problem && <p className="text-sm text-muted-foreground sm:col-span-2">{problem}</p>}
      <span className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={lock || !!problem}>Guardar el avalúo</Button>
        <Button disabled={lock} onClick={() => setForm(null)}>Cancelar</Button>
      </span>
    </form>}

    <Notice tone="info">El avalúo del propietario sirve para fijar el precio. Si el comprador usa crédito, su banco o el Infonavit pedirá su propio avalúo.</Notice>

    {!form && <span className="flex flex-wrap gap-2">
      {!avaluo && <Button disabled={lock} onClick={open}>El propietario trae avalúo</Button>}
      {avaluo && <Button disabled={lock} onClick={open}>{state === "vencido" ? "Registrar un avalúo actualizado" : "Corregir el avalúo"}</Button>}
      {avaluo && <Button disabled={lock} onClick={remove}>Quitar el avalúo</Button>}
    </span>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </Card>;
}
