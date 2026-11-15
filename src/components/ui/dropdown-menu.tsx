"use client";
import * as React from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Menús del panel sobre Radix (shadcn/ui, DEC-52): flechas para moverse, Enter para elegir, Escape
  para cerrar y el foco vuelve al botón. Crecen desde el botón que los abre.
*/
export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

/** `portal={false}`: el menú se queda junto a su botón en el árbol (por ejemplo, dentro de la barra inferior). */
export function DropdownMenuContent({ className, sideOffset = 6, align = "end", portal = true, ...props }: React.ComponentProps<typeof MenuPrimitive.Content> & { portal?: boolean }) {
  const container = usePanelContainer();
  const content = <MenuPrimitive.Content sideOffset={sideOffset} align={align} collisionPadding={12} className={cn(
      "z-[65] min-w-[14rem] max-w-[calc(100vw-1.5rem)] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-[12px] border border-[var(--card-edge)] bg-card p-1.5 text-foreground shadow-[var(--shadow-raised)] outline-none",
      "motion-safe:data-[state=open]:animate-[menuIn_.16s_var(--ease-out)]",
      className,
    )} {...props} />;
  return portal ? <MenuPrimitive.Portal container={container}>{content}</MenuPrimitive.Portal> : content;
}
const item = "relative flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-[0.9375rem] font-medium outline-none data-[highlighted]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:text-muted-foreground";
export function DropdownMenuItem({ className, danger, ...props }: React.ComponentProps<typeof MenuPrimitive.Item> & { danger?: boolean }) {
  return <MenuPrimitive.Item className={cn(item, danger && "text-[var(--alert)] [&>svg]:text-[var(--alert)]", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("my-1 h-px bg-[var(--card-edge)]", className)} {...props} />;
}
