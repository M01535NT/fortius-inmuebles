import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button, Sheet } from "@/components/admin/kit";

afterEach(cleanup);

/*
  BUG-C26: el panel lateral es `role="dialog" aria-modal="true"`, pero Tab desde su último control
  (o Shift+Tab desde el primero) sale al contenido de fondo, tapado por el velo. Con teclado el
  asesor pierde de vista dónde está el foco. El foco debe dar la vuelta dentro del panel.
  (jsdom no mueve el foco con Tab por sí mismo: la prueba exige que el panel lo haga.)
*/
function Pantalla() {
  return <>
    <button type="button">Fondo</button>
    <Sheet open onClose={() => undefined} title="Nuevo evento" footer={<Button variant="primary">Guardar</Button>}>
      <label htmlFor="titulo">Título</label><input id="titulo" />
    </Sheet>
  </>;
}
const enPanel = () => screen.getByRole("dialog", { name: "Nuevo evento" });
const controles = () => Array.from(enPanel().querySelectorAll<HTMLElement>("button:not([tabindex='-1']), input, select, textarea, a[href]"));

test("Tab desde el último control del panel vuelve al primero", () => {
  render(<Pantalla />);
  const lista = controles();
  const ultimo = lista.at(-1)!;
  ultimo.focus();
  fireEvent.keyDown(ultimo, { key: "Tab" });
  expect(document.activeElement).toBe(lista[0]);
});

test("Shift+Tab desde el primer control del panel va al último", () => {
  render(<Pantalla />);
  const lista = controles();
  lista[0].focus();
  fireEvent.keyDown(lista[0], { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(lista.at(-1));
});
