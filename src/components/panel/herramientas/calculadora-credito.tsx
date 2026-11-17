"use client";
import { useMemo, useState } from "react";

import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { aTexto } from "@/lib/panel/calendario";
import { calcularCredito, pesos } from "@/lib/panel/herramientas";

import { Resultado } from "./resultado";

const LEYENDA = "Cálculo de referencia. No incluye seguros, comisiones del banco ni impuestos de la operación.";

/** Crédito hipotecario: precio, enganche, plazo y tasa → mensualidad. Es para el comprador. */
export function CalculadoraCredito({ precioInicial, para }: { precioInicial?: number | null; para?: string }) {
  const [precio, setPrecio] = useState(() => (precioInicial === null ? "" : String(precioInicial ?? 2500000)));
  const [enganche, setEnganche] = useState<10 | 20 | 30 | 40>(20);
  const [plazo, setPlazo] = useState<10 | 15 | 20 | 25>(20);
  const [tasa, setTasa] = useState("11.5");
  const [hoy] = useState(() => aTexto(new Date()));

  const t = Number.parseFloat(tasa) || 0;
  const credito = useMemo(() => calcularCredito(montoANumero(precio), enganche, plazo, t, hoy), [precio, enganche, plazo, t, hoy]);
  const lineas = credito ? [
    { k: "Mensualidad", v: pesos(credito.mensualidad), grande: true },
    { k: "Enganche", v: pesos(credito.enganche) },
    { k: "Crédito", v: pesos(credito.credito) },
    { k: "Intereses en total", v: pesos(credito.intereses) },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Campo etiqueta="Precio del inmueble" dinero inputMode="decimal" value={formatoMonto(precio)} onChange={(e) => setPrecio(e.target.value.replace(/[^0-9.]/g, ""))} />
      <Segmentado etiqueta="Enganche" valor={enganche} alElegir={setEnganche} opciones={[{ valor: 10, etiqueta: "10%" }, { valor: 20, etiqueta: "20%" }, { valor: 30, etiqueta: "30%" }, { valor: 40, etiqueta: "40%" }]} />
      <Segmentado etiqueta="Plazo" valor={plazo} alElegir={setPlazo} opciones={[{ valor: 10, etiqueta: "10 años" }, { valor: 15, etiqueta: "15 años" }, { valor: 20, etiqueta: "20 años" }, { valor: 25, etiqueta: "25 años" }]} />
      <Campo etiqueta="Tasa anual (%)" inputMode="decimal" value={tasa} onChange={(e) => setTasa(e.target.value.replace(/[^0-9.]/g, ""))} error={t > 25 ? "La tasa no puede pasar de 25%." : undefined} />
      <Resultado
        lineas={lineas}
        vacio="Escribe un precio para ver la mensualidad."
        titulo="Crédito hipotecario"
        para={para}
        supuestos={[`precio ${pesos(montoANumero(precio))}`, `enganche ${enganche}%`, `plazo ${plazo} años`, `tasa ${t}% anual`]}
        leyenda={LEYENDA}
      />
      <p className="pn-her-leyenda">{LEYENDA}</p>
    </div>
  );
}
