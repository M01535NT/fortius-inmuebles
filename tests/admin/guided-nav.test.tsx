import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const { tasks, leads, clients } = vi.hoisted(() => ({ tasks: [] as Array<Record<string, unknown>>, leads: [] as Array<Record<string, unknown>>, clients: [] as Array<Record<string, unknown>> }));
vi.mock("@/lib/admin/store", async original => {
  const actual = await original<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: (store: unknown) => store === actual.db.tareas ? tasks : store === actual.db.leads ? leads : store === actual.db.clientes ? clients : [] };
});
vi.mock("@/lib/admin/operational-date", () => ({ operationalDate: () => "2026-10-16" }));
import { GuidedSidebar, MobileTabBar, isNavActive, MAIN_NAV } from "@/components/admin/workspace/guided-nav";

const user = { name: "Mariana Ruiz", email: "mariana@example.invalid", initials: "MR" };
const sidebar = (role: string, pathname = "/admin") => render(<GuidedSidebar pathname={pathname} role={role} user={user} search={<button type="button">Buscar</button>} onLogout={async () => {}} />);
beforeEach(() => { tasks.length = 0; leads.length = 0; clients.length = 0; });
afterEach(cleanup);

test("la barra lateral muestra cinco secciones, Herramientas y el botón de nueva operación", () => {
  sidebar("editor");
  const nav = screen.getByRole("navigation", { name: "Módulos del panel" });
  expect(Array.from(nav.querySelectorAll("a")).map(a => a.textContent)).toEqual(["Hoy", "Operaciones", "Contactos", "Inmuebles", "Agenda", "Herramientas16"]);
  expect(screen.getByRole("link", { name: "Nueva operación" }).getAttribute("href")).toBe("/admin/operaciones/nueva");
  expect(within(nav).queryByRole("button", { name: /Administración/ })).toBeNull();
  expect(screen.getByText("Asesor")).toBeTruthy();
});

test("Administración solo aparece al administrador, plegada, con sus cinco accesos", () => {
  sidebar("admin");
  const toggle = screen.getByRole("button", { name: /Administración/ });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  const group = document.getElementById("admin-nav-administracion")!;
  expect(Array.from(group.querySelectorAll("a")).map(a => a.textContent)).toEqual(["Equipo", "Sitio web", "Reportes", "Historial", "Configuración"]);
});

test("Administración se abre sola si la página actual está dentro de ella", () => {
  sidebar("admin", "/admin/blog");
  expect(screen.getByRole("button", { name: /Administración/ }).getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("link", { name: "Sitio web" }).getAttribute("aria-current")).toBe("page");
});

test("la sección activa incluye sus fichas de detalle y las direcciones anteriores", () => {
  const [hoy, operaciones, contactos, , agenda] = MAIN_NAV;
  expect(isNavActive("/admin", hoy)).toBe(true);
  expect(isNavActive("/admin/operaciones", hoy)).toBe(false);
  expect(isNavActive("/admin/operaciones/nueva", operaciones)).toBe(true);
  expect(isNavActive("/admin/leads/123", contactos)).toBe(true);
  expect(isNavActive("/admin/tareas/9", agenda)).toBe(true);
  expect(isNavActive("/admin/agendas", agenda)).toBe(false);
});

test("el contador de Hoy suma tareas vencidas o de hoy y contactos por atender", () => {
  tasks.push({ id: "t1", estado: "pendiente", vence: "2026-10-15" }, { id: "t2", estado: "pendiente", vence: "2026-10-16" }, { id: "t3", estado: "completada", vence: "2026-10-10" }, { id: "t4", estado: "pendiente", vence: "2026-10-20" });
  sidebar("editor");
  expect(screen.getByRole("link", { name: /^Hoy/ }).textContent).toBe("Hoy2 pendientes");
});

test("la barra inferior del celular marca la sección y abre el menú", () => {
  const onMenu = vi.fn();
  render(<MobileTabBar pathname="/admin/contactos" menuOpen={false} onMenu={onMenu} menuButton={React.createRef()} />);
  const tabs = screen.getByRole("navigation", { name: "Secciones principales" });
  expect(within(tabs).getByRole("link", { name: "Contactos" }).getAttribute("aria-current")).toBe("page");
  expect(within(tabs).getByRole("link", { name: "Nueva operación" }).getAttribute("href")).toBe("/admin/operaciones/nueva");
  fireEvent.click(within(tabs).getByRole("button", { name: "Menú del panel" }));
  expect(onMenu).toHaveBeenCalled();
});

test("en la barra inferior el lector de pantalla oye primero la sección y después el contador", () => {
  tasks.push({ id: "t1", estado: "pendiente", vence: "2026-10-16" });
  render(<MobileTabBar pathname="/admin" menuOpen={false} onMenu={() => {}} menuButton={React.createRef()} />);
  expect(screen.getByRole("link", { name: "Hoy, 1 pendiente" }).getAttribute("aria-current")).toBe("page");
});
