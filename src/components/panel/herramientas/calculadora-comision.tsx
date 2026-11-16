"use client";
import { useMemo, useState } from "react";

import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { calcularComision, pesos } from "@/lib/panel/herramientas";

import { Etiquetado, Resultado } from "./resultado";

const LEYENDA = "Cuenta de referencia. No incluye ISR, gastos notariales ni el reparto entre asesores.";

/** Comisión: precio de venta y porcentaje → comisión, IVA y lo que le queda al propietario. Es para el vendedor. */
export function CalculadoraComision({ precioInicial, para }: { precioInicial?: number | null; para?: string }) {
  const [precio, setPrecio] = useState(() => (precioInicial === null ? "" : String(precioInicial ?? 2500000)));
  const [pct, setPct] = useState<3 | 4 | 5 | 6>(5);
  const comision = useMemo(() => calcularComision(montoANumero(precio), pct), [precio, pct]);
  const lineas = comision ? [
    { k: "Comisión con IVA", v: pesos(comision.total), grande: true },
    { k: "Comisión", v: pesos(comision.comision) },
    { k: "IVA (16%)", v: pesos(comision.iva) },
    { k: "Al propietario le quedan", v: pesos(comision.alPropietario) },
  ] : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Campo etiqueta="Precio de venta" dinero inputMode="decimal" value={formatoMonto(precio)} onChange={(e) => setPrecio(e.target.value.replace(/[^0-9.]/g, ""))} />
      <Etiquetado etiqueta="Comisión"><Segmentado etiqueta="Comisión" valor={pct} alElegir={setPct} opciones={[{ valor: 3, etiqueta: "3%" }, { valor: 4, etiqueta: "4%" }, { valor: 5, etiqueta: "5%" }, { valor: 6, etiqueta: "6%" }]} /></Etiquetado>
      <Resultado
        lineas={lineas}
        vacio="Escribe un precio para ver la comisión."
        titulo="Comisión"
        para={para}
        supuestos={[`precio de venta ${pesos(montoANumero(precio))}`, `comisión ${pct}% más IVA`]}
        leyenda={LEYENDA}
      />
      <p className="pn-sub" style={{ margin: 0 }}>{LEYENDA}</p>
    </div>
  );
}
