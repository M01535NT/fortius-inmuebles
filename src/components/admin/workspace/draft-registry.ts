"use client";
import * as React from "react";
import { confirmAction } from "@/components/admin/workspace/confirm";

/*
  C-74: las pestañas de una sección (RouteTabs) desmontan la que se deja. Un formulario con captura
  sin guardar se anota aquí, y cambiar de pestaña pregunta antes de descartarla. Los enlaces y el
  cierre de la ventana los sigue cuidando useLeaveGuard.
*/
const pending = new Set<symbol>();

/** Anota la captura sin guardar mientras `dirty` sea verdadero. */
export function useUnsavedDraft(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const key = Symbol("captura");
    pending.add(key);
    return () => { pending.delete(key); };
  }, [dirty]);
}

/** Verdadero si se puede seguir: no hay captura sin guardar o la persona aceptó descartarla. */
export async function confirmDiscardDrafts(message = "Tienes una captura sin guardar. ¿Descartarla y cambiar de pestaña?") {
  if (!pending.size) return true;
  return confirmAction(message, { title: "Cambios sin guardar", confirmLabel: "Descartar" });
}
