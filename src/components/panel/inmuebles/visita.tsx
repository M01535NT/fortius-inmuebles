"use client";
import { useId, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { SelectorFecha, SelectorHora } from "@/components/panel/kit/selector-fecha";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento } from "@/lib/domain/records";
import { aTexto, diaLargo, horaTexto } from "@/lib/panel/calendario";
import { sumarDias } from "@/lib/panel/datos/agenda";
import { nuevaCita, seEmpalma, type DatosCita } from "@/lib/panel/datos/agenda-acciones";

/**
 * «Agendar visita» del boceto de Inmuebles: con quién, día y hora, y notas, ahí mismo en la ficha. La cita se guarda en
 * la colección `eventos` de la Agenda (tipo visita, ligada al inmueble). Si se empalma con otra, se avisa y se guarda igual.
 * Con quién va en desplegable (los interesados primero); el día también (Hoy, Mañana, los días siguientes u Otra fecha).
 */
export function AgendarVisita({ inmueble, personas, interesadas, citas, hoy, ocupado, alGuardar, alCancelar }: {
  inmueble: Property; personas: readonly Cliente[];
  /** Ids de las personas cuya búsqueda coincide: van primero en «Con quién». */
  interesadas: readonly string[];
  citas: readonly Evento[]; hoy: Date; ocupado: boolean;
  alGuardar: (d: DatosCita, persona?: string) => void; alCancelar: () => void;
}) {
  const idNotas = useId();
  const dias = Array.from({ length: 7 }, (_, i) => aTexto(sumarDias(hoy, i)));
  const [d, setD] = useState<DatosCita>(() => ({
    tipo: "visita", titulo: "", fecha: dias[1], hora: 11 * 60, clienteId: interesadas.find((id) => personas.some((c) => c.id === id)) ?? "",
    propiedadSlug: inmueble.slug, notas: "",
  }));
  const [otra, setOtra] = useState(false);
  const persona = personas.find((c) => c.id === d.clienteId)?.nombre;
  const primero = new Set(interesadas);
  const ordenadas = [...personas].sort((a, b) => Number(primero.has(b.id)) - Number(primero.has(a.id)) || (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  const opcionesPersona = ordenadas.map((c) => ({ valor: c.id, etiqueta: primero.has(c.id) ? `${c.nombre} · interesado` : c.nombre }));
  const opcionesDia = [
    ...dias.map((f, i) => ({ valor: f, etiqueta: i === 0 ? `Hoy (${diaLargo(f)})` : i === 1 ? `Mañana (${diaLargo(f)})` : diaLargo(f) })),
    { valor: "otra", etiqueta: otra && !dias.includes(d.fecha) ? `Otra fecha: ${diaLargo(d.fecha)}` : "Otra fecha…" },
  ];
  const empalme = d.hora !== null ? seEmpalma(nuevaCita(d, persona, "__borrador__"), citas) : null;
  const cuando = d.fecha === dias[0] ? "hoy" : d.fecha === dias[1] ? "mañana" : diaLargo(d.fecha);
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); alGuardar(d, persona); }}>
      <Desplegable etiqueta="Con quién" valor={d.clienteId} vacio="Sin persona por ahora" opciones={opcionesPersona} alElegir={(clienteId) => setD({ ...d, clienteId })} />
      <Desplegable etiqueta="Día" valor={otra || !dias.includes(d.fecha) ? "otra" : d.fecha} opciones={opcionesDia}
        alElegir={(v) => { if (v === "otra") { setOtra(true); return; } if (v) { setOtra(false); setD({ ...d, fecha: v }); } }} />
      {otra ? <SelectorFecha etiqueta="Día" valor={d.fecha} hoy={hoy} alElegir={(fecha) => setD({ ...d, fecha })} /> : null}
      <div className="pn-campo">
        <span style={{ fontSize: 14, fontWeight: 600 }}>Hora</span>
        <SelectorHora valor={d.hora ?? 11 * 60} alCambiar={(hora) => setD({ ...d, hora })} />
      </div>
      <div className="pn-campo">
        <label htmlFor={idNotas}>Notas (opcional)</label>
        <textarea id={idNotas} rows={3} maxLength={2000} value={d.notas} placeholder="Ej. llevar llaves de la caseta" onChange={(e) => setD({ ...d, notas: e.target.value })} />
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>
        Visita{persona ? ` con ${persona}` : ""} {cuando}{d.hora !== null ? `, ${horaTexto(d.hora)}` : ""} · {inmueble.titulo}
      </p>
      {empalme ? <p role="status" style={{ margin: 0, fontSize: 14, color: "var(--warning)" }}>{empalme} Puedes agendarla igual.</p> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <Boton variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" deshabilitado={ocupado}>Agendar</Boton>
      </div>
    </form>
  );
}
