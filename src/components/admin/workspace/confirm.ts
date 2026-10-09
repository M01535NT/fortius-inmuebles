"use client";

// Native dialog supplies focus containment, Escape and an inert background.
// Text is assigned with textContent, never interpreted as HTML.
let queue: Promise<unknown> = Promise.resolve();
export function confirmAction(message: string): Promise<boolean> {
  const result = queue.then(() => new Promise<boolean>((resolve) => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement("dialog");
    dialog.className = "admin-confirm";
    dialog.setAttribute("aria-labelledby", "admin-confirm-title");
    dialog.setAttribute("aria-describedby", "admin-confirm-message");
    const heading = document.createElement("h2");
    heading.id = "admin-confirm-title";
    heading.textContent = "Confirmar acción";
    const text = document.createElement("p");
    text.id = "admin-confirm-message";
    text.textContent = message;
    const controls = document.createElement("div");
    const cancel = document.createElement("button"), accept = document.createElement("button");
    cancel.type = accept.type = "button";
    cancel.textContent = "Cancelar";
    accept.textContent = "Confirmar";
    cancel.className = "admin-button admin-button-secondary";
    accept.className = "admin-button admin-button-primary";
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
