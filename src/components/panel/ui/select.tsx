"use client";
import { Select as S } from "radix-ui";

import { Gesto } from "@/components/panel/icons";
import { cn } from "@/lib/panel/utils";

import { contenedorPanel } from "./contenedor";

/** Radix no admite el valor vacío en una opción: se traduce a este centinela y de vuelta. */
const VACIO = "__vacio__";

/**
 * Lista desplegable del panel (regla del titular, 16/11/2026: nada de filas de botones).
 * La misma caja que un campo (juego único, panel-kit.css): blanca, con borde, 34 px (44 en el teléfono), con flecha; la lista flota con línea y sombra suave, filas de 44 px, palomita en la elegida.
 * Teclado: Espacio o Enter abre, flechas recorren, escribir salta a la opción, Esc cierra.
 */
export function Seleccion({ id, valor, opciones, alElegir, vacio, etiquetaAccesible, describedBy }: {
  id?: string; valor: string; opciones: readonly { valor: string; etiqueta: string }[];
  alElegir: (v: string) => void; vacio?: string; etiquetaAccesible?: string; describedBy?: string;
}) {
  return (
    <S.Root value={valor === "" ? VACIO : valor} onValueChange={(v) => alElegir(v === VACIO ? "" : v)}>
      <S.Trigger
        id={id}
        aria-label={etiquetaAccesible}
        aria-describedby={describedBy}
        className="group pn-control pn-control-boton"
        data-vacio={valor === "" || undefined}
      >
        <span className="pn-control-valor"><S.Value placeholder={vacio ?? "Elige…"} /></span>
        <S.Icon className="shrink-0 text-[var(--ink-faint)] transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none">
          <Gesto nombre="abajo" tamano={16} />
        </S.Icon>
      </S.Trigger>
      <S.Portal container={contenedorPanel()}>
        <S.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) max-w-[min(var(--radix-select-content-available-width),calc(100vw-32px))] overflow-hidden rounded-[var(--r-lg)] border border-border bg-popover p-1 text-popover-foreground shadow-[var(--sombra-flota)]",
            "origin-(--radix-select-content-transform-origin) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none",
          )}
        >
          <S.Viewport className="max-h-[inherit] overflow-y-auto">
            {vacio !== undefined ? <Opcion valor={VACIO} etiqueta={vacio} tenue /> : null}
            {opciones.map((o) => <Opcion key={o.valor} valor={o.valor} etiqueta={o.etiqueta} />)}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}

function Opcion({ valor, etiqueta, tenue }: { valor: string; etiqueta: string; tenue?: boolean }) {
  return (
    <S.Item
      value={valor}
      className={cn(
        "relative flex min-h-11 cursor-default select-none items-center gap-2 rounded-[var(--r-md)] py-2 pr-9 pl-3 text-sm outline-none focus-visible:outline-none",
        "data-[highlighted]:bg-muted data-[state=checked]:font-semibold",
        tenue && "text-[var(--ink-muted)]",
      )}
    >
      <S.ItemText>{etiqueta}</S.ItemText>
      <S.ItemIndicator className="absolute right-3 inline-flex text-[var(--accent)]"><Gesto nombre="palomita" tamano={16} /></S.ItemIndicator>
    </S.Item>
  );
}
