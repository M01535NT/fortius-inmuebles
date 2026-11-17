"use client";
import { useMemo, useState } from "react";

import { Gesto } from "@/components/panel/icons";
import type { Evento } from "@/lib/domain/records";
import { aTexto, diaLargo, horaTexto } from "@/lib/panel/calendario";
import { semanaDesde } from "@/lib/panel/datos/agenda";
import { aHoraGuardada, deHoraGuardada, seEmpalma } from "@/lib/panel/datos/agenda-acciones";
import { moverPasos } from "@/lib/panel/datos/agenda-dia";

/**
 * «Mover» (boceto «Agenda»): los próximos 7 días en una tira, la hora de 30 en 30 con − y +, el aviso si se empalma
 * y un solo botón. Sirve igual en el teléfono, donde no hay arrastre entre días.
 */
export function MoverCita({ cita, citas, hoy, alMover }: {
  cita: Evento; citas: readonly Evento[]; hoy: Date; alMover: (cambio: { fecha?: string; minutos?: number }) => void;
}) {
  const hoyTexto = aTexto(hoy);
  const [fecha, setFecha] = useState(cita.fecha >= hoyTexto ? cita.fecha : hoyTexto);
  const [minutos, setMinutos] = useState<number | null>(deHoraGuardada(cita.hora));
  const dias = useMemo(() => semanaDesde(hoy, citas, hoy), [hoy, citas]);
  const fueraDeTira = !dias.some((d) => d.fecha === fecha);
  const prueba: Evento = { ...cita, fecha, ...(minutos !== null ? { hora: aHoraGuardada(minutos) } : {}) };
  const choque = seEmpalma(prueba, citas);
  const cambio = { ...(fecha !== cita.fecha ? { fecha } : {}), ...(minutos !== null && aHoraGuardada(minutos) !== cita.hora ? { minutos } : {}) };
  const igual = cambio.fecha === undefined && cambio.minutos === undefined;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="pn-dstrip" role="group" aria-label="Día">
        {dias.map((d) => (
          <button key={d.fecha} type="button" className="pn-dpill" aria-pressed={fecha === d.fecha} onClick={() => setFecha(d.fecha)}
            aria-label={`${d.hoy ? "Hoy, " : ""}${diaLargo(d.fecha)}`}>
            <span className="pn-dw">{d.letra}</span><span className="pn-dn">{d.numero}</span>
          </button>
        ))}
      </div>
      {fueraDeTira ? <p className="pn-campo-ayuda" style={{ margin: 0 }}>Ahora: {diaLargo(fecha)}</p> : null}
      {minutos !== null ? (
        <div className="pn-step" role="group" aria-label="Hora">
          <button type="button" className="pn-iconbtn" aria-label="30 minutos antes" onClick={() => setMinutos((m) => moverPasos(m ?? 0, -1))}><Gesto nombre="izquierda" tamano={18} /></button>
          <b aria-live="polite">{horaTexto(minutos)}</b>
          <button type="button" className="pn-iconbtn" aria-label="30 minutos después" onClick={() => setMinutos((m) => moverPasos(m ?? 0, 1))}><Gesto nombre="derecha" tamano={18} /></button>
        </div>
      ) : (
        <button type="button" className="pn-sbtn pn-sbtn-suave" onClick={() => setMinutos(10 * 60)}>Ponerle hora</button>
      )}
      {choque ? <div className="pn-warnbox" role="status">{choque}</div> : null}
      <button type="button" className="pn-fdone" disabled={igual} aria-disabled={igual || undefined} onClick={() => alMover(cambio)}>
        Mover{fecha !== cita.fecha ? ` al ${diaLargo(fecha)}` : ""}{minutos !== null && cambio.minutos !== undefined ? ` a las ${horaTexto(minutos)}` : ""}
      </button>
      <p className="pn-campo-ayuda" style={{ margin: 0 }}>Para otra fecha más lejana, usa «Cambiar datos». También puedes arrastrarla en la semana.</p>
    </div>
  );
}
