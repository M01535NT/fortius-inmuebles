"use client";
import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

/**
 * Avisos breves (sonner) con los colores del panel. Entran y salen por el mismo lado y se descartan deslizando.
 * Toda acción que cambia datos avisa con «Deshacer» (RP-102): `toast("Guardado", { action: { label: "Deshacer", onClick } })`.
 */
export function Toaster(props: ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position="bottom-center"
      duration={5000}
      toastOptions={{
        classNames: {
          toast: "!rounded-[var(--r-lg)] !border !border-border !bg-popover !text-popover-foreground !shadow-[var(--sombra-flota)] !font-[inherit]",
          description: "!text-muted-foreground",
          actionButton: "!bg-transparent !text-primary !font-semibold",
        },
      }}
      {...props}
    />
  );
}
