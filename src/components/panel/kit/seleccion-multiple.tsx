"use client";
import { useId } from "react";

import { Gesto } from "@/components/panel/icons";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";

/**
 * Varias opciones a la vez (por ejemplo, «Qué debe»). Se ve igual que una lista desplegable (misma caja, misma flecha)
 * y abre la lista con palomitas; la lista no se cierra al marcar. Las opciones `exclusivas` («Nada», «No sabe») no se
 * combinan: al marcarlas se desmarca lo demás, y al marcar otra se desmarcan ellas.
 */
export function SeleccionMultiple<T extends string>({ etiqueta, valor, opciones, alCambiar, vacio = "Sin decir", exclusivas = [], sinEtiqueta }: {
  etiqueta: string; valor: readonly T[]; opciones: readonly { valor: T; etiqueta: string }[];
  alCambiar: (v: T[]) => void; vacio?: string; exclusivas?: readonly T[]; sinEtiqueta?: boolean;
}) {
  const id = useId();
  const texto = opciones.filter((o) => valor.includes(o.valor)).map((o) => o.etiqueta).join(", ");
  function marcar(v: T, si: boolean) {
    const sin = valor.filter((x) => x !== v);
    if (!si) { alCambiar(sin); return; }
    alCambiar(exclusivas.includes(v) ? [v] : [...sin.filter((x) => !exclusivas.includes(x)), v]);
  }
  return (
    <div className="pn-campo">
      <span id={`${id}-e`} className={sinEtiqueta ? "pn-solo-lector" : undefined}>{etiqueta}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="pn-control pn-control-boton" data-vacio={!texto || undefined} aria-labelledby={`${id}-e ${id}-v`}>
          <span id={`${id}-v`} className="pn-control-valor">{texto || vacio}</span>
          <Gesto nombre="abajo" tamano={16} className="pn-control-flecha" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-(--radix-dropdown-menu-trigger-width)">
          <DropdownMenuLabel>Puedes elegir varias</DropdownMenuLabel>
          {opciones.map((o) => (
            <DropdownMenuCheckboxItem key={o.valor} checked={valor.includes(o.valor)} onSelect={(e) => e.preventDefault()} onCheckedChange={(si) => marcar(o.valor, si === true)}>
              {o.etiqueta}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
