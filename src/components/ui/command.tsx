"use client";
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/*
  Lista con buscador (shadcn/ui «Command» sobre cmdk, DEC-52): para Ctrl K y para cualquier selector
  que se filtra escribiendo (elegir persona, inmueble o asunto dentro de un formulario, junto con
  `Popover`). Flechas, Enter y Escape; el texto filtra sin acentos si se le pasa `filter`.
*/
export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive data-slot="command" className={cn("flex size-full flex-col overflow-hidden rounded-[inherit] bg-card text-foreground", className)} {...props} />;
}
export function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return <div data-slot="command-input-wrapper" className="flex min-h-12 items-center gap-2.5 border-b border-[var(--card-edge)] px-3">
    <Search size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
    <CommandPrimitive.Input data-slot="command-input" className={cn("flex h-11 w-full bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none", className)} {...props} />
  </div>;
}
export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("max-h-[min(22rem,60dvh)] scroll-py-1.5 overflow-y-auto overflow-x-hidden p-1.5", className)} {...props} />;
}
export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className={cn("py-6 text-center text-sm text-muted-foreground", className)} {...props} />;
}
export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group data-slot="command-group" className={cn("overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground", className)} {...props} />;
}
export function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("-mx-1.5 my-1 h-px bg-[var(--card-edge)]", className)} {...props} />;
}
export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item data-slot="command-item" className={cn(
    "relative flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-[0.9375rem] font-medium outline-none",
    "data-[selected=true]:bg-secondary data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
    className,
  )} {...props} />;
}
export function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="command-shortcut" className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />;
}
