"use client";
import { useState } from "react";

import { diaLargo, diasDelMes, horaTexto, moverHora, tituloMes } from "@/lib/panel/calendario";

import { Gesto } from "../icons";

const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Calendario del mes: lunes primero, hoy con aro, días pasados apagados. Arriba dice la fecha elegida con letra.
 * `valor` y lo que devuelve `alElegir` son AAAA-MM-DD.
 */
export function SelectorFecha({ valor, alElegir, hoy, etiqueta = "Fecha" }: { valor: string | null; alElegir: (fecha: string) => void; hoy: Date; etiqueta?: string }) {
  const [vista, setVista] = useState(() => ({ anio: hoy.getFullYear(), mes: hoy.getMonth() }));
  const celdas = diasDelMes(vista.anio, vista.mes, hoy);
  const esMesActual = vista.anio === hoy.getFullYear() && vista.mes === hoy.getMonth();
  const mover = (d: number) => setVista((v) => { const f = new Date(v.anio, v.mes + d, 1); return { anio: f.getFullYear(), mes: f.getMonth() }; });
  const letra = valor ? diaLargo(valor) : "Elige un día";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{etiqueta}: {letra.charAt(0).toUpperCase() + letra.slice(1)}</span>
      <div className="pn-cal" role="group" aria-label={etiqueta}>
        <div className="pn-cal-cab">
          <button type="button" className="pn-iconbtn" onClick={() => mover(-1)} aria-label="Mes anterior" aria-disabled={esMesActual || undefined} style={esMesActual ? { opacity: 0.3, pointerEvents: "none" } : undefined}><Gesto nombre="izquierda" /></button>
          <b>{tituloMes(vista.anio, vista.mes)}</b>
          <button type="button" className="pn-iconbtn" onClick={() => mover(1)} aria-label="Mes siguiente"><Gesto nombre="derecha" /></button>
        </div>
        <div className="pn-cal-rejilla" aria-hidden>
          {SEMANA.map((d, i) => <span key={i} className="pn-cal-dia-sem">{d}</span>)}
        </div>
        <div className="pn-cal-rejilla">
          {celdas.map((c, i) => c.fecha === null ? <span key={i} /> : (
            <button key={c.fecha} type="button" className="pn-cal-dia" data-hoy={c.hoy} aria-pressed={valor === c.fecha} disabled={c.pasado} onClick={() => alElegir(c.fecha!)} aria-label={diaLargo(c.fecha)}>{c.dia}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Hora en pasos de 30 minutos, de 7:00 a 20:00. `valor` son minutos desde medianoche. */
export function SelectorHora({ valor, alCambiar }: { valor: number; alCambiar: (minutos: number) => void }) {
  return (
    <div className="pn-hora" role="group" aria-label="Hora">
      <button type="button" className="pn-iconbtn" onClick={() => alCambiar(moverHora(valor, -1))} aria-label="30 minutos antes"><Gesto nombre="izquierda" /></button>
      <b aria-live="polite">{horaTexto(valor)}</b>
      <button type="button" className="pn-iconbtn" onClick={() => alCambiar(moverHora(valor, 1))} aria-label="30 minutos después"><Gesto nombre="derecha" /></button>
    </div>
  );
}
