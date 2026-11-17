"use client";
import "./posponer.css";

import { Icono } from "@/components/panel/icons";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/panel/ui/dropdown-menu";
import type { OpcionPosponer } from "@/lib/panel/datos/posponer";

/**
 * Posponer, el control común (DECISIONES, «Patrones de interacción»): Esta tarde · Mañana · Lunes · Elegir fecha.
 * Las opciones salen de `opcionesPosponer(ahora, conHora)`; «Elegir fecha…» abre el calendario de quien lo usa.
 * Dos formas: dentro de un menú desplegable (escritorio) y como lista de opciones en una hoja (teléfono).
 */
type Props = { opciones: readonly OpcionPosponer[]; alElegir: (o: OpcionPosponer) => void; alElegirFecha: () => void };

/** Va dentro de un `DropdownMenuContent`. */
export function ItemsPosponer({ opciones, alElegir, alElegirFecha }: Props) {
  return (
    <>
      {opciones.map((o) => (
        <DropdownMenuItem key={o.clave} onSelect={() => alElegir(o)}>
          {o.etiqueta} <span className="pn-pos-pista">{o.pista}</span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={alElegirFecha}>Elegir fecha…</DropdownMenuItem>
    </>
  );
}

/** Lista de opciones para una hoja (boceto del teléfono): filas de 52 px con la hora o el día a la derecha. */
export function OpcionesPosponer({ opciones, alElegir, alElegirFecha }: Props) {
  return (
    <div className="pn-pos-opts">
      {opciones.map((o) => (
        <button key={o.clave} type="button" className="pn-pos-opt" onClick={() => alElegir(o)}>
          <span>{o.etiqueta}</span><span className="pn-pos-pista">{o.pista}</span>
        </button>
      ))}
      <button type="button" className="pn-pos-opt" onClick={alElegirFecha}><span>Elegir fecha</span><Icono nombre="cita" tamano={18} /></button>
    </div>
  );
}
