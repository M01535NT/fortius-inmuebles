"use client";
import { useId, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { COMO_FUE, type ComoFue } from "@/lib/panel/datos/agenda-resultado";

export type RespuestaComoFue = { estado: ComoFue; nota: string; siguiente: string; vence: string | null };

/**
 * «¿Cómo te fue?» (DECISIONES.md «Agenda»): se anota qué pasó y, si el asesor quiere, lo que sigue.
 * «No llegó» también se anota. Lo que sigue lo escribe siempre el asesor y solo se ofrece si la cita tiene asunto.
 */
export function ComoTeFue({ conAsunto, hoy, ocupado, alGuardar, alCancelar }: {
  conAsunto: boolean; hoy: Date; ocupado: boolean; alGuardar: (r: RespuestaComoFue) => void; alCancelar: () => void;
}) {
  const id = useId();
  const [estado, setEstado] = useState<ComoFue>("hecha");
  const [nota, setNota] = useState("");
  const [siguiente, setSiguiente] = useState("");
  const [vence, setVence] = useState<string | null>(null);
  return (
    <form noValidate aria-labelledby={`${id}-t`} style={{ display: "grid", gap: 12, marginTop: 16, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--card)" }}
      onSubmit={(e) => { e.preventDefault(); if (!ocupado) alGuardar({ estado, nota, siguiente: conAsunto ? siguiente : "", vence: conAsunto && siguiente.trim() ? vence : null }); }}>
      <h3 id={`${id}-t`} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>¿Cómo te fue?</h3>
      <Interruptor etiqueta="La cita" opciones={[COMO_FUE[0]!, COMO_FUE[1]!]} valor={estado} alElegir={setEstado} />
      <div className="pn-campo">
        <label htmlFor={`${id}-nota`}>Qué pasó (opcional)</label>
        <textarea id={`${id}-nota`} rows={3} maxLength={1000} value={nota} onChange={(e) => setNota(e.target.value)}
          placeholder={estado === "no_llego" ? "Por ejemplo: no contestó, se reagenda" : "Por ejemplo: le gustó, quiere ver otra opción"} />
      </div>
      {conAsunto ? (
        <>
          <Campo etiqueta="Lo que sigue (opcional)" value={siguiente} maxLength={160} autoComplete="off" onChange={(e) => setSiguiente(e.target.value)}
            ayuda="Queda como pendiente del asunto." />
          {siguiente.trim() ? <DesplegableFecha etiqueta="Para cuándo" valor={vence} alElegir={setVence} hoy={hoy} /> : null}
        </>
      ) : <p className="pn-campo-ayuda" style={{ margin: 0 }}>Esta cita no tiene asunto: lo que anotes queda en la cita.</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Boton type="submit" deshabilitado={ocupado}>{ocupado ? "Anotando…" : "Anotar"}</Boton>
        <Boton variante="texto" onClick={alCancelar}>Ahora no</Boton>
      </div>
    </form>
  );
}
