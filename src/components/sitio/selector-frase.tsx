"use client";

import * as React from "react";
import { Select } from "radix-ui";

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

// Radix no admite una opción con valor vacío («cualquier precio»): se traduce de ida y vuelta.
const VACIO = "__cualquiera__";
const aClave = (valor: string) => (valor === "" ? VACIO : valor);
const deClave = (clave: string) => (clave === VACIO ? "" : clave);

/**
  Pieza de la frase del inventario («Quiero [comprar] [casas] en [Playas]»): se ve como texto azul
  y abre su lista debajo. Es la lista de Radix (17/11/2026): si no cabe debajo se abre arriba y no se
  sale de la pantalla; Enter, Espacio o flechas abren; flechas, Inicio y Fin recorren; escribir una
  letra salta a la opción que empieza con ella; Enter elige; Escape cierra y el foco vuelve a la pieza.
*/
export function SelectorFrase({ etiqueta, opciones, valor, textoLibre, onCambio }: Props) {
  const indice = opciones.findIndex((o) => o.valor === valor);
  const texto = indice >= 0 ? opciones[indice]?.etiqueta : textoLibre ?? opciones[0]?.etiqueta;

  return (
    <span className="s-frase-pieza">
      <Select.Root value={aClave(valor)} onValueChange={(clave) => onCambio(deClave(clave))}>
        <Select.Trigger aria-label={`${etiqueta}: ${texto}`} className="s-frase-boton"
          data-elegido={indice > 0 || (indice < 0 && Boolean(textoLibre)) ? "true" : undefined}>
          <Select.Value>{texto}</Select.Value>
          <Select.Icon asChild><Chevron className="s-frase-chevron" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content position="popper" side="bottom" align="start" sideOffset={8} collisionPadding={16}
            aria-label={etiqueta} className="s-frase-lista">
            <Select.Viewport>
              {opciones.map((opcion) => (
                <Select.Item key={opcion.valor} value={aClave(opcion.valor)} className="s-frase-opcion">
                  <Select.ItemText>{opcion.etiqueta}</Select.ItemText>
                  <Select.ItemIndicator>
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </span>
  );
}
