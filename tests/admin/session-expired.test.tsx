import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AdminShell } from "@/components/admin/admin-shell";
import * as api from "@/lib/admin/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/notas", useRouter: () => ({ push: vi.fn() }) }));

/*
  RP-19 (UX-04): la sesión vence mientras alguien escribe. La pantalla no se cierra: se pide
  entrar de nuevo encima, lo capturado sigue ahí y, al volver a entrar, se puede guardar.
*/
let expired = false;
let mfa = false;
const codes: string[] = [];
let user = { id: "staff", email: "staff@example.com", role: "admin" };
const logins: unknown[] = [];

function Capture() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState("");
  return <div>
    <label>Nota en captura<textarea value={text} onChange={e => setText(e.target.value)} /></label>
    <button type="button" onClick={() => void api.apiRequest("/api/admin/collections/notas/n1", "PUT", { data: { id: "n1", texto: text }, version: null }).then(() => setResult("Guardada"), e => setResult(api.errorMessage(e)))}>Guardar la nota</button>
    <p>{result}</p>
  </div>;
}

beforeEach(() => {
  expired = false; mfa = false; codes.length = 0;
  user = { id: "staff", email: "staff@example.com", role: "admin" };
  logins.length = 0;
  api.clearAdminCache();
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/session") return expired ? Response.json({ error: "Sin sesión" }, { status: 401 }) : Response.json({ user });
    if (url === "/api/auth/login") { logins.push(JSON.parse(String(init?.body))); if (mfa) return Response.json({ mfaRequired: true }); expired = false; return Response.json({ ok: true }); }
    if (url === "/api/auth/mfa/verify") { const { code } = JSON.parse(String(init?.body)); codes.push(code); if (code !== "123456") return Response.json({ error: "El código no coincide." }, { status: 400 }); expired = false; return Response.json({ ok: true }); }
    if (url.startsWith("/api/auth/")) return Response.json({ ok: true });
    if (expired) return Response.json({ error: "Sin sesión" }, { status: 401 });
    if (init?.method === "PUT") { const body = JSON.parse(String(init.body)); return Response.json({ record: { id: "n1", data: body.data, version: 1, createdAt: "2026-11-13", updatedAt: "2026-11-13" } }); }
    return Response.json({ records: [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("con la sesión vencida, lo capturado se conserva y se guarda al volver a entrar", async () => {
  render(<AdminShell><Capture /></AdminShell>);
  const box = await screen.findByLabelText("Nota en captura") as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: "Llamar al propietario el lunes" } });
  expired = true;
  fireEvent.click(screen.getByRole("button", { name: "Guardar la nota" }));
  expect(await screen.findByRole("heading", { name: "Tu sesión venció" })).toBeTruthy();
  // La pantalla de acceso no reemplazó al panel: la captura sigue montada y con su texto.
  expect(screen.queryByRole("heading", { name: "Acceso al panel" })).toBeNull();
  expect((screen.getByLabelText("Nota en captura") as HTMLTextAreaElement).value).toBe("Llamar al propietario el lunes");
  expect(screen.queryByText("Guardada")).toBeNull();
  expect((screen.getByLabelText("Correo") as HTMLInputElement).value).toBe("staff@example.com");
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar y seguir" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Tu sesión venció" })).toBeNull());
  expect(logins).toEqual([{ email: "staff@example.com", password: "clave-de-prueba-123" }]);
  expect((screen.getByLabelText("Nota en captura") as HTMLTextAreaElement).value).toBe("Llamar al propietario el lunes");
  fireEvent.click(screen.getByRole("button", { name: "Guardar la nota" }));
  expect(await screen.findByText("Guardada")).toBeTruthy();
});

test("si entra otra persona, la captura anterior no se conserva", async () => {
  render(<AdminShell><Capture /></AdminShell>);
  fireEvent.change(await screen.findByLabelText("Nota en captura"), { target: { value: "Dato del asesor anterior" } });
  expired = true;
  fireEvent.click(screen.getByRole("button", { name: "Guardar la nota" }));
  await screen.findByRole("heading", { name: "Tu sesión venció" });
  user = { id: "otra", email: "staff@example.com", role: "asesor" };
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar y seguir" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Tu sesión venció" })).toBeNull());
  expect((await screen.findByLabelText("Nota en captura") as HTMLTextAreaElement).value).toBe("");
});

test("al abrir el panel sin sesión se muestra el acceso de siempre", async () => {
  expired = true;
  render(<AdminShell><Capture /></AdminShell>);
  expect(await screen.findByRole("heading", { name: "Acceso al panel" })).toBeTruthy();
  expect(screen.queryByLabelText("Nota en captura")).toBeNull();
});

test("AUT-01: con la verificación en dos pasos, después de la contraseña se pide el código de la app", async () => {
  render(<AdminShell><Capture /></AdminShell>);
  fireEvent.change(await screen.findByLabelText("Nota en captura"), { target: { value: "Dato que no se pierde" } });
  expired = true; mfa = true;
  fireEvent.click(screen.getByRole("button", { name: "Guardar la nota" }));
  await screen.findByRole("heading", { name: "Tu sesión venció" });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar y seguir" }));
  const code = await screen.findByLabelText("Código de la app");
  fireEvent.change(code, { target: { value: "000000" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar y seguir" }));
  expect(await screen.findByText(/El código no coincide/)).toBeTruthy();
  expect(screen.getByLabelText("Código de la app")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Código de la app"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar y seguir" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Tu sesión venció" })).toBeNull());
  expect(codes).toEqual(["000000", "123456"]);
  expect((screen.getByLabelText("Nota en captura") as HTMLTextAreaElement).value).toBe("Dato que no se pierde");
});
