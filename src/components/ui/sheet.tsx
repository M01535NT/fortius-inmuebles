"use client";
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { usePanelContainer } from "./portal";

/*
  Panel lateral del panel (shadcn/ui «Sheet» sobre Radix Dialog, DEC-52): a la derecha en computadora
  y desde abajo en el celular. El aspecto vive en `kit.module.css` (.sheet, .scrim); las pantallas no
  lo usan directo, sino por el `Sheet` del kit, que conserva su nombre y sus opciones.
*/
export const SheetRoot = DialogPrimitive.Root;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
export const SheetClose = DialogPrimitive.Close;
export const SheetOverlay = DialogPrimitive.Overlay;
export const SheetPanel = DialogPrimitive.Content;
export function SheetPortal(props: Omit<React.ComponentProps<typeof DialogPrimitive.Portal>, "container">) {
  const container = usePanelContainer();
  return <DialogPrimitive.Portal container={container} {...props} />;
}
