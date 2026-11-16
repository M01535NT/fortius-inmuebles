"use client";
import { Tooltip as T } from "radix-ui";
import type { ComponentProps } from "react";

import { contenedorPanel } from "./contenedor";
import { cn } from "@/lib/panel/utils";

/** Globo de ayuda. Tras el primero, los vecinos abren al instante (skipDelayDuration). */
export function TooltipProvider({ delayDuration = 400, skipDelayDuration = 300, ...props }: ComponentProps<typeof T.Provider>) {
  return <T.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />;
}
export const Tooltip = T.Root;
export const TooltipTrigger = T.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof T.Content>) {
  return (
    <T.Portal container={contenedorPanel()}>
      <T.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 origin-(--radix-tooltip-content-transform-origin) rounded-[var(--r-md)] bg-foreground px-2.5 py-1.5 text-xs font-medium text-background",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </T.Portal>
  );
}
