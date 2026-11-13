"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, MoreHorizontal } from "@/components/admin/icons";
import { Button, ButtonLink, EmptyBox, Notice, Pill, ProgressBar } from "@/components/admin/kit";
import { AsyncButton, AsyncForm, Field, btnGhost, inputClass, selectClass } from "@/components/admin/ui";
import { buyersFor, lastNotice, noticeMessage, priceDroppedSince, seekersFrom, whatsappDigits } from "@/lib/admin/buyer-matches";
import { operationalDate } from "@/lib/admin/operational-date";
import { db, uid, useCollection, useSession, type AdminProperty } from "@/lib/admin/store";
import { shortDate } from "@/lib/admin/today";
import { KEY_PLACES, NOTICE_CHANNELS, PREP_ITEMS, PREP_STATES, keyDueDate, keyLoanLate, openKeyLoans, prepProgress, prepState, type KeyPlace, type NoticeChannel, type PrepItem, type PrepState } from "@/lib/propiedad-seguimiento";
import f from "@/components/admin/form.module.css";

/*
  Seguimiento del inmueble (titular, 29/10/2026): quién tiene las llaves, qué falta para
  promoverlo y a qué compradores les puede servir. Todo es privado: el sitio no recibe
  estos campos. Cada bloque guarda solo lo suyo sobre la versión más reciente del
  inmueble; si alguien lo cambió antes, el servidor responde con conflicto y no se pierde.
  Desde SIM-19 (12/11/2026) son pestañas de la ficha del inmueble (`property-file.tsx`):
  «Prestar llaves» abre su formulario y la preparación es una lista con casilla.
*/

const toDay = (instant: string) => operationalDate(new Date(instant));
const optional = (data: FormData, key: string) => String(data.get(key) ?? "").trim() || undefined;

export type BlockProps = { property: AdminProperty; save: (patch: Partial<AdminProperty>) => Promise<unknown> };

