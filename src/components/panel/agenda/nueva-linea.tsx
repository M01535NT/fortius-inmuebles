"use client";
import { useId, useMemo, useState } from "react";

import type { Evento } from "@/lib/domain/records";
import { nuevaCita, seEmpalma, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { datosDeLinea, leerLinea } from "@/lib/panel/linea-cita";

/**
 * «Nueva cita» en una línea (boceto «Agenda»): se escribe como se diría («Visita con Ana G. mañana 4pm en Otay»),
 * debajo se ve lo entendido en pastillas, el aviso si se empalma y «Agendar». «Con más detalle» abre el formulario completo
 * con lo ya escrito.
 */
export function NuevaEnUnaLinea({ personas, citas, hoy, asesorId, ocupado, textoInicial = "", alAgendar, alDetalle }: {
  personas: readonly { id: string; nombre: string; archivada?: boolean }[]; citas: readonly Evento[]; hoy: Date; asesorId: string | null; ocupado: boolean; textoInicial?: string;
  alAgendar: (d: DatosCita) => void;
  alDetalle: (d: DatosCita) => void;
}) {
  const id = useId();
  const [texto, setTexto] = useState(textoInicial);
  const linea = useMemo(() => leerLinea(texto, hoy, personas.filter((p) => !p.archivada && p.nombre).map((p) => ({ id: p.id, nombre: p.nombre }))), [texto, hoy, personas]);
  const datos = datosDeLinea(linea, hoy, asesorId);
  const choque = texto.trim() && linea.completa ? seEmpalma(nuevaCita(datos, undefined, "prueba"), citas) : null;
  const listo = texto.trim().length > 0 && linea.completa;
  return (
    <form noValidate style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); if (listo && !ocupado) alAgendar(datos); }}>
      <label className="pn-field" htmlFor={id}>
        <span>Qué, cuándo y con quién</span>
        <input id={id} autoFocus autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Visita con Ana G. mañana 4pm en Otay" />
      </label>
      {texto.trim() ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} aria-live="polite">
          {linea.pastillas.map((p) => <span key={p.k} className="pn-chp"><i>{p.k}</i><b>{p.v}</b></span>)}
        </div>
      ) : null}
      {texto.trim() && !linea.completa ? <p className="pn-campo-ayuda" style={{ margin: 0 }}>Falta el día: escribe «hoy», «mañana», «el jueves» o «20 nov».</p> : null}
      {choque ? <div className="pn-warnbox" role="status">{choque}</div> : null}
      {linea.persona && !linea.persona.id ? <p className="pn-campo-ayuda" style={{ margin: 0 }}>«{linea.persona.texto}» no está en el Directorio: queda en el título de la cita.</p> : null}
      <button type="submit" className="pn-fdone" disabled={!listo || ocupado} aria-disabled={!listo || ocupado || undefined}>{ocupado ? "Agendando…" : "Agendar"}</button>
      <button type="button" className="pn-dlink" style={{ justifySelf: "center", margin: 0 }} onClick={() => alDetalle(datos)}>Con más detalle</button>
    </form>
  );
}
