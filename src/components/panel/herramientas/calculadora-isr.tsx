"use client";
import { useMemo, useState } from "react";

import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { SELLER_ISR_RULES as R } from "@/data/financial-rules";
import { localToday } from "@/lib/finance/money";
import { calculateSellerIsrCase } from "@/lib/finance/seller-isr";
import { pesos } from "@/lib/panel/herramientas";

import { DatosCuenta, Resultado, type LineaResultado } from "./resultado";

const LEYENDA = "Estimación, no asesoría fiscal: el cálculo definitivo lo hace el notario. Si falta un dato o la fecha queda fuera de las reglas cargadas, queda pendiente.";

const fechaCorta = (iso: string) => iso.split("-").reverse().join("/");
/** La ley, el artículo, la reforma y la fecha en que se revisó (SPEC.md, sección 9). */
const FUENTE = `Ley del ISR, artículos 93 (fracción XIX), 120 a 127, última reforma ${R.lawReform}, revisada el ${fechaCorta(R.reviewedAt)}; tarifa del Anexo 8 de la Resolución Miscelánea ${R.validFrom.slice(0, 4)}; factor de actualización: ${R.updateFactorArticle}.`;

const PROPIETARIOS = ["1", "2", "3", "4"].map((v) => ({ valor: v, etiqueta: v === "1" ? "Uno" : `${v} en partes iguales` }));
const limpiar = (t: string) => t.replace(/[^0-9.]/g, "");
/** Vacío es «falta», no cero: así el resultado dice pendiente en lugar de inventar. */
const opcional = (t: string): number | null => (t.trim() === "" ? null : montoANumero(t));

function Monto({ etiqueta, valor, alCambiar, ayuda, placeholder = "Falta" }: { etiqueta: string; valor: string; alCambiar: (v: string) => void; ayuda?: string; placeholder?: string }) {
  return <Campo etiqueta={etiqueta} dinero inputMode="decimal" placeholder={placeholder} ayuda={ayuda} value={formatoMonto(valor)} onChange={(e) => alCambiar(limpiar(e.target.value))} />;
}

/**
 * ISR por la venta de un inmueble de persona física (el mismo cálculo que usa el sitio, con sus artículos).
 * Sin un dato, el resultado es «Pendiente» y dice qué falta; nunca se supone un valor fiscal.
 */
