"use client";
import * as React from "react";
import { inputClass } from "@/components/admin/ui";

/*
  Campo de importe del panel (pedido del titular, 17/10/2026): mientras no se edita muestra
  el monto con formato de moneda ($5,000,000.00); al enfocarlo deja el número limpio para
  escribir. Guarda siempre un número. Sirve controlado (value/onChange) o dentro de un
  formulario (name/defaultValue, con un campo oculto que envía el número).
*/

const formato = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatoMoneda = (value: number) => `$${formato.format(value)}`;
/** Acepta lo que escriba el asesor («$5,000,000.50», «5000000») y devuelve el número, o "" si está vacío. */
export function leerMonto(text: string): number | "" {
  const clean = text.replace(/[^\d.]/g, "");
  if (!clean) return "";
  const [entero, ...decimales] = clean.split(".");
  const value = Number(`${entero || "0"}${decimales.length ? `.${decimales.join("").slice(0, 2)}` : ""}`);
  return Number.isFinite(value) ? value : "";
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> & {
  value?: unknown; defaultValue?: unknown; onValueChange?: (value: number | "") => void;
};

export function MoneyInput({ value, defaultValue, onValueChange, name, className, onFocus, onBlur, ...rest }: Props) {
  const controlled = value !== undefined;
  const [own, setOwn] = React.useState<number | "">(typeof defaultValue === "number" && Number.isFinite(defaultValue) ? defaultValue : "");
  const current = controlled ? (typeof value === "number" && Number.isFinite(value) ? value : "") : own;
  const [editing, setEditing] = React.useState<string | null>(null);
  const shown = editing ?? (current === "" ? "" : formatoMoneda(current));
  return <>
    <input {...rest} type="text" inputMode="decimal" autoComplete="off" className={className ?? inputClass} value={shown}
      onFocus={event => { setEditing(current === "" ? "" : String(current)); onFocus?.(event); }}
      onBlur={event => { setEditing(null); onBlur?.(event); }}
      onChange={event => {
        setEditing(event.target.value.replace(/[^\d.,$\s]/g, ""));
        const next = leerMonto(event.target.value);
        if (!controlled) setOwn(next);
        onValueChange?.(next);
      }} />
    {name && <input type="hidden" name={name} value={current === "" ? "" : String(current)} />}
  </>;
}
