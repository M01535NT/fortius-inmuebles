"use client";
import * as React from "react";
import { toast } from "sonner";
import { ChevronDown } from "@/components/admin/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/disclosure";
import { DateField } from "@/components/ui/date-field";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/*
  Piezas de Inmuebles sobre la base de DEC-52 (sin tocar `ui/`):
  · `Disclosure`: lo que antes era <details>, sobre Radix Collapsible. Con `keepMounted` el contenido
    sigue en el DOM aunque esté cerrado (oculto), para que sus campos viajen en el <form> y la copia
    temporal los lea; sin él, se monta al abrir.
  · `usePanelNotice`: avisos breves con Sonner (abajo al centro). Sin el apilado montado (pruebas o
    pantallas sueltas) el aviso sale en su lugar, con el mismo texto y `role="status"`.
*/
export function Disclosure({ title, children, className, triggerClassName, contentClassName, keepMounted, defaultOpen, open, onOpenChange, "aria-label": ariaLabel, icon }: {
  title: React.ReactNode; children: React.ReactNode; className?: string; triggerClassName?: string; contentClassName?: string;
  keepMounted?: boolean; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; "aria-label"?: string; icon?: React.ReactNode;
}) {
  return <Collapsible className={cn("group/disclosure", className)} defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
    <CollapsibleTrigger aria-label={ariaLabel} className={cn("flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-left font-semibold outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-color)]", triggerClassName)}>
      {title}{icon ?? <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/disclosure:rotate-180 motion-reduce:transition-none" />}
    </CollapsibleTrigger>
    <CollapsibleContent forceMount={keepMounted || undefined} className={cn("data-[state=closed]:hidden", contentClassName)}>{children}</CollapsibleContent>
  </Collapsible>;
}

/**
  Fecha dentro de un formulario largo (inmueble, origen): `DateField` controlado que manda `name` como
  el nativo. «Recuperar copia» llena los campos por el DOM (valor y evento `input` en el campo oculto):
  aquí se escucha ese evento para que el calendario tome la fecha recuperada.
*/
export function FormDateField({ id, name, defaultValue, min, onChange }: { id: string; name: string; defaultValue?: string; min?: string; onChange?: (iso: string) => void }) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  return <div className="contents" onInput={event => { const el = event.target; if (el instanceof HTMLInputElement && el.type === "hidden" && el.name === name) setValue(el.value); }}>
    <DateField id={id} name={name} value={value} min={min} onChange={iso => { setValue(iso); onChange?.(iso); }} />
  </div>;
}

export function usePanelNotice(ms = 5000) {
  const ready = useToasterReady();
  const [text, setText] = React.useState("");
  const show = React.useCallback((message: string) => {
    if (!ready) { setText(message); return; }
    setText("");
    toast.custom(() => <div role="status" className="flex max-w-[calc(100vw-2rem)] items-center rounded-[14px] bg-[#061f3f] px-4 py-3 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)]">{message}</div>, { toasterId: PANEL_TOASTER, duration: ms });
  }, [ready, ms]);
  const inline = text ? <p role="status" className="text-sm text-muted-foreground">{text}</p> : null;
  return { show, inline };
}
