"use client";
import { Tabs as T } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/panel/utils";

/** Pestañas: la activa lleva línea de acento, no relleno. Las flechas mueven entre pestañas (Radix). */
export const Tabs = T.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof T.List>) {
  return <T.List className={cn("flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid border-transparent! px-3 text-sm font-medium text-[var(--ink-muted)] transition-[color,background-color,border-color] duration-150",
        "hover:text-[var(--ink)] data-[state=active]:border-[var(--accent)]! data-[state=active]:font-semibold data-[state=active]:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("pt-4 outline-none", className)} {...props} />;
}
