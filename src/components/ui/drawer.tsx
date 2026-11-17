"use client";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Panel desde abajo para el celular (shadcn/ui «Drawer» sobre Vaul, DEC-52): se arrastra para
  cerrarlo, con la manija arriba. En computadora se usa el `Sheet` del kit (a la derecha). Vaul
  respeta «reducir movimiento» del sistema; el velo y los colores son los del panel.
*/
export function Drawer({ shouldScaleBackground = false, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />;
}
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

export function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const container = usePanelContainer();
  return <DrawerPrimitive.Portal container={container}>
    <DrawerPrimitive.Overlay className="fixed inset-0 z-[60] bg-[var(--scrim)]" />
    <DrawerPrimitive.Content data-slot="drawer-content" className={cn(
      "fixed inset-x-0 bottom-0 z-[61] mt-24 flex max-h-[88dvh] flex-col rounded-t-[var(--radius-panel)] border-t border-[var(--card-edge)] bg-card text-foreground shadow-[var(--shadow-raised)] outline-none",
      "pb-[env(safe-area-inset-bottom)]",
      className,
    )} {...props}>
      <div aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-[var(--edge-soft)]" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>;
}
export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("flex flex-col gap-1.5 px-5 pb-3 pt-4", className)} {...props} />;
}
export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2.5 border-t border-border px-5 py-4", className)} {...props} />;
}
export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title className={cn("m-0 text-lg font-semibold leading-tight", className)} {...props} />;
}
export function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description className={cn("m-0 text-sm text-muted-foreground", className)} {...props} />;
}
