"use client";
import * as React from "react";
import Link from "next/link";
import { Building2 } from "@/components/admin/icons";
import { Avatar, Thumb } from "@/components/admin/kit";
import type { AdminProperty, Asesor, Cliente, Evento, Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import s from "./agenda.module.css";

/*
  Con quién y sobre qué (DEC-51): cada cita y cada tarea lleva la cara de la persona (su color fijo)
  y la foto del inmueble. Lo resuelve a partir de las referencias guardadas; un asunto trae a su
  cliente, su inmueble y su asesor cuando el registro no los tiene.
*/
export type AgendaExpediente = { id: string; folio: string; cliente_id: string; propiedad_slug: string | null; asesor_id: string };
export type References = Pick<Evento, "leadId" | "clienteId" | "propiedadSlug" | "expedienteId" | "asesorId">;
export type AgendaContext = { leads: Lead[]; clientes: Cliente[]; propiedades: AdminProperty[]; asesores: Asesor[]; expedientes: AgendaExpediente[] };

export type ResolvedRefs = {
  lead?: Lead; cliente?: Cliente; propiedad?: AdminProperty; expediente?: AgendaExpediente; asesor?: Asesor;
  /** La persona que se ve: el prospecto, el cliente o el cliente del asunto. */
  person?: { name: string; href: string; role: string };
};

export function resolveRefs(refs: References, ctx: AgendaContext): ResolvedRefs {
  const expediente = ctx.expedientes.find(row => row.id === refs.expedienteId);
  const lead = ctx.leads.find(row => row.id === refs.leadId);
  const cliente = ctx.clientes.find(row => row.id === (refs.clienteId ?? expediente?.cliente_id));
  const propiedad = ctx.propiedades.find(row => row.slug === (refs.propiedadSlug ?? expediente?.propiedad_slug));
  const asesor = ctx.asesores.find(row => row.id === (refs.asesorId ?? expediente?.asesor_id));
  const person = cliente ? { name: cliente.nombre, href: `/admin/clientes/${encodeURIComponent(cliente.id)}`, role: "Cliente" }
    : lead ? { name: lead.nombre, href: `/admin/leads/${encodeURIComponent(lead.id)}`, role: "Prospecto" } : undefined;
  return { lead, cliente, propiedad, expediente, asesor, person };
}

export const propertyPhoto = (p?: AdminProperty) => p?.galeria?.[0]?.src;
export const adviserPhoto = (a?: Asesor) => a?.perfilPublico?.foto;

/** La foto del inmueble con la cara de la persona encima, o solo una de las dos. Decorativo: el texto va aparte. */
export function RefMedia({ refs, size = 44, className }: { refs: ResolvedRefs; size?: number; className?: string }) {
  if (!refs.propiedad && !refs.person) return null;
  return <span className={cn(s.media, className)} style={{ width: size, height: size }} aria-hidden="true">
    {refs.propiedad ? <Thumb src={propertyPhoto(refs.propiedad)} size={size} icon={<Building2 size={Math.round(size * 0.42)} aria-hidden="true" />} />
      : refs.person && <Avatar name={refs.person.name} size={size} />}
    {refs.propiedad && refs.person && <Avatar name={refs.person.name} size={Math.round(size * 0.5)} className={s.mediaFace} />}
  </span>;
}

/** Enlaces del contexto de una cita (prospecto, cliente, inmueble, asunto y asesor). */
export function RefLinks({ refs, className }: { refs: ResolvedRefs; className?: string }) {
  const { lead, cliente, propiedad, expediente, asesor } = refs;
  if (!lead && !cliente && !propiedad && !expediente && !asesor) return null;
  return <span className={cn(s.context, className)}>
    {lead && <Link href={`/admin/leads/${encodeURIComponent(lead.id)}`}>{lead.nombre}</Link>}
    {cliente && <Link href={`/admin/clientes/${encodeURIComponent(cliente.id)}`}>Cliente: {cliente.nombre}</Link>}
    {propiedad && <Link href={`/admin/propiedades/${encodeURIComponent(propiedad.slug)}/editar`}>{propiedad.titulo}</Link>}
    {expediente && <Link href={`/admin/operaciones/${encodeURIComponent(expediente.id)}`}>Asunto: {expediente.folio}</Link>}
    {asesor && <span className={s.who}><Avatar name={asesor.nombre} src={adviserPhoto(asesor)} size={18} />{asesor.nombre}</span>}
  </span>;
}

/** Atajos de una tecla de la Agenda; nunca actúan mientras se escribe, ni en menús, ventanas o el calendario. */
export function useAgendaKeys(enabled: boolean, keys: Record<string, () => void>) {
  const latest = React.useRef(keys);
  React.useEffect(() => { latest.current = keys; });
  React.useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const at = event.target instanceof Element ? event.target : null;
      if (at?.closest("input, textarea, select, [contenteditable=true], [role=menu], [role=listbox], [role=dialog], [role=grid], [role=combobox]")) return;
      if (document.querySelector("[role=dialog][data-state=open], [role=alertdialog]")) return;
      const run = latest.current[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!run) return;
      event.preventDefault();
      run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
