"use client";
import type { ComponentProps } from "react";
import { Drawer as V } from "vaul";

import { Gesto } from "@/components/panel/icons";
import { contenedorPanel } from "./contenedor";
import { cn } from "@/lib/panel/utils";

/**
 * Hoja que sube desde abajo en el teléfono (vaul): se arrastra para cerrar, con impulso.
 * En escritorio conviene `Dialog`; esta es para pantallas chicas.
 */
export const Drawer = V.Root;
export const DrawerTrigger = V.Trigger;
export const DrawerClose = V.Close;

export function DrawerContent({ className, children, ...props }: ComponentProps<typeof V.Content>) {
  return (
    <V.Portal container={contenedorPanel()}>
      <V.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)]" />
      <V.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-[var(--r-xl)] border border-b-0 border-border bg-popover text-popover-foreground outline-none",
          "pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--border-strong)]/50" />
        <V.Close className="absolute right-2 top-2 grid size-11 place-items-center rounded-[var(--r-md)] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label="Cerrar">
          <Gesto nombre="cerrar" tamano={18} />
        </V.Close>
        {children}
      </V.Content>
    </V.Portal>
  );
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof V.Title>) {
  return <V.Title className={cn("px-4 pt-3 text-lg font-semibold", className)} {...props} />;
}
export function DrawerDescription({ className, ...props }: ComponentProps<typeof V.Description>) {
  return <V.Description className={cn("px-4 text-sm text-muted-foreground", className)} {...props} />;
}
