"use client";

import * as React from "react";

import { NumberTicker } from "@/components/magicui/number-ticker";

/*
  Calculadora de hipoteca (estimación informativa). En el detalle de
  propiedad recibe el precio fijo; en /herramientas/hipoteca se usa con
  `precioEditable` y el usuario captura el monto.
  Fórmula estándar de amortización con pagos mensuales fijos.
*/
type Props = { precio: number; moneda: "MXN" | "USD"; precioEditable?: boolean };

const ENGANCHES = [10, 20, 30] as const;
const PLAZOS = [10, 15, 20] as const;
const TASA_DEFAULT = 10.5; // % anual, editable por el usuario

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function MortgageCalculator({ precio: precioInicial, moneda, precioEditable = false }: Props) {
  const [precioInput, setPrecioInput] = React.useState(String(precioInicial));
  const [enganche, setEnganche] = React.useState<number>(20);
  const [plazo, setPlazo] = React.useState<number>(20);
  const [tasaInput, setTasaInput] = React.useState(String(TASA_DEFAULT));

  const precio = Number(precioInput);
  const tasa = Number(tasaInput);
  const precioValido = precioInput.trim() !== "" && Number.isFinite(precio) && precio >= 100000 && precio <= 10_000_000_000_000;
  const tasaValida = tasaInput.trim() !== "" && Number.isFinite(tasa) && tasa >= 1 && tasa <= 25;
  const valido = precioValido && tasaValida;

  const montoEnganche = precio * (enganche / 100);
  const credito = precio - montoEnganche;
  const r = tasa / 100 / 12;
  const n = plazo * 12;
  const mensualidad = r > 0 ? (credito * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : credito / n;
  const resultadoValido = valido && Number.isFinite(mensualidad);

  const selectClass =
    "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-5 md:p-6">
      <h2 className="display-soft text-xl text-foreground">Estima tu mensualidad</h2>
      {precioEditable ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="calc-precio" className="text-sm font-medium text-foreground">
            Precio de la propiedad ({moneda})
          </label>
          <input
            id="calc-precio"
            type="number"
            min={100000}
            step={50000}
            value={precioInput}
            onChange={(e) => setPrecioInput(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3.5 font-mono text-base text-foreground"
          />
        </div>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Con base en el precio de {fmt(precio)} {moneda}.
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="calc-enganche" className="text-sm font-medium text-foreground">
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
          <label htmlFor="calc-plazo" className="text-sm font-medium text-foreground">
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
          <label htmlFor="calc-tasa" className="text-sm font-medium text-foreground">
            Tasa %
          </label>
          <input
            id="calc-tasa"
            type="number"
            min={1}
            max={25}
            step={0.1}
            value={tasaInput}
            onChange={(e) => setTasaInput(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3.5 text-base text-foreground"
          />
        </div>
      </div>

      {!resultadoValido ? (
        <p role="alert" className="mt-5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {!precioValido
            ? "Ingresa un precio válido entre $100,000 y $10,000,000,000,000."
            : "Ingresa una tasa válida entre 1% y 25%."}
        </p>
      ) : (
      <dl className="mt-5 border-t border-border">
        <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
          <dt className="text-sm text-muted-foreground">Enganche ({enganche}%)</dt>
          <dd className="font-mono text-sm text-foreground">{fmt(montoEnganche)} {moneda}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
          <dt className="text-sm text-muted-foreground">Crédito solicitado</dt>
          <dd className="font-mono text-sm text-foreground">{fmt(credito)} {moneda}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 py-3.5">
          <dt className="text-base font-medium text-foreground">Mensualidad</dt>
          <dd className="whitespace-nowrap font-mono text-base font-medium text-primary">
            <NumberTicker value={mensualidad} prefix="$" suffix={` ${moneda}`} />
          </dd>
        </div>
      </dl>
      )}

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Pago fijo sin seguros, comisiones ni gastos de cierre.
      </p>
    </div>
  );
}
