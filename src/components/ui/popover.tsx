"use client";
import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Ventanita flotante del panel (shadcn/ui «Popover» sobre Radix, DEC-52): para lo que mezcla enlaces e
  interruptores, como la cuenta. Tab recorre lo de adentro; Escape, tocar fuera o salir con el foco la
  cierran, y el foco vuelve al botón. Crece desde el botón que la abre.
*/
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export function PopoverContent({ className, sideOffset = 8, align = "start", ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePanelContainer();
  return <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content sideOffset={sideOffset} align={align} collisionPadding={12} className={cn(
      "z-[65] origin-[var(--radix-popover-content-transform-origin)] outline-none motion-safe:data-[state=open]:animate-[menuIn_.16s_var(--ease-out)]",
      className,
    )} {...props} />
  </PopoverPrimitive.Portal>;
}
