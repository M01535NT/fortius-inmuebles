"use client";
import * as React from "react";
import { toast } from "sonner";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";

/*
  Aviso corto de Personas con Sonner (DEC-52): «Perfil guardado», «Archivo guardado en su perfil».
  Sale en el apilado del panel, lo anuncia el lector de pantalla y se va solo. Sin el apilado
  montado (pruebas o pantallas sueltas), el mismo texto queda en su lugar con `role="status"`.
*/
export function useAviso(ms = 5000) {
  const ready = useToasterReady();
  const [suelto, setSuelto] = React.useState<string | null>(null);
  const avisar = React.useCallback((texto: string) => {
    if (ready) toast.custom(() => <Burbuja texto={texto} />, { toasterId: PANEL_TOASTER, duration: ms });
    else setSuelto(texto);
  }, [ready, ms]);
  const limpiar = React.useCallback(() => setSuelto(null), []);
  return { avisar, limpiar, suelto };
}

function Burbuja({ texto }: { texto: string }) {
  return <div role="status" className="max-w-[calc(100vw-2rem)] rounded-[14px] bg-[#061f3f] px-4 py-2.5 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)]">{texto}</div>;
}
