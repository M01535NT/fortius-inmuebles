"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { db, errorMessage, uid, upsert, useCollection, type Lead } from "@/lib/admin/store";
import { CONTACT_KINDS, RETRY_ACTION, RETRY_DAYS, addDays, missedInARow, suggestedNext, withContact, type ContactKind } from "@/lib/admin/lead-contact";

/*
  «Registrar contacto» del interesado (COR-18, RP-21): primer toque, qué pasó; segundo, guardar con
  el siguiente paso y su fecha ya propuestos. «Visitó» deja la visita en la agenda con el inmueble,
  para que la vean su ficha y la operación del propietario. Tras tres «No contestó» seguidos se
  propone reintentar en 30 días (RP-97).
*/
export function ContactLog({ lead, today, onDirtyChange }: { lead: Lead; today: string; onDirtyChange?: (dirty: boolean) => void }) {
  const properties = useCollection(db.propiedades);
  const [kind, setKind] = React.useState<ContactKind | null>(null);
  const [accion, setAccion] = React.useState(""), [fecha, setFecha] = React.useState(""), [nota, setNota] = React.useState("");
  const [inmueble, setInmueble] = React.useState(lead.propiedadSlug ?? "");
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const missed = missedInARow(lead);
  const retry = kind === "no_contesto" && missed >= 2;
  React.useEffect(() => { onDirtyChange?.(!!kind); }, [kind, onDirtyChange]);

  function pick(next: ContactKind) {
    setKind(next); setError(""); setNotice("");
    const suggested = next === "no_contesto" && missed >= 2 ? { accion: RETRY_ACTION, fecha: addDays(today, RETRY_DAYS) } : suggestedNext(next, today);
    setAccion(suggested.accion); setFecha(suggested.fecha);
  }
  function cancel() { setKind(null); setNota(""); setError(""); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!kind || busy) return;
    if (!accion.trim() || !fecha) { setError("Escribe el siguiente paso y su fecha."); return; }
    if (fecha < today) { setError("La fecha del siguiente paso no puede ser anterior a hoy."); return; }
    setBusy(true); setError("");
    try {
      const at = new Date().toISOString();
      if (kind === "visito" && inmueble) {
        const property = properties.find(p => p.slug === inmueble);
        await upsert(db.eventos, { id: uid(), titulo: `Visita de ${lead.nombre}${property ? ` a ${property.titulo}` : ""}`, fecha: today, tipo: "visita", leadId: lead.id, propiedadSlug: inmueble, asesorId: lead.asesorId }, null);
      }
      await upsert(db.leads, withContact(lead, { kind, nota, accion, fecha, id: uid(), at }), db.leads.version(lead));
      setNotice(`Listo: quedó registrado «${CONTACT_KINDS[kind]}».`); setKind(null); setNota("");
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return <div id="registrar-contacto" className="flex flex-col gap-3">
    <fieldset className="flex flex-col gap-2" disabled={busy}>
      <legend className="mb-1 text-sm font-semibold">Registrar contacto</legend>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CONTACT_KINDS) as ContactKind[]).map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => pick(k)}
          className="inline-flex min-h-11 items-center rounded-full border px-4 text-[.9375rem] font-[560]">{CONTACT_KINDS[k]}</button>)}
      </div>
      {missed >= 2 && <p className="m-0 text-sm text-muted-foreground">{missed} intentos seguidos sin respuesta.</p>}
    </fieldset>
    {kind && <form onSubmit={save} aria-label={`Guardar «${CONTACT_KINDS[kind]}»`} className="grid gap-3 sm:grid-cols-2">
      {kind === "visito" && <label className="flex flex-col gap-1 text-sm sm:col-span-2">Inmueble que visitó<select className={selectClass} value={inmueble} onChange={e => setInmueble(e.target.value)}>
        <option value="">Sin inmueble</option>
        {properties.map(p => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}
      </select></label>}
      <label className="flex flex-col gap-1 text-sm">Siguiente paso<input className={inputClass} value={accion} maxLength={160} required onChange={e => setAccion(e.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm">Fecha<input type="date" className={inputClass} value={fecha} min={today} required onChange={e => setFecha(e.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">Nota (opcional)<input className={inputClass} value={nota} maxLength={2000} placeholder="Qué se habló o qué quedó pendiente" onChange={e => setNota(e.target.value)} /></label>
      {retry && <p className="m-0 text-sm text-muted-foreground sm:col-span-2">Es el tercer intento sin respuesta: se propone reintentar en {RETRY_DAYS} días.</p>}
      <span className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>Guardar</Button><Button variant="ghost" disabled={busy} onClick={cancel}>Cancelar</Button></span>
    </form>}
    {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
  </div>;
}
