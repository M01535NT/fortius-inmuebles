"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "@/components/admin/icons";
import { Button, ButtonLink, Card } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { db, errorMessage, uid, upsert, type Lead } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { TIPO_INMUEBLE_LABELS } from "@/lib/inmueble-tipos";
import { LEAD_PROFILE_OPTIONS, leadProfileSchema, type LeadProfile } from "@/lib/lead-profile";
import s from "./wizard.module.css";

/*
  «Quiere comprar» y «Quiere rentar» (COR-11, RP-93, 29/10/2026). Fortius solo representa al
  propietario: quien busca comprar o rentar es interesado de Fortius y contraparte del
  propietario, nunca cliente. Aquí se hace su perfil (C-04) y se guarda como prospecto con su
  próxima acción; no se abre operación ni expediente. Ningún dato del perfil detiene el
  guardado (RP-82): solo el aviso de privacidad y la próxima acción con fecha.
*/

export type InterestedContact =
  | { kind: "lead"; lead: Lead; version: number | null }
  | { kind: "cliente"; nombre: string; telefono: string; email?: string; asesorId?: string }
  | { kind: "nuevo"; nombre: string; telefono: string; email?: string; asesorId: string };

type Intent = "comprar" | "rentar";
const label = (intent: Intent) => intent === "comprar" ? "Quiere comprar" : "Busca una renta";
type Form = { tipo: string; zona: string; uso: string; presupuesto: string; moneda: string; formaPago: string; tipoCredito: string; estadoCredito: string; origenIngresos: string; recamaras: string; plazo: string; requisitos: string; privacidad: boolean; accion: string; fecha: string };

function initial(contact: InterestedContact, intent: Intent): Form {
  const lead = contact.kind === "lead" ? contact.lead : undefined, p = lead?.perfil ?? {};
  const same = p.operacion === intent;
  const num = (v?: number) => v === undefined ? "" : String(v);
  return {
    tipo: lead?.tipoPropiedad ?? "", zona: lead?.zona ?? "", uso: same ? p.uso ?? "" : "",
    presupuesto: same ? num(p.presupuestoMax) : "", moneda: (same && p.moneda) || "MXN",
    formaPago: same ? p.formaPago ?? "" : "", tipoCredito: same ? p.tipoCredito ?? "" : "", estadoCredito: same ? p.estadoCredito ?? "" : "",
    origenIngresos: p.origenIngresos ?? "", recamaras: same ? num(p.recamaras) : "", plazo: same ? p.plazo ?? "" : "", requisitos: same ? p.requisitos ?? "" : "",
    privacidad: !!p.avisoPrivacidad, accion: intent === "comprar" ? "Enviarle opciones que cumplan su perfil" : "Enviarle opciones de renta", fecha: operationalDate(),
  };
}

/** Une el perfil capturado con el que ya tenía la persona; lo que se deja vacío no borra lo anterior. */
export function interestedProfile(intent: Intent, form: Form, before: LeadProfile = {}): LeadProfile {
  const credit = form.formaPago === "credito" || form.formaPago === "mixto";
  const number = (v: string) => v.trim() === "" ? undefined : Number(v);
  const next: Record<string, unknown> = {
    operacion: intent, uso: form.uso || undefined, presupuestoMax: number(form.presupuesto),
    formaPago: intent === "comprar" ? form.formaPago || undefined : undefined,
    tipoCredito: intent === "comprar" && credit ? form.tipoCredito || undefined : undefined,
    estadoCredito: intent === "comprar" && credit ? form.estadoCredito || undefined : undefined,
    origenIngresos: form.origenIngresos || undefined, recamaras: number(form.recamaras),
    plazo: form.plazo.trim() || undefined, requisitos: form.requisitos.trim() || undefined,
    proximaAccion: form.accion.trim(), proximoContacto: form.fecha, avisoPrivacidad: before.avisoPrivacidad ?? operationalDate(),
  };
  const merged: Record<string, unknown> = { ...before };
  for (const [key, value] of Object.entries(next)) if (value !== undefined) merged[key] = value;
  if (form.presupuesto.trim()) merged.moneda = form.moneda;
  return leadProfileSchema.parse(merged);
}

