"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";

/*
  Deshacer en lugar de confirmar (RP-16, UX-04): tras una acción que el servidor puede revertir
  (completar una tarea, por ejemplo) aparece el aviso con «Deshacer». Lo anuncia el lector de
  pantalla, se alcanza con teclado y dura al menos 8 segundos; mientras tenga el foco o el puntero
  encima no se va. El aviso solo aparece después de que el servidor confirmó la acción.
*/
export type Undoable = { text: string; undo: () => Promise<unknown> };

export function useUndo(ms = 8000) {
  const [current, setCurrent] = React.useState<Undoable | null>(null);
  return { current, offer: setCurrent, clear: () => setCurrent(null), ms };
}

export function UndoNotice({ current, clear, ms, onError }: { current: Undoable | null; clear: () => void; ms: number; onError: (message: string) => void }) {
  const [busy, setBusy] = React.useState(false);
  const [hold, setHold] = React.useState(false);
  React.useEffect(() => {
    if (!current || hold || busy) return;
    const timer = window.setTimeout(clear, ms);
    return () => window.clearTimeout(timer);
  }, [current, hold, busy, clear, ms]);
  if (!current) return null;
  async function undo() {
    setBusy(true);
    try { await current!.undo(); clear(); }
    catch (error) { clear(); onError(`No se pudo deshacer: ${error instanceof Error ? error.message : "intenta de nuevo"}`); }
    finally { setBusy(false); }
  }
  return <div role="status" className="flex flex-wrap items-center gap-2 px-1 text-sm" onFocus={() => setHold(true)} onBlur={() => setHold(false)} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
    <span>{current.text}</span>
    <Button variant="ghost" disabled={busy} onClick={() => void undo()}>{busy ? "Deshaciendo…" : "Deshacer"}</Button>
  </div>;
}
