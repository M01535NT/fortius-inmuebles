"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import { diaLargo } from "@/lib/panel/calendario";
import { textoSigue, type FilaAsunto } from "@/lib/panel/datos/asuntos";

/**
 * «Lo que sigue» del asunto (boceto «Asuntos», punto 3): Hecho y Posponer; si no hay, el bloque ya es el campo para escribirlo.
 * Tocar «Anotar otro» agrega un siguiente paso más. Cada cambio avisa con Deshacer (lo maneja la página).
 */
export function LoQueSigue({ fila, ocupado, alHecho, alPosponer, alAnotar }: {
  fila: FilaAsunto; ocupado: boolean;
  alHecho: (tareaId: string) => void;
  alPosponer: (tareaId: string, fecha: string | null) => Promise<boolean>;
  alAnotar: (texto: string, fecha: string | null) => Promise<boolean>;
}) {
  const [hoy] = useState(() => new Date());
  const [anotando, setAnotando] = useState(false);
  const [pospone, setPospone] = useState(false);
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState<string | null>(fila.sigue?.fecha ?? null);
  const s = fila.sigue;
  const mostrarCampo = !s || anotando;
  const guardar = () => {
    if (!texto.trim()) return;
    void alAnotar(texto, fecha).then((ok) => { if (ok) { setTexto(""); setFecha(null); setAnotando(false); } });
  };
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 16, padding: 12, border: `1px solid ${!s || s.vencido ? "var(--warning)" : "var(--border)"}`, borderRadius: "var(--r-lg)" }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Lo que sigue</h3>
      {s ? (
        <>
          <p style={{ margin: 0, color: s.vencido ? "var(--warning)" : undefined, fontWeight: 500 }}>{textoSigue(s)}</p>
          {pospone ? (
            <div style={{ display: "grid", gap: 8 }}>
              <DesplegableFecha etiqueta="Nueva fecha" valor={nuevaFecha} alElegir={setNuevaFecha} hoy={hoy} />
              <div style={{ display: "flex", gap: 8 }}>
                <Boton variante="secundario" deshabilitado={ocupado} onClick={() => void alPosponer(s.id, nuevaFecha).then((ok) => { if (ok) setPospone(false); })}>Guardar fecha</Boton>
                <Boton variante="texto" onClick={() => setPospone(false)}>Cancelar</Boton>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Boton variante="secundario" deshabilitado={ocupado} onClick={() => alHecho(s.id)} aria-label={`Marcar hecho: ${s.texto}`}>Hecho</Boton>
              <Boton variante="texto" onClick={() => { setNuevaFecha(s.fecha); setPospone(true); }}>Posponer</Boton>
              {!anotando ? <Boton variante="texto" onClick={() => setAnotando(true)}>Anotar otro</Boton> : null}
            </div>
          )}
          {fila.abiertas.length > 1 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-muted)" }}>
              {fila.abiertas.filter((t) => t.id !== s.id).map((t) => <li key={t.id}>{t.titulo}{t.vence ? ` · ${diaLargo(t.vence)}` : ""}</li>)}
            </ul>
          ) : null}
        </>
      ) : null}
      {mostrarCampo ? (
        <div style={{ display: "grid", gap: 8 }}>
          <Campo etiqueta={s ? "Otro paso" : "¿Qué sigue?"} placeholder="Por ejemplo: llamar para agendar la visita" maxLength={160} value={texto}
            onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); guardar(); } }} autoComplete="off" />
          <DesplegableFecha valor={fecha} alElegir={setFecha} hoy={hoy} />
          {texto.trim() || s ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Boton variante="secundario" deshabilitado={ocupado || !texto.trim()} onClick={guardar}>Guardar</Boton>
              {s ? <Boton variante="texto" onClick={() => { setAnotando(false); setTexto(""); }}>Cancelar</Boton> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
