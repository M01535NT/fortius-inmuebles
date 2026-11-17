"use client";
import * as React from "react";
import { AlertDialog as AlertPrimitive, Dialog as DialogPrimitive } from "radix-ui";
import { X } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { usePanelContainer } from "./portal";

/*
  Ventanas del panel sobre Radix (shadcn/ui, DEC-52): Dialog para ventanas y paneles laterales,
  AlertDialog para confirmar algo que no se deshace. Radix pone el foco, lo encierra, cierra con
  Escape y devuelve el foco a donde estaba. Los estilos son los del panel (tokens de .admin-root).
*/
export const Dialog = DialogPrimitive.Root;
export const DialogClose = DialogPrimitive.Close;

const overlay = "fixed inset-0 z-[60] bg-[var(--scrim)] motion-safe:data-[state=open]:animate-[fadeIn_.2s_ease] motion-safe:data-[state=closed]:animate-[fadeOut_.15s_ease-in]";

/** `instant`: sin animación, para lo que se abre muchas veces al día con el teclado (Ctrl K). */
export function DialogContent({ className, children, closeLabel = "Cerrar", hideClose, instant, forceMount, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string; hideClose?: boolean; instant?: boolean }) {
  const container = usePanelContainer();
  return <DialogPrimitive.Portal container={container} forceMount={forceMount}>
    <DialogPrimitive.Overlay className={instant ? "fixed inset-0 z-[60] bg-[var(--scrim)]" : overlay} forceMount={forceMount} />
    <DialogPrimitive.Content forceMount={forceMount} className={cn(
      "fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-[var(--radius-panel)] border border-[var(--card-edge)] bg-card p-6 text-foreground shadow-[var(--shadow-raised)] outline-none",
      !instant && "motion-safe:data-[state=open]:animate-[dialogIn_.18s_var(--ease-out)]",
      className,
    )} {...props}>
      {children}
      {!hideClose && <DialogPrimitive.Close className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={closeLabel}><X size={20} aria-hidden="true" /></DialogPrimitive.Close>}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("m-0 text-lg font-semibold leading-tight", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("m-0 text-sm text-muted-foreground", className)} {...props} />;
}

export const AlertDialog = AlertPrimitive.Root;
export function AlertDialogContent({ className, children, ...props }: React.ComponentProps<typeof AlertPrimitive.Content>) {
  const container = usePanelContainer();
  return <AlertPrimitive.Portal container={container}>
    <AlertPrimitive.Overlay className={cn(overlay, "z-[70]")} />
    <AlertPrimitive.Content className={cn(
      "fixed left-1/2 top-1/2 z-[71] flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--card-edge)] bg-card p-6 text-foreground shadow-[var(--shadow-raised)] outline-none",
      "motion-safe:data-[state=open]:animate-[dialogIn_.18s_var(--ease-out)]",
      className,
    )} {...props}>{children}</AlertPrimitive.Content>
  </AlertPrimitive.Portal>;
}
export const AlertDialogTitle = AlertPrimitive.Title;
export const AlertDialogDescription = AlertPrimitive.Description;
export const AlertDialogCancel = AlertPrimitive.Cancel;
export const AlertDialogAction = AlertPrimitive.Action;