export function KeysBlock({ property, save }: BlockProps) {
  const [lending, setLending] = React.useState(false);
  const session = useSession();
  const today = operationalDate();
  const keys = property.llaves ?? { prestamos: [] };
  const open = openKeyLoans(keys);
  const returned = keys.prestamos.filter(loan => !!loan.regreso).sort((a, b) => b.regreso!.localeCompare(a.regreso!)).slice(0, 10);
  const lend = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget, data = new FormData(form);
    const persona = optional(data, "persona");
    if (!persona) throw new Error("Escribe quién se lleva las llaves");
    await save({ llaves: { ...keys, prestamos: [...keys.prestamos, { id: uid(), persona, motivo: optional(data, "motivo"), regresoPrevisto: optional(data, "regresoPrevisto"), salida: new Date().toISOString(), registradoPor: session?.name ?? session?.email }] } });
    form.reset(); setLending(false);
  };
  const where = async (event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget), copias = optional(data, "copias");
    await save({ llaves: { ...keys, copias: copias === undefined ? undefined : Number(copias), lugar: optional(data, "lugar") as KeyPlace | undefined, detalle: optional(data, "detalle") } });
  };
  const giveBack = (id: string) => save({ llaves: { ...keys, prestamos: keys.prestamos.map(loan => loan.id === id ? { ...loan, regreso: new Date().toISOString(), recibidoPor: session?.name ?? session?.email } : loan) } });
  return <section id="llaves" aria-labelledby="llaves-title" className={`${f.group} scroll-mt-24`}>
    <div className={f.groupHead}><h2 id="llaves-title">Llaves</h2><p>{open.length ? `${open.length === 1 ? "Un préstamo abierto" : `${open.length} préstamos abiertos`}` : keys.lugar ? KEY_PLACES[keys.lugar] : "Registra dónde están y a quién se prestan."}</p></div>
    {open.length > 0 && <ul className="flex flex-col gap-2" aria-label="Llaves prestadas">{open.map(loan => {
      const late = keyLoanLate(loan, today, toDay);
      return <li key={loan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border p-3">
        <span className="flex min-w-0 flex-col gap-0.5">
          <strong className="[overflow-wrap:anywhere]">Las tiene {loan.persona}</strong>
          <small className="text-muted-foreground [overflow-wrap:anywhere]">{[`Desde el ${shortDate(toDay(loan.salida))}`, loan.motivo, `regresan el ${shortDate(keyDueDate(loan, toDay))}`].filter(Boolean).join(" · ")}</small>
        </span>
        <span className="flex flex-wrap items-center gap-2">{late && <Pill tone="alert">Atrasadas</Pill>}<AsyncButton type="button" className={btnGhost} onClick={() => giveBack(loan.id)} aria-label={`Registrar que ${loan.persona} regresó las llaves`}>Registrar regreso</AsyncButton></span>
      </li>;
    })}</ul>}
    {!lending ? <div><Button variant="primary" onClick={() => setLending(true)}>Prestar llaves</Button></div>
    : <AsyncForm onSubmit={lend} aria-label="Prestar llaves" className={`${f.grid} rounded-[10px] border border-border p-3`}>
      <Field label="Quién se las lleva" htmlFor="llaves-persona"><input id="llaves-persona" name="persona" required maxLength={160} autoFocus className={inputClass} placeholder="Asesor, comprador, técnico…" /></Field>
      <Field label="Para qué" htmlFor="llaves-motivo"><input id="llaves-motivo" name="motivo" maxLength={500} className={inputClass} placeholder="Visita, sesión de fotos, mantenimiento…" /></Field>
      <Field label="Regresan el" htmlFor="llaves-regreso" hint="Si lo dejas vacío, deben volver el mismo día."><input id="llaves-regreso" name="regresoPrevisto" type="date" min={today} className={inputClass} /></Field>
      <div className={`${f.span2} flex flex-wrap gap-2`}><Button type="submit" variant="primary">Registrar préstamo</Button><Button onClick={() => setLending(false)}>Cancelar</Button></div>
    </AsyncForm>}
    <details className="group rounded-[10px] border border-border p-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">Dónde se guardan{keys.copias !== undefined ? ` · ${keys.copias} ${keys.copias === 1 ? "copia" : "copias"}` : ""}<ChevronDown size={18} aria-hidden="true" className="transition-transform group-open:rotate-180" /></summary>
      <AsyncForm onSubmit={where} aria-label="Dónde se guardan las llaves" className={`${f.grid} mt-3`}>
        <Field label="Lugar" htmlFor="llaves-lugar"><select id="llaves-lugar" name="lugar" defaultValue={keys.lugar ?? ""} className={selectClass}><option value="">Por confirmar</option>{(Object.keys(KEY_PLACES) as KeyPlace[]).map(k => <option key={k} value={k}>{KEY_PLACES[k]}</option>)}</select></Field>
        <Field label="Copias que tiene Fortius" htmlFor="llaves-copias"><input id="llaves-copias" name="copias" type="number" min={0} max={50} step={1} inputMode="numeric" defaultValue={keys.copias ?? ""} className={inputClass} /></Field>
        <Field label="Detalle" htmlFor="llaves-detalle" className={f.span2}><input id="llaves-detalle" name="detalle" maxLength={500} defaultValue={keys.detalle ?? ""} className={inputClass} placeholder="Gaveta, llavero, control del portón…" /></Field>
        <div><Button type="submit">Guardar</Button></div>
      </AsyncForm>
    </details>
    {returned.length > 0 && <details className="group rounded-[10px] border border-border p-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">Préstamos anteriores<ChevronDown size={18} aria-hidden="true" className="transition-transform group-open:rotate-180" /></summary>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm">{returned.map(loan => <li key={loan.id} className="[overflow-wrap:anywhere]">{loan.persona} · {shortDate(toDay(loan.salida))} al {shortDate(toDay(loan.regreso!))}{loan.motivo ? ` · ${loan.motivo}` : ""}</li>)}</ul>
    </details>}
  </section>;
}

