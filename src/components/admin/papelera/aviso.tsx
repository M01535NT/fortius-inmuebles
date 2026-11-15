"use client";
import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "@/components/admin/icons";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";

/*
  Aviso de Eliminados (LV-10, bloque g): «de vuelta en su lugar» sale en el apilado de Sonner, abajo
  al centro, como el resto de los avisos del panel (DEC-52). Sin Sonner montado (pantalla suelta o
  pruebas) se muestra en su lugar, con el mismo texto.
*/
export function useAviso() {
  const ready = useToasterReady();
  const [inline, setInline] = React.useState("");
  const show = React.useCallback((text: string) => {
    if (!ready) { setInline(text); return; }
    setInline("");
    toast.custom(() => <AvisoBody text={text} />, { toasterId: PANEL_TOASTER, duration: 5000 });
  }, [ready]);
  const clear = React.useCallback(() => setInline(""), []);
  return { inline, show, clear };
}

function AvisoBody({ text }: { text: string }) {
  return <div className="flex min-h-12 w-[min(28rem,calc(100vw-2rem))] items-center gap-3 rounded-[12px] border border-[var(--card-edge)] bg-card px-4 py-3 text-[0.9375rem] text-foreground shadow-[var(--shadow-raised)]">
    <CheckCircle2 size={20} aria-hidden="true" className="shrink-0 text-[var(--success)]" />
    <span className="min-w-0">{text}</span>
  </div>;
}
