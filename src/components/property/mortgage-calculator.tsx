"use client";

import * as React from "react";

/*
  Calculadora de hipoteca (estimación informativa). Solo se muestra en
  propiedades en venta con precio público y crédito disponible.
  Fórmula estándar de amortización con pagos mensuales fijos.
*/
type Props = { precio: number; moneda: "MXN" | "USD" };

const ENGANCHES = [10, 20, 30] as const;
const PLAZOS = [10, 15, 20] as const;
const TASA_DEFAULT = 10.5; // % anual, editable por el usuario

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function MortgageCalculator({ precio, moneda }: Props) {
  const [enganche, setEnganche] = React.useState<number>(20);
  const [plazo, setPlazo] = React.useState<number>(20);
  const [tasa, setTasa] = React.useState<number>(TASA_DEFAULT);

  const montoEnganche = precio * (enganche / 100);
  const credito = precio - montoEnganche;
  const r = tasa / 100 / 12;
  const n = plazo * 12;
  const mensualidad = r > 0 ? (credito * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : credito / n;

  const selectClass =
    "h-11 rounded-md border border-input bg-background px-3 text-[15px] text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 className="display-soft text-xl text-foreground">Estima tu mensualidad</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Con base en el precio de {fmt(precio)} {moneda}.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="calc-enganche" className="text-[13.5px] font-medium text-foreground">
            Enganche
          </label>
          <select
            id="calc-enganche"
            value={enganche}
            onChange={(e) => setEnganche(Number(e.target.value))}
            className={selectClass}
          >
            {ENGANCHES.map((e) => (
              <option key={e} value={e}>
                {e}%
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="calc-plazo" className="text-[13.5px] font-medium text-foreground">
            Plazo
          </label>
          <select
            id="calc-plazo"
            value={plazo}
            onChange={(e) => setPlazo(Number(e.target.value))}
            className={selectClass}
          >
            {PLAZOS.map((p) => (
              <option key={p} value={p}>
                {p} años
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="calc-tasa" className="text-[13.5px] font-medium text-foreground">
            Tasa %
          </label>
          <input
            id="calc-tasa"
            type="number"
            min={1}
            max={25}
            step={0.1}
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value) || TASA_DEFAULT)}
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground"
          />
        </div>
      </div>

      <dl className="mt-5 border-t border-border">
        <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
          <dt className="text-[14px] text-muted-foreground">Enganche ({enganche}%)</dt>
          <dd className="font-mono text-[14px] text-foreground">{fmt(montoEnganche)} {moneda}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
          <dt className="text-[14px] text-muted-foreground">Crédito solicitado</dt>
          <dd className="font-mono text-[14px] text-foreground">{fmt(credito)} {moneda}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 py-3.5">
          <dt className="text-[14.5px] font-medium text-foreground">Mensualidad</dt>
          <dd className="whitespace-nowrap font-mono text-[16px] font-medium text-primary">
            {fmt(mensualidad)} {moneda}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        Estimación informativa con pagos fijos; no incluye seguros, comisiones
        ni gastos de cierre, y no constituye una oferta de crédito. Las
        condiciones reales las define tu institución financiera.
      </p>
    </div>
  );
}