export function CalculadoraIsr({ precioInicial, para }: { precioInicial?: number | null; para?: string }) {
  const [precio, setPrecio] = useState(() => (precioInicial === null || precioInicial === undefined ? "" : String(precioInicial)));
  const [venta, setVenta] = useState(localToday);
  const [compra, setCompra] = useState("");
  const [duenos, setDuenos] = useState("1");
  const [modo, setModo] = useState<"actualizado" | "historico">("historico");
  const [actualizado, setActualizado] = useState("");
  const [costo, setCosto] = useState("");
  const [terreno, setTerreno] = useState("");
  const [inpcCompra, setInpcCompra] = useState("");
  const [inpcVenta, setInpcVenta] = useState("");
  const [mejoras, setMejoras] = useState("");
  const [gastos, setGastos] = useState("");
  const [comision, setComision] = useState("");
  const [casa, setCasa] = useState<"si" | "no">("no");
  const [usoAntes, setUsoAntes] = useState<"no" | "si">("no");
  const [udi, setUdi] = useState("");

  const p = montoANumero(precio);
  const r = useMemo(() => {
    if (p <= 0) return null;
    try {
      return calculateSellerIsrCase({
        price: p, saleDate: venta, acquisitionDate: compra, owners: Number(duenos), costMode: modo,
        updatedCost: opcional(actualizado), acquisitionCost: opcional(costo), landCost: opcional(terreno),
        inpcAcquisition: opcional(inpcCompra), inpcSale: opcional(inpcVenta),
        improvements: opcional(mejoras), expenses: opcional(gastos), commission: opcional(comision),
        homeExemption: casa === "si", noPriorExemption: usoAntes === "no", udiValue: opcional(udi),
      });
    } catch {
      return null;
    }
  }, [p, venta, compra, duenos, modo, actualizado, costo, terreno, inpcCompra, inpcVenta, mejoras, gastos, comision, casa, usoAntes, udi]);

  const lineas: LineaResultado[] = !r ? [] : r.status === "pendiente"
    ? [{ k: "ISR estimado", v: "Pendiente", grande: true }, ...r.missing.map((m) => ({ k: m, v: "Falta" }))]
    : [
        { k: Number(duenos) > 1 ? "ISR estimado de todos" : "ISR estimado", v: pesos(r.provisional), grande: true },
        { k: "Pago al estado (5%)", v: pesos(r.state) },
        { k: "Pago federal", v: pesos(r.federal) },
        { k: "Ganancia", v: pesos(r.gain) },
        { k: r.costFloorApplied ? "Costo actualizado (mínimo del 10%)" : "Costo actualizado", v: pesos(r.updatedCost) },
        { k: "Deducciones", v: pesos(r.deductions) },
        ...(r.exemptionApplied && r.exemptLimit !== null ? [{ k: "Exento por casa habitación hasta", v: pesos(r.exemptLimit) }] : []),
        { k: "Años desde la compra", v: String(r.years) },
        ...(Number(duenos) > 1 ? r.owners.map((o) => ({ k: `Propietario ${o.owner}`, v: pesos(o.provisional) })) : []),
      ];

  const supuestos = [
    `precio ${pesos(p)}`, `escritura el ${fechaCorta(venta)}`, compra ? `compra el ${fechaCorta(compra)}` : "fecha de compra por escribir",
    Number(duenos) > 1 ? `${duenos} propietarios en partes iguales` : "un propietario",
    casa === "si" ? (usoAntes === "no" ? "casa habitación, sin exención en los tres años anteriores" : "casa habitación, ya usó la exención") : "sin exención de casa habitación",
  ];

  return (
    <div className="her-cuenta">
      <DatosCuenta titulo="La venta">
        <Campo etiqueta="Precio de venta" dinero inputMode="decimal" placeholder="Falta" value={formatoMonto(precio)} onChange={(e) => setPrecio(limpiar(e.target.value))} />
        <Campo etiqueta="Fecha estimada de la escritura" type="date" value={venta} onChange={(e) => setVenta(e.target.value)} />
        <Campo etiqueta="Fecha en que se compró" type="date" value={compra} onChange={(e) => setCompra(e.target.value)} />
        <Desplegable etiqueta="Propietarios" valor={duenos} opciones={PROPIETARIOS} alElegir={(v) => v && setDuenos(v)} />
      </DatosCuenta>
      <DatosCuenta titulo="El costo de compra">
        <Interruptor etiqueta="Costo de compra" valor={modo} alElegir={setModo} opciones={[{ valor: "historico", etiqueta: "El de la escritura" }, { valor: "actualizado", etiqueta: "Ya actualizado" }]} />
        {modo === "actualizado" ? (
          <Monto etiqueta="Costo de adquisición actualizado" valor={actualizado} alCambiar={setActualizado} ayuda="El que dé la notaría o el contador." />
        ) : (
          <>
            <Monto etiqueta="Precio en que se compró" valor={costo} alCambiar={setCosto} />
            <Monto etiqueta="Valor del terreno en esa compra" valor={terreno} alCambiar={setTerreno} placeholder="Opcional" ayuda="Si se deja vacío, la ley toma el 20% del precio de compra." />
            <Campo etiqueta="INPC del mes en que se compró" inputMode="decimal" placeholder="Falta" value={inpcCompra} onChange={(e) => setInpcCompra(limpiar(e.target.value))} ayuda="Lo publica el INEGI." />
            <Campo etiqueta="INPC del mes anterior a la venta" inputMode="decimal" placeholder="Falta" value={inpcVenta} onChange={(e) => setInpcVenta(limpiar(e.target.value))} />
          </>
        )}
      </DatosCuenta>
      <DatosCuenta titulo="Deducciones y exención">
        <Monto etiqueta="Mejoras y ampliaciones, actualizadas" valor={mejoras} alCambiar={setMejoras} ayuda="Escribe 0 si no hubo." />
        <Monto etiqueta="Gastos notariales, impuestos y avalúo deducibles" valor={gastos} alCambiar={setGastos} ayuda="Escribe 0 si no hay." />
        <Monto etiqueta="Comisión de la venta" valor={comision} alCambiar={setComision} ayuda="La que paga el vendedor, con IVA." />
        <Interruptor etiqueta="Es su casa habitación" valor={casa} alElegir={setCasa} opciones={[{ valor: "no", etiqueta: "No" }, { valor: "si", etiqueta: "Sí" }]} />
        {casa === "si" ? (
          <>
            <Interruptor etiqueta="Usó la exención en los tres años anteriores" valor={usoAntes} alElegir={setUsoAntes} opciones={[{ valor: "no", etiqueta: "No" }, { valor: "si", etiqueta: "Sí" }]} />
            {usoAntes === "no" ? <Campo etiqueta="Valor de la UDI el día de la escritura" inputMode="decimal" placeholder="Falta" value={udi} onChange={(e) => setUdi(limpiar(e.target.value))} ayuda="Lo publica el Banco de México." /> : null}
          </>
        ) : null}
      </DatosCuenta>
      <Resultado
        lineas={lineas}
        vacio="Escribe el precio de venta para empezar."
        titulo="Cálculo de ISR por la venta"
        para={para}
        supuestos={supuestos}
        leyenda={LEYENDA}
        tipo="isr"
        fuente={FUENTE}
      />
      <p className="as-m her-ley">{LEYENDA}</p>
    </div>
  );
}
