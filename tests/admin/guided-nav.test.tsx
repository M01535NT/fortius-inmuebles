import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const { tasks, leads, clients } = vi.hoisted(() => ({ tasks: [] as Array<Record<string, unknown>>, leads: [] as Array<Record<string, unknown>>, clients: [] as Array<Record<string, unknown>> }));
vi.mock("@/lib/admin/store", async original => {
  const actual = await original<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: (store: unknown) => store === actual.db.tareas ? tasks : store === actual.db.leads ? leads : store === actual.db.clientes ? clients : [] };
});
vi.mock("@/lib/admin/operational-date", () => ({ operationalDate: () => "2026-10-16" }));
// COR-05: el número del menú es el largo de la cola de Hoy; aquí se fija para probar cómo se muestra.
const { pending } = vi.hoisted(() => ({ pending: { value: 0 } }));
vi.mock("@/components/admin/workspace/use-today-queue", () => ({ usePendingCount: () => pending.value }));
import { SideNav, MobileTabBar, isNavActive, MAIN_NAV, MORE_NAV } from "@/components/admin/workspace/guided-nav";

const user = { name: "Mariana Ruiz", email: "mariana@example.invalid", initials: "MR" };
const sidenav = (role: string, pathname = "/admin") => render(<SideNav pathname={pathname} role={role} user={user} onLogout={async () => {}} search={<button type="button">Buscar</button>} />);
beforeEach(() => { tasks.length = 0; leads.length = 0; clients.length = 0; pending.value = 0; });
afterEach(cleanup);

test("el menú lateral lleva los seis módulos y Herramientas, el buscador, «Nuevo» y la cuenta; sin Administración a la vista del asesor", () => {
  sidenav("editor");
  const nav = screen.getByRole("navigation", { name: "Módulos del panel" });
  expect(Array.from(nav.querySelectorAll("a")).map(a => a.textContent)).toEqual(["Hoy", "Operaciones", "Contactos", "Inmuebles", "Trámites", "Agenda y tareas", "Herramientas"]);
  expect(within(nav).getByRole("link", { name: "Herramientas" }).getAttribute("href")).toBe("/admin/herramientas");
  expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy();
  const account = screen.getByRole("button", { name: /Mariana Ruiz, Asesor/ });
  expect(account.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(account);
  const menu = document.getElementById("admin-account-menu")!;
  expect(within(menu).getByRole("link", { name: "Mi perfil" }).getAttribute("href")).toBe("/admin/perfil");
  expect(within(menu).queryByRole("link", { name: "Administración" })).toBeNull();
  expect(within(menu).getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
  expect(within(menu).getByText("Asesor")).toBeTruthy();
});

test("«+ Nuevo» abre las cinco altas, la operación primero, y avisa a la pantalla destino", () => {
  sidenav("editor");
  const heard: string[] = [];
  window.addEventListener("fortius:quick-create", event => heard.push((event as CustomEvent<string>).detail));
  const trigger = screen.getByRole("button", { name: "Nuevo" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu", { name: "Qué quieres crear" });
  expect(within(menu).getAllByRole("menuitem").map(item => [item.textContent, item.getAttribute("href")])).toEqual([
    ["Atender a alguien", "/admin/operaciones/nueva"], ["Nueva operación", "/admin/operaciones/nueva?intencion=vender"], ["Nuevo inmueble", "/admin/propiedades/nueva"], ["Nueva tarea", "/admin/agenda?tab=tareas&nueva=1"], ["Agendar visita", "/admin/agenda?nueva=1"],
  ]);
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Nueva tarea" }));
  expect(heard).toEqual(["tarea"]);
  expect(screen.queryByRole("menu")).toBeNull();
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("el administrador encuentra Administración en el menú lateral y en su cuenta, marcada dentro de esas páginas", () => {
  sidenav("admin", "/admin/blog");
  const nav = screen.getByRole("navigation", { name: "Módulos del panel" });
  const entry = within(nav).getByRole("link", { name: "Administración" });
  expect(entry.getAttribute("href")).toBe("/admin/asesores");
  expect(entry.getAttribute("aria-current")).toBe("page");
  expect(within(nav).getByRole("link", { name: "Herramientas" }).getAttribute("aria-current")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Mariana Ruiz, Administrador/ }));
  const link = within(document.getElementById("admin-account-menu")!).getByRole("link", { name: "Administración" });
  expect(link.getAttribute("href")).toBe("/admin/asesores");
  expect(link.getAttribute("aria-current")).toBe("page");
});

test("la sección activa incluye sus fichas de detalle y las direcciones anteriores", () => {
  const [hoy, operaciones, contactos, , , agenda] = MAIN_NAV;
  expect(isNavActive("/admin", hoy)).toBe(true);
  expect(isNavActive("/admin/operaciones", hoy)).toBe(false);
  expect(isNavActive("/admin/operaciones/nueva", operaciones)).toBe(true);
  expect(isNavActive("/admin/leads/123", contactos)).toBe(true);
  expect(isNavActive("/admin/tareas/9", agenda)).toBe(true);
  expect(isNavActive("/admin/agendas", agenda)).toBe(false);
  for (const path of ["/admin/herramientas", "/admin/apps/hipoteca", "/admin/notas", "/admin/reportes", "/admin/configuracion", "/admin/perfil"]) expect(isNavActive(path, MORE_NAV)).toBe(true);
  expect(isNavActive("/admin/propiedades", MORE_NAV)).toBe(false);
});

test("Trámites va en el menú para el asesor y el director y se marca en sus pantallas, no Herramientas (TRA-01)", () => {
  for (const role of ["editor", "admin"]) {
    sidenav(role, "/admin/tramites");
    const nav = screen.getByRole("navigation", { name: "Módulos del panel" });
    const link = within(nav).getByRole("link", { name: "Trámites" });
    expect(link.getAttribute("href")).toBe("/admin/tramites");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Herramientas" }).getAttribute("aria-current")).toBeNull();
    cleanup();
  }
});

test("el contador de Hoy muestra las tarjetas de la cola de Hoy (COR-05)", () => {
  pending.value = 2;
  sidenav("editor");
  expect(screen.getByRole("link", { name: /^Hoy/ }).textContent).toBe("Hoy2 pendientes");
});

test("la barra inferior del celular marca la sección y abre el menú «Más»", () => {
  const onMenu = vi.fn();
  render(<MobileTabBar pathname="/admin/contactos" menuOpen={false} onMenu={onMenu} menuButton={React.createRef()} />);
  const tabs = screen.getByRole("navigation", { name: "Secciones principales" });
  expect(within(tabs).getByRole("link", { name: "Contactos" }).getAttribute("aria-current")).toBe("page");
  // SIM-17: el «+» abre el mismo menú que «+ Nuevo».
  fireEvent.click(within(tabs).getByRole("button", { name: "Nuevo" }));
  expect(within(tabs).getAllByRole("menuitem").map(item => item.textContent)).toEqual(["Atender a alguien", "Nueva operación", "Nuevo inmueble", "Nueva tarea", "Agendar visita"]);
  const more = within(tabs).getByRole("button", { name: "Menú del panel" });
  expect(more.textContent).toBe("Más");
  fireEvent.click(more);
  expect(onMenu).toHaveBeenCalled();
});

test("en la barra inferior el lector de pantalla oye primero la sección y después el contador", () => {
  pending.value = 1;
  render(<MobileTabBar pathname="/admin" menuOpen={false} onMenu={() => {}} menuButton={React.createRef()} />);
  expect(screen.getByRole("link", { name: "Hoy, 1 pendiente" }).getAttribute("aria-current")).toBe("page");
});
