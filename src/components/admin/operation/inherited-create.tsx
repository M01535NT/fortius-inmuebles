"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, errorMessage, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { operationHref, type OperationRecord } from "@/lib/admin/operation-view";

/*
  COR-24 (12/11/2026): el director da de alta un inmueble que el asesor trae con contrato ya
  firmado. Se crea la operación en verificación, con entrevista, levantamiento y plan cubiertos por
  excepción. Lo que protege al cliente (titularidad, factibilidad, valor), el precio y el contrato se
  revisan en la operación antes de publicar, como en cualquier captación.
*/
export const INHERITED_REASON = "Inventario anterior con contrato firmado con su asesor";

export function InheritedCreate({ onDirtyChange, taken }: { onDirtyChange?: (dirty: boolean) => void; taken: Set<string> }) {
  const router = useRouter();
  const properties = useCollection(db.propiedades), advisers = useCollection(db.asesores);
  const today = operationalDate();
  const [slug, setSlug] = React.useState(""), [name, setName] = React.useState(""), [phone, setPhone] = React.useState("");
  const [since, setSince] = React.useState(""), [reason, setReason] = React.useState(INHERITED_REASON);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const dirty = !!(slug || name || phone || since || reason !== INHERITED_REASON);
  React.useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  // Solo inmuebles con asesor y sin operación del propietario en curso.
  const options = properties.filter(p => p.asesorId && !taken.has(p.slug)).sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  const adviserOf = (id?: string) => advisers.find(a => a.id === id)?.nombre ?? "sin asesor";

  async function create(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!slug) return setError("Elige el inmueble.");
    if (name.trim().length < 3) return setError("Escribe el nombre del propietario.");
    if (phone.replace(/\D/g, "").length < 7) return setError("Escribe el teléfono del propietario.");
    if (!since) return setError("Indica desde cuándo está firmado el contrato.");
    if (since > today) return setError("La fecha del contrato no puede ser futura.");
    if (reason.trim().length < 10) return setError("Escribe el motivo de la excepción (al menos 10 caracteres).");
    setBusy(true);
    try {
      const result = await apiRequest<{ expediente: OperationRecord }>("/api/admin/inventario-heredado", "POST", { propiedadSlug: slug, propietario: { nombre: name.trim(), telefono: phone.trim() }, desde: since, motivo: reason.trim() });
      onDirtyChange?.(false);
      void db.clientes.load().catch(() => {}); void db.tareas.load().catch(() => {});
      router.push(operationHref(result.expediente.id));
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }

  return <form className="flex flex-col gap-4" onSubmit={event => void create(event)} noValidate>
    <p className="text-sm text-muted-foreground">Para un inmueble que el asesor ya trae con contrato firmado. La entrevista, el levantamiento y el plan se dan por cubiertos. Antes de publicar, en la operación, registras el contrato firmado y revisas la titularidad, la factibilidad, el valor y el precio.</p>
    <label className="text-sm font-semibold">Inmueble<select className={selectClass} value={slug} onChange={e => setSlug(e.target.value)} disabled={busy}>
      <option value="">{options.length ? "Elige el inmueble…" : "No hay inmuebles sin operación"}</option>
      {options.map(p => <option key={p.slug} value={p.slug}>{p.titulo} · {adviserOf(p.asesorId)}</option>)}
    </select></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Nombre del propietario<input className={inputClass} maxLength={160} value={name} onChange={e => setName(e.target.value)} disabled={busy} autoComplete="off" /></label>
      <label className="text-sm font-semibold">Teléfono<input className={inputClass} inputMode="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} autoComplete="off" /></label>
    </div>
    <label className="text-sm font-semibold sm:max-w-xs">Contrato firmado desde<input type="date" className={inputClass} max={today} value={since} onChange={e => setSince(e.target.value)} disabled={busy} /></label>
    <label className="text-sm font-semibold">Motivo de la excepción<textarea className={textareaClass} rows={2} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div><Button type="submit" variant="primary" disabled={busy}>{busy ? "Dando de alta…" : "Dar de alta"}</Button></div>
  </form>;
}
