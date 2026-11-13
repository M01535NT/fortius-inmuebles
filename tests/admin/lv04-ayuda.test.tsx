import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EmptyBox, Hint, StartHere } from "@/components/admin/kit";
import { EMPTY_ART } from "@/components/admin/icons";

/* LV-04 (V07, V08), aprobado por el titular el 13/11/2026. */
// El entorno de prueba no trae almacenamiento local: se simula uno en memoria.
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), clear: () => data.clear() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("el «?» abre una sola línea y la cierra al pulsar otra vez o con Escape", () => {
  render(<Hint term="el dictamen">Revisión de quién es dueño.</Hint>);
  const button = screen.getByRole("button", { name: "Qué es el dictamen" });
  const note = screen.getByText("Revisión de quién es dueño.");
  expect(note.hasAttribute("hidden")).toBe(true);
  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(note.hasAttribute("hidden")).toBe(false);
  fireEvent.keyDown(button, { key: "Escape" });
  expect(note.hasAttribute("hidden")).toBe(true);
  fireEvent.click(button); fireEvent.click(button);
  expect(note.hasAttribute("hidden")).toBe(true);
});

test("«Empieza aquí» sale hasta que la persona pulsa y no vuelve para ella", () => {
  const { unmount } = render(<StartHere storageKey="fortius.empieza-aqui.v1:u1"><button type="button">Nuevo</button></StartHere>);
  expect(screen.getByText("Empieza aquí")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
  expect(screen.queryByText("Empieza aquí")).toBeNull();
  unmount();
  render(<StartHere storageKey="fortius.empieza-aqui.v1:u1"><button type="button">Nuevo</button></StartHere>);
  expect(screen.queryByText("Empieza aquí")).toBeNull();
  cleanup();
  render(<StartHere storageKey="fortius.empieza-aqui.v1:u2"><button type="button">Nuevo</button></StartHere>);
  expect(screen.getByText("Empieza aquí")).toBeTruthy();
});

test("sin persona conocida no se muestra el punto", () => {
  render(<StartHere><button type="button">Nuevo</button></StartHere>);
  expect(screen.queryByText("Empieza aquí")).toBeNull();
});

test("el estado vacío lleva su ilustración decorativa y el título", () => {
  const { container } = render(<EmptyBox art={{ icon: EMPTY_ART.tareas, kind: "listo" }} title="Nada pendiente">Todo hecho.</EmptyBox>);
  expect(screen.getByText("Nada pendiente")).toBeTruthy();
  const art = container.querySelector("[aria-hidden='true'] svg");
  expect(art).toBeTruthy();
});
