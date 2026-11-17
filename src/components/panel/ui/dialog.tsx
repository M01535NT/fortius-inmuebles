"use client";
import { Dialog as D } from "radix-ui";
import type { ComponentProps } from "react";

import { Gesto } from "@/components/panel/icons";
import { contenedorPanel } from "./contenedor";
import { cn } from "@/lib/panel/utils";

/** Diálogo de shadcn/ui con el sistema Fortius: línea y sombra solo porque flota, esquinas de 16 px. */
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, cerrarVisible = true, ...props }: ComponentProps<typeof D.Content> & { cerrarVisible?: boolean }) {
  return (
    <D.Portal container={contenedorPanel()}>
      <D.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[var(--r-xl)] border border-border bg-popover p-6 text-popover-foreground shadow-[var(--sombra-flota)] duration-200",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none",
          className,
        )}
        {...props}
      >
        {children}
        {cerrarVisible ? (
          <D.Close className="absolute right-3 top-3 grid size-11 place-items-center rounded-[var(--r-md)] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label="Cerrar">
            <Gesto nombre="cerrar" tamano={18} />
          </D.Close>
        ) : null}
      </D.Content>
    </D.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof D.Title>) {
  return <D.Title className={cn("pr-10 text-lg font-semibold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: ComponentProps<typeof D.Description>) {
  return <D.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
