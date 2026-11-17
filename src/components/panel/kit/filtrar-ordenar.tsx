"use client";
import { useState, type ReactNode } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/panel/ui/popover";

export type Interruptor = { etiqueta: string; ayuda?: string; valor: boolean; alCambiar: (v: boolean) => void; cuenta?: number };

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
 * «Filtrar y ordenar» (boceto «Inicio», «Inmuebles» y «Personas»): botón de ajustes de 48 × 44 con el número de filtros
 * puestos; abre una ventana flotante junto al botón en escritorio y una hoja desde abajo en el teléfono.
 * Arriba «Limpiar»; «Mostrar» con casillas y «Ordenar por» con opciones; los cambios se ven al momento y «Ver N» solo cierra.
 */
export function FiltrarYOrdenar<O extends string>({ orden, ordenes, alOrdenar, interruptores, resultado, nombreResultado, alQuitar }: Props<O>) {
  const [abierto, setAbierto] = useState(false);
  const telefono = useEsTelefono();
  const activos = contarFiltros(interruptores, orden, ordenes);
  const boton = (
    <button type="button" className="pn-fbtn" aria-haspopup="dialog" aria-expanded={abierto} title="Filtrar y ordenar"
      aria-label={activos ? `Filtrar y ordenar, ${activos} ${activos === 1 ? "filtro puesto" : "filtros puestos"}` : "Filtrar y ordenar"}
      onClick={telefono ? () => setAbierto(true) : undefined}>
      <Icono nombre="filtrar" tamano={20} />
      {activos ? <span className="pn-fbtn-n" aria-hidden>{activos}</span> : null}
    </button>
  );
  const cuerpo = (
    <Cuerpo
      orden={orden} ordenes={ordenes} alOrdenar={alOrdenar} interruptores={interruptores} activos={activos} alQuitar={alQuitar} conTitulo={!telefono}
      pie={<button type="button" className="pn-fdone" onClick={() => setAbierto(false)}>Ver {resultado} {resultado === 1 ? nombreResultado[0] : nombreResultado[1]}</button>}
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
      <PopoverContent align="end" className="w-[340px] p-4" aria-label="Filtrar y ordenar">{cuerpo}</PopoverContent>
    </Popover>
  );
}

/** Cuántos filtros hay puestos: los encendidos y el orden si no es el primero. */
export function contarFiltros<O extends string>(interruptores: readonly Pick<Interruptor, "valor">[], orden: O, ordenes: readonly { valor: O }[]): number {
  return interruptores.filter((i) => i.valor).length + (orden !== ordenes[0]?.valor ? 1 : 0);
}

/** Línea bajo los controles con lo filtrado («Solo solicitudes del sitio · Lo vencido primero») y «Limpiar». */
export function ResumenFiltros({ partes, alLimpiar }: { partes: string[]; alLimpiar: () => void }) {
  if (!partes.length) return null;
  return (
    <div className="pn-fsum" aria-live="polite">
      <span>{partes.join(" · ")}</span>
      <button type="button" onClick={alLimpiar}>Limpiar</button>
    </div>
  );
}

function Cuerpo<O extends string>({ orden, ordenes, alOrdenar, interruptores, pie, activos, alQuitar, conTitulo }: Pick<Props<O>, "orden" | "ordenes" | "alOrdenar" | "interruptores" | "alQuitar"> & { pie: ReactNode; activos: number; conTitulo: boolean }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="pn-fcab">
        {conTitulo ? <h2>Filtrar y ordenar</h2> : <span />}
        <button type="button" className="pn-dlink" aria-disabled={!activos || undefined} onClick={activos ? alQuitar : undefined}>Limpiar</button>
      </div>
      {interruptores.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          <span className="pn-fh">Mostrar</span>
          <div className="pn-fgrupo" role="group" aria-label="Mostrar">
            {interruptores.map((i) => (
              <button key={i.etiqueta} type="button" className="pn-ck" role="checkbox" aria-checked={i.valor} onClick={() => i.alCambiar(!i.valor)}>
                <span className="pn-ck-caja" aria-hidden><Gesto nombre="palomita" tamano={14} /></span>
                <span style={{ flex: 1, display: "grid", gap: 1 }}>
                  <span>{i.etiqueta}</span>
                  {i.ayuda ? <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-muted)" }}>{i.ayuda}</span> : null}
                </span>
                {i.cuenta !== undefined ? <span className="pn-ck-n">{i.cuenta}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {ordenes.length > 1 ? (
        <div style={{ display: "grid", gap: 8 }}>
          <span className="pn-fh">Ordenar por</span>
          <div className="pn-fgrupo" role="radiogroup" aria-label="Ordenar por">
            {ordenes.map((o) => (
              <button key={o.valor} type="button" className="pn-ck" role="radio" aria-checked={orden === o.valor} onClick={() => alOrdenar(o.valor)}>
                <span className="pn-ck-caja" aria-hidden />
                <span style={{ flex: 1 }}>{o.etiqueta}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {pie}
    </div>
  );
}
