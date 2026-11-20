"use client";
import { Cargando } from "@/components/panel/kit/estados";

import { CalculadoraComision } from "./calculadora-comision";
import { CalculadoraCostos } from "./calculadora-costos";
import { CalculadoraCredito } from "./calculadora-credito";
import { CalculadoraIsr } from "./calculadora-isr";
import { ParaInmueble, useInmuebleDeDireccion } from "./inmueble-elegido";

export type Cual = "credito" | "comision" | "compra" | "venta" | "isr";

/**
 * Cuenta con el inmueble que viene de su ficha: «Para: …» arriba, el precio ya escrito y Quitar.
 * Se monta de nuevo al cambiar de inmueble (key) para que el precio arranque con el suyo.
 */
export function ConInmueble({ cual }: { cual: Cual }) {
  const { codigo, elegido, buscando, noEncontrado, quitar } = useInmuebleDeDireccion();
  if (buscando) return <Cargando lineas={3} etiqueta="Cargando el inmueble" />;
  const para = elegido ? `${elegido.titulo} (${elegido.codigo})` : undefined;
  const props = { precioInicial: elegido ? elegido.precio : undefined, para };
  const key = `${cual}-${codigo ?? "libre"}`;
  return (
    <div className="her-cuenta">
      {elegido ? <ParaInmueble elegido={elegido} alQuitar={quitar} /> : null}
      {elegido?.aviso ? <p className="as-m her-ley pn-tono-aviso">{elegido.aviso}</p> : null}
      {noEncontrado ? <p className="as-m her-ley pn-tono-aviso">No se encontró el inmueble {codigo}. La cuenta queda libre.</p> : null}
      {cual === "credito" ? <CalculadoraCredito key={key} {...props} />
        : cual === "comision" ? <CalculadoraComision key={key} {...props} />
        : cual === "isr" ? <CalculadoraIsr key={key} {...props} />
        : <CalculadoraCostos key={key} ladoInicial={cual} {...props} />}
    </div>
  );
}
