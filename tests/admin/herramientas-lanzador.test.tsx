import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
const push = vi.hoisted(() => vi.fn());
const rol = vi.hoisted(() => ({ value: "editor" as string }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/admin/apps" }));
vi.mock("@/lib/admin/store", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/admin/store")>()), useSession: () => ({ id: "u-1", email: "a@fortius.test", role: rol.value }) }));
import { AppsCatalog } from "@/components/admin/apps/catalog";

/* LV-10f · Más como lanzador: buscar, recorrer con flechas y abrir con Enter; Administración solo para el administrador. */
const guardado = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => guardado.get(k) ?? null, setItem: (k: string, v: string) => void guardado.set(k, v), removeItem: (k: string) => void guardado.delete(k), clear: () => guardado.clear() });
afterEach(() => { cleanup(); push.mockClear(); rol.value = "editor"; guardado.clear(); });
const buscador = () => screen.getByRole("searchbox", { name: "Buscar herramienta o sección" });

it("filtra mientras se escribe, Enter abre lo primero y queda en Recientes", () => {
  render(<AppsCatalog />);
  fireEvent.change(buscador(), { target: { value: "hipoteca" } });
  const visibles = screen.getAllByRole("link").filter(a => a.hasAttribute("data-lanzador"));
  expect(visibles.length).toBeGreaterThan(0);
  expect(visibles.every(a => /hipoteca|crédito|credito/i.test(a.textContent ?? ""))).toBe(true);
  fireEvent.keyDown(buscador(), { key: "Enter" });
  const destino = visibles[0].getAttribute("href");
  expect(push).toHaveBeenCalledWith(destino);
  expect(JSON.parse(localStorage.getItem("fortius.herramientas.recientes.v1") ?? "[]")).toEqual([destino]);
});

it("las flechas recorren lo visible y Escape borra la búsqueda", () => {
  render(<AppsCatalog />);
  fireEvent.keyDown(buscador(), { key: "ArrowDown" });
  const destinos = screen.getAllByRole("link").filter(a => a.hasAttribute("data-lanzador"));
  expect(document.activeElement).toBe(destinos[0]);
  fireEvent.keyDown(destinos[0], { key: "ArrowDown" });
  expect(document.activeElement).toBe(destinos[1]);
  fireEvent.keyDown(destinos[1], { key: "End" });
  expect(document.activeElement).toBe(destinos.at(-1));
  fireEvent.keyDown(destinos.at(-1)!, { key: "Home" });
  fireEvent.keyDown(destinos[0], { key: "ArrowUp" });
  expect(document.activeElement).toBe(buscador());
  fireEvent.change(buscador(), { target: { value: "zzzz" } });
  expect(screen.getByRole("status").textContent).toContain("Nada coincide con «zzzz»");
  fireEvent.keyDown(buscador(), { key: "Escape" });
  expect((buscador() as HTMLInputElement).value).toBe("");
});

it("Administración aparece solo para el administrador", () => {
  render(<AppsCatalog />);
  const secciones = () => within(screen.getByRole("navigation", { name: "Secciones del panel" }));
  expect(secciones().queryByRole("link", { name: /Administración/ })).toBeNull();
  cleanup();
  rol.value = "admin";
  render(<AppsCatalog />);
  expect(secciones().getByRole("link", { name: /Administración/ })).toBeTruthy();
});
