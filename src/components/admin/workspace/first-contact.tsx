"use client";
import * as React from "react";
import { buttonClass } from "@/components/admin/kit";
import { AsyncButton } from "@/components/admin/ui";
import { CONTACT_KINDS, suggestedNext, withContact, type ContactKind } from "@/lib/admin/lead-contact";
import { operationalDate } from "@/lib/admin/operational-date";
import { planNextStep } from "@/lib/admin/next-step-task";
import { db, uid, upsert, useCollection, type Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";

/*
  «Registrar contacto» (COR-21 con el registro de COR-18): en dos toques el asesor dice qué pasó
  con un prospecto nuevo del sitio. Se guarda igual que en su ficha (nota de contacto, primera
  atención, «Contactado» y el siguiente paso sugerido), así sale de «Nuevos sin atender» y su
  línea de tiempo lo muestra. Usa la versión del registro: si otra persona lo cambió, avisa.
*/
const KINDS: ContactKind[] = ["llamada", "no_contesto", "whatsapp"];

export function FirstContactButton({ lead, className }: { lead: Lead; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const tasks = useCollection(db.tareas);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const closed = React.useRef(false);
  // Al cancelar, el foco vuelve al botón que abrió las opciones.
  React.useEffect(() => { if (!open && closed.current) trigger.current?.focus(); }, [open]);
  if (!open) return <button ref={trigger} type="button" className={buttonClass({ variant: "secondary", className })} aria-label={`Registrar contacto con ${lead.nombre}`} aria-expanded={false} onClick={() => setOpen(true)}>Registrar contacto</button>;
  return <div role="group" aria-label={`Qué pasó con ${lead.nombre}`} className={cn("flex flex-wrap items-start gap-2", className)}>
    {KINDS.map((kind, index) => <AsyncButton key={kind} autoFocus={index === 0} className={buttonClass({ variant: "secondary" })} onClick={async () => {
      const at = new Date().toISOString(), next = suggestedNext(kind, operationalDate());
      await upsert(db.leads, withContact(lead, { kind, id: uid(), at, ...next }), db.leads.version(lead));
      // DEC-42: el siguiente paso sugerido queda como tarea con fecha.
      const task = planNextStep(tasks, { kind: "lead", id: lead.id, asesorId: lead.asesorId }, { ...next, id: uid() });
      await upsert(db.tareas, task, db.tareas.version(task));
    }}>{CONTACT_KINDS[kind]}</AsyncButton>)}
    <button type="button" className={buttonClass({ variant: "ghost" })} onClick={() => { closed.current = true; setOpen(false); }}>Cancelar</button>
  </div>;
}
