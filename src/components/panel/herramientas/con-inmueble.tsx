"use client";
import { Cargando } from "@/components/panel/kit/estados";

import { CalculadoraComision } from "./calculadora-comision";
import { CalculadoraCostos } from "./calculadora-costos";
import { CalculadoraCredito } from "./calculadora-credito";
import { ParaInmueble, useInmuebleDeDireccion } from "./inmueble-elegido";

/**
 * Calculadora con el inmueble que viene de su ficha (AUD-03, T1): «Para: …» arriba, el precio ya escrito y Quitar.
 * Se monta de nuevo al cambiar de inmueble (key) para que el precio arranque con el suyo.
 */
export function ConInmueble({ cual }: { cual: "credito" | "comision" | "costos" }) {
  const { codigo, elegido, buscando, noEncontrado, quitar } = useInmuebleDeDireccion();
  if (buscando) return <Cargando lineas={3} etiqueta="Cargando el inmueble" />;
  const para = elegido ? `${elegido.titulo} (${elegido.codigo})` : undefined;
  const props = { precioInicial: elegido ? elegido.precio : undefined, para };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {elegido ? <ParaInmueble elegido={elegido} alQuitar={quitar} /> : null}
      {elegido?.aviso ? <p className="pn-sub pn-tono-aviso" style={{ margin: 0 }}>{elegido.aviso}</p> : null}
      {noEncontrado ? <p className="pn-sub pn-tono-aviso" style={{ margin: 0 }}>No se encontró el inmueble {codigo}. La cuenta queda libre.</p> : null}
      {cual === "credito" ? <CalculadoraCredito key={codigo ?? "libre"} {...props} /> : cual === "comision" ? <CalculadoraComision key={codigo ?? "libre"} {...props} /> : <CalculadoraCostos key={codigo ?? "libre"} {...props} />}
    </div>
  );
}
