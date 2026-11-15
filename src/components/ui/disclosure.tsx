"use client";
import * as React from "react";
import { Accordion as AccordionPrimitive, Collapsible as CollapsiblePrimitive, HoverCard as HoverCardPrimitive, ContextMenu as ContextPrimitive, ScrollArea as ScrollPrimitive } from "radix-ui";
import { ChevronDown } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Piezas para mostrar y esconder (shadcn/ui «Collapsible», «Accordion», «HoverCard», «ContextMenu»
  y «ScrollArea» sobre Radix, DEC-52). «Formularios cerrados hasta que se piden» (RP-104) usa
  `Collapsible`; las secciones de una ficha, `Accordion`. La animación de altura usa las variables de
  Radix y se apaga con «reducir movimiento».
*/
export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return <CollapsiblePrimitive.Content data-slot="collapsible-content" className={cn("overflow-hidden motion-safe:data-[state=open]:animate-[collapsibleDown_.2s_var(--ease-out)] motion-safe:data-[state=closed]:animate-[collapsibleUp_.15s_ease-in]", className)} {...props} />;
}

export const Accordion = AccordionPrimitive.Root;
export function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-[var(--card-edge)] last:border-b-0", className)} {...props} />;
}
export function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger data-slot="accordion-trigger" className={cn(
      "flex min-h-12 flex-1 items-center justify-between gap-3 py-2 text-left text-[0.9375rem] font-semibold outline-none [&[data-state=open]>svg]:rotate-180",
      className,
    )} {...props}>
      {children}
      <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>;
}
export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return <AccordionPrimitive.Content data-slot="accordion-content" className="overflow-hidden text-[0.9375rem] motion-safe:data-[state=open]:animate-[accordionDown_.2s_var(--ease-out)] motion-safe:data-[state=closed]:animate-[accordionUp_.15s_ease-in]" {...props}>
    <div className={cn("pb-4", className)}>{children}</div>
  </AccordionPrimitive.Content>;
}

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export function HoverCardContent({ className, align = "start", sideOffset = 8, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  const container = usePanelContainer();
  return <HoverCardPrimitive.Portal container={container}>
    <HoverCardPrimitive.Content data-slot="hover-card-content" align={align} sideOffset={sideOffset} collisionPadding={12} className={cn(
      "z-[65] w-72 rounded-[12px] border border-[var(--card-edge)] bg-card p-4 text-foreground shadow-[var(--shadow-raised)] outline-none",
      "origin-[var(--radix-hover-card-content-transform-origin)] motion-safe:data-[state=open]:animate-[menuIn_.16s_var(--ease-out)]",
      className,
    )} {...props} />
  </HoverCardPrimitive.Portal>;
}

/** Menú con clic derecho sobre una fila; siempre debe existir el mismo menú en un botón «⋯» visible. */
export const ContextMenu = ContextPrimitive.Root;
export const ContextMenuTrigger = ContextPrimitive.Trigger;
export function ContextMenuContent({ className, ...props }: React.ComponentProps<typeof ContextPrimitive.Content>) {
  const container = usePanelContainer();
  return <ContextPrimitive.Portal container={container}>
    <ContextPrimitive.Content data-slot="context-menu-content" collisionPadding={12} className={cn(
      "z-[65] min-w-[14rem] rounded-[12px] border border-[var(--card-edge)] bg-card p-1.5 text-foreground shadow-[var(--shadow-raised)] outline-none motion-safe:data-[state=open]:animate-[menuIn_.16s_var(--ease-out)]",
      className,
    )} {...props} />
  </ContextPrimitive.Portal>;
}
export function ContextMenuItem({ className, danger, ...props }: React.ComponentProps<typeof ContextPrimitive.Item> & { danger?: boolean }) {
  return <ContextPrimitive.Item className={cn(
    "relative flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-[0.9375rem] font-medium outline-none data-[highlighted]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:text-muted-foreground",
    danger && "text-[var(--alert)] [&>svg]:text-[var(--alert)]",
    className,
  )} {...props} />;
}
export function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextPrimitive.Separator>) {
  return <ContextPrimitive.Separator className={cn("my-1 h-px bg-[var(--card-edge)]", className)} {...props} />;
}

export function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollPrimitive.Root>) {
  return <ScrollPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollPrimitive.Viewport className="size-full rounded-[inherit] outline-none focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--focus-color)]">{children}</ScrollPrimitive.Viewport>
    <ScrollPrimitive.Scrollbar orientation="vertical" className="flex w-2.5 touch-none select-none p-0.5"><ScrollPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--edge-soft)]" /></ScrollPrimitive.Scrollbar>
    <ScrollPrimitive.Scrollbar orientation="horizontal" className="flex h-2.5 touch-none select-none flex-col p-0.5"><ScrollPrimitive.Thumb className="relative flex-1 rounded-full bg-[var(--edge-soft)]" /></ScrollPrimitive.Scrollbar>
    <ScrollPrimitive.Corner />
  </ScrollPrimitive.Root>;
}
