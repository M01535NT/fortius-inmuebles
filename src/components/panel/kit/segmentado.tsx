"use client";
import { useId, useRef } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import { Seleccion } from "@/components/panel/ui/select";
import { Switch } from "@/components/panel/ui/switch";

export type OpcionSegmentada<V extends string | number> = { valor: V; etiqueta: string; cuenta?: number };

const texto = (o: { etiqueta: string; cuenta?: number }) => (o.cuenta !== undefined ? `${o.etiqueta} (${o.cuenta})` : o.etiqueta);

/**
 * Elegir una de varias opciones (regla del titular, 16/11/2026): con 2 opciones, un interruptor entre las dos;
 * con 3 o más, una lista desplegable. Nunca una fila de botones.
 */
export function Segmentado<V extends string | number>({
  opciones, valor, alElegir, etiqueta, sinEtiqueta,
}: {
  opciones: readonly OpcionSegmentada<V>[]; valor: V; alElegir: (v: V) => void; etiqueta: string;
  /** La etiqueta solo para el lector de pantalla (vistas de una lista, junto al botón de ajustes). */
  sinEtiqueta?: boolean;
}) {
  const id = useId();
  if (opciones.length === 2) return <Interruptor etiqueta={etiqueta} opciones={[opciones[0], opciones[1]]} valor={valor} alElegir={alElegir} sinEtiqueta={sinEtiqueta} />;
  return (
    <div className="pn-campo" style={sinEtiqueta ? { gap: 0 } : undefined}>
      <label htmlFor={id} className={sinEtiqueta ? "pn-solo-lector" : undefined}>{etiqueta}</label>
      <Seleccion id={id} valor={String(valor)} opciones={opciones.map((o) => ({ valor: String(o.valor), etiqueta: texto(o) }))}
        alElegir={(v) => { const o = opciones.find((x) => String(x.valor) === v); if (o) alElegir(o.valor); }} />
    </div>
  );
}

/**
 * Cambiar de vista de lo mismo (SPEC.md, «La excepción es cambiar de vista»; modelo visual): de 3 a 4 vistas, una fila
 * de botones juntos, como en las apps de Mac. Solo para vistas, nunca para elegir un dato; con 5 o más, lista desplegable.
 * Las flechas pasan de una vista a otra; cada botón dice su nombre al pasar el cursor; 44 px en el teléfono.
 */
export function BotonesDeVista<V extends string>({ opciones, valor, alElegir, etiqueta }: {
  opciones: readonly { valor: V; etiqueta: string; icono?: NombreIcono; cuenta?: number }[]; valor: V; alElegir: (v: V) => void; etiqueta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (opciones.length > 4) {
    return <Segmentado etiqueta={etiqueta} sinEtiqueta valor={valor} alElegir={alElegir} opciones={opciones.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta, cuenta: o.cuenta }))} />;
  }
  const tecla = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = opciones.findIndex((o) => o.valor === valor);
    const sig = opciones[(i + (e.key === "ArrowRight" ? 1 : opciones.length - 1)) % opciones.length];
    alElegir(sig.valor);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("[aria-selected=true]")?.focus());
  };
  return (
    <div ref={ref} className="pn-vistas" role="tablist" aria-label={etiqueta} onKeyDown={tecla}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="tab" aria-selected={o.valor === valor} tabIndex={o.valor === valor ? 0 : -1}
          title={o.etiqueta} onClick={() => alElegir(o.valor)}>
          {o.icono ? <Icono nombre={o.icono} tamano={14} aria-hidden /> : null}
          <span>{o.etiqueta}</span>
          {o.cuenta ? <span className="pn-vistas-n">{o.cuenta}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Dos opciones: «Venta ◯ Renta». Encendido es la segunda; la elegida va en negritas. Pulsar cualquiera de los dos textos también cambia. */
export function Interruptor<V extends string | number>({ etiqueta, opciones, valor, alElegir, sinEtiqueta }: {
  etiqueta: string; opciones: readonly [OpcionSegmentada<V>, OpcionSegmentada<V>]; valor: V; alElegir: (v: V) => void; sinEtiqueta?: boolean;
}) {
  const [a, b] = opciones;
  const segunda = valor === b.valor;
  const lado = (o: OpcionSegmentada<V>, activo: boolean) => (
    <button type="button" className="pn-int-lado" data-activo={activo} onClick={() => alElegir(o.valor)} tabIndex={-1} aria-hidden>{texto(o)}</button>
  );
  return (
    <div className="pn-campo" style={sinEtiqueta ? { gap: 0 } : undefined}>
      <span className={sinEtiqueta ? "pn-solo-lector" : undefined}>{etiqueta}</span>
      <div className="pn-int">
        {lado(a, !segunda)}
        <Switch checked={segunda} onCheckedChange={(c) => alElegir(c ? b.valor : a.valor)} aria-label={`${etiqueta}: ${texto(segunda ? b : a)}`} />
        {lado(b, segunda)}
      </div>
    </div>
  );
}
