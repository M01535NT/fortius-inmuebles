import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { AppLauncher } from "@/components/admin/workspace/app-launcher";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
beforeEach(() => {
  // jsdom lacks native dialog methods; browser focus containment is checked with CUA.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  } });
});
afterEach(() => {
  cleanup();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>).showModal;
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>).close;
});

function open(role = "admin") {
  render(<AppLauncher role={role} pathname="/admin" onOpen={() => {}} />);
  const trigger = screen.getByRole("button", { name: "Abrir aplicaciones" });
  fireEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog", { name: "Aplicaciones del sistema" }) };
}

test("all twenty existing destinations are available to an administrator", () => {
  const { dialog } = open();
  expect(within(dialog).getAllByRole("link")).toHaveLength(20);
  expect(within(dialog).getByRole("link", { name: "CRM" }).getAttribute("href")).toBe("/admin/leads");
  expect(within(dialog).getByRole("link", { name: "Documentos" }).getAttribute("href")).toBe("/admin/documentos");
  expect(within(dialog).getByRole("link", { name: "Resumen" }).getAttribute("aria-current")).toBe("page");
});

test("staff cannot discover restricted shortcuts through the launcher or its search", () => {
  const { dialog } = open("editor");
  expect(within(dialog).getAllByRole("link")).toHaveLength(15);
  for (const name of ["Finanzas", "Portal de clientes", "Control comercial", "Reportes", "Historial"]) {
    expect(within(dialog).queryByRole("link", { name })).toBeNull();
  }
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "finanzas" } });
  expect(within(dialog).queryAllByRole("link")).toHaveLength(0);
  expect(within(dialog).getByRole("status").textContent).toContain("No hay aplicaciones");
});

test("accent-insensitive search filters locally and navigation closes the window", () => {
  const { dialog, trigger } = open();
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "ANALISIS" } });
  const link = within(dialog).getByRole("link", { name: "Análisis territorial" });
  expect(within(dialog).getAllByRole("link")).toHaveLength(1);
  expect(link.getAttribute("href")).toBe("/admin/territorio");
  link.addEventListener("click", event => event.preventDefault());
  fireEvent.click(link);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(trigger);
  expect(screen.getAllByRole("link")).toHaveLength(20);
});

test("cancel closes the modal, restores focus and releases the background scroll lock", () => {
  const { dialog, trigger } = open();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe("");
});

test("search receives focus and Tab wraps in both directions inside the app window", () => {
  const { dialog } = open();
  expect(document.activeElement).toBe(within(dialog).getByRole("searchbox"));
  const first = within(dialog).getByRole("button", { name: "Cerrar aplicaciones" });
  const last = within(dialog).getByRole("link", { name: "Historial" });
  last.focus();
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
});
