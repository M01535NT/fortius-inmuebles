"use client";
import { PAPELERA } from "@/components/admin/papelera/textos";

// Native dialog supplies focus containment, Escape and an inert background.
// Text is assigned with textContent, never interpreted as HTML.
let queue: Promise<unknown> = Promise.resolve();
/**
  Confirmación de borrado aprobada (titular, 13/11/2026): título «Eliminar <cosa>», botón «Eliminar»
  en rojo y una frase que dice si se puede restaurar desde Eliminados. `restaurable` es el género
  del objeto («o» o «a») cuando la base lo permite, o `false` cuando no.
*/
export function confirmDelete(cosa: string, mensaje: string, restaurable: "o" | "a" | false) {
  const cierre = restaurable ? PAPELERA.sePuedeRestaurar[restaurable] : PAPELERA.noSePuedeRestaurar;
  return confirmAction(`${mensaje} ${cierre}`, { title: `Eliminar ${cosa}`, confirmLabel: "Eliminar", danger: true });
}
/** Eliminar una operación: ventana propia; vuelve desde Eliminados con todo lo suyo. */
export function confirmDeleteOperation(folio: string, who?: string) {
  return confirmDelete("operación", `La operación ${folio}${who && who !== folio ? ` de ${who}` : ""} se mueve a Eliminados con sus documentos, PDF y tareas.`, "a");
}
export type ConfirmOptions = { title?: string; confirmLabel?: string; danger?: boolean };
export function confirmAction(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  const result = queue.then(() => new Promise<boolean>((resolve) => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement("dialog");
    dialog.className = "admin-confirm";
    dialog.setAttribute("aria-labelledby", "admin-confirm-title");
    dialog.setAttribute("aria-describedby", "admin-confirm-message");
    const heading = document.createElement("h2");
    heading.id = "admin-confirm-title";
    heading.textContent = options.title ?? "Confirmar acción";
    const text = document.createElement("p");
    text.id = "admin-confirm-message";
    text.textContent = message;
    const controls = document.createElement("div");
    const cancel = document.createElement("button"), accept = document.createElement("button");
    cancel.type = accept.type = "button";
    cancel.textContent = "Cancelar";
    accept.textContent = options.confirmLabel ?? "Confirmar";
    cancel.className = "admin-button admin-button-secondary";
    accept.className = options.danger ? "admin-button admin-button-primary admin-button-danger" : "admin-button admin-button-primary";
    controls.append(cancel, accept);
    dialog.append(heading, text, controls);
    let accepted = false;
    cancel.onclick = () => dialog.close();
    accept.onclick = () => { accepted = true; dialog.close(); };
    dialog.onclose = () => { dialog.remove(); previous?.focus(); resolve(accepted); };
    (document.querySelector(".admin-workspace") ?? document.body).append(dialog);
    dialog.showModal();
    cancel.focus();
  }));
  queue = result.catch(() => false);
  return result;
}
