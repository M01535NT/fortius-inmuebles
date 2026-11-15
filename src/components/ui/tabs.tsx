"use client";
import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/*
  Pestañas del panel (shadcn/ui «Tabs» sobre Radix, DEC-52): flechas para moverse, Inicio y Fin,
  y la pestaña elegida es la única que entra con Tab. El `Tabs` del kit las usa por dentro con su
  aspecto de siempre (subrayado o lista vertical); las pantallas siguen usando el del kit.
*/
export const TabsRoot = TabsPrimitive.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn(className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(className)} {...props} />;
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />;
}
