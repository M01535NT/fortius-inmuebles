"use client";

import * as React from "react";

import { PropertyInterestForm } from "@/components/property/property-interest-form";

type Canales = { whatsapp: string; phoneHref: string; emailHref: string };
type Props = {
  slug: string;
  codigo: string;
  titulo: string;
  asesor?: { nombre: string; cargo: string; iniciales: string };
  canales: Canales;
};

const suscribir = () => () => {};
const hoy = () => new Date().toDateString();
const sinFecha = () => "";

/* Próximos días hábiles (lunes a sábado) a partir de mañana. */
function proximosDias(clave: string, cuantos = 5) {
  if (!clave) return [];
  const dias: { id: string; semana: string; dia: string; etiqueta: string }[] = [];
  const cursor = new Date(clave);
  while (dias.length < cuantos) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0) continue;
    dias.push({
      id: cursor.toISOString().slice(0, 10),
      semana: cursor.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", ""),
      dia: String(cursor.getDate()),
      etiqueta: cursor.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }),
    });
  }
  return dias;
}

/*
  Asesor y visita (17/11/2026): quién atiende, cinco días para proponer y
  «Solicitar visita». El día viaja dentro del mensaje, como antes; el asesor
  lo confirma. Debajo, WhatsApp, llamada y correo.
*/
export function FichaAsesor({ slug, codigo, titulo, asesor, canales }: Props) {
  const clave = React.useSyncExternalStore(suscribir, hoy, sinFecha);
  const dias = React.useMemo(() => proximosDias(clave), [clave]);
  const [elegido, setElegido] = React.useState<string | null>(null);
  const [abierto, setAbierto] = React.useState(false);
  const dia = dias.find((d) => d.id === elegido) ?? dias[0];

  React.useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener("fortius:solicitar-visita", abrir);
    return () => window.removeEventListener("fortius:solicitar-visita", abrir);
  }, []);

  return (
    <div id="interes" className="fa">
      {asesor ? (
        <div className="fa-persona">
          <span className="fa-avatar" aria-hidden="true">{asesor.iniciales}</span>
          <span className="fa-nombre"><strong>{asesor.nombre}</strong><span>{asesor.cargo}</span></span>
        </div>
      ) : <p className="fa-titulo">Agenda una visita.</p>}

      <p className="fa-guia">Propón un día y te confirmamos la hora.</p>
      <div className="fa-dias" role="group" aria-label="Día propuesto para la visita">
        {dias.length
          ? dias.map((d) => (
            <button key={d.id} type="button" aria-pressed={dia?.id === d.id} aria-label={d.etiqueta} onClick={() => setElegido(d.id)}>
              <span>{d.semana}</span><strong>{d.dia}</strong>
            </button>
          ))
          : Array.from({ length: 5 }, (_, i) => <span key={i} className="fa-dia-vacio" aria-hidden="true" />)}
      </div>

      {!abierto
        ? <button type="button" className="s-btn s-btn-relleno s-btn-grande fa-cta" aria-expanded={false} aria-controls="fa-formulario" onClick={() => setAbierto(true)}>Solicitar visita</button>
        : <div id="fa-formulario" className="fa-formulario"><PropertyInterestForm slug={slug} codigo={codigo} titulo={titulo} intent="visita" proposedDay={dia?.etiqueta} /></div>}

      {(canales.whatsapp || canales.phoneHref || canales.emailHref) ? (
        <div className="fa-canales">
          {canales.whatsapp && <a href={canales.whatsapp} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-contorno s-btn-chico">WhatsApp</a>}
          {canales.phoneHref && <a href={canales.phoneHref} className="s-btn s-btn-contorno s-btn-chico">Llamar</a>}
          {canales.emailHref && <a href={canales.emailHref} className="s-btn s-btn-contorno s-btn-chico">Correo</a>}
        </div>
      ) : null}
    </div>
  );
}
