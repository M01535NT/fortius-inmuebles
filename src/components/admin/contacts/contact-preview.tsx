"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone } from "@/components/admin/icons";
import { Avatar, ButtonLink, Card, Pill } from "@/components/admin/kit";
import { LEAD_PROFILE_OPTIONS } from "@/lib/lead-profile";
import { LEAD_ESTADO_LABELS, LEAD_ORIGEN_LABELS, fechaCorta, type Cliente, type Evento, type Lead } from "@/lib/admin/store";
import { isTaskOpen, type Task } from "@/lib/tasks";
import { stepDate, type ContactRow } from "@/lib/admin/contacts-view";
import { shortDate } from "@/lib/admin/today";
import s from "./contacts.module.css";

/*
  Vista previa de una persona (boceto Contactos, 17/10/2026): a la derecha de la lista, en
  computadora, se ve quién es, lo que busca, su presupuesto, el siguiente paso y su actividad
  reciente, con Llamar, WhatsApp y «Abrir ficha». Todo sale de la ficha que ya existe; los
  «inmuebles que coinciden» del boceto no existen todavía en el sistema (EXT-01).
*/

const CLIENT_TYPE: Record<Cliente["tipo"], string> = { propietario: "Propietario", comprador: "Comprador", arrendador: "Arrendador", arrendatario: "Arrendatario", inversionista: "Inversionista", otro: "Cliente" };

export function ContactPreview({ row, lead, client, tasks, events, today }: { row: ContactRow; lead?: Lead; client?: Cliente; tasks: Task[]; events: Evento[]; today: string }) {
  const person = lead ?? client;
  if (!person) return null;
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
  const notes = (lead?.notas ?? client?.leadOriginal?.notas ?? []).slice(-3).reverse();
  const due = row.when ? <Pill size="sm" tone={row.late ? "alert" : "muted"}>{row.when}</Pill> : null;

  return <Card as="aside" className={s.preview} aria-label={`Vista previa de ${person.nombre}`}>
    <div className="flex items-start gap-3">
      <Avatar name={person.nombre} size={48} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="m-0 text-lg font-[650] leading-tight [overflow-wrap:anywhere]">{person.nombre}</h2>
        <p className="text-sm text-muted-foreground">{kind}{lead ? ` · ${LEAD_ESTADO_LABELS[lead.estado]}` : ""}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {digits && <ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden="true" />Llamar</ButtonLink>}
      {digits && <ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink>}
      <ButtonLink href={row.href} variant="primary" className="ml-auto" aria-label={`Abrir ficha de ${person.nombre}`}>Abrir ficha<ArrowUpRight size={16} aria-hidden="true" /></ButtonLink>
    </div>
    <dl className={s.facts}>
      <div><dt>Busca</dt><dd>{row.wants}</dd></div>
      <div><dt>Presupuesto</dt><dd>{row.budget ?? "Por definir"}</dd></div>
      <div><dt>Zona</dt><dd>{row.zone}</dd></div>
      <div><dt>Teléfono</dt><dd>{person.telefono || "Sin teléfono"}</dd></div>
    </dl>
    {chips.length > 0 && <section className="flex flex-col gap-2"><h3 className={s.previewTitle}>Lo que busca</h3><div className="flex flex-wrap gap-1.5">{chips.map(text => <Pill key={text} size="sm" tone="muted">{text}</Pill>)}</div></section>}
    {person.mensaje && <p className={s.quote}>«{person.mensaje}»</p>}
    <section className="flex flex-col gap-2">
      <h3 className={s.previewTitle}>Siguiente paso</h3>
      <p className="flex flex-wrap items-center gap-2 text-sm"><span className={!row.when ? "text-muted-foreground" : ""}>{row.step}</span>{due}</p>
    </section>
    {(activity.length > 0 || notes.length > 0) && <section className="flex flex-col gap-2">
      <h3 className={s.previewTitle}>Actividad</h3>
      <ul className={s.activity}>
        {activity.map(item => <li key={item.id}><Link href={item.href}><span className={s.activityWhen}>{item.when?.label ?? "Sin fecha"}</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]"><span className={s.meta}>{item.kind} · </span>{item.text}</span></Link></li>)}
        {notes.map(note => <li key={note.id}><span className={s.activityRow}><span className={s.activityWhen}>{shortDate(note.fecha.slice(0, 10))}</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{note.texto}</span></span></li>)}
      </ul>
    </section>}
    <p className={s.meta}>Registrado el {fechaCorta(person.creadoEl)}.</p>
  </Card>;
}
