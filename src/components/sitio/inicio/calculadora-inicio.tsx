"use client";

import * as React from "react";

import { calculateMortgage } from "@/lib/finance/mortgage";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";

const TASA = 10.5;
const ENGANCHE = 20;
const PLAZO = 20;
const pesos = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

/*
  Haz números (17/11/2026): la mensualidad se calcula al mover el precio, con 20 % de enganche,
  20 años y la tasa de referencia de la calculadora completa. Sin registro.
*/
export function CalculadoraInicio() {
  const [precio, setPrecio] = React.useState(3_000_000);
  const pago = React.useMemo(() => {
    try {
      return calculateMortgage({
        price: precio, downPercent: ENGANCHE, annualRate: TASA, months: PLAZO * 12, firstPayment: "2026-12-01",
        insurance: null, monthlyFee: null, openingFee: null, extraMonthly: 0, extraOnce: 0, extraMonth: 12,
        prepaymentFee: null, prepaymentMode: "term",
      }).payment;
    } catch { return null; }
  }, [precio]);

  return (
    <section className="s-banda hn" aria-labelledby="hn-titulo">
      <div className="s-contenedor hn-cuerpo">
        <div className="hn-texto">
          <h2 id="hn-titulo" className="hn-titulo">Haz números antes de decidir.</h2>
          <p className="s-apoyo">Mueve el precio y mira la mensualidad. Sin registro.</p>
          <ListaLineas grande className="hn-enlaces" etiqueta="Herramientas">
            <FilaLinea href="/herramientas/hipoteca" titulo="Calculadora de hipoteca completa" />
            <FilaLinea href="/herramientas/gastos-de-cierre" titulo="Gastos de cierre" />
          </ListaLineas>
        </div>
        <div className="hn-caja">
          <label className="hn-precio">
            <span>Precio de la propiedad</span>
            <output className="hn-precio-valor" htmlFor="hn-rango">{pesos(precio)}</output>
            <input id="hn-rango" type="range" min={1_000_000} max={20_000_000} step={250_000} value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))} aria-valuetext={pesos(precio)} />
          </label>
          <dl className="hn-supuestos">
            <div><dt>Enganche, {ENGANCHE} %</dt><dd>{pesos(precio * ENGANCHE / 100)}</dd></div>
            <div><dt>Plazo</dt><dd>{PLAZO} años</dd></div>
            <div><dt>Tasa anual</dt><dd>{TASA} %</dd></div>
          </dl>
          <div>
            <p className="hn-etiqueta">Mensualidad estimada</p>
            <p className="hn-pago" aria-live="polite">{pago === null ? "Por calcular" : pesos(pago)}</p>
          </div>
          <p className="hn-nota">Capital e interés. La tasa y las condiciones las define el banco.</p>
        </div>
      </div>
    </section>
  );
}
