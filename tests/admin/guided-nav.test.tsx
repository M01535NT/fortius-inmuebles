import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const { tasks, leads, clients } = vi.hoisted(() => ({ tasks: [] as Array<Record<string, unknown>>, leads: [] as Array<Record<string, unknown>>, clients: [] as Array<Record<string, unknown>> }));
vi.mock("@/lib/admin/store", async original => {
  const actual = await original<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: (store: unknown) => store === actual.db.tareas ? tasks : store === actual.db.leads ? leads : store === actual.db.clientes ? clients : [] };
});
vi.mock("@/lib/admin/operational-date", () => ({ operationalDate: () => "2026-10-16" }));
import { TopNav, MobileTabBar, isNavActive, MAIN_NAV, MORE_NAV } from "@/components/admin/workspace/guided-nav";

const user = { name: "Mariana Ruiz", email: "mariana@example.invalid", initials: "MR" };
const topnav = (role: string, pathname = "/admin") => render(<TopNav pathname={pathname} role={role} user={user} onLogout={async () => {}} search={<button type="button">Buscar</button>} />);
beforeEach(() => { tasks.length = 0; leads.length = 0; clients.length = 0; });
afterEach(cleanup);

test("la barra superior lleva seis píldoras, el buscador, «Nuevo» y la cuenta; sin Administración a la vista del asesor", () => {
  topnav("editor");
  const nav = screen.getByRole("navigation", { name: "Módulos del panel" });
  expect(Array.from(nav.querySelectorAll("a")).map(a => a.textContent)).toEqual(["Hoy", "Operaciones", "Contactos", "Inmuebles", "Agenda", "Más"]);
  expect(within(nav).getByRole("link", { name: "Más" }).getAttribute("href")).toBe("/admin/herramientas");
  expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy();
  const account = screen.getByRole("button", { name: /Mariana Ruiz, Asesor/ });
  expect(account.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(account);
  const menu = document.getElementById("admin-account-menu")!;
  expect(within(menu).getByRole("link", { name: "Mi perfil" }).getAttribute("href")).toBe("/admin/perfil");
  expect(within(menu).queryByRole("link", { name: "Administración" })).toBeNull();
  expect(within(menu).getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
  expect(screen.getByText("Asesor")).toBeTruthy();
});

test("«+ Nuevo» abre las cinco altas, la operación primero, y avisa a la pantalla destino", () => {
  topnav("editor");
  const heard: string[] = [];
  window.addEventListener("fortius:quick-create", event => heard.push((event as CustomEvent<string>).detail));
  const trigger = screen.getByRole("button", { name: "Nuevo" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu", { name: "Qué quieres crear" });
  expect(within(menu).getAllByRole("menuitem").map(item => [item.textContent, item.getAttribute("href")])).toEqual([
    ["Nueva operación", "/admin/operaciones/nueva"], ["Nuevo prospecto", "/admin/contactos?nuevo=1"], ["Nuevo inmueble", "/admin/propiedades/nueva"], ["Nueva tarea", "/admin/agenda?tab=tareas&nueva=1"], ["Agendar visita", "/admin/agenda?nueva=1"],
  ]);
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Nuevo prospecto" }));
  expect(heard).toEqual(["prospecto"]);
  expect(screen.queryByRole("menu")).toBeNull();
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("el administrador encuentra Administración en su cuenta y «Más» se marca dentro de esas páginas", () => {
  topnav("admin", "/admin/blog");
  fireEvent.click(screen.getByRole("button", { name: /Mariana Ruiz, Administrador/ }));
  const link = within(document.getElementById("admin-account-menu")!).getByRole("link", { name: "Administración" });
  expect(link.getAttribute("href")).toBe("/admin/asesores");
  expect(link.getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Más" }).getAttribute("aria-current")).toBe("page");
});

test("la sección activa incluye sus fichas de detalle y las direcciones anteriores", () => {
  const [hoy, operaciones, contactos, , agenda] = MAIN_NAV;
  expect(isNavActive("/admin", hoy)).toBe(true);
  expect(isNavActive("/admin/operaciones", hoy)).toBe(false);
  expect(isNavActive("/admin/operaciones/nueva", operaciones)).toBe(true);
  expect(isNavActive("/admin/leads/123", contactos)).toBe(true);
  expect(isNavActive("/admin/tareas/9", agenda)).toBe(true);
  expect(isNavActive("/admin/agendas", agenda)).toBe(false);
  for (const path of ["/admin/herramientas", "/admin/apps/hipoteca", "/admin/notas", "/admin/reportes", "/admin/configuracion", "/admin/perfil"]) expect(isNavActive(path, MORE_NAV)).toBe(true);
  expect(isNavActive("/admin/propiedades", MORE_NAV)).toBe(false);
});

test("el contador de Hoy suma tareas vencidas o de hoy y contactos por atender", () => {
  tasks.push({ id: "t1", estado: "pendiente", vence: "2026-10-15" }, { id: "t2", estado: "pendiente", vence: "2026-10-16" }, { id: "t3", estado: "completada", vence: "2026-10-10" }, { id: "t4", estado: "pendiente", vence: "2026-10-20" });
  topnav("editor");
  expect(screen.getByRole("link", { name: /^Hoy/ }).textContent).toBe("Hoy2 pendientes");
});

test("la barra inferior del celular marca la sección y abre el menú «Más»", () => {
  const onMenu = vi.fn();
  render(<MobileTabBar pathname="/admin/contactos" menuOpen={false} onMenu={onMenu} menuButton={React.createRef()} />);
  const tabs = screen.getByRole("navigation", { name: "Secciones principales" });
  expect(within(tabs).getByRole("link", { name: "Contactos" }).getAttribute("aria-current")).toBe("page");
  expect(within(tabs).getByRole("link", { name: "Nueva operación" }).getAttribute("href")).toBe("/admin/operaciones/nueva");
  const more = within(tabs).getByRole("button", { name: "Menú del panel" });
  expect(more.textContent).toBe("Más");
  fireEvent.click(more);
  expect(onMenu).toHaveBeenCalled();
});

test("en la barra inferior el lector de pantalla oye primero la sección y después el contador", () => {
  tasks.push({ id: "t1", estado: "pendiente", vence: "2026-10-16" });
  render(<MobileTabBar pathname="/admin" menuOpen={false} onMenu={() => {}} menuButton={React.createRef()} />);
  expect(screen.getByRole("link", { name: "Hoy, 1 pendiente" }).getAttribute("aria-current")).toBe("page");
});
