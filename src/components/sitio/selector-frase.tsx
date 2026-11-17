"use client";

import * as React from "react";

import { Chevron } from "@/components/sitio/iconos";

export type OpcionFrase = { valor: string; etiqueta: string };

type Props = {
  /** Nombre de la lista para lectores de pantalla («Operación», «Zona»). */
  etiqueta: string;
  opciones: readonly OpcionFrase[];
  valor: string;
  /** Texto del botón cuando el valor no está en la lista (p. ej. un precio escrito a mano). */
  textoLibre?: string;
  onCambio: (valor: string) => void;
};

/**
  Pieza de la frase del inventario («Quiero [comprar] [casas] en [Playas]»): se ve como texto azul
  y abre su lista debajo. Teclado: Enter, Espacio o flecha abajo abren; flechas, Inicio y Fin
  recorren; Enter elige; Escape o Tab cierran y el foco vuelve a la pieza.
*/
export function SelectorFrase({ etiqueta, opciones, valor, textoLibre, onCambio }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [activo, setActivo] = React.useState(0);
  const raiz = React.useRef<HTMLSpanElement>(null);
  const boton = React.useRef<HTMLButtonElement>(null);
  const lista = React.useRef<HTMLUListElement>(null);
  const id = React.useId();
  const indice = opciones.findIndex((o) => o.valor === valor);
  const texto = indice >= 0 ? opciones[indice]?.etiqueta : textoLibre ?? opciones[0]?.etiqueta;

  const abrir = () => {
    setActivo(Math.max(0, indice));
    setAbierto(true);
  };
  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };
  const elegir = (i: number) => {
    const opcion = opciones[i];
    if (opcion) onCambio(opcion.valor);
    cerrar(true);
  };

  React.useEffect(() => {
    if (!abierto) return;
    lista.current?.focus({ preventScroll: true });
    const fuera = (event: PointerEvent) => {
      if (!raiz.current?.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  React.useEffect(() => {
    if (!abierto) return;
    document.getElementById(`${id}-${activo}`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo, id]);

  const onKeyLista = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const n = opciones.length;
    if (event.key === "ArrowDown") { event.preventDefault(); setActivo((i) => (i + 1) % n); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActivo((i) => (i - 1 + n) % n); }
    else if (event.key === "Home") { event.preventDefault(); setActivo(0); }
    else if (event.key === "End") { event.preventDefault(); setActivo(n - 1); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); elegir(activo); }
    else if (event.key === "Escape") { event.preventDefault(); cerrar(true); }
    else if (event.key === "Tab") { setAbierto(false); }
  };

  return (
    <span ref={raiz} className="s-frase-pieza">
      <button ref={boton} type="button" aria-haspopup="listbox" aria-expanded={abierto} aria-controls={abierto ? `${id}-lista` : undefined}
        aria-label={`${etiqueta}: ${texto}`}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        onKeyDown={(event) => { if (event.key === "ArrowDown" && !abierto) { event.preventDefault(); abrir(); } }}
        className="s-frase-boton" data-elegido={indice > 0 || (indice < 0 && Boolean(textoLibre)) ? "true" : undefined}>
        <span>{texto}</span>
        <Chevron className="s-frase-chevron" />
      </button>
      {abierto ? (
        <ul ref={lista} id={`${id}-lista`} role="listbox" aria-label={etiqueta} tabIndex={-1}
          aria-activedescendant={`${id}-${activo}`} onKeyDown={onKeyLista} className="s-frase-lista">
          {opciones.map((opcion, i) => (
            <li key={opcion.valor} id={`${id}-${i}`} role="option" aria-selected={opcion.valor === valor}
              data-activo={i === activo ? "true" : undefined}
              onPointerEnter={() => setActivo(i)} onClick={() => elegir(i)} className="s-frase-opcion">
              <span>{opcion.etiqueta}</span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}
