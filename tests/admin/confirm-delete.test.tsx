import { afterEach, beforeAll, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { confirmDelete, confirmDeleteOperation } from "@/components/admin/workspace/confirm";

/* Confirmación de borrado aprobada (13/11/2026): «Eliminar <cosa>», botón «Eliminar» y si se puede restaurar. */
beforeAll(() => {
  // jsdom no trae <dialog> modal: lo simula lo justo para la prueba.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(cleanup);
const dialog = () => document.querySelector("dialog.admin-confirm") as HTMLDialogElement;

it("dice qué se elimina, que se puede restaurar desde Eliminados y confirma con «Eliminar» en rojo", async () => {
  const answer = confirmDeleteOperation("EXP-0001", "Familia de ejemplo");
  await Promise.resolve(); await Promise.resolve();
  expect(dialog().querySelector("h2")?.textContent).toBe("Eliminar operación");
  expect(dialog().querySelector("p")?.textContent).toBe("La operación EXP-0001 de Familia de ejemplo se mueve a Eliminados con sus documentos, PDF y tareas. Podrás restaurarla desde Eliminados.");
  const accept = [...dialog().querySelectorAll("button")].find(b => b.textContent === "Eliminar")!;
  expect(accept.className).toContain("admin-button-danger");
  accept.click();
  expect(await answer).toBe(true);
});

it("cuando la base no permite restaurarlo, lo dice; cancelar no elimina", async () => {
  const answer = confirmDelete("cliente", "Se elimina a Persona de ejemplo.", false);
  await Promise.resolve(); await Promise.resolve();
  expect(dialog().querySelector("p")?.textContent).toBe("Se elimina a Persona de ejemplo. No se puede restaurar.");
  [...dialog().querySelectorAll("button")].find(b => b.textContent === "Cancelar")!.click();
  expect(await answer).toBe(false);
});
