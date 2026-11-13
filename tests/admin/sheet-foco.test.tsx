import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Sheet } from "@/components/admin/kit";

afterEach(cleanup);

/*
  BUG-C06: el efecto de foco de Sheet depende de `onClose`. Las pantallas pasan una función nueva
  en cada render (Agenda, notas, operación, sistema), así que cada cambio de estado del padre
  vuelve a correr el efecto: devuelve el foco al botón que abrió el panel y luego al primer campo.
  En Agenda, cambiar «Hora» manda el foco a «Nuevo evento» a mitad de la captura.
*/
function Pantalla() {
  const [open, setOpen] = React.useState(false);
  const [hora, setHora] = React.useState("10:00");
  return <>
    <button type="button" onClick={() => setOpen(true)}>Agendar</button>
    <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo evento">
      <label htmlFor="titulo">Título</label><input id="titulo" />
      <label htmlFor="hora">Hora</label><input id="hora" value={hora} onChange={(e) => setHora(e.target.value)} />
    </Sheet>
  </>;
}

test("el panel no le quita el foco al campo que se está editando cuando el padre vuelve a renderizar", () => {
  render(<Pantalla />);
  const abrir = screen.getByRole("button", { name: "Agendar" });
  abrir.focus();
  fireEvent.click(abrir);
  expect(document.activeElement?.id).toBe("titulo");
  const hora = screen.getByLabelText("Hora");
  hora.focus();
  fireEvent.change(hora, { target: { value: "11:30" } });
  expect(document.activeElement?.id).toBe("hora");
});

test("al cerrar, el foco vuelve al botón que abrió el panel", () => {
  render(<Pantalla />);
  const abrir = screen.getByRole("button", { name: "Agendar" });
  abrir.focus();
  fireEvent.click(abrir);
  fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "12:00" } });
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(abrir);
});
