"use client";
import * as React from "react";
import { toast } from "sonner";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/*
  Avisos breves de Agenda y Tareas («Guardado», «No se pudo guardar…») en el apilado de Sonner
  (DEC-52), con la misma placa azul que el aviso de «Deshacer». Sin el apilado montado (pantallas
  sueltas o pruebas) el aviso se muestra en su lugar con el mismo texto. Los errores se anuncian
  como alerta y no se van solos; lo demás dura 5 segundos.
*/
type Flash = { text: string; tone: "ok" | "error"; at: number };

export function useNotify() {
  const ready = useToasterReady();
  const [inline, setInline] = React.useState<Flash | null>(null);
  const notify = React.useCallback((text: string, tone: Flash["tone"] = "ok") => {
    if (ready) {
      toast.custom(() => <FlashBody text={text} tone={tone} floating />, { toasterId: PANEL_TOASTER, duration: tone === "error" ? 10_000 : 5_000 });
      return;
    }
    setInline({ text, tone, at: Date.now() });
  }, [ready]);
  const clear = React.useCallback(() => setInline(null), []);
  React.useEffect(() => {
    if (!inline || inline.tone === "error") return;
    const timer = window.setTimeout(clear, 5_000);
    return () => window.clearTimeout(timer);
  }, [inline, clear]);
  const node = inline ? <FlashBody key={inline.at} text={inline.text} tone={inline.tone} /> : null;
  return { notify, node, clear };
}

function FlashBody({ text, tone, floating }: { text: string; tone: Flash["tone"]; floating?: boolean }) {
  return <div role={tone === "error" ? "alert" : "status"} className={cn(floating
    ? "flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-[14px] bg-[#061f3f] px-4 py-2.5 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)]"
    : cn("text-sm", tone === "error" ? "text-destructive" : "text-[var(--success)]"))}>{text}</div>;
}