/** Preparación como lista: la casilla marca «Listo» y guarda al momento; «⋯» abre quién y cuándo. */
export function PrepBlock({ property, save }: BlockProps) {
  const advisers = useCollection(db.asesores);
  const progress = prepProgress(property);
  const items = Object.keys(PREP_ITEMS) as PrepItem[];
  const hint = (item: PrepItem) => item === "fotos" && property.galeria.length ? `Hay ${property.galeria.length} ${property.galeria.length === 1 ? "foto" : "fotos"} en la ficha` : item === "video" && property.videoUrl ? "El video ya está en la ficha" : item === "recorrido360" && property.tour360Url ? "El recorrido ya está en la ficha" : undefined;
  const [busy, setBusy] = React.useState<PrepItem | null>(null);
  const [error, setError] = React.useState("");
  async function mark(item: PrepItem, estado: PrepState) {
    setBusy(item); setError("");
    try { await save({ preparacion: { ...property.preparacion, [item]: { ...property.preparacion?.[item], estado } } }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar. Intenta de nuevo."); }
    finally { setBusy(null); }
  }
  const details = async (item: PrepItem, event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    await save({ preparacion: { ...property.preparacion, [item]: { ...property.preparacion?.[item], estado: (optional(data, "estado") as PrepState | undefined) ?? prepState(property, item).estado, fecha: optional(data, "fecha"), responsable: optional(data, "responsable") } } });
  };
  return <section id="preparacion" aria-labelledby="preparacion-title" className={`${f.group} scroll-mt-24`}>
    <div className={f.groupHead}><h2 id="preparacion-title">Preparación para promoverlo</h2><p>{progress.done} de {progress.total} listas</p></div>
    <ProgressBar value={progress.done} max={Math.max(progress.total, 1)} label={`Preparación: ${progress.done} de ${progress.total} listas`} />
    <datalist id="prep-responsables">{advisers.filter(a => a.activo).map(a => <option key={a.id} value={a.nombre} />)}</datalist>
    <ul className="m-0 flex list-none flex-col divide-y divide-border p-0" aria-label="Lista de preparación">{items.map(item => {
      const state = prepState(property, item), stored = property.preparacion?.[item];
      const meta = [state.estado === "agendado" ? "Agendado" : state.estado === "no_aplica" ? "No aplica" : undefined, stored?.fecha && shortDate(stored.fecha), stored?.responsable, state.derived ? hint(item) : undefined].filter(Boolean).join(" · ");
      return <li key={item} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-1.5">
        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-5 shrink-0 accent-[var(--primary)]" checked={state.estado === "listo"} disabled={busy === item || state.estado === "no_aplica"}
            onChange={event => void mark(item, event.currentTarget.checked ? "listo" : "pendiente")} />
          <span className="flex min-w-0 flex-col"><span className={state.estado === "no_aplica" ? "text-muted-foreground line-through" : "font-[540]"}>{PREP_ITEMS[item]}</span>{meta && <small className="text-muted-foreground [overflow-wrap:anywhere]">{meta}</small>}</span>
        </label>
        <details className="group [&[open]]:basis-full">
          <summary aria-label={`Quién y cuándo: ${PREP_ITEMS[item]}`} className="ml-auto flex size-11 cursor-pointer list-none items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary [&::-webkit-details-marker]:hidden"><MoreHorizontal size={20} aria-hidden="true" /></summary>
          <AsyncForm onSubmit={event => details(item, event)} aria-label={`Quién y cuándo: ${PREP_ITEMS[item]}`} className={`${f.grid} mt-1 mb-2 rounded-[10px] border border-border p-3`}>
            <Field label="Estado" htmlFor={`prep-${item}-estado`}><select id={`prep-${item}-estado`} name="estado" defaultValue={state.estado} className={selectClass}>
              {(Object.keys(PREP_STATES) as PrepState[]).map(k => <option key={k} value={k}>{PREP_STATES[k]}</option>)}
            </select></Field>
            <Field label="Fecha" htmlFor={`prep-${item}-fecha`}><input id={`prep-${item}-fecha`} name="fecha" type="date" defaultValue={stored?.fecha ?? ""} className={inputClass} /></Field>
            <Field label="Responsable" htmlFor={`prep-${item}-responsable`} className={f.span2}><input id={`prep-${item}-responsable`} name="responsable" list="prep-responsables" maxLength={160} defaultValue={stored?.responsable ?? ""} className={inputClass} /></Field>
            <div><Button type="submit">Guardar</Button></div>
          </AsyncForm>
        </details>
      </li>;
    })}</ul>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}

export function BuyersBlock({ property, save }: BlockProps) {
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), session = useSession();
  const [origin, setOrigin] = React.useState("");
  // El enlace al sitio se arma en el navegador con el dominio desde el que se abrió el panel.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setOrigin(window.location.origin); }, []);
  const offerable = property.publicada === true && property.estado === "disponible";
  const matches = offerable ? buyersFor(property, seekersFrom(leads, clients)) : [];
  const record = (personaId: string, tipo: "lead" | "cliente", medio: NoticeChannel) => save({ avisosCompradores: [...(property.avisosCompradores ?? []), { id: uid(), personaId, tipo, medio, fecha: new Date().toISOString(), registradoPor: session?.name ?? session?.email, precio: property.precio.modalidad === "publico" ? { monto: property.precio.monto, moneda: property.precio.moneda } : undefined }] });
  return <section id="compradores" aria-labelledby="compradores-title" className={`${f.group} scroll-mt-24`}>
    <div className={f.groupHead}><h2 id="compradores-title">Compradores que podrían interesarse</h2><p>{offerable ? `${matches.length} ${matches.length === 1 ? "persona" : "personas"}` : "Sin avisos por ahora"}</p></div>
    {!offerable ? <Notice tone="info" title="Publícalo para poder ofrecerlo">Solo inmuebles publicados y disponibles: sin contrato firmado no se ofrece a nadie.</Notice>
      : !matches.length ? <EmptyBox title="Nadie coincide todavía">Contactos que buscan algo así, en esta zona o con este presupuesto.</EmptyBox>
      : <ul className="flex flex-col gap-2" aria-label="Compradores que podrían interesarse">{matches.map(({ seeker, reasons }) => {
        const notice = lastNotice(property, seeker), dropped = priceDroppedSince(property, notice), wa = whatsappDigits(seeker.telefono);
        return <li key={`${seeker.kind}:${seeker.id}`} className="flex flex-col gap-3 rounded-[10px] border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col gap-0.5">
              <Link href={seeker.href} className="font-semibold underline-offset-4 hover:underline [overflow-wrap:anywhere]">{seeker.nombre}</Link>
              <small className="text-muted-foreground [overflow-wrap:anywhere]">{seeker.kind === "lead" ? "Prospecto" : "Cliente"} · {reasons.join(" · ")}</small>
              {notice && <small className="text-muted-foreground">Avisado el {shortDate(toDay(notice.fecha))} por {NOTICE_CHANNELS[notice.medio].toLowerCase()}</small>}
            </span>
            {dropped ? <Pill tone="warn" className="shrink-0">Bajó de precio</Pill> : notice ? <Pill tone="success" className="shrink-0">Avisado</Pill> : <Pill tone="brand" className="shrink-0">Por avisar</Pill>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {wa.length >= 7 && origin && <ButtonLink href={`https://wa.me/${wa}?text=${encodeURIComponent(noticeMessage(property, seeker, origin))}`} target="_blank" rel="noreferrer" aria-label={`Escribir por WhatsApp a ${seeker.nombre}`}><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink>}
            <NoticeButton name={seeker.nombre} hasPhone={wa.length >= 7} onRecord={medio => record(seeker.id, seeker.kind, medio)} />
          </div>
        </li>;
      })}</ul>}
    {offerable && matches.length > 0 && <p className="text-sm text-muted-foreground">Abrir WhatsApp no registra nada: marca «Ya le avisé» cuando hayas enviado el mensaje.</p>}
  </section>;
}

function NoticeButton({ name, hasPhone, onRecord }: { name: string; hasPhone: boolean; onRecord: (medio: NoticeChannel) => Promise<unknown> }) {
  const [medio, setMedio] = React.useState<NoticeChannel>(hasPhone ? "whatsapp" : "correo");
  const id = React.useId();
  return <span className="flex flex-wrap items-center gap-2">
    <label className="sr-only" htmlFor={id}>Medio del aviso a {name}</label>
    <span className="w-40"><select id={id} value={medio} onChange={e => setMedio(e.target.value as NoticeChannel)} className={selectClass}>{(Object.keys(NOTICE_CHANNELS) as NoticeChannel[]).map(k => <option key={k} value={k}>{NOTICE_CHANNELS[k]}</option>)}</select></span>
    <AsyncButton type="button" className={btnGhost} onClick={() => onRecord(medio)} aria-label={`Registrar que ya le avisaste a ${name}`}>Ya le avisé</AsyncButton>
  </span>;
}
