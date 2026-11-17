"use client";
import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Etiqueta flotante del panel (shadcn/ui «Tooltip» sobre Radix, DEC-52): nombra un botón de solo
  ícono al pasar el ratón o al llegar con el teclado. No lleva información que no esté en otro lado:
  en celular no se ve. `TooltipProvider` se monta una vez en admin-shell; fuera del panel (pruebas)
  cada `Tooltip` trae el suyo.
*/
export function TooltipProvider({ delayDuration = 400, skipDelayDuration = 300, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />;
}
export function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipProvider><TooltipPrimitive.Root {...props} /></TooltipProvider>;
}
export const TooltipTrigger = TooltipPrimitive.Trigger;
export function TooltipContent({ className, sideOffset = 6, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const container = usePanelContainer();
  return <TooltipPrimitive.Portal container={container}>
    <TooltipPrimitive.Content data-slot="tooltip-content" sideOffset={sideOffset} collisionPadding={8} className={cn(
      "z-[80] max-w-[18rem] rounded-[8px] bg-[var(--navy-surface)] px-2.5 py-1.5 text-[0.8125rem] font-medium leading-snug text-[var(--on-navy)] shadow-[var(--shadow-float)]",
      "origin-[var(--radix-tooltip-content-transform-origin)] motion-safe:data-[state=delayed-open]:animate-[fadeIn_.12s_ease]",
      className,
    )} {...props}>{children}</TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>;
}
