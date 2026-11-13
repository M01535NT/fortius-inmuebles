import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { commandsFor, filterCommands, isRecordPath, pushRecent, typingTarget } from "@/lib/admin/commands";
import { clearAdminCache, isLoggedIn } from "@/lib/admin/store";
import { WorkspaceSearch } from "@/components/admin/workspace/search";
import { ADMIN_NAV, MAIN_NAV, QUICK_CREATE, TOOLS_NAV } from "@/components/admin/workspace/guided-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/tareas/t1", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

/* UX-03 (RP-10, RP-11, N03): la barra de comandos busca y actúa, con atajos que no estorban al escribir. */
const source = { quick: QUICK_CREATE, nav: [...MAIN_NAV, TOOLS_NAV], admin: ADMIN_NAV };

test("las acciones se buscan por palabras y lo de administración solo lo ve el administrador", () => {
  const editor = commandsFor("editor", source), admin = commandsFor("admin", source);
  expect(filterCommands(editor, "nueva tarea").map(c => c.label)).toEqual(["Nueva tarea"]);
  expect(filterCommands(editor, "ir operaciones").map(c => c.href)).toEqual(["/admin/operaciones"]);
  expect(filterCommands(editor, "configuración")).toEqual([]);
  expect(filterCommands(admin, "configuracion").map(c => c.href)).toEqual(["/admin/configuracion"]);
  expect(filterCommands(editor, "")).toEqual([]);
});

test("recientes: solo registros, el último al frente, sin repetir y máximo 5", () => {
  expect(isRecordPath("/admin/tareas/t1")).toBe(true);
  expect(isRecordPath("/admin/operaciones/nueva")).toBe(false);
  expect(isRecordPath("/admin/propiedades/casa/editar")).toBe(true);
  expect(isRecordPath("/admin/agenda")).toBe(false);
  expect(pushRecent(["/admin/leads/a", "/admin/tareas/t1"], "/admin/tareas/t1")).toEqual(["/admin/tareas/t1", "/admin/leads/a"]);
  expect(pushRecent(["/admin/leads/1", "/admin/leads/2", "/admin/leads/3", "/admin/leads/4", "/admin/leads/5"], "/admin/clientes/c")).toHaveLength(5);
  expect(pushRecent(["/admin/leads/1"], "/admin/agenda")).toEqual(["/admin/leads/1"]);
});

test("ningún atajo de una tecla actúa dentro de un campo", () => {
  const input = document.createElement("input"), area = document.createElement("textarea"), div = document.createElement("div");
  expect(typingTarget(input)).toBe(true);
  expect(typingTarget(area)).toBe(true);
  expect(typingTarget(div)).toBe(false);
});

let puts: Array<Record<string, unknown>>, patches: unknown[];
beforeEach(() => {
  puts = []; patches = [];
  clearAdminCache();
  const task = { id: "t1", titulo: "Pedir el predial", descripcion: "", categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [] };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/session") return Response.json({ user: { id: "u-1", email: "a@fortius.test", role: "editor" } });
    if (url === "/api/admin/preferencias" && init?.method === "PATCH") { patches.push(JSON.parse(String(init.body))); return Response.json({ preferencias: { data: { panel: JSON.parse(String(init.body)).panel }, version: 2 } }); }
    if (url === "/api/admin/preferencias") return Response.json({ preferencias: { data: { panel: { recientes: ["/admin/leads/borrado"] } }, version: 1 } });
    if (init?.method === "PUT" && url.includes("/collections/tareas/")) { const body = JSON.parse(String(init.body)); puts.push(body); return Response.json({ record: { id: "t1", data: body.data, version: 2 } }); }
    if (url.endsWith("/collections/tareas")) return Response.json({ records: [{ id: "t1", data: task, version: 1 }] });
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [] });
    return Response.json({ records: [] });
  }));
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); clearAdminCache(); vi.unstubAllGlobals(); });

test("la barra guarda el registro abierto en Recientes, ofrece acciones y marca la tarea con su versión", async () => {
  await isLoggedIn();
  render(<WorkspaceSearch variant="field" />);
  // La tarea abierta queda al frente de Recientes; el registro que ya no se ve se conserva atrás pero no se muestra.
  await waitFor(() => expect(patches).toEqual([{ panel: { recientes: ["/admin/tareas/t1", "/admin/leads/borrado"] } }]));
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  const dialog = within(screen.getByRole("dialog", { name: "Buscar en el panel", hidden: true }));
  expect(await dialog.findByRole("list", { name: "Recientes", hidden: true })).toBeTruthy();
  fireEvent.change(dialog.getByRole("searchbox", { hidden: true }), { target: { value: "predial" } });
  fireEvent.click(await dialog.findByRole("button", { name: "Marcar como hecha: Pedir el predial", hidden: true }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0]).toMatchObject({ version: 1, data: { id: "t1", estado: "completada" } });
  expect(await dialog.findByText("Completaste «Pedir el predial».")).toBeTruthy();
  fireEvent.change(dialog.getByRole("searchbox", { hidden: true }), { target: { value: "nueva tarea" } });
  expect(dialog.getByRole("list", { name: "Acciones", hidden: true }).textContent).toContain("Nueva tarea");
});

test("«/» abre la barra fuera de un campo y no dentro de uno", async () => {
  await isLoggedIn();
  render(<><input aria-label="Campo" /><WorkspaceSearch variant="field" /></>);
  const field = screen.getByRole("textbox", { name: "Campo" });
  const palette = () => document.querySelectorAll("dialog")[0];
  fireEvent.keyDown(field, { key: "/" });
  expect(palette().hasAttribute("open")).toBe(false);
  fireEvent.keyDown(document.body, { key: "/" });
  expect(palette().hasAttribute("open")).toBe(true);
});
