"use client";
import { DropdownMenu as M } from "radix-ui";
import type { ComponentProps } from "react";

import { Gesto } from "@/components/panel/icons";
import { contenedorPanel } from "./contenedor";
import { cn } from "@/lib/panel/utils";

/** Menú de acciones. Filas de 44 px; el resaltado es gris (`bg-muted`), nunca el color de marca. */
export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;
export const DropdownMenuRadioGroup = M.RadioGroup;

const fila = "relative flex min-h-11 cursor-default select-none items-center gap-2 rounded-[var(--r-md)] px-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function DropdownMenuContent({ className, sideOffset = 6, align = "end", ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal container={contenedorPanel()}>
      <M.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-48 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-[var(--r-lg)] border border-border bg-popover p-1 text-popover-foreground shadow-[var(--sombra-flota)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownMenuItem({ className, peligro, ...props }: ComponentProps<typeof M.Item> & { peligro?: boolean }) {
  return <M.Item className={cn(fila, peligro && "text-destructive", className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem className={cn(fila, "pr-9", className)} {...props}>
      {children}
      <M.ItemIndicator className="absolute right-3"><Gesto nombre="palomita" tamano={16} /></M.ItemIndicator>
    </M.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
