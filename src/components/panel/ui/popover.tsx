"use client";
import { Popover as P } from "radix-ui";
import type { ComponentProps } from "react";

import { contenedorPanel } from "./contenedor";
import { cn } from "@/lib/panel/utils";

/** Ventana flotante anclada a su botón; crece desde él. */
export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal container={contenedorPanel()}>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-[var(--r-lg)] border border-border bg-popover p-4 text-popover-foreground shadow-[var(--sombra-flota)] outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}
