const confirmAction = vi.hoisted(() => vi.fn().mockResolvedValue(false));
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction, confirmDelete: vi.fn().mockResolvedValue(false) }));
const nav = vi.hoisted(() => ({ path: "/admin/agenda", search: new URLSearchParams(), listeners: new Set<() => void>() }));
vi.mock("next/navigation", async () => {
  const react = await import("react");
  const subscribe = (cb: () => void) => { nav.listeners.add(cb); return () => nav.listeners.delete(cb); };
  const replace = (url: string) => { const u = new URL(url, "http://localhost"); nav.path = u.pathname; nav.search = u.searchParams; nav.listeners.forEach(cb => cb()); };
  return { usePathname: () => nav.path, useSearchParams: () => react.useSyncExternalStore(subscribe, () => nav.search), useRouter: () => ({ push: vi.fn(), replace }), useParams: () => ({}) };
});
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
import AgendaPage from "@/app/admin/agenda/page";
import { clearAdminCache } from "@/lib/admin/store";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
beforeEach(() => {
  clearAdminCache();
  confirmAction.mockClear();
  nav.path = "/admin/agenda"; nav.search = new URLSearchParams("tab=tareas");
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ records: [] })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/*
  BUG-C74 (resto, tras 43cc716): «Cerrar captura» ya conserva lo escrito, pero cambiar a la pestaña
  «Agenda» sigue desmontando TareasScreen (route-tabs.tsx: solo se pinta la pestaña activa) y con ella
  la tarea nueva a medio escribir, sin preguntar. El hallazgo original incluía este camino.
*/
test("cambiar a la pestaña «Agenda» con una tarea a medio escribir no la borra sin preguntar", async () => {
  render(<AgendaPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Nueva tarea" }));
  fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Pedir escrituras al propietario de ensayo" } });
  fireEvent.click(screen.getByRole("tab", { name: /Agenda/ }));
  await act(async () => {});
  fireEvent.click(screen.getByRole("tab", { name: /Tareas/ }));
  await act(async () => {});
  const titulo = screen.queryByLabelText("Título") as HTMLInputElement | null;
  if (!titulo) fireEvent.click(await screen.findByRole("button", { name: "Nueva tarea" }));
  const valor = (screen.getByLabelText("Título") as HTMLInputElement).value;
  // Vale preguntar antes de salir (y, si no se confirma, quedarse) o conservar lo escrito.
  expect(confirmAction.mock.calls.length > 0 || valor === "Pedir escrituras al propietario de ensayo", `se perdió lo escrito sin preguntar (título: «${valor}»)`).toBe(true);
});
