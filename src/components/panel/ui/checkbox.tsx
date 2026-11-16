"use client";
import { Checkbox as C } from "radix-ui";
import type { ComponentProps } from "react";

import { Gesto } from "@/components/panel/icons";
import { cn } from "@/lib/panel/utils";

export function Checkbox({ className, ...props }: ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "peer relative grid size-5 shrink-0 place-items-center rounded-[var(--r-sm)] border border-[var(--border-strong)] bg-card",
        "before:absolute before:-inset-3 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <C.Indicator><Gesto nombre="palomita" tamano={14} /></C.Indicator>
    </C.Root>
  );
}
