import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { conflictFields, describeValue, fieldLabel, mergeChoice } from "@/lib/admin/conflict";
import { AdminShell } from "@/components/admin/admin-shell";
import * as api from "@/lib/admin/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/notas", useRouter: () => ({ push: vi.fn() }) }));

describe("comparación campo por campo (RP-17)", () => {
  const base = { id: "t1", titulo: "Llamar", vence: "2026-11-14", prioridad: "normal", historial: [{ id: "h1" }] };
  test("distingue lo que cambiaste tú, lo que cambió la otra persona y lo que cambiaron los dos", () => {
    const mine = { ...base, titulo: "Llamar al propietario", prioridad: "alta", historial: [{ id: "h1" }, { id: "h-mio" }] };
    const theirs = { ...base, vence: "2026-11-20", prioridad: "baja", historial: [{ id: "h1" }, { id: "h-otro" }] };
    const fields = conflictFields(base, mine, theirs);
    expect(fields.map(f => [f.key, f.changed])).toEqual([["titulo", "mine"], ["vence", "theirs"], ["prioridad", "both"]]);
    const merged = mergeChoice(theirs, mine, { titulo: "mine", prioridad: "theirs", vence: "theirs" });
    expect(merged).toEqual({ id: "t1", titulo: "Llamar al propietario", vence: "2026-11-20", prioridad: "baja", historial: [{ id: "h1" }, { id: "h-otro" }, { id: "h-mio" }] });
  });
  test("sin base conocida, todo campo distinto se elige a mano", () => {
    expect(conflictFields(undefined, { a: 1 }, { a: 2 })[0].changed).toBe("both");
  });
  test("textos para el asesor", () => {
    expect(fieldLabel("vence")).toBe("Fecha límite");
    expect(fieldLabel("fechaInicioObra")).toBe("Fecha inicio obra");
    expect(describeValue(undefined)).toBe("Vacío");
    expect(describeValue(true)).toBe("Sí");
    expect(describeValue([{ texto: "Revisar" }, { texto: "Enviar" }])).toBe("Revisar, Enviar");
  });
});

/* De punta a punta: dos personas editan la misma nota; la segunda elige y se guarda sobre la versión nueva. */
let server = { version: 1, data: { id: "n1", titulo: "Nota", texto: "Original", creadoEl: "2026-11-13" } as Record<string, unknown> };
const puts: Array<{ version: number; data: Record<string, unknown> }> = [];
function Editor() {
  const notas = api.useCollection(api.db.notas);
  const [start] = React.useState(() => ({ item: notas[0], version: api.db.notas.version(notas[0]) }));
  const [result, setResult] = React.useState("");
  if (!start.item) return null;
  return <button type="button" onClick={() => void api.db.notas.put({ ...start.item, titulo: "Nota corregida" }, start.version).then(() => setResult("Guardada"), e => setResult(api.errorMessage(e)))}>Guardar mi cambio {result}</button>;
}
beforeEach(() => {
  server = { version: 1, data: { id: "n1", titulo: "Nota", texto: "Original", creadoEl: "2026-11-13" } };
  puts.length = 0;
  api.clearAdminCache();
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/session") return Response.json({ user: { id: "staff", email: "staff@example.com", role: "admin" } });
    if (url.startsWith("/api/auth/")) return Response.json({ ok: true });
    if (init?.method === "PUT" && url.includes("/collections/notas/")) {
      const body = JSON.parse(String(init.body));
      puts.push(body);
      if (body.version !== server.version) return Response.json({ error: "El registro cambió" }, { status: 409 });
      server = { version: server.version + 1, data: body.data };
      return Response.json({ record: { id: "n1", data: server.data, version: server.version, createdAt: "2026-11-13", updatedAt: "2026-11-13" } });
    }
    if (url.endsWith("/collections/notas")) return Response.json({ records: [{ id: "n1", data: server.data, version: server.version, createdAt: "2026-11-13", updatedAt: "2026-11-13" }] });
    return Response.json({ records: [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function conflict() {
  render(<AdminShell><Editor /></AdminShell>);
  const button = await screen.findByRole("button", { name: /Guardar mi cambio/ }, { timeout: 5000 });
  // Otra persona guarda antes: cambia el texto y también el título.
  server = { version: 2, data: { ...server.data, titulo: "Nota del director", texto: "Texto nuevo" } };
  fireEvent.click(button);
  return within(await screen.findByRole("dialog", { name: "Alguien guardó antes que tú" }, { timeout: 5000 }));
}

test("muestra los dos lados, pide elegir lo que cambiaron los dos y guarda sobre la versión nueva", async () => {
  const dialog = await conflict();
  const titulo = dialog.getByRole("group", { name: /Título/ });
  expect(within(titulo).getByText("Nota corregida")).toBeTruthy();
  expect(within(titulo).getByText("Nota del director")).toBeTruthy();
  // El texto lo cambió solo la otra persona: llega elegido su valor, nada se sobrescribe.
  const texto = dialog.getByRole("group", { name: /Texto/ });
  expect((within(texto).getByRole("radio", { name: /Lo que se guardó antes/ }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(dialog.getByRole("button", { name: "Guardar lo elegido" }));
  expect(await dialog.findByRole("alert")).toBeTruthy();
  expect(puts).toHaveLength(1);
  fireEvent.click(within(titulo).getByRole("radio", { name: /Tu cambio/ }));
  fireEvent.click(dialog.getByRole("button", { name: "Guardar lo elegido" }));
  expect(await screen.findByRole("button", { name: /Guardada/ }, { timeout: 5000 })).toBeTruthy();
  expect(puts.at(-1)).toEqual({ version: 2, data: { id: "n1", titulo: "Nota corregida", texto: "Texto nuevo", creadoEl: "2026-11-13" } });
});

test("cancelar no guarda nada y conserva el aviso del conflicto", async () => {
  const dialog = await conflict();
  fireEvent.click(dialog.getByRole("button", { name: "Cancelar" }));
  expect(await screen.findByRole("button", { name: /Conserva tu borrador/ }, { timeout: 5000 })).toBeTruthy();
  expect(puts).toHaveLength(1);
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Alguien guardó antes que tú" })).toBeNull());
});

test("los valores de lista se leen como palabra", () => {
  expect(describeValue("alta")).toBe("Alta");
  expect(describeValue("en_revision")).toBe("En revision");
});
