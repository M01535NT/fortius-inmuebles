"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/kit";
import { PANEL_TOASTER, useToasterReady } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/*
  Deshacer en lugar de confirmar (RP-16, UX-04): tras una acción que el servidor puede revertir
  (completar una tarea, por ejemplo) aparece el aviso con «Deshacer». Lo anuncia el lector de
  pantalla, se alcanza con teclado y dura al menos 8 segundos; mientras tenga el foco o el puntero
  encima no se va. El aviso solo aparece después de que el servidor confirmó la acción.
  Desde DEC-52 el aviso sale en el apilado de Sonner (abajo al centro); la cuenta de los 8 segundos
  y la pausa siguen aquí, y Sonner solo lo muestra y lo retira.
*/
export type Undoable = { text: string; undo: () => Promise<unknown> };

export function useUndo(ms = 8000) {
  const [current, setCurrent] = React.useState<Undoable | null>(null);
  return { current, offer: setCurrent, clear: () => setCurrent(null), ms };
}

type Props = { current: Undoable | null; clear: () => void; ms: number; onError: (message: string) => void; className?: string };

export function UndoNotice(props: Props) {
  const ready = useToasterReady();
  const latest = React.useRef(props);
  React.useEffect(() => { latest.current = props; });
  const { current } = props;
  React.useEffect(() => {
    if (!ready || !current) return;
    const id = toast.custom(() => <UndoBody {...latest.current} current={current} toast />, { toasterId: PANEL_TOASTER, duration: Infinity, dismissible: false });
    return () => { toast.dismiss(id); };
  }, [ready, current]);
  return ready ? null : <UndoBody {...props} />;
}

function UndoBody({ current, clear, ms, onError, className, toast: floating }: Props & { toast?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [hold, setHold] = React.useState(false);
  // C-72: un aviso nuevo empieza sin pausa (tras pulsar «Deshacer» con el ratón nunca llega pointerleave).
  const [shown, setShown] = React.useState(current);
  if (shown !== current) { setShown(current); setHold(false); }
  React.useEffect(() => {
    if (!current || hold || busy) return;
    const timer = window.setTimeout(clear, ms);
    return () => window.clearTimeout(timer);
  }, [current, hold, busy, clear, ms]);
  if (!current) return null;
  async function undo() {
    setBusy(true);
    try { await current!.undo(); setHold(false); clear(); }
    catch (error) { clear(); onError(`No se pudo deshacer: ${error instanceof Error ? error.message : "intenta de nuevo"}`); }
    finally { setBusy(false); }
  }
  return <div role="status" className={cn(floating
    ? "flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-[14px] bg-[#061f3f] py-1.5 pl-4 pr-1.5 text-sm text-[#f8f8ff] shadow-[var(--shadow-float)] [&_button]:!text-[#f8f8ff] [&_button:hover]:!bg-white/10"
    : "flex flex-wrap items-center gap-2 px-1 text-sm", !floating && className)}
    onFocus={() => setHold(true)} onBlur={() => setHold(false)} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
    <span>{current.text}</span>
    <Button variant="ghost" disabled={busy} onClick={() => void undo()}>{busy ? "Deshaciendo…" : "Deshacer"}</Button>
  </div>;
}
