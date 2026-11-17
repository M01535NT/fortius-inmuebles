"use client";
import { useId, useState } from "react";

import { Campo } from "@/components/panel/kit/campo";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import type { ComoFue } from "@/lib/panel/datos/agenda-resultado";

export type RespuestaComoFue = { estado: ComoFue; nota: string; siguiente: string; vence: string | null };

/**
 * «¿Cómo te fue?» (boceto «Agenda» y DECISIONES.md): «Qué pasó», «Lo que sigue» opcional y dos botones,
 * Anotar (la cita se hizo) y No llegó. Lo que sigue lo escribe siempre el asesor y solo se ofrece si la cita tiene asunto.
 */
export function ComoTeFue({ conAsunto, hoy, ocupado, alGuardar, alCancelar }: {
  conAsunto: boolean; hoy: Date; ocupado: boolean; alGuardar: (r: RespuestaComoFue) => void; alCancelar?: () => void;
}) {
  const id = useId();
  const [nota, setNota] = useState("");
  const [siguiente, setSiguiente] = useState("");
  const [vence, setVence] = useState<string | null>(null);
  const enviar = (estado: ComoFue) => {
    if (!ocupado) alGuardar({ estado, nota, siguiente: conAsunto ? siguiente : "", vence: conAsunto && siguiente.trim() ? vence : null });
  };
  return (
    <form noValidate style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); enviar("hecha"); }}>
      <div className="pn-campo">
        <label htmlFor={`${id}-nota`}>Qué pasó</label>
        <textarea id={`${id}-nota`} rows={3} maxLength={1000} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Por ejemplo: le gustó, quiere ver otra opción" />
      </div>
      {conAsunto ? (
        <>
          <Campo etiqueta="Lo que sigue (opcional)" value={siguiente} maxLength={160} autoComplete="off" onChange={(e) => setSiguiente(e.target.value)}
            ayuda="Queda como pendiente del asunto." />
          {siguiente.trim() ? <DesplegableFecha etiqueta="Para cuándo" valor={vence} alElegir={setVence} hoy={hoy} /> : null}
        </>
      ) : <p className="pn-campo-ayuda" style={{ margin: 0 }}>Esta cita no tiene asunto: lo que anotes queda en la cita.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button type="submit" className="pn-sbtn" disabled={ocupado}>{ocupado ? "Anotando…" : "Anotar"}</button>
        <button type="button" className="pn-sbtn pn-sbtn-suave" disabled={ocupado} onClick={() => enviar("no_llego")}>No llegó</button>
      </div>
      {alCancelar ? <button type="button" className="pn-dlink" style={{ justifySelf: "center", margin: 0 }} onClick={alCancelar}>Ahora no</button> : null}
    </form>
  );
}
