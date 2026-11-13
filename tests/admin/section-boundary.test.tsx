import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SectionBoundary } from "@/components/admin/section-boundary";

afterEach(cleanup);

let fail = true;
function Fragile() {
  if (fail) throw new Error("dato inesperado");
  return <p>Sección lista</p>;
}

it("un error en una sección se queda en esa sección y se puede reintentar (C60)", () => {
  const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<div><h1>Equipo</h1><SectionBoundary what="las cuentas de asesores"><Fragile /></SectionBoundary></div>);
  expect(screen.getByRole("heading", { name: "Equipo" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("No pudimos mostrar las cuentas de asesores.");
  expect(screen.getByRole("alert").textContent).not.toContain("dato inesperado");
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(screen.getByText("Sección lista")).toBeTruthy();
  quiet.mockRestore();
});
