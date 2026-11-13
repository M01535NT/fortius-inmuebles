import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import AdminError from "@/app/admin/error";

afterEach(cleanup);

test("SIM-11: el error del panel tranquiliza, permite reintentar y vuelve a Hoy, sin detalles técnicos", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const retry = vi.fn();
  render(<AdminError error={new Error("fallo interno con datos")} retry={retry} />);
  expect(screen.getByRole("heading", { name: "No pudimos abrir esta página." })).toBeTruthy();
  expect(screen.getByText(/Tus datos están a salvo/)).toBeTruthy();
  expect(screen.queryByText(/fallo interno/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: "Volver a Hoy" }).getAttribute("href")).toBe("/admin");
});
