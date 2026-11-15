"use client";
import * as React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/dialog";
import { buttonClass } from "@/components/admin/kit";
import { registerConfirmHost, type ConfirmRequest } from "./confirm";

/*
  Confirmaciones del panel sobre Radix AlertDialog (DEC-52). `confirmAction` sigue siendo la única
  forma de pedirlas; este componente solo las dibuja, una a la vez y en orden. Radix pone el foco en
  «Cancelar», cierra con Escape (equivale a cancelar) y devuelve el foco al terminar.
*/
export function ConfirmHost() {
  const [request, setRequest] = React.useState<ConfirmRequest | null>(null);
  const answered = React.useRef(false);
  React.useEffect(() => {
    registerConfirmHost(next => { answered.current = false; setRequest(next); });
    return () => registerConfirmHost(null);
  }, []);
  const answer = (accepted: boolean) => {
    if (!request || answered.current) return;
    answered.current = true;
    request.resolve(accepted);
    setRequest(null);
  };
  const { title = "Confirmar acción", confirmLabel = "Confirmar", danger } = request?.options ?? {};
  return <AlertDialog open={!!request} onOpenChange={open => { if (!open) answer(false); }}>
    {request && <AlertDialogContent data-confirm="">
      <AlertDialogTitle className="m-0 text-lg font-semibold leading-tight">{title}</AlertDialogTitle>
      <AlertDialogDescription className="m-0 text-[0.9375rem] leading-relaxed text-muted-foreground">{request.message}</AlertDialogDescription>
      <div className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <AlertDialogCancel className={buttonClass({ variant: "secondary" })} onClick={() => answer(false)}>Cancelar</AlertDialogCancel>
        <AlertDialogAction className={buttonClass({ variant: danger ? "dangerSolid" : "primary" })} onClick={() => answer(true)}>{confirmLabel}</AlertDialogAction>
      </div>
    </AlertDialogContent>}
  </AlertDialog>;
}
