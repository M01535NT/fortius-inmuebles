import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { clearAdminCache, isLoggedIn } from "@/lib/admin/store";
import { usePanelPreference } from "@/components/admin/workspace/preferences-store";

/* UX-02 (RP-14): las preferencias del panel siguen al usuario; lo del navegador se sube una vez. */
let server: Record<string, unknown>;
let patches: unknown[];
let fail = false;
const legacy = { key: "fortius.inmuebles.vista.v1", parse: (raw: string) => raw === "tarjetas" ? "tarjetas" as const : undefined };
function Probe() {
  const { value, save, error } = usePanelPreference("inmueblesVista", "filas", legacy);
  return <div><span data-testid="vista">{value}</span><button type="button" onClick={() => void save(value === "filas" ? "tarjetas" : "filas")}>Cambiar</button>{error && <p role="alert">{error}</p>}</div>;
}
// En jsdom de estas pruebas no hay almacenamiento local: uno en memoria, como el del navegador.
const memory = new Map<string, string>();
const localStorage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v), removeItem: (k: string) => void memory.delete(k), clear: () => memory.clear() };
beforeEach(() => {
  server = {}; patches = []; fail = false;
  clearAdminCache();
  memory.clear();
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/session") return Response.json({ user: { id: "u-1", email: "a@fortius.test", role: "editor" } });
    if (url === "/api/admin/preferencias" && init?.method === "PATCH") {
      if (fail) return Response.json({ error: "El panel no responde" }, { status: 503 });
      const body = JSON.parse(String(init.body));
      patches.push(body);
      server = { ...server, ...body.panel };
      return Response.json({ preferencias: { data: { panel: server }, version: patches.length + 1 } });
    }
    if (url === "/api/admin/preferencias") return Response.json({ preferencias: { data: { panel: server }, version: 1 } });
    return Response.json({ records: [] });
  }));
});
afterEach(() => { cleanup(); clearAdminCache(); memory.clear(); vi.unstubAllGlobals(); });

test("la vista elegida se guarda en el servidor y se lee de ahí", async () => {
  server = { inmueblesVista: "tarjetas" };
  await isLoggedIn();
  render(<Probe />);
  await waitFor(() => expect(screen.getByTestId("vista").textContent).toBe("tarjetas"));
  act(() => screen.getByRole("button", { name: "Cambiar" }).click());
  expect(screen.getByTestId("vista").textContent).toBe("filas");
  await waitFor(() => expect(patches).toEqual([{ panel: { inmueblesVista: "filas" } }]));
  expect(screen.getByTestId("vista").textContent).toBe("filas");
});

test("si el servidor la rechaza, vuelve a como estaba y avisa", async () => {
  await isLoggedIn();
  render(<Probe />);
  await waitFor(() => expect(screen.getByTestId("vista").textContent).toBe("filas"));
  fail = true;
  act(() => screen.getByRole("button", { name: "Cambiar" }).click());
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByTestId("vista").textContent).toBe("filas");
});

test("lo que este navegador recordaba se sube una vez y se borra de aquí", async () => {
  localStorage.setItem("fortius.inmuebles.vista.v1", "tarjetas");
  await isLoggedIn();
  render(<Probe />);
  await waitFor(() => expect(patches).toEqual([{ panel: { inmueblesVista: "tarjetas" } }]));
  await waitFor(() => expect(localStorage.getItem("fortius.inmuebles.vista.v1")).toBeNull());
  expect(screen.getByTestId("vista").textContent).toBe("tarjetas");
});
