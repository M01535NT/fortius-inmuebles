"use client";
import Link from "next/link";

import { Icono } from "@/components/panel/icons";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead } from "@/lib/domain/records";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import { aTexto, diaLargo, horaTexto } from "@/lib/panel/calendario";
import { DURACION_MIN } from "@/lib/panel/datos/agenda";
import { deHoraGuardada } from "@/lib/panel/datos/agenda-acciones";
import { textoResultado, yaPaso, type EventoConResultado } from "@/lib/panel/datos/agenda-resultado";
import { iniciales } from "@/lib/panel/datos/asuntos";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { rutaConsulta, rutaInmueble, rutaPersona } from "@/lib/panel/datos/relacionado";

const duracion = (min: number) => (min >= 60 ? `${min / 60} h` : `${min} min`);
/** El lugar escrito al agendar en una línea queda en las notas como «Lugar: …». */
export const lugarDeNotas = (notas?: string) => /^Lugar:\s*(.+)$/m.exec(notas ?? "")?.[1]?.trim() || null;

/**
 * Detalle de una cita (boceto «Agenda», panel al costado): tipo y estado, título, día y hora, el aviso si se empalma,
 * «¿Cómo te fue?» si ya pasó, con quién (llamar, WhatsApp «voy en camino»), dónde (cómo llegar), el asunto,
 * y al final Mover, Cambiar datos y Cancelar cita (con Deshacer, sin pedir confirmación).
 */
export function DetalleCita({ ev, empalme, hoy, cliente, lead, inmueble, asunto, asesor, pide, ocupado, alAnotar, alNoLlego, alMover, alCambiar, alCancelar }: {
  ev: EventoConResultado; empalme: boolean; hoy: Date;
  cliente?: Cliente; lead?: Lead; inmueble?: Property; asunto?: { id: string; texto: string }; asesor?: string;
  pide: boolean; ocupado: boolean;
  alAnotar: () => void; alNoLlego: () => void; alMover: () => void; alCambiar: () => void; alCancelar: () => void;
}) {
  const ini = deHoraGuardada(ev.hora);
  const dur = DURACION_MIN[ev.tipo] ?? 30;
  const paso = yaPaso(ev, hoy);
  const estado = ev.resultado ? textoResultado(ev.resultado).split(". ")[0] : paso ? "Ya pasó" : ev.fecha === aTexto(hoy) ? "Hoy" : "Próxima";
  const nombre = cliente?.nombre?.trim() || lead?.nombre?.trim() || "";
  const telefono = cliente?.telefono || lead?.telefono || "";
  const tel = telefono.replace(/[^\d+]/g, "");
  const wa = telefono ? enlaceWhatsApp(telefono, `Hola ${nombre.split(/\s+/)[0] ?? ""}, voy en camino a nuestra cita.`) : null;
  const lugar = lugarDeNotas(ev.notas) ?? (inmueble ? [inmueble.direccionAproximada, inmueble.zona].filter(Boolean).join(", ") : null);
  const mapa = lugar ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lugar}, Tijuana`)}` : null;
  const notas = ev.notas?.replace(/^Lugar:.*$/m, "").trim();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="pn-evb-punto" data-tipo={ev.tipo} aria-hidden />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>{EVENTO_TIPO_LABELS[ev.tipo] ?? "Cita"}</span>
          <span className={`pn-pill${paso && !ev.resultado ? " pn-pill-aviso" : ""}`} style={{ alignSelf: "center" }}>{estado}</span>
        </div>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>{ev.titulo}</p>
        <p style={{ margin: 0, fontSize: 15, color: "var(--ink-muted)" }}>
          {diaLargo(ev.fecha)}{ini !== null ? ` · ${horaTexto(ini)}–${horaTexto(ini + dur)} · ${duracion(dur)}` : " · sin hora"}{asesor ? ` · ${asesor}` : ""}
        </p>
      </div>
      {empalme ? <div className="pn-warnbox" role="status">Se empalma con otra cita ese día.</div> : null}
      {pide ? (
        <div className="pn-ask">
          <b style={{ fontSize: 15 }}>¿Cómo te fue?</b>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button type="button" className="pn-sbtn" onClick={alAnotar}>Anotar cómo fue</button>
            <button type="button" className="pn-sbtn pn-sbtn-suave" disabled={ocupado} onClick={alNoLlego}>No llegó</button>
          </div>
        </div>
      ) : ev.resultado ? <p style={{ margin: 0, fontSize: 14 }}><b>Cómo fue:</b> {textoResultado(ev.resultado)}</p> : null}

      {nombre ? (
        <div className="pn-dato" style={{ cursor: "default" }}>
          <span className="pn-av" aria-hidden>{iniciales(nombre)}</span>
          <Link href={cliente ? rutaPersona(cliente.id) : rutaConsulta(lead?.id ?? "")} style={{ flex: 1, minWidth: 0, display: "grid", gap: 1, color: "inherit", textDecoration: "none" }}>
            <b style={{ fontSize: 15 }}>{nombre}</b>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{telefono || (cliente ? "Persona" : "Consulta")}</span>
          </Link>
          {tel ? <a className="pn-iconbtn" href={`tel:${tel}`} aria-label={`Llamar a ${nombre}`}><Icono nombre="llamada" tamano={18} /></a> : null}
          {wa ? <a className="pn-iconbtn" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${nombre}: voy en camino`}><Icono nombre="mensaje" tamano={18} /></a> : null}
        </div>
      ) : null}
      {lugar || inmueble ? (
        <div className="pn-dato" style={{ cursor: "default" }}>
          <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="ubicacion" tamano={18} /></span>
          <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 1 }}>
            {inmueble ? <Link href={rutaInmueble(inmueble.codigo)} style={{ fontSize: 15, fontWeight: 600, color: "inherit", textDecoration: "none" }}>{inmueble.titulo}</Link> : <b style={{ fontSize: 15 }}>{lugar}</b>}
            {inmueble && lugar ? <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{lugar}</span> : null}
          </span>
          {mapa ? <a className="pn-sbtn pn-sbtn-suave" href={mapa} target="_blank" rel="noopener noreferrer">Cómo llegar</a> : null}
        </div>
      ) : null}
      {asunto ? (
        <Link className="pn-dato" href={`/panel/asuntos?ver=${encodeURIComponent(asunto.id)}`}>
          <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="expediente" tamano={18} /></span>
          <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 1 }}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Asunto</span>
            <b style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asunto.texto}</b>
          </span>
        </Link>
      ) : null}
      {notas ? <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{notas}</p> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button type="button" className="pn-sbtn pn-sbtn-suave" onClick={alMover}>Mover</button>
        <button type="button" className="pn-sbtn pn-sbtn-suave" onClick={alCambiar}>Cambiar datos</button>
      </div>
      <button type="button" className="pn-dlink" style={{ justifySelf: "center", margin: 0, color: "var(--error)" }} disabled={ocupado} onClick={alCancelar}>Cancelar cita</button>
    </div>
  );
}
