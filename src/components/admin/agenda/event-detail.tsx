"use client";
import * as React from "react";
import Link from "next/link";
import { Building2, CalendarDays, CheckCircle2, Phone, Trash2 } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Pill, Sheet, Thumb } from "@/components/admin/kit";
import { EVENTO_TIPO_LABELS, type Evento } from "@/lib/admin/store";
import { dayTitle } from "@/lib/admin/agenda-view";
import { humanDate } from "@/lib/utils";
import type { Task } from "@/lib/tasks";
import type { Followup } from "@/lib/admin/followups";
import { adviserPhoto, propertyPhoto, resolveRefs, type AgendaContext } from "./agenda-parts";
import s from "./agenda.module.css";

/*
  Detalle de una cita (lenguaje de Trámites): qué es y cuándo, con quién (su cara) y sobre qué
  inmueble (su foto), y «Lo que sigue» con la misma persona o el mismo asunto: la próxima cita y
  las tareas abiertas. Se abre en el panel del kit, a la derecha en computadora y desde abajo en
  celular. Eliminar se deshace con «Deshacer» (RP-16).
*/
export function EventDetail({ evento, eventos, tareas, followups, context, today, onClose, onDelete }: {
  evento: Evento | null; eventos: Evento[]; tareas: Task[]; followups: Followup[]; context: AgendaContext; today: string;
  onClose: () => void; onDelete: (evento: Evento) => void;
}) {
  // El panel conserva la última cita mientras se cierra, para que no se vacíe a medio camino.
  const [shown, setShown] = React.useState(evento);
  if (evento && evento !== shown) setShown(evento);
  const e = evento ?? shown;
  if (!e) return null;
  const refs = resolveRefs(e, context);
  const visit = e.tipo === "visita";
  const same = (r: Pick<Evento, "leadId" | "clienteId" | "expedienteId">) =>
    (!!e.expedienteId && r.expedienteId === e.expedienteId) || (!!e.clienteId && r.clienteId === e.clienteId) || (!!e.leadId && r.leadId === e.leadId);
  const stamp = (x: Evento) => `${x.fecha}T${x.hora ?? "24:00"}`;
  const nextEvent = eventos.filter(x => x.id !== e.id && same(x) && stamp(x) > stamp(e)).sort((a, b) => stamp(a).localeCompare(stamp(b)))[0];
  const openTasks = tareas.filter(t => same(t)).sort((a, b) => (a.vence ?? "9999").localeCompare(b.vence ?? "9999")).slice(0, 3);
  const contact = followups.find(f => (f.kind === "cliente" && f.personId === refs.cliente?.id) || (f.kind === "lead" && f.personId === refs.lead?.id));
  const photo = propertyPhoto(refs.propiedad);
  const primary = refs.expediente ? { href: `/admin/operaciones/${encodeURIComponent(refs.expediente.id)}`, label: "Abrir asunto" }
    : refs.person ? { href: refs.person.href, label: `Ver a ${refs.person.name.split(" ")[0]}` } : null;
  return <Sheet open={!!evento} onClose={onClose} title={e.titulo} description={`${EVENTO_TIPO_LABELS[e.tipo]} · ${dayTitle(e.fecha)}${e.hora ? ` · ${e.hora}` : " · Sin hora"}`}
    footer={<>
      <Button variant="danger" onClick={() => onDelete(e)}><Trash2 size={16} aria-hidden="true" />Eliminar</Button>
      {primary && <ButtonLink variant="primary" href={primary.href}>{primary.label}</ButtonLink>}
    </>}>
    {(e.fecha <= today) && <div className="flex flex-wrap items-center gap-2">
      {e.fecha < today ? <Pill tone="muted">Ya pasó</Pill> : <Pill tone={visit ? "info" : "neutral"}><CalendarDays size={14} aria-hidden="true" />Hoy</Pill>}
    </div>}
    {refs.propiedad && (photo
      ? <Link href={`/admin/propiedades/${encodeURIComponent(refs.propiedad.slug)}/editar`} className={s.detailPhoto} aria-label={`Inmueble: ${refs.propiedad.titulo}`}>
        <Thumb src={photo} ratio="16 / 9" />
        <span className={s.detailPhotoCaption}>{refs.propiedad.titulo}</span>
      </Link>
      : <Link href={`/admin/propiedades/${encodeURIComponent(refs.propiedad.slug)}/editar`} className={s.detailProperty} aria-label={`Inmueble: ${refs.propiedad.titulo}`}>
        <Thumb size={48} icon={<Building2 size={20} aria-hidden="true" />} /><span>{refs.propiedad.titulo}</span>
      </Link>)}
    <dl className={s.detailList}>
      {refs.person && <div><dt>Con</dt><dd><Link href={refs.person.href} className={s.who}><Avatar name={refs.person.name} size={28} />{refs.person.name}<span className="text-muted-foreground">· {refs.person.role}</span></Link></dd></div>}
      {refs.expediente && <div><dt>Asunto</dt><dd><Link href={`/admin/operaciones/${encodeURIComponent(refs.expediente.id)}`}>Asunto: {refs.expediente.folio}</Link></dd></div>}
      {refs.asesor && <div><dt>Asesor</dt><dd><span className={s.who}><Avatar name={refs.asesor.nombre} src={adviserPhoto(refs.asesor)} size={28} />{refs.asesor.nombre}</span></dd></div>}
      {e.notas && <div><dt>Notas</dt><dd className="whitespace-pre-wrap">{e.notas}</dd></div>}
    </dl>
    {(refs.person || refs.expediente) && <section aria-labelledby="agenda-detail-next" className={s.next}>
      <h3 id="agenda-detail-next">Lo que sigue</h3>
      {nextEvent || openTasks.length || contact ? <ul>
        {nextEvent && <li><CalendarDays size={18} aria-hidden="true" /><span><b>{nextEvent.titulo}</b><small>{humanDate(nextEvent.fecha, today)}{nextEvent.hora ? ` · ${nextEvent.hora}` : ""}</small></span></li>}
        {contact && <li><Phone size={18} aria-hidden="true" /><span><Link href={contact.href}>Volver a contactar</Link><small>{humanDate(contact.fecha, today)}</small></span></li>}
        {openTasks.map(t => <li key={t.id}><CheckCircle2 size={18} aria-hidden="true" /><span><Link href={`/admin/tareas/${encodeURIComponent(t.id)}`}>{t.titulo}</Link><small>{t.vence ? humanDate(t.vence, today) : "Sin fecha"}</small></span></li>)}
      </ul> : <p className="text-sm text-muted-foreground">Nada más agendado con {refs.person ? refs.person.name : "este asunto"}.</p>}
    </section>}
  </Sheet>;
}
