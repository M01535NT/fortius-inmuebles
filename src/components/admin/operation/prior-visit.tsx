"use client";
import * as React from "react";
import { Button, Card, Pill } from "@/components/admin/kit";
import { inputClass, textareaClass } from "@/components/admin/ui";
import { db, uid, uploadFile, useCollection, useSession } from "@/lib/admin/store";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import type { OperationWorkflow, PriorVisit } from "@/lib/formatos/operation-workflow";
import { privateFileUrl } from "@/components/admin/property-origin";
import { saveError } from "./use-operation";

/*
  Visita autorizada antes de la firma (DEC-41, excepción a RP-91). Un inmueble «En evaluación» se
  puede enseñar a un interesado concreto antes de firmar la intermediación si el propietario firma
  una carta breve de autorización de visita y el director da el visto bueno con motivo. No se
  publica ni se mandan fotos o ficha. La base exige al director y que la carta se haya subido.
*/

type Save = (changes: { flujo?: OperationWorkflow }) => Promise<unknown>;
type Form = { interesado: string; motivo: string; carta: { path: string; nombre: string } | null };
const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Tijuana" });

export function PriorVisitCard({ op, disabled, onSave, className }: { op: OperationRecord; disabled: boolean; onSave: Save; className?: string }) {
  const flow = flowOf(op), visits = flow.visitasPrevias ?? [];
  const director = useSession()?.role !== "editor";
  const leads = useCollection(db.leads);
  const [form, setForm] = React.useState<Form | null>(null);
  const [busy, setBusy] = React.useState(false), [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const lock = disabled || busy || uploading;
  const id = React.useId();
  const signed = flow.requisitos.intermediacion?.estado === "revisado";

  async function save(next: PriorVisit[], done: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const flujo: OperationWorkflow = { ...flow, visitasPrevias: next };
      if (!next.length) delete flujo.visitasPrevias;
      await onSave({ flujo }); setForm(null); setNotice(done);
    } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  async function attach(file: File | undefined, input: HTMLInputElement) {
    if (!file || !form) return;
    setUploading(true); setError("");
    try { const saved = await uploadFile(file, "private"); setForm(current => current && { ...current, carta: { path: saved.path, nombre: file.name.slice(0, 160) } }); input.value = ""; }
    catch { setError("No se pudo subir la carta. Intenta de nuevo."); } finally { setUploading(false); }
  }
  const problem = !form ? "" : form.interesado.trim().length < 2 ? "Escribe a quién se le enseña el inmueble." : !form.carta ? "Adjunta la carta firmada por el propietario."
    : form.motivo.trim().length < 3 ? "Escribe por qué se autoriza." : "";
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || problem || lock) return;
    const name = form.interesado.trim();
    const lead = leads.find(item => item.nombre.trim().toLocaleLowerCase("es-MX") === name.toLocaleLowerCase("es-MX"));
    const visit: PriorVisit = { id: uid(), interesado: name.slice(0, 160), ...(lead ? { leadId: lead.id } : {}), carta: { path: form.carta!.path, ...(form.carta!.nombre ? { nombre: form.carta!.nombre } : {}) }, motivo: form.motivo.trim().slice(0, 1000) };
    void save([...visits, visit], "Visita autorizada. Queda en el historial de la operación.");
  }

  return <Card id="visita-previa" className={`flex flex-col gap-3 p-5 ${className ?? ""}`} aria-labelledby={`${id}-titulo`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id={`${id}-titulo`} className="m-0 text-base">Visita antes de la firma</h2>
      {visits.length > 0 && !signed && <Pill tone="warn">Visita autorizada antes de la firma</Pill>}
    </div>
    <p className="m-0 text-sm text-muted-foreground">Sin la intermediación firmada el inmueble no se ofrece. Solo se puede enseñar a un interesado concreto con la carta de autorización de visita firmada por el propietario y el visto bueno del director. No se publica ni se mandan fotos ni ficha.</p>
    {visits.length > 0 && <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {visits.map(visit => <li key={visit.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3 text-sm">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong>{visit.interesado}</strong>
          <span className="text-muted-foreground">{visit.motivo}</span>
          <span className="text-muted-foreground">{visit.autorizadoEl ? `Autorizada el ${when.format(new Date(visit.autorizadoEl))}. ` : ""}<a href={privateFileUrl(visit.carta.path)} target="_blank" rel="noreferrer" className="text-primary-ink underline underline-offset-4">Ver la carta</a></span>
        </span>
        {director && <Button variant="ghost" disabled={lock} onClick={() => void save(visits.filter(item => item.id !== visit.id), "Se retiró la autorización de visita.")}>Retirar</Button>}
      </li>)}
    </ul>}
    {!director && !signed && <p className="m-0 text-sm">Si un interesado quiere verlo antes de la firma, pide la carta al propietario; la autoriza el director.</p>}
    {director && !signed && !form && <Button className="self-start" disabled={lock} onClick={() => { setError(""); setNotice(""); setForm({ interesado: "", motivo: "", carta: null }); }}>Autorizar una visita</Button>}
    {form && <form className="flex flex-col gap-3" onSubmit={submit} aria-label="Autorizar una visita antes de la firma">
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`${id}-interesado`}>Interesado
        <input id={`${id}-interesado`} list={`${id}-leads`} maxLength={160} value={form.interesado} onChange={event => setForm({ ...form, interesado: event.target.value })} className={inputClass} />
        <datalist id={`${id}-leads`}>{leads.filter(lead => lead.estado !== "descartado").map(lead => <option key={lead.id} value={lead.nombre} />)}</datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`${id}-carta`}>{form.carta ? "Cambiar la carta" : "Carta de autorización de visita firmada por el propietario"}
        <input id={`${id}-carta`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => void attach(event.currentTarget.files?.[0], event.currentTarget)} className={inputClass + " h-auto min-h-11 py-2"} />
      </label>
      {uploading && <p role="status" className="m-0 text-sm">Subiendo…</p>}
      {form.carta && !uploading && <p className="m-0 text-sm">Adjunta: {form.carta.nombre || "carta"}</p>}
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`${id}-motivo`}>Por qué se autoriza
        <textarea id={`${id}-motivo`} rows={2} maxLength={1000} value={form.motivo} onChange={event => setForm({ ...form, motivo: event.target.value })} className={textareaClass} />
      </label>
      {problem && <p className="m-0 text-sm text-muted-foreground">{problem}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={lock || !!problem}>Autorizar</Button>
        <Button variant="ghost" disabled={busy} onClick={() => setForm(null)}>Cancelar</Button>
      </div>
    </form>}
    {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
  </Card>;
}
