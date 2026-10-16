import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/admin/ui";
import { EVENTO_TIPO_LABELS, type AdminProperty, type Asesor, type Cliente, type Evento, type Lead } from "@/lib/admin/store";
import type { Followup } from "@/lib/admin/followups";
import { TASK_STATUSES, type Task } from "@/lib/tasks";
import styles from "./calendar-agenda.module.css";

type CalendarReferences = Pick<Evento, "leadId" | "clienteId" | "propiedadSlug" | "expedienteId" | "asesorId">;
type CalendarContext = {
  leads: Lead[];
  clientes: Cliente[];
  propiedades: AdminProperty[];
  asesores: Asesor[];
  expedientes: { id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string }[];
};
export type CalendarActivity =
  | { kind: "evento"; id: string; fecha: string; hora?: string; titulo: string; event: Evento }
  | { kind: "tarea"; id: string; fecha: string; titulo: string; task: Task }
  | { kind: "contacto"; id: string; fecha: string; titulo: string; contact: Followup };

export function CalendarEventContext({ references, context }: { references: CalendarReferences; context: CalendarContext }) {
  const lead = context.leads.find(row => row.id === references.leadId);
  const cliente = context.clientes.find(row => row.id === references.clienteId);
  const propiedad = context.propiedades.find(row => row.slug === references.propiedadSlug);
  const expediente = context.expedientes.find(row => row.id === references.expedienteId);
  const asesor = context.asesores.find(row => row.id === references.asesorId);
  return <div className={styles.context}>
    {lead && <Link href={"/admin/leads/" + encodeURIComponent(lead.id)}>{lead.nombre}</Link>}
    {cliente && <Link href={"/admin/clientes/" + encodeURIComponent(cliente.id)}>Cliente: {cliente.nombre}</Link>}
    {propiedad && <Link href={"/admin/propiedades/" + encodeURIComponent(propiedad.slug) + "/editar"}>Inmueble: {propiedad.codigo}</Link>}
    {expediente && <Link href={"/admin/operaciones/" + encodeURIComponent(expediente.id)}>Expediente: {expediente.folio}</Link>}
    {asesor && <span>Asesor: {asesor.nombre}</span>}
  </div>;
}

export function CalendarActivityList({
  items, context, onSelectEvent, showDate = false,
}: {
  items: CalendarActivity[];
  context: CalendarContext;
  onSelectEvent: (date: string) => void;
  showDate?: boolean;
}) {
  return <ul className={styles.activityList}>
    {items.map(item => <li key={item.kind + ":" + item.id} className={styles.activity}>
      <div className={styles.activityMeta}>
        {showDate && <time dateTime={item.fecha} className={styles.activityDate}>{item.fecha.slice(8)} / {item.fecha.slice(5, 7)} / {item.fecha.slice(0, 4)}</time>}
        <span className={styles.activityTime}>{item.kind === "evento" ? (item.hora || "Sin hora") : "Sin hora"}</span>
        <Badge>{item.kind === "evento" ? EVENTO_TIPO_LABELS[item.event.tipo] : item.kind === "tarea" ? "Tarea" : "Contacto"}</Badge>
      </div>
      {item.kind === "evento" ? <>
        <button type="button" aria-label={"Ver evento: " + item.titulo} className={styles.activityTitle} onClick={() => onSelectEvent(item.fecha)}>{item.titulo}</button>
        <CalendarEventContext references={item.event} context={context} />
      </> : item.kind === "tarea" ? <>
        <Link className={styles.activityTitle} href={"/admin/tareas/" + encodeURIComponent(item.task.id)}>{item.titulo}</Link>
        <p className={styles.activityNote}>{TASK_STATUSES[item.task.estado]}</p>
        <CalendarEventContext references={item.task} context={context} />
      </> : <>
        <Link className={styles.activityTitle} href={item.contact.href}>{item.titulo}</Link>
        <p className={styles.activityNote}>{item.contact.kind === "cliente" ? "Cliente" : "Prospecto"} · {context.asesores.find(row => row.id === item.contact.asesorId)?.nombre ?? "Sin asesor"}</p>
      </>}
    </li>)}
  </ul>;
}
