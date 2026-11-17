"use client";

import * as React from "react";

export type Opcion<T extends string> = { valor: T; etiqueta: string };

type Base<T extends string> = {
  opciones: readonly Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
  /** Nombre del grupo para lectores de pantalla («Herramientas», «Vista»). */
  etiqueta: string;
  /** «tenue»: cápsula gris con la opción elegida en blanco (selector de vista). */
  tono?: "normal" | "tenue";
  chicas?: boolean;
  className?: string;
};

function clases(tono: "normal" | "tenue", chicas: boolean, className?: string) {
  return ["s-pestanas", tono === "tenue" ? "s-pestanas-tenue" : "", chicas ? "s-pestanas-chicas" : "", className ?? ""].filter(Boolean).join(" ");
}

/**
  Pestañas: cambian el panel que se ve debajo (fotos, video, 360°; herramientas de la ficha).
  Flechas izquierda y derecha, Inicio y Fin recorren las pestañas; solo la elegida entra con Tab.
  `idPanel(valor)` liga cada pestaña con su panel (aria-controls).
*/
export function Pestanas<T extends string>({ opciones, valor, onCambio, etiqueta, tono = "normal", chicas = false, className, idPanel }: Base<T> & { idPanel?: (valor: T) => string }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const mover = (desde: number, paso: number | "inicio" | "fin") => {
    const n = opciones.length;
    const i = paso === "inicio" ? 0 : paso === "fin" ? n - 1 : (desde + paso + n) % n;
    const opcion = opciones[i];
    if (!opcion) return;
    onCambio(opcion.valor);
    refs.current[i]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const teclas: Record<string, number | "inicio" | "fin"> = { ArrowRight: 1, ArrowLeft: -1, Home: "inicio", End: "fin" };
    const paso = teclas[event.key];
    if (paso === undefined) return;
    event.preventDefault();
    mover(i, paso);
  };
  return (
    <div role="tablist" aria-label={etiqueta} className={clases(tono, chicas, className)}>
      {opciones.map((opcion, i) => {
        const elegida = opcion.valor === valor;
        return (
          <button key={opcion.valor} ref={(el) => { refs.current[i] = el; }} type="button" role="tab"
            aria-selected={elegida} aria-controls={idPanel?.(opcion.valor)} tabIndex={elegida ? 0 : -1}
            onClick={() => onCambio(opcion.valor)} onKeyDown={(event) => onKeyDown(event, i)} className="s-pestana">
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/**
  Grupo de pastillas: elige un modo sin cambiar de panel (cuadrícula, lista, mapa).
  Cada pastilla es un botón con aria-pressed; todas entran con Tab.
*/
export function Pastillas<T extends string>({ opciones, valor, onCambio, etiqueta, tono = "tenue", chicas = true, className }: Base<T>) {
  return (
    <div role="group" aria-label={etiqueta} className={clases(tono, chicas, className)}>
      {opciones.map((opcion) => (
        <button key={opcion.valor} type="button" aria-pressed={opcion.valor === valor} onClick={() => onCambio(opcion.valor)} className="s-pestana">
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
