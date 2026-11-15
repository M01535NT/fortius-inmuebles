"use client";
import * as React from "react";
import { toast } from "sonner";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";

/*
  LV-10d · Avisos de la Bandeja con Sonner (DEC-52): «Guardado en la Bandeja», «Tipo guardado» y
  parecidos salen en el apilado del panel (abajo al centro) y se retiran solos. Sin el apilado
  montado (pruebas o pantallas sueltas) el mismo texto se muestra en su lugar. Los avisos con
  «Deshacer» siguen en `UndoNotice`; los errores, junto a lo que falló.
*/
export function useAviso(ms = 4000) {
  const ready = useToasterReady();
  const [texto, setTexto] = React.useState<string | null>(null);
  const avisar = React.useCallback((mensaje: string) => {
    if (!ready) { setTexto(mensaje); return; }
    setTexto(null);
    toast.custom(() => <div role="status" className="flex max-w-[calc(100vw-2rem)] items-center rounded-[14px] bg-[#061f3f] px-4 py-3 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)]">{mensaje}</div>,
      { toasterId: PANEL_TOASTER, duration: ms });
  }, [ready, ms]);
  const limpiar = React.useCallback(() => setTexto(null), []);
  return { texto, avisar, limpiar };
}
