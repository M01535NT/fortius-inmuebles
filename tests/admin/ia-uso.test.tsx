import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IaUsoSection } from "@/components/admin/ia-uso";

/* IA-02: Configuración muestra el gasto del mes de la lectura con IA y deja cambiar el tope. */
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const uso = { gastoUsd: 12.5, topeUsd: 20, origenTope: "servidor", lecturas: 3, desde: "2026-11-01", disponible: true };

it("dice cuánto se gastó en el mes, cuántas lecturas y el tope vigente", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => json({ uso })));
  render(<IaUsoSection />);
  expect(await screen.findByText("$12.50 USD")).toBeTruthy();
  expect(screen.getByText(/gastados en noviembre · 3 lecturas/)).toBeTruthy();
  expect(screen.getByRole("img", { name: "63 % del tope del mes" })).toBeTruthy();
  expect((screen.getByLabelText("Tope de gasto al mes, en dólares") as HTMLInputElement).value).toBe("20");
  expect(screen.getByText(/configuración del servidor/)).toBeTruthy();
});

it("al llegar al tope avisa que la lectura está en pausa; si no está activa, lo dice", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => json({ uso: { ...uso, gastoUsd: 20, origenTope: "configuracion", disponible: false } })));
  render(<IaUsoSection guardado={20} />);
  expect(await screen.findByText(/la lectura está en pausa/)).toBeTruthy();
  expect(screen.getByText(/todavía no está activa/)).toBeTruthy();
});

it("si no se puede consultar, avisa con Reintentar y el campo sigue disponible", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(json({ error: "El gasto de la lectura con IA lo ve el director" }, 403)).mockResolvedValueOnce(json({ uso }));
  vi.stubGlobal("fetch", fetchMock);
  render(<IaUsoSection />);
  expect((await screen.findByRole("alert")).textContent).toContain("lo ve el director");
  expect(screen.getByLabelText("Tope de gasto al mes, en dólares")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("$12.50 USD")).toBeTruthy();
});
