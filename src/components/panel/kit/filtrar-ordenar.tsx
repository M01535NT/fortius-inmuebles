"use client";
import { useId, useState, type ReactNode } from "react";

import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/panel/ui/popover";
import { Switch } from "@/components/panel/ui/switch";

export type Interruptor = { etiqueta: string; ayuda?: string; valor: boolean; alCambiar: (v: boolean) => void };

type Props<O extends string> = {
  orden: O;
  ordenes: { valor: O; etiqueta: string }[];
  alOrdenar: (o: O) => void;
  interruptores: Interruptor[];
  /** Cuántos quedan con lo elegido, para el botón «Ver N …». */
  resultado: number;
  nombreResultado: [singular: string, plural: string];
  alQuitar: () => void;
};

/**
 * «Filtrar y ordenar» (sugerencia 9, DECISIONES.md): ventana flotante en escritorio y hoja desde abajo en el teléfono.
 * El botón dice cuántos filtros hay puestos; los cambios se ven al momento y «Ver N» solo cierra.
 */
export function FiltrarYOrdenar<O extends string>({ orden, ordenes, alOrdenar, interruptores, resultado, nombreResultado, alQuitar }: Props<O>) {
  const [abierto, setAbierto] = useState(false);
  const telefono = useEsTelefono();
  const activos = interruptores.filter((i) => i.valor).length + (orden !== ordenes[0]?.valor ? 1 : 0);
  const boton = (
    <button type="button" className="pn-btn pn-btn-secundario" aria-haspopup="dialog" aria-expanded={abierto} onClick={telefono ? () => setAbierto(true) : undefined}>
      <Icono nombre="filtrar" tamano={18} />
      Filtrar y ordenar
      {activos ? <span className="pn-contador" aria-label={`${activos} ${activos === 1 ? "filtro puesto" : "filtros puestos"}`}>{activos}</span> : null}
    </button>
  );
  const cuerpo = (
    <Cuerpo
      orden={orden} ordenes={ordenes} alOrdenar={alOrdenar} interruptores={interruptores}
      pie={
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <Boton variante="texto" onClick={alQuitar} deshabilitado={!activos}>Quitar filtros</Boton>
          <Boton onClick={() => setAbierto(false)}>Ver {resultado} {resultado === 1 ? nombreResultado[0] : nombreResultado[1]}</Boton>
        </div>
      }
    />
  );
  if (telefono) {
    return (
      <>
        {boton}
        <HojaAdaptable abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Filtrar y ordenar">{cuerpo}</HojaAdaptable>
      </>
    );
  }
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>{boton}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4" aria-label="Filtrar y ordenar">{cuerpo}</PopoverContent>
    </Popover>
  );
}

function Cuerpo<O extends string>({ orden, ordenes, alOrdenar, interruptores, pie }: Pick<Props<O>, "orden" | "ordenes" | "alOrdenar" | "interruptores"> & { pie: ReactNode }) {
  const nombre = useId();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: 4 }}>
        <legend className="pn-grupo" style={{ padding: 0, marginBottom: 4 }}>Ordenar por</legend>
        {ordenes.map((o) => (
          <label key={o.valor} className="pn-opcion">
            <input type="radio" name={nombre} value={o.valor} checked={orden === o.valor} onChange={() => alOrdenar(o.valor)} />
            {o.etiqueta}
          </label>
        ))}
      </fieldset>
      {interruptores.length ? (
        <div style={{ display: "grid", gap: 4 }}>
          <span className="pn-grupo" style={{ margin: 0 }}>Mostrar</span>
          {interruptores.map((i) => <FilaInterruptor key={i.etiqueta} {...i} />)}
        </div>
      ) : null}
      {pie}
    </div>
  );
}

function FilaInterruptor({ etiqueta, ayuda, valor, alCambiar }: Interruptor) {
  const id = useId();
  return (
    <div className="pn-opcion" style={{ justifyContent: "space-between" }}>
      <label htmlFor={id} style={{ display: "grid", gap: 2, cursor: "pointer" }}>
        <span>{etiqueta}</span>
        {ayuda ? <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{ayuda}</span> : null}
      </label>
      <Switch id={id} checked={valor} onCheckedChange={alCambiar} />
    </div>
  );
}
