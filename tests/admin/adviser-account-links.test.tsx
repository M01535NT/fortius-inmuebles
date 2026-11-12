import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AdviserAccountLinks, parseAccounts } from "@/components/admin/adviser-account-links";

afterEach(cleanup);

it("oculta la vinculación de cuentas a quien no es administrador", () => {
  vi.stubGlobal("fetch", vi.fn());
  render(<AdviserAccountLinks isAdmin={false} advisers={[]} />);
  expect(screen.queryByText("Cuentas de asesores")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it("muestra el correo de cada cuenta sin su identificador interno (C57)", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ cuentas: [
    { user_id: "u1", email: "asesora@ejemplo.test", role: "editor", active: true, asesor_id: null },
    { user_id: "u2", email: "", role: "editor", active: true, asesor_id: null },
  ] }), { status: 200, headers: { "Content-Type": "application/json" } })));
  render(<AdviserAccountLinks isAdmin advisers={[]} />);
  expect(await screen.findByText("asesora@ejemplo.test")).toBeTruthy();
  expect(screen.getByText("Cuenta sin correo")).toBeTruthy();
  expect(screen.queryByText("u1")).toBeNull();
  expect(screen.queryByText("u2")).toBeNull();
  vi.unstubAllGlobals();
});

it("una respuesta con otra forma muestra un aviso con Reintentar en la sección, sin tumbar la pantalla (C60)", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ otra: "forma" }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ cuentas: [{ user_id: "u9", email: "nuevo@ejemplo.test", role: "editor", active: true, asesor_id: null }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  render(<AdviserAccountLinks isAdmin advisers={[]} />);
  expect((await screen.findByRole("alert")).textContent).toContain("No pudimos cargar las cuentas.");
  expect(screen.getByText("Cuentas de asesores")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("nuevo@ejemplo.test")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  vi.unstubAllGlobals();
});

it("parseAccounts descarta lo que no tiene la forma de una cuenta", () => {
  expect(parseAccounts(null)).toBeNull();
  expect(parseAccounts({ cuentas: "x" })).toBeNull();
  expect(parseAccounts({ cuentas: [null, { user_id: 1 }, { user_id: "a", role: "editor", active: true }] })).toEqual([{ user_id: "a", role: "editor", active: true, email: "", asesor_id: null }]);
});
