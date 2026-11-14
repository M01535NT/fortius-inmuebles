"use client";
import * as React from "react";
import { Button, Kbd } from "@/components/admin/kit";
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
  const dialog = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const { value: enabled, save, error } = useSingleKeyShortcuts();
  React.useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) { if (typeof node.showModal === "function") node.showModal(); else node.setAttribute("open", ""); }
    if (!open && node.open) { if (typeof node.close === "function") node.close(); else node.removeAttribute("open"); }
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={titleId} className="admin-confirm" onClose={onClose} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="flex flex-col gap-4">
      <h2 id={titleId} className="m-0 text-lg font-semibold">Atajos de teclado</h2>
      <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-sm">
        {SHORTCUTS.map(item => <React.Fragment key={item.keys}>
          <dt className={!enabled && item.single ? "opacity-50" : undefined}><Kbd>{item.keys}</Kbd></dt>
          <dd className="m-0">{item.what}{!enabled && item.single ? " (apagado)" : ""}</dd>
        </React.Fragment>)}
      </dl>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={enabled} onChange={event => void save(event.target.checked)} />
        Usar los atajos de una tecla (/ y ?). Nunca actúan mientras escribes en un campo.
      </label>
      {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Listo</Button></div>
    </div>
  </dialog>;
}
