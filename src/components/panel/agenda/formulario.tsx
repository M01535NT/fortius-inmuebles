"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { SelectorFecha, SelectorHora } from "@/components/panel/kit/selector-fecha";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { EVENTO_TIPO_LABELS, EVENTO_TIPOS, type Evento } from "@/lib/domain/records";
import { nuevaCita, seEmpalma, tituloCita, type DatosCita } from "@/lib/panel/datos/agenda-acciones";

const TIPOS = EVENTO_TIPOS.map((t) => ({ valor: t, etiqueta: EVENTO_TIPO_LABELS[t] }));

/**
 * Nueva cita o cambiarla (PN-04, boceto «Agenda»): tipo, día, hora, con quién y dónde. El título es opcional: si no se escribe,
 * se arma con el tipo y la persona. Si se empalma con otra cita, se avisa y se puede guardar igual.
 */
export function FormularioCita({ inicial, citas, personas, inmuebles, hoy, ocupado, textoGuardar, alGuardar }: {
  inicial: DatosCita; citas: readonly Evento[]; personas: readonly Cliente[]; inmuebles: readonly Property[]; hoy: Date;
  ocupado: boolean; textoGuardar: string; alGuardar: (d: DatosCita, persona?: string) => void;
}) {
  const [d, setD] = useState<DatosCita>(inicial);
  const persona = personas.find((c) => c.id === d.clienteId)?.nombre;
  const ordenadas = [...personas].sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  const empalme = d.hora !== null ? seEmpalma(nuevaCita(d, persona, "__borrador__"), citas) : null;
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); alGuardar(d, persona); }}>
      <Desplegable etiqueta="Tipo" valor={d.tipo} opciones={TIPOS} alElegir={(tipo) => { if (tipo) setD({ ...d, tipo }); }} />
      <Desplegable etiqueta="Con quién (opcional)" valor={d.clienteId} vacio="Sin persona" opciones={ordenadas.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
        alElegir={(clienteId) => setD({ ...d, clienteId, propiedadSlug: d.propiedadSlug || (personas.find((c) => c.id === clienteId)?.propiedadSlug ?? "") })} />
      <Desplegable etiqueta="Inmueble (opcional)" valor={d.propiedadSlug} vacio="Sin inmueble" opciones={inmuebles.map((p) => ({ valor: p.slug, etiqueta: `${p.titulo} · ${p.codigo}` }))}
        alElegir={(propiedadSlug) => setD({ ...d, propiedadSlug })} />
      <SelectorFecha etiqueta="Día" valor={d.fecha} hoy={hoy} alElegir={(fecha) => setD({ ...d, fecha })} />
      <Interruptor etiqueta="Hora" opciones={[{ valor: "sin", etiqueta: "Sin hora" }, { valor: "con", etiqueta: "Con hora" }]} valor={d.hora === null ? "sin" : "con"}
        alElegir={(v) => setD({ ...d, hora: v === "con" ? d.hora ?? 10 * 60 : null })} />
      {d.hora !== null ? <SelectorHora valor={d.hora} alCambiar={(hora) => setD({ ...d, hora })} /> : null}
      {empalme ? <p role="status" style={{ margin: 0, color: "var(--warning)" }}>{empalme} Puedes guardarla igual.</p> : null}
      <Campo etiqueta="Título (opcional)" placeholder={tituloCita({ tipo: d.tipo, titulo: "" }, persona)} maxLength={160} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} autoComplete="off" />
      <div className="pn-campo">
        <label htmlFor="cita-notas">Notas (opcional)</label>
        <textarea id="cita-notas" rows={3} maxLength={2000} value={d.notas} onChange={(e) => setD({ ...d, notas: e.target.value })} />
      </div>
      <Boton type="submit" bloque deshabilitado={ocupado}>{textoGuardar}</Boton>
    </form>
  );
}
