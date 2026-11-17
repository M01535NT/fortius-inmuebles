"use client";
import * as React from "react";
import { Button, Kbd } from "@/components/admin/kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/controls";
import { SHORTCUTS } from "@/lib/admin/commands";
import { usePanelPreference } from "@/components/admin/workspace/preferences-store";

/*
  Hoja de atajos (RP-11, UX-03): se abre con «?» o desde la barra de comandos. Los atajos de una
  tecla («/» y «?») se pueden apagar aquí; la preferencia sigue al usuario. Ctrl K siempre funciona.
*/
export function useSingleKeyShortcuts() {
  return usePanelPreference("atajos", true);
}

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Ventana de Radix (DEC-52): Escape y el velo la cierran y el foco vuelve a donde estaba.
  const { value: enabled, save, error } = useSingleKeyShortcuts();
  return <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <DialogContent aria-describedby={undefined} closeLabel="Cerrar atajos">
      <DialogTitle>Atajos de teclado</DialogTitle>
      <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-sm">
        {SHORTCUTS.map(item => <React.Fragment key={item.keys}>
          <dt className={!enabled && item.single ? "opacity-50" : undefined}><Kbd>{item.keys}</Kbd></dt>
          <dd className="m-0">{item.what}{!enabled && item.single ? " (apagado)" : ""}</dd>
        </React.Fragment>)}
      </dl>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <Switch checked={enabled} onCheckedChange={checked => void save(checked)} aria-label="Usar los atajos de una tecla" />
        Usar los atajos de una tecla (/ y ?). Nunca actúan mientras escribes en un campo.
      </label>
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Listo</Button></div>
    </DialogContent>
  </Dialog>;
}
