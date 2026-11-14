"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone, Trash2, UserPlus } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Card, Pill } from "@/components/admin/kit";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import { LEAD_PROFILE_OPTIONS } from "@/lib/lead-profile";
import { db, errorMessage, LEAD_ORIGEN_LABELS, removeById, upsert, type Cliente, type Evento, type Lead } from "@/lib/admin/store";
import { FirstContactButton } from "@/components/admin/workspace/first-contact";
import { arrivedAt } from "@/lib/admin/today";
import { leadStage, LEAD_STAGE_LABELS } from "@/lib/admin/person-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { stepDate, type ContactRow, type Waiting } from "@/lib/admin/contacts-view";
import { shortDate } from "@/lib/admin/today";
import s from "./contacts.module.css";

/*
  Vista previa de una persona (boceto Contactos, 17/10/2026): a la derecha de la lista, en
  computadora, se ve quién es, lo que busca, su presupuesto, el siguiente paso y su actividad
  reciente, con Llamar, WhatsApp y «Abrir ficha». Todo sale de la ficha que ya existe; los
  «inmuebles que coinciden» del boceto no existen todavía en el sistema (EXT-01).
  Al pie, «Eliminar contacto» (titular, 14/11/2026): el menú «⋯» de la ficha no se encontraba. Mismas
  reglas que la ficha: va a Eliminados y se restaura; un cliente con una operación en curso no se
  elimina (`blocking` dice cuál); un prospecto que ya es cliente se elimina como cliente.
*/

const CLIENT_TYPE: Record<Cliente["tipo"], string> = { propietario: "Propietario", comprador: "Comprador", arrendador: "Arrendador", arrendatario: "Arrendatario", inversionista: "Inversionista", otro: "Cliente" };

/** «12:42» en la hora de Tijuana. */
const clock = (instant: number) => new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Tijuana" }).format(instant);

