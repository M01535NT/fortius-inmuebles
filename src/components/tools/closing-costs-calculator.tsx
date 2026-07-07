"use client";

import * as React from "react";

import { NumberTicker } from "@/components/magicui/number-ticker";

/*
  Estimador de gastos de cierre (Tijuana, BC). Rangos de referencia
  tomados de la investigación interna (InvestigacionModeloNegocio.md):
  - ISAI Tijuana: progresivo, aprox 2% a 4.5% (Art. 8 Ley de Ingresos municipal)
  - Honorarios notariales: 0.5% a 1.5%
  - Registro Público: ~0.2%
  - Avalúo: monto fijo aproximado ($3,000 a $15,000 MXN)
  Estimación informativa: los montos reales varían por operación y se
  confirman con el notario o el especialista correspondiente.
*/
type Perfil = "comprador" | "vendedor";

const AVALUO = { min: 3000, max: 15000 };

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function ClosingCostsCalculator() {
  const [perfil, setPerfil] = React.useState<Perfil>("comprador");
  const [precio, setPrecio] = React.useState<number>(3000000);
  const [comision, setComision] = React.useState<number>(5);

  const rows =
    perfil === "comprador"
      ? [
          { label: "ISAI (impuesto de adquisición)", min: precio * 0.02, max: precio * 0.045 },
          { label: "Honorarios notariales", min: precio * 0.005, max: precio * 0.015 },
          { label: "Registro Público de la Propiedad", min: precio * 0.002, max: precio * 0.002 },
          { label: "Avalúo", min: AVALUO.min, max: AVALUO.max },
        ]
      : [
          { label: `Comisión de intermediación (${comision}%)`, min: precio * (comision / 100), max: precio * (comision / 100) },
          { label: "IVA sobre la comisión (16%)", min: precio * (comision / 100) * 0.16, max: precio * (comision / 100) * 0.16 },
        ];

  const totalMin = rows.reduce((s, r) => s + r.min, 0);
  const totalMax = rows.reduce((s, r) => s + r.max, 0);

  const chip =
    "inline-flex h-10 items-center rounded-md border px-4 text-[14px] font-medium transition-colors";

  return (
    <div className="rounded-lg border border-border bg-card p-6 md:p-8">
      {/* Perfil */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Perfil">
        {(["comprador", "vendedor"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={perfil === p}
            onClick={() => setPerfil(p)}
            className={
              chip +
              (perfil === p
                ? " border-primary/50 bg-secondary text-foreground"
                : " border-border text-foreground/75 hover:bg-secondary hover:text-foreground")
            }
          >
            {p === "comprador" ? "Voy a comprar" : "Voy a vender"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="gastos-precio" className="text-[13.5px] font-medium text-foreground">
            {perfil === "comprador" ? "Precio de compra (MXN)" : "Precio de venta (MXN)"}
          </label>
          <input
            id="gastos-precio"
            type="number"
            min={100000}
            step={50000}
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value) || 3000000)}
            className="h-11 rounded-md border border-input bg-background px-3.5 font-mono text-[15px] text-foreground"
          />
        </div>
        {perfil === "vendedor" ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="gastos-comision" className="text-[13.5px] font-medium text-foreground">
              Comisión pactada (%)
            </label>
            <input
              id="gastos-comision"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={comision}
              onChange={(e) => setComision(Number(e.target.value) || 5)}
              className="h-11 rounded-md border border-input bg-background px-3.5 font-mono text-[15px] text-foreground"
            />
          </div>
        ) : null}
      </div>

      {/* Desglose */}
      <dl className="mt-7 border-t border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b border-border py-3.5"
          >
            <dt className="text-[14px] text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-nowrap font-mono text-[14px] text-foreground">
              {row.min === row.max ? fmt(row.min) : `${fmt(row.min)} a ${fmt(row.max)}`}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-6 py-4">
          <dt className="text-[15px] font-medium text-foreground">Total estimado</dt>
          <dd className="whitespace-nowrap font-mono text-[16px] font-medium text-primary">
            {totalMin === totalMax ? (
              <NumberTicker value={totalMin} prefix="$" suffix=" MXN" />
            ) : (
              <>
                <NumberTicker value={totalMin} prefix="$" /> a{" "}
                <NumberTicker value={totalMax} prefix="$" suffix=" MXN" />
              </>
            )}
          </dd>
        </div>
      </dl>

      {perfil === "vendedor" ? (
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Falta el ISR por enajenación: lo calcula y retiene el notario según
          tu caso, y puede estar exento en casa habitación si cumples los
          requisitos. Lo revisamos contigo antes de decidir.
        </p>
      ) : null}

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        Estimación informativa con rangos de referencia para Tijuana, BC. Los
        montos reales varían por operación y se confirman con el notario o el
        especialista correspondiente.
      </p>
    </div>
  );
}
