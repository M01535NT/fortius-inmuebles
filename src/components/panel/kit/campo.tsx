"use client";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { Icono } from "../icons";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  etiqueta: string;
  ayuda?: ReactNode;
  /** El error nunca depende solo del color: lleva ícono y mensaje enlazado (aria-describedby). */
  error?: string;
  /** Campo de monto con el signo «$». */
  dinero?: boolean;
};

/** Etiqueta arriba, borde fuerte y mensaje debajo. La caja mide 44 px de alto. */
export function Campo({ etiqueta, ayuda, error, dinero, ...input }: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descripcion = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ") || undefined;
  const caja = <input {...input} id={id} aria-invalid={error ? true : undefined} aria-describedby={descripcion} />;
  return (
    <div className="pn-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {dinero ? <span className="pn-campo-dinero"><span aria-hidden>$</span>{caja}</span> : caja}
      {ayuda ? <span id={idAyuda} className="pn-campo-ayuda">{ayuda}</span> : null}
      {error ? <span id={idError} className="pn-campo-error" role="alert"><Icono nombre="alerta" tamano={16} />{error}</span> : null}
    </div>
  );
}

/** Quita lo que no sea dígito o punto y pone comas de millar: «3,000,000». */
export function formatoMonto(texto: string): string {
  const [entero = "", decimal] = texto.replace(/[^0-9.]/g, "").split(".");
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal === undefined ? miles : `${miles}.${decimal}`;
}

export function montoANumero(texto: string): number {
  const n = Number.parseFloat(texto.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
