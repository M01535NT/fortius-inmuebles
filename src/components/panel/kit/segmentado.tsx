"use client";
import { useId } from "react";

import { Seleccion } from "@/components/panel/ui/select";
import { Switch } from "@/components/panel/ui/switch";

export type OpcionSegmentada<V extends string | number> = { valor: V; etiqueta: string; cuenta?: number };

const texto = (o: { etiqueta: string; cuenta?: number }) => (o.cuenta !== undefined ? `${o.etiqueta} (${o.cuenta})` : o.etiqueta);

/**
 * Elegir una de varias opciones (regla del titular, 16/11/2026): con 2 opciones, un interruptor entre las dos;
 * con 3 o más, una lista desplegable. Nunca una fila de botones.
 */
export function Segmentado<V extends string | number>({
  opciones, valor, alElegir, etiqueta,
}: { opciones: readonly OpcionSegmentada<V>[]; valor: V; alElegir: (v: V) => void; etiqueta: string }) {
  const id = useId();
  if (opciones.length === 2) return <Interruptor etiqueta={etiqueta} opciones={[opciones[0], opciones[1]]} valor={valor} alElegir={alElegir} />;
  return (
    <div className="pn-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <Seleccion id={id} valor={String(valor)} opciones={opciones.map((o) => ({ valor: String(o.valor), etiqueta: texto(o) }))}
        alElegir={(v) => { const o = opciones.find((x) => String(x.valor) === v); if (o) alElegir(o.valor); }} />
    </div>
  );
}

/** Dos opciones: «Venta ◯ Renta». Encendido es la segunda; la elegida va en negritas. Pulsar cualquiera de los dos textos también cambia. */
export function Interruptor<V extends string | number>({ etiqueta, opciones, valor, alElegir }: {
  etiqueta: string; opciones: readonly [OpcionSegmentada<V>, OpcionSegmentada<V>]; valor: V; alElegir: (v: V) => void;
}) {
  const [a, b] = opciones;
  const segunda = valor === b.valor;
  const lado = (o: OpcionSegmentada<V>, activo: boolean) => (
    <button type="button" className="pn-int-lado" data-activo={activo} onClick={() => alElegir(o.valor)} tabIndex={-1} aria-hidden>{texto(o)}</button>
  );
  return (
    <div className="pn-campo">
      <span>{etiqueta}</span>
      <div className="pn-int">
        {lado(a, !segunda)}
        <Switch checked={segunda} onCheckedChange={(c) => alElegir(c ? b.valor : a.valor)} aria-label={`${etiqueta}: ${texto(segunda ? b : a)}`} />
        {lado(b, segunda)}
      </div>
    </div>
  );
}
