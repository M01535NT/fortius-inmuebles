"use client";

import * as React from "react";
import { CalendarDays, Mail, MessageCircle, Phone } from "lucide-react";

import { PropertyInterestForm } from "@/components/property/property-interest-form";

type Channel = { whatsapp: string; phoneHref: string; emailHref: string };
type Props = {
  slug: string;
  codigo: string;
  titulo: string;
  asesor?: { nombre: string; cargo: string; iniciales: string };
  channels: Channel;
};

const subscribe = () => () => {};
const today = () => new Date().toDateString();
const noDate = () => "";

/* Próximos días hábiles (lunes a sábado) a partir de mañana. */
function nextDays(key: string, count = 5) {
  if (!key) return [];
  const days: { id: string; weekday: string; day: string; label: string }[] = [];
  const cursor = new Date(key);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0) continue;
    days.push({
      id: cursor.toISOString().slice(0, 10),
      weekday: cursor.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", ""),
      day: String(cursor.getDate()),
      label: cursor.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }),
    });
  }
  return days;
}

/*
  Tarjeta fija de la ficha «Escenario»: el interesado propone un día, el
  asesor lo confirma. «Solicitar visita» abre el formulario con la intención
  de visita y el día elegido; los canales directos quedan debajo.
*/
export function VisitPlanner({ slug, codigo, titulo, asesor, channels }: Props) {
  const key = React.useSyncExternalStore(subscribe, today, noDate);
  const days = React.useMemo(() => nextDays(key), [key]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const chosen = days.find(day => day.id === selected) ?? days[0];

  return (
    <div id="interes" className="fe-visit">
      {asesor ? <div className="fe-visit-agent">
        <span className="fe-visit-avatar" aria-hidden="true">{asesor.iniciales}</span>
        <span><strong>{asesor.nombre}</strong><span>{asesor.cargo} · responde en horario de oficina</span></span>
      </div> : <p className="fe-visit-title">Hablemos de esta propiedad.</p>}

      <p className="fe-visit-lead"><CalendarDays size={16} aria-hidden="true" />Propón un día; el asesor lo confirma contigo</p>
      <div className="fe-visit-days" role="group" aria-label="Día propuesto para la visita">
        {days.length ? days.map(day => (
          <button key={day.id} type="button" aria-pressed={chosen?.id === day.id} aria-label={day.label} onClick={() => setSelected(day.id)}>
            <span>{day.weekday}</span><strong>{day.day}</strong>
          </button>
        )) : Array.from({ length: 5 }, (_, i) => <span key={i} className="fe-visit-day-placeholder" aria-hidden="true" />)}
      </div>

      {!open ? (
        <button type="button" className="pg-btn fe-visit-cta" aria-expanded={false} aria-controls="fe-visit-form" onClick={() => setOpen(true)}>Solicitar visita</button>
      ) : (
        <div id="fe-visit-form" className="fe-visit-form">
          <PropertyInterestForm slug={slug} codigo={codigo} titulo={titulo} intent="visita" proposedDay={chosen?.label} />
        </div>
      )}

      {(channels.whatsapp || channels.phoneHref || channels.emailHref) ? (
        <div className="fe-visit-channels">
          {channels.whatsapp && <a href={channels.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>}
          {channels.phoneHref && <a href={channels.phoneHref}><Phone size={16} aria-hidden="true" />Llamar</a>}
          {channels.emailHref && <a href={channels.emailHref}><Mail size={16} aria-hidden="true" />Correo</a>}
        </div>
      ) : null}
    </div>
  );
}
