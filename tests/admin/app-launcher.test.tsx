import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { AppLauncher } from "@/components/admin/workspace/app-launcher";
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { if (!this.open) return; this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
});
afterEach(() => {
  cleanup();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal); else delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>).showModal;
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose); else delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>).close;
});
function open(role = "admin", pathname = "/admin") { render(<AppLauncher role={role} pathname={pathname} onOpen={() => {}} />); const trigger = screen.getByRole("button", { name: "Abrir aplicaciones" }); fireEvent.click(trigger); const dialog = screen.getByRole("dialog", { name: "Aplicaciones del sistema" }); return { trigger, dialog, apps: within(dialog).getByRole("navigation", { name: "Aplicaciones del sistema" }) }; }
test.each(["admin", "editor"])("%s accede a las veinte herramientas sin duplicar módulos administrativos", role => {
  const { dialog, apps } = open(role, "/admin/apps/ficha-comercial"); const links = within(apps).getAllByRole("link");
  expect(links).toHaveLength(16); expect(new Set(links.map(link => link.getAttribute("href"))).size).toBe(16);
  expect(links.every(link => /^\/admin\/apps\/[a-z-]+$/.test(link.getAttribute("href") ?? ""))).toBe(true);
  expect(within(apps).getByRole("link", { name: "Ficha comercial" }).getAttribute("aria-current")).toBe("page");
  expect(within(apps).getByRole("link", { name: "Cotizador de servicios" }).getAttribute("href")).toBe("/admin/apps/cotizador");
  expect(within(dialog).getByRole("link", { name: "Abrir catálogo completo" }).getAttribute("href")).toBe("/admin/apps");
  expect(within(apps).queryByRole("link", { name: "CRM" })).toBeNull(); expect(within(apps).queryByRole("link", { name: "Clientes" })).toBeNull();
});
test("búsqueda sin acentos filtra herramientas y navegar cierra el diálogo", () => {
  const { dialog, apps, trigger } = open(); fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "FOTOGRAFIAS" } });
  const link = within(apps).getByRole("link", { name: "Fotografías" }); expect(within(apps).getAllByRole("link")).toHaveLength(1); expect(link.getAttribute("href")).toBe("/admin/apps/fotografias");
  link.addEventListener("click", event => event.preventDefault()); fireEvent.click(link); expect(trigger.getAttribute("aria-expanded")).toBe("false"); expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(trigger); expect(within(screen.getByRole("navigation", { name: "Aplicaciones del sistema" })).getAllByRole("link")).toHaveLength(16);
});
test("categorías y búsqueda se combinan sin perder el acceso al catálogo", () => {
  const { dialog, apps } = open(); fireEvent.click(within(dialog).getByRole("button", { name: "Finanzas" })); expect(within(apps).getAllByRole("link")).toHaveLength(6);
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "ficha" } }); expect(within(apps).queryAllByRole("link")).toHaveLength(0); expect(within(dialog).getByRole("status").textContent).toContain("No hay aplicaciones");
  expect(within(dialog).getByRole("link", { name: "Abrir catálogo completo" })).toBeTruthy();
});
test("cancelar restaura foco y libera desplazamiento de fondo", () => { const { dialog, trigger } = open(); expect(document.body.style.overflow).toBe("hidden"); fireEvent(dialog, new Event("cancel", { cancelable: true })); expect(document.activeElement).toBe(trigger); expect(trigger.getAttribute("aria-expanded")).toBe("false"); expect(document.body.style.overflow).toBe(""); });
test("búsqueda recibe foco y Tab permanece dentro del lanzador", () => {
  const { dialog } = open(); expect(document.activeElement).toBe(within(dialog).getByRole("searchbox")); const first = within(dialog).getByRole("button", { name: "Cerrar aplicaciones" }); const last = within(dialog).getByRole("link", { name: "Abrir catálogo completo" }); last.focus(); fireEvent.keyDown(last, { key: "Tab" }); expect(document.activeElement).toBe(first); fireEvent.keyDown(first, { key: "Tab", shiftKey: true }); expect(document.activeElement).toBe(last);
});
