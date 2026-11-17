"use client";
import { Command as C } from "cmdk";
import type { ComponentProps } from "react";

import { Icono } from "@/components/panel/icons";
import { cn } from "@/lib/panel/utils";

/**
 * Lista de comandos con búsqueda (cmdk), base de «Buscar o crear» (Ctrl K).
 * Sin animación al abrir: se usa decenas de veces al día.
 */
export function Command({ className, ...props }: ComponentProps<typeof C>) {
  return <C className={cn("flex size-full flex-col overflow-hidden bg-popover text-popover-foreground", className)} {...props} />;
}

export function CommandInput({ className, ...props }: ComponentProps<typeof C.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4">
      <Icono nombre="buscar" tamano={18} aria-hidden />
      <C.Input className={cn("h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground", className)} {...props} />
    </div>
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof C.List>) {
  return <C.List className={cn("max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain p-1", className)} {...props} />;
}
export function CommandEmpty(props: ComponentProps<typeof C.Empty>) {
  return <C.Empty className="px-4 py-8 text-center text-sm text-muted-foreground" {...props} />;
}
export function CommandGroup({ className, ...props }: ComponentProps<typeof C.Group>) {
  return <C.Group className={cn("[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground", className)} {...props} />;
}
export function CommandItem({ className, ...props }: ComponentProps<typeof C.Item>) {
  return <C.Item className={cn("flex min-h-11 cursor-default select-none items-center gap-3 rounded-[var(--r-md)] px-3 text-sm outline-none data-[selected=true]:bg-muted data-[disabled=true]:opacity-50", className)} {...props} />;
}
export function CommandSeparator({ className, ...props }: ComponentProps<typeof C.Separator>) {
  return <C.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
