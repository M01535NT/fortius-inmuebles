import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateField } from "@/components/ui/date-field";
import { Combobox } from "@/components/ui/combobox";

afterEach(cleanup);

test("el campo de fecha manda AAAA-MM-DD en el formulario, se elige en el calendario y se puede quitar", async () => {
  render(<form data-testid="f"><DateField name="fecha" defaultValue="2026-11-14" aria-label="Fecha de la cita" /></form>);
  const form = screen.getByTestId("f") as HTMLFormElement;
  expect(new FormData(form).get("fecha")).toBe("2026-11-14");
  fireEvent.click(screen.getByRole("button", { name: "Fecha de la cita" }));
  fireEvent.click(await screen.findByRole("button", { name: /20 de noviembre/i }));
  expect(new FormData(form).get("fecha")).toBe("2026-11-20");
  fireEvent.click(screen.getByRole("button", { name: "Quitar fecha" }));
  expect(new FormData(form).get("fecha")).toBe("");
});

test("el selector con buscador filtra sin acentos y elige con Enter", async () => {
  const Demo = () => { const [v, setV] = React.useState(""); return <Combobox aria-label="Persona" value={v} onChange={setV} name="persona" options={[{ value: "p1", label: "José Peña" }, { value: "p2", label: "Ana Ruiz" }]} />; };
  render(<Demo />);
  fireEvent.click(screen.getByRole("combobox", { name: "Persona" }));
  const search = await screen.findByPlaceholderText("Buscar…");
  fireEvent.change(search, { target: { value: "jose pena" } });
  expect(screen.queryByText("Ana Ruiz")).toBeNull();
  fireEvent.keyDown(search, { key: "Enter" });
  expect(screen.getByRole("combobox", { name: "Persona" }).textContent).toContain("José Peña");
});

test("el calendario no se vuelve a montar cuando la pantalla se dibuja de nuevo con la ventanita abierta", async () => {
  const Demo = ({ n }: { n: number }) => <div data-n={n}><DateField defaultValue="2026-11-14" aria-label="Fecha" /></div>;
  const view = render(<Demo n={1} />);
  fireEvent.click(screen.getByRole("button", { name: "Fecha" }));
  const day = await screen.findByRole("button", { name: /20 de noviembre/i });
  view.rerender(<Demo n={2} />);
  expect(day.isConnected).toBe(true);
});
