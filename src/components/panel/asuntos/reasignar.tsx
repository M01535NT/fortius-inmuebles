"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Asesor } from "@/lib/domain/records";

/**
 * Quién lleva el asunto y, solo para el director, «Pasar a otro asesor» (M-04, PN-10). Pide el motivo (10 letras o más, lo exige la base);
 * con el asunto se mueven el inmueble, la persona y las tareas abiertas. No tiene Deshacer: se regresa pasándolo de nuevo.
 */
export function LoLleva({ asesorId, asesores, esDirector, alPasar }: {
  asesorId: string | null; asesores: readonly Asesor[]; esDirector: boolean;
  alPasar: (asesorId: string, motivo: string) => Promise<boolean>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const actual = asesores.find((a) => a.id === asesorId);
  const opciones = asesores.filter((a) => a.activo && a.id !== asesorId).map((a) => ({ valor: a.id, etiqueta: a.nombre }));
  const listo = !!destino && motivo.trim().length >= 10;
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0 }}><span className="pn-sub">Lo lleva </span><strong style={{ fontWeight: 600 }}>{actual?.nombre ?? "Sin asesor"}</strong></p>
        {esDirector && !abierto && opciones.length ? <Boton variante="texto" onClick={() => setAbierto(true)}>Pasar a otro asesor</Boton> : null}
      </div>
      {abierto ? (
        <div style={{ display: "grid", gap: 12, padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
          <Desplegable etiqueta="Pasar a" valor={destino} vacio="Elige al asesor" opciones={opciones} alElegir={setDestino} />
          <div className="pn-campo">
            <label htmlFor="motivo-pasar">Motivo</label>
            <textarea id="motivo-pasar" rows={3} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: se va de vacaciones dos semanas" />
            <span className="pn-campo-ayuda">Se mueven con el asunto el inmueble, la persona y las tareas abiertas. El motivo queda en el historial.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Boton deshabilitado={!listo || ocupado} onClick={() => {
              setOcupado(true);
              void alPasar(destino, motivo.trim()).then((ok) => { setOcupado(false); if (ok) { setAbierto(false); setDestino(""); setMotivo(""); } });
            }}>{ocupado ? "Pasando…" : "Pasar el asunto"}</Boton>
            <Boton variante="texto" onClick={() => setAbierto(false)}>Cancelar</Boton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
