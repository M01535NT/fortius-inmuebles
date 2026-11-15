"use client";
import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Selector del panel (shadcn/ui «Select» sobre Radix, DEC-52): para elegir una opción de una lista
  corta con su aspecto de marca (estado, papel, responsable). Flechas, letras para saltar, Enter y
  Escape. Para formularios largos que se mandan con <form>, el <select> nativo del kit sigue sirviendo
  (en celular abre el selector del sistema); este se usa donde la opción lleva ícono, cara o color.
*/
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, size = "md", ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" }) {
  return <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(
    "inline-flex w-full items-center justify-between gap-2 rounded-[var(--field-radius)] border border-[var(--control-edge)] bg-[var(--field-surface)] px-3 text-left text-[0.9375rem] text-foreground outline-none",
    "data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-color)]",
    "[&>span]:min-w-0 [&>span]:truncate [&>span]:flex [&>span]:items-center [&>span]:gap-2",
    size === "sm" ? "min-h-9 text-sm" : "min-h-11",
    className,
  )} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>;
}

export function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const container = usePanelContainer();
  return <SelectPrimitive.Portal container={container}>
    <SelectPrimitive.Content data-slot="select-content" position={position} sideOffset={6} collisionPadding={12} className={cn(
      "relative z-[66] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[10rem] overflow-hidden rounded-[12px] border border-[var(--card-edge)] bg-card text-foreground shadow-[var(--shadow-raised)]",
      "origin-[var(--radix-select-content-transform-origin)] motion-safe:data-[state=open]:animate-[menuIn_.16s_var(--ease-out)]",
      position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
      className,
    )} {...props}>
      <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-muted-foreground"><ChevronUp size={16} aria-hidden="true" /></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-muted-foreground"><ChevronDown size={16} aria-hidden="true" /></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>;
}

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item data-slot="select-item" className={cn(
    "relative flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] py-1.5 pl-2.5 pr-9 text-[0.9375rem] font-medium outline-none",
    "data-[highlighted]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:text-muted-foreground",
    className,
  )} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2.5 flex items-center"><SelectPrimitive.ItemIndicator><Check size={18} aria-hidden="true" className="!text-foreground" /></SelectPrimitive.ItemIndicator></span>
  </SelectPrimitive.Item>;
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("my-1 h-px bg-[var(--card-edge)]", className)} {...props} />;
}