/** Paso 3 para quien compra o renta: lo que busca, y se guarda como interesado. */
export function InterestedStep({ intent, contact, origin, onBack, onSaved, onDirtyChange }: { intent: Intent; contact: InterestedContact; origin: string; onBack: () => void; onSaved: (lead: Lead) => void; onDirtyChange: (dirty: boolean, busy: boolean) => void }) {
  const [form, setForm] = React.useState(() => initial(contact, intent));
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const leadId = React.useRef(contact.kind === "lead" ? contact.lead.id : uid());
  const [baseline, setBaseline] = React.useState(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  React.useEffect(() => { onDirtyChange(dirty, busy); }, [dirty, busy, onDirtyChange]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => { setForm(old => ({ ...old, [key]: value })); setError(""); };
  const rent = intent === "rentar", credit = form.formaPago === "credito" || form.formaPago === "mixto";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!form.privacidad) { setError("Compártele el aviso de privacidad antes de guardar sus datos."); return; }
    if (!form.accion.trim() || !form.fecha) { setError("Escribe la próxima acción y su fecha."); return; }
    setBusy(true); setError("");
    try {
      const now = new Date().toISOString();
      const note = { id: uid(), fecha: now, texto: `${label(intent)}. Llegó por: ${origin}. Perfil capturado en Nueva operación, sin abrir operación: Fortius representa al propietario.${contact.kind === "cliente" ? " También es cliente de Fortius en otra operación." : ""}` };
      let lead: Lead;
      if (contact.kind === "lead") {
        const before = contact.lead;
        lead = { ...before, tipoPropiedad: form.tipo || before.tipoPropiedad, zona: form.zona.trim() || before.zona, estado: before.estado === "nuevo" ? "contactado" : before.estado, perfil: interestedProfile(intent, form, before.perfil), notas: [...before.notas, note] };
      } else lead = { perfil: interestedProfile(intent, form), id: leadId.current, nombre: contact.nombre, telefono: contact.telefono, ...(contact.email ? { email: contact.email } : {}), ...(contact.asesorId ? { asesorId: contact.asesorId } : {}), origen: "manual", estado: "contactado", creadoEl: now, notas: [note], ...(form.tipo ? { tipoPropiedad: form.tipo } : {}), ...(form.zona.trim() ? { zona: form.zona.trim() } : {}) };
      await upsert(db.leads, lead, contact.kind === "lead" ? contact.version : null);
      setBaseline(form);
      onSaved(lead);
    } catch (cause) {
      setError(errorMessage(cause) || "No se pudo guardar al interesado.");
    } finally { setBusy(false); }
  }

  const choice = (key: "uso" | "formaPago" | "tipoCredito" | "estadoCredito" | "origenIngresos" | "moneda", text: string) =>
    <label className="flex flex-col gap-2 text-sm font-semibold">{text}<select className={selectClass} value={form[key]} onChange={e => set(key, e.target.value)}>
      {key !== "moneda" && <option value="">Por confirmar</option>}
      {Object.entries(LEAD_PROFILE_OPTIONS[key]).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select></label>;

  return <form onSubmit={save} className="contents" aria-label="Lo que busca">
    <div className={s.body}>
      <h1 className={s.title}>¿Qué busca?</h1>
      <p className={s.lead}>{label(intent)}. Se guarda como interesado con su próxima acción; no se abre operación, porque Fortius representa al propietario. Lo que no sepas, déjalo en blanco.</p>
      <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold">Tipo de inmueble<select className={selectClass} value={form.tipo} onChange={e => set("tipo", e.target.value)}><option value="">Por confirmar</option>{Object.entries(TIPO_INMUEBLE_LABELS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
        {choice("uso", "Uso")}
        <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">Zonas o colonias que le interesan<input maxLength={200} className={inputClass} value={form.zona} onChange={e => set("zona", e.target.value)} /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">{rent ? "Renta mensual máxima" : "Presupuesto máximo"}<input type="number" min={0} inputMode="numeric" className={inputClass} value={form.presupuesto} onChange={e => set("presupuesto", e.target.value)} /></label>
        {choice("moneda", "Moneda")}
        {!rent && choice("formaPago", "Forma de pago")}
        {!rent && credit && <>{choice("tipoCredito", "Tipo de crédito")}{choice("estadoCredito", "Estado del crédito")}</>}
        {choice("origenIngresos", "Origen de sus ingresos")}
        <label className="flex flex-col gap-2 text-sm font-semibold">Recámaras mínimas<input type="number" min={0} max={50} inputMode="numeric" className={inputClass} value={form.recamaras} onChange={e => set("recamaras", e.target.value)} /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">¿Para cuándo lo necesita?<input maxLength={500} className={inputClass} value={form.plazo} onChange={e => set("plazo", e.target.value)} /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">Lo que necesita y notas<textarea rows={3} maxLength={4000} className={textareaClass} value={form.requisitos} onChange={e => set("requisitos", e.target.value)} /></label>
        <label className="flex min-h-11 items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" className="mt-1" checked={form.privacidad} onChange={e => set("privacidad", e.target.checked)} /><span><strong>Ya le compartí el aviso de privacidad.</strong> <span className="text-muted-foreground">Compártele el enlace antes de guardar sus datos.</span></span></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Próxima acción<input required maxLength={160} className={inputClass} value={form.accion} onChange={e => set("accion", e.target.value)} /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Fecha de la próxima acción<input required type="date" className={inputClass} value={form.fecha} onChange={e => set("fecha", e.target.value)} /></label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    <div className={s.footer}><div className={s.footerRow}>
      <Button variant="ghost" disabled={busy} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Atrás</Button>
      <Button type="submit" variant="primary" disabled={busy}>{busy ? "Guardando…" : "Guardar interesado"}<ArrowRight size={16} aria-hidden="true" /></Button>
    </div></div>
  </form>;
}

/** Paso 4 para quien compra o renta: quedó como interesado y qué sigue. */
export function InterestedDone({ intent, lead }: { intent: Intent; lead: Lead }) {
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { heading.current?.focus(); }, []);
  return <div className={s.body}>
    <span className={s.doneMark} aria-hidden="true"><Check size={28} /></span>
    <h1 ref={heading} tabIndex={-1} className={s.title}>Listo, {lead.nombre} quedó como interesado</h1>
    <p className={s.lead}>No se abrió operación: Fortius representa al propietario. Lo encuentras en Contactos, con su próxima acción.</p>
    <Card as="div" className="overflow-hidden"><dl className={s.summary} aria-label="Resumen del interesado">
      <dt>Interesado</dt><dd>{lead.nombre}</dd>
      <dt>Quiere</dt><dd>{label(intent)}</dd>
      <dt>Próxima acción</dt><dd>{lead.perfil?.proximaAccion} · {lead.perfil?.proximoContacto}</dd>
      <dt>Lo que sigue</dt><dd>Cuando visite un inmueble o haga una oferta, regístrala en la operación del propietario. Si firma la promesa, la compraventa o el arrendamiento, queda como contraparte de esa operación.</dd>
    </dl></Card>
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink variant="primary" href={`/admin/leads/${encodeURIComponent(lead.id)}`}>Ver su ficha<ArrowRight size={16} aria-hidden="true" /></ButtonLink>
      <Link href="/admin" className="font-semibold text-foreground underline-offset-4 hover:underline">Volver a Hoy</Link>
    </div>
  </div>;
}
