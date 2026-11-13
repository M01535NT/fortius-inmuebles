import { afterEach, beforeAll, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { confirmAction } from "@/components/admin/workspace/confirm";

/*
  BUG-C41: el <dialog> de confirmAction no detiene la tecla Escape, que sube hasta `document`. Los
  oyentes de la página la reciben también: Escape para cancelar «Faltan N datos… ¿Descargarlo?»
  cierra además toda la ventana de captura (formato-capture.tsx), y en «Datos de la operación»
  vuelve a pedir la confirmación. Escape dentro de la confirmación solo debe cancelarla.
*/
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(cleanup);

it("Escape dentro de una confirmación no llega a los oyentes de la página", async () => {
  let llegó = false;
  const oyente = (event: KeyboardEvent) => { if (event.key === "Escape") llegó = true; };
  document.addEventListener("keydown", oyente);
  try {
    void confirmAction("¿Descargarlo?");
    await Promise.resolve(); await Promise.resolve();
    const dialog = document.querySelector("dialog.admin-confirm") as HTMLDialogElement;
    const cancelar = [...dialog.querySelectorAll("button")].find(b => b.textContent === "Cancelar")!;
    cancelar.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(llegó).toBe(false);
    dialog.close();
  } finally { document.removeEventListener("keydown", oyente); }
});
