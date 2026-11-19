"use client";
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

import { Icono } from "../icons";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  etiqueta: string;
  ayuda?: ReactNode;
  /** El error nunca depende solo del color: lleva ícono y mensaje enlazado (aria-describedby). */
  error?: string;
  /** Campo de monto con el signo «$». */
  dinero?: boolean;
};

/** Etiqueta arriba, la caja del juego único (34 px; 44 en el teléfono) y mensaje debajo. */
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

/**
 * Área de texto con su etiqueta: la misma caja que un campo (juego único). `accion` va a la derecha de la etiqueta
 * (por ejemplo, el botón de dictar), fuera de la etiqueta para no anidar botones en ella.
 */
export function AreaTexto({ etiqueta, accion, ayuda, className, ...area }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  etiqueta: string; accion?: ReactNode; ayuda?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="pn-campo">
      <span className="pn-campo-cab"><label htmlFor={id}>{etiqueta}</label>{accion}</span>
      <textarea {...area} id={id} className={className} aria-describedby={ayuda ? `${id}-ayuda` : undefined} />
      {ayuda ? <span id={`${id}-ayuda`} className="pn-campo-ayuda">{ayuda}</span> : null}
    </div>
  );
}

/** Teléfono: clave del país y número en una línea, con la misma caja que los demás campos. */
export function CampoTelefono({ etiqueta, pais, numero, alCambiarPais, alCambiarNumero }: {
  etiqueta: string; pais: string; numero: string; alCambiarPais: (v: string) => void; alCambiarNumero: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="pn-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <span className="pn-tel">
        <input aria-label="Clave del país" value={pais} maxLength={5} inputMode="tel" autoComplete="off" onChange={(e) => alCambiarPais(e.target.value)} />
        <input id={id} inputMode="tel" value={numero} maxLength={30} autoComplete="off" onChange={(e) => alCambiarNumero(e.target.value)} />
      </span>
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