export function ContactPreview({ row, lead, client, tasks, events, today, blocking = "", wait, limitHours = 2, me }: {
  row: ContactRow; lead?: Lead; client?: Cliente; tasks: Task[]; events: Evento[]; today: string; blocking?: string;
  /** Prospecto sin primera respuesta: cuánto lleva y si pasó el plazo. */
  wait?: Waiting | null; limitHours?: number;
  /** El asesor de quien usa el panel, para «Asignármela». */
  me?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [taking, setTaking] = React.useState(false);
  const [error, setError] = React.useState("");
  const person = lead ?? client;
  if (!person) return null;
  const canDelete = !(lead?.clienteId);
  async function remove() {
    if (!await confirmDelete(lead ? "prospecto" : "cliente", `${person!.nombre} sale de Contactos${lead ? " con su historial" : ""}.`, "o")) return;
    setBusy(true); setError("");
    try {
      if (lead) await removeById(db.leads, lead.id, db.leads.version(lead));
      else await removeById(db.clientes, client!.id, db.clientes.version(client!));
    } catch (problem) { setError(errorMessage(problem)); setBusy(false); }
  }
  const digits = (person.telefono ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  const perfil = person.perfil;
  const kind = lead ? `Prospecto · ${LEAD_ORIGEN_LABELS[lead.origen] ?? lead.origen}` : `Cliente · ${CLIENT_TYPE[client!.tipo]}`;
  const chips = [
    perfil?.operacion && LEAD_PROFILE_OPTIONS.operacion[perfil.operacion],
    person.tipoPropiedad && person.tipoPropiedad[0].toUpperCase() + person.tipoPropiedad.slice(1),
    person.zona,
    perfil?.recamaras !== undefined && `${perfil.recamaras} ${perfil.recamaras === 1 ? "recámara" : "recámaras"}`,
    perfil?.estacionamientos !== undefined && `${perfil.estacionamientos} ${perfil.estacionamientos === 1 ? "estacionamiento" : "estacionamientos"}`,
    perfil?.formaPago && LEAD_PROFILE_OPTIONS.formaPago[perfil.formaPago],
    perfil?.estadoCredito && `Crédito ${LEAD_PROFILE_OPTIONS.estadoCredito[perfil.estadoCredito].toLowerCase()}`,
    perfil?.plazo && `Plazo: ${perfil.plazo}`,
  ].filter((text): text is string => typeof text === "string" && text.trim().length > 0);
  const mine = (ref: { leadId?: string; clienteId?: string }) => lead ? ref.leadId === lead.id : ref.clienteId === client!.id;
  const activity = [
    ...tasks.filter(t => isTaskOpen(t) && mine(t)).map(t => ({ id: `t${t.id}`, when: t.vence ? stepDate(t.vence, today) : null, text: t.titulo, kind: "Tarea", href: `/admin/tareas/${encodeURIComponent(t.id)}`, sort: t.vence ?? "9999" })),
    ...events.filter(e => mine(e) && e.fecha >= today).map(e => ({ id: `e${e.id}`, when: stepDate(e.fecha, today, e.hora), text: e.titulo, kind: e.tipo === "visita" ? "Visita" : "Cita", href: `/admin/agenda?fecha=${e.fecha}&evento=${encodeURIComponent(e.id)}`, sort: `${e.fecha} ${e.hora ?? ""}` })),
  ].sort((a, b) => a.sort.localeCompare(b.sort)).slice(0, 5);
  // C-54: las tres notas más recientes, por fecha (se guardan de la más nueva a la más vieja).
  const notes = [...(lead?.notas ?? client?.leadOriginal?.notas ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  const due = row.when ? <Pill size="sm" tone={row.late ? "alert" : "muted"}>{row.when}</Pill> : null;
  // Boceto «desde cero» (14/11/2026): el plazo de primera respuesta en un aviso azul con su barra.
  const arrived = lead && wait ? new Date(arrivedAt(lead)).getTime() : NaN;
  const deadline = arrived + limitHours * 3_600_000;
  const spent = wait ? (wait.late ? 100 : Math.min(100, Math.max(4, (wait.hours / limitHours) * 100))) : 0;
  async function takeIt() {
    if (!lead || !me) return;
    setTaking(true); setError("");
    try { await upsert(db.leads, { ...lead, asesorId: me }, db.leads.version(lead)); }
    catch (problem) { setError(errorMessage(problem)); }
    finally { setTaking(false); }
  }

  return <Card as="aside" className={s.preview} aria-label={`Vista previa de ${person.nombre}`}>
    <div className="flex items-start gap-3">
      <Avatar name={person.nombre} size={48} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="m-0 text-lg font-[620] leading-tight [overflow-wrap:anywhere]">{person.nombre}</h2>
        <p className="text-sm text-muted-foreground">{kind}{lead ? ` · ${LEAD_STAGE_LABELS[leadStage(lead.estado)]}` : ""}{lead && !lead.asesorId ? " · sin asesor" : ""}</p>
      </div>
      <Link href={row.href} className={s.openLink} aria-label={`Abrir ficha de ${person.nombre}`} title="Abrir ficha"><ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className={s.previewActions}>
      {digits && <ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden="true" />Llamar</ButtonLink>}
      {digits && <ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink>}
      {lead && !lead.asesorId && me && <Button disabled={taking} onClick={() => void takeIt()}><UserPlus size={16} aria-hidden="true" />{taking ? "Asignando…" : "Asignármela"}</Button>}
    </div>
    {wait && Number.isFinite(arrived) && <div className={s.deadline} data-late={wait.late || undefined} role="status">
      <strong>{wait.late ? `Pasó el plazo: venció a las ${clock(deadline)}` : `Responder antes de las ${clock(deadline)}`}</strong>
      <span>Llegó a las {clock(arrived)} · plazo de {limitHours} h</span>
      <span className={s.deadlineBar} aria-hidden="true"><i style={{ width: `${spent}%` }} /></span>
    </div>}
    <dl className={s.facts}>
      <div><dt>Teléfono</dt><dd>{person.telefono || "Sin teléfono"}</dd></div>
      <div><dt>Busca</dt><dd>{row.wants || "Sin dato"}</dd></div>
      <div><dt>Zona</dt><dd>{row.zone || "Sin dato"}</dd></div>
      <div><dt>Presupuesto</dt><dd>{row.budget ?? "Sin dato"}</dd></div>
    </dl>
    {chips.length > 0 && <section className="flex flex-col gap-2"><h3 className={s.previewTitle}>Lo que busca</h3><div className="flex flex-wrap gap-1.5">{chips.map(text => <Pill key={text} size="sm" tone="muted">{text}</Pill>)}</div></section>}
    {person.mensaje && <section className="flex flex-col gap-2"><h3 className={s.previewTitle}>{lead && lead.origen !== "manual" ? "Mensaje que dejó en el sitio" : "Mensaje que dejó"}</h3><p className={s.quote}>«{person.mensaje}»</p></section>}
    {lead && wait && <FirstContactButton lead={lead} className="w-full" />}
    {row.step && <section className="flex flex-col gap-2">
      <h3 className={s.previewTitle}>Siguiente paso</h3>
      <p className="flex flex-wrap items-center gap-2 text-sm"><span className={!row.when ? "text-muted-foreground" : ""}>{row.step}</span>{due}</p>
    </section>}
    {(activity.length > 0 || notes.length > 0) && <section className="flex flex-col gap-2">
      <h3 className={s.previewTitle}>Actividad</h3>
      <ul className={s.activity}>
        {activity.map(item => <li key={item.id}><Link href={item.href}><span className={s.activityWhen}>{item.when?.label ?? "Sin fecha"}</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]"><span className={s.meta}>{item.kind} · </span>{item.text}</span></Link></li>)}
        {notes.map(note => <li key={note.id}><span className={s.activityRow}><span className={s.activityWhen}>{shortDate(note.fecha)}</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{note.texto}</span></span></li>)}
      </ul>
    </section>}
    <p className={s.meta}>Registrado el {humanDay(person.creadoEl)}.</p>
    {canDelete && <div className="flex flex-col items-start gap-1 border-t border-[var(--card-edge)] pt-3">
      <Button variant="danger" disabled={busy || !!blocking} onClick={() => void remove()} aria-label={`Eliminar a ${person.nombre}`}><Trash2 size={16} aria-hidden="true" />{busy ? "Eliminando…" : "Eliminar contacto"}</Button>
      {blocking && <p className={s.meta}>{blocking}{blocking.startsWith("Tiene") ? "; primero se cierra o se elimina." : "."}</p>}
      {error && <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p>}
    </div>}
  </Card>;
}

/** «21 oct 2026» en lugar de «21/10/2026» (C03, C40). */
function humanDay(instant: string) {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return "fecha desconocida";
  const day = operationalDate(date);
  return `${shortDate(day)} ${day.slice(0, 4)}`;
}
