"use client";
import * as React from "react";
import { MessageCircle } from "@/components/admin/icons";
import { Button, ButtonLink } from "@/components/admin/kit";
import { selectClass, textareaClass } from "@/components/admin/ui";
import { whatsappDigits } from "@/lib/admin/buyer-matches";
import { contactAttempts, missedInARow, RETRY_ACTION } from "@/lib/admin/lead-contact";
import { blanks, messagesFor, suggestedTemplate, type TemplateId, type TemplateOverrides } from "@/lib/admin/message-templates";
import { db, settingsStore, useCollection, useSession, useSingleton, type Lead } from "@/lib/admin/store";
import { awaitingFirstReply } from "@/lib/admin/today";
import { cn } from "@/lib/utils";
import { personStyles as s } from "./person";

/*
  «Mensajes listos» de la ficha (RP-22, CRM-02): el asesor elige el texto aprobado, lo ve lleno con
  los datos de la persona y del inmueble, completa lo que va entre corchetes y abre WhatsApp con el
  texto escrito. Abrir WhatsApp no registra nada; al confirmar «Ya lo mandé», se abre «Registrar
  contacto» con «Mandé WhatsApp» para guardar el contacto con su siguiente paso.
*/

const noSubscribe = () => () => undefined;
const longDay = (day: string) => new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00.000Z`));

export function ReadyMessages({ lead, today, onSent }: { lead: Lead; today: string; onSent: (templateName: string) => void }) {
  const session = useSession(), settings = useSingleton(settingsStore);
  const asesores = useCollection(db.asesores), propiedades = useCollection(db.propiedades), eventos = useCollection(db.eventos);
  // La liga a la ficha usa el sitio desde el que se abre el panel; en el servidor no hay origen.
  const origin = React.useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");

  const property = propiedades.find(p => p.slug === lead.propiedadSlug) ?? null;
  const visit = eventos.filter(e => e.leadId === lead.id && e.tipo === "visita" && e.fecha >= today).sort((a, b) => `${a.fecha}${a.hora ?? ""}`.localeCompare(`${b.fecha}${b.hora ?? ""}`))[0];
  const visited = eventos.some(e => e.leadId === lead.id && e.tipo === "visita" && e.fecha < today) || contactAttempts(lead).some(n => n.contacto === "visito");
  const messages = messagesFor({
    // Sin asesor asignado (lo común en «Sin atender»), firma quien escribe desde su sesión.
    nombre: lead.nombre, asesor: asesores.find(a => a.id === lead.asesorId)?.nombre ?? session?.name?.trim(), zona: lead.zona, property, origin,
    visit: visit ? { dia: longDay(visit.fecha), hora: visit.hora } : null,
  }, settings?.mensajes as TemplateOverrides | undefined);
  const suggested = suggestedTemplate({
    unattended: awaitingFirstReply(lead), hasProperty: !!property, lastContact: contactAttempts(lead)[0]?.contacto,
    retry: lead.perfil?.proximaAccion === RETRY_ACTION || missedInARow(lead) >= 3, visited,
    propertyClosed: property?.estado === "vendida" || property?.estado === "rentada",
  });
  const [choice, setChoice] = React.useState<TemplateId>(suggested);
  const current = messages.find(m => m.id === choice) ?? messages[0];
  // Mientras el asesor no lo corrija, el texto sigue al mensaje elegido y a los datos de la persona.
  const [draft, setDraft] = React.useState<string | null>(null);
  const [asking, setAsking] = React.useState(false);
  const edited = draft !== null;
  const text = draft ?? current.text;

  const digits = whatsappDigits(lead.telefono ?? "");
  const missing = blanks(text);
  const ready = current.available && digits.length >= 12 && missing.length === 0 && text.trim().length > 0;

  return <div className="flex flex-col gap-3">
    <label className="flex flex-col gap-1 text-sm font-semibold" htmlFor="mensaje-listo">Mensaje
      <select id="mensaje-listo" className={selectClass} value={choice} onChange={event => { setChoice(event.target.value as TemplateId); setDraft(null); setAsking(false); }}>
        {messages.map(m => <option key={m.id} value={m.id} disabled={!m.available}>{m.name}{m.id === suggested ? " (sugerido)" : ""}{m.available ? "" : " · no aplica"}</option>)}
      </select>
    </label>
    <label className="sr-only" htmlFor="mensaje-texto">Texto del mensaje</label>
    <textarea id="mensaje-texto" rows={6} className={textareaClass} value={text} maxLength={1500} onChange={event => { setDraft(event.target.value); setAsking(false); }} />
    {!current.available && <p className={s.small}>{current.reason}</p>}
    {current.available && missing.length > 0 && <p className={cn(s.small, "font-semibold")} role="status">Antes de enviarlo, cambia lo que está entre corchetes: {missing.join(", ")}.</p>}
    {digits.length < 12 && <p className={s.small}>Falta un teléfono de 10 dígitos para abrir WhatsApp.</p>}
    {edited && <button type="button" className={cn(s.textLink, "self-start")} onClick={() => setDraft(null)}>Volver al texto aprobado</button>}
    {asking
      ? <div className="flex flex-wrap items-center gap-2" role="group" aria-label="¿Ya lo mandaste?">
          <span className="text-[.9375rem] font-semibold">¿Ya lo mandaste?</span>
          <Button onClick={() => { setAsking(false); onSent(current.name); }}>Sí, registrarlo</Button>
          <Button variant="ghost" onClick={() => setAsking(false)}>Todavía no</Button>
        </div>
      : ready
        ? <ButtonLink className="self-start" href={`https://wa.me/${digits}?text=${encodeURIComponent(text.trim())}`} target="_blank" rel="noreferrer" onClick={() => setAsking(true)}><MessageCircle size={16} aria-hidden="true" />Abrir en WhatsApp</ButtonLink>
        : <Button className="self-start" disabled><MessageCircle size={16} aria-hidden="true" />Abrir en WhatsApp</Button>}
  </div>;
}
