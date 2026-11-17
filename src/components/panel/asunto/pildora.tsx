"use client";
import type { ReactNode } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";

/**
 * Píldora que abre una lista para elegir (boceto: «En estudio ▾», «Todo el equipo ▾»).
 * Regla del titular: de 3 opciones en adelante, lista desplegable; nunca un botón por opción.
 */
export function Pildora<T extends string>({ etiqueta, valor, opciones, alElegir, icono, antes, titulo }: {
  /** Para el lector de pantalla y como título de la lista. */
  etiqueta: string;
  valor: T;
  opciones: readonly { valor: T; etiqueta: string }[];
  alElegir: (v: T) => void;
  icono?: NombreIcono;
  /** Algo antes del texto, como el punto de color de «En qué va». */
  antes?: ReactNode;
  /** Texto de la píldora si no es el de la opción elegida. */
  titulo?: string;
}) {
  const actual = opciones.find((o) => o.valor === valor);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="as-pil" aria-label={`${etiqueta}: ${actual?.etiqueta ?? "sin elegir"}`}>
        {antes}{icono ? <Icono nombre={icono} tamano={14} /> : null}
        <span className="as-pil-t">{titulo ?? actual?.etiqueta ?? etiqueta}</span>
        <Icono nombre="down" tamano={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuLabel>{etiqueta}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={valor} onValueChange={(v) => alElegir(v as T)}>
          {opciones.map((o) => <DropdownMenuRadioItem key={o.valor} value={o.valor}>{o.etiqueta}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Ícono en su cuadrito de color (boceto: «tile»). */
export function Cuadro({ icono, color, chico }: { icono: NombreIcono; color: string; chico?: boolean }) {
  return (
    <span className={chico ? "as-tile as-tile-ch" : "as-tile"} style={{ background: `var(--c-${color})` }} aria-hidden>
      <Icono nombre={icono} tamano={chico ? 13 : 16} />
    </span>
  );
}
