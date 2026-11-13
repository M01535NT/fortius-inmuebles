import * as React from "react";
import { act } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FichaSectionsNav, shouldHideSections } from "@/components/property/ficha-sections-nav";

/*
  Índice de secciones de la ficha: al bajar se oculta solo si ya va pegado arriba (sticky, 72 px).
  En una ficha con galería alta, a los 400 px el índice sigue en su lugar bajo las cifras;
  ocultarlo ahí dejaba un hueco en blanco (reportado por el titular, 13/11/2026).
*/
const sections = [{ id: "descripcion", label: "Descripción" }, { id: "ubicacion", label: "Ubicación" }];
let navTop = 600;

beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => { cb(0); return 1; });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ top: navTop, bottom: navTop + 72, left: 0, right: 0, width: 0, height: 72, x: 0, y: navTop, toJSON: () => ({}) }) as DOMRect);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.scrollY = 0; });

function scrollTo(y: number) {
  nav().style.top = "72px"; // en la página lo pone ficha.css
  act(() => { (window as { scrollY: number }).scrollY = y; window.dispatchEvent(new Event("scroll")); });
}
const nav = () => screen.getByRole("navigation", { name: "Secciones del inmueble" });

test("bajó más de 400 px pero el índice no está pegado: sigue visible", () => {
  render(<FichaSectionsNav sections={sections} />);
  navTop = 300; // galería alta: el índice sigue bajo las cifras
  scrollTo(450);
  expect(nav().hasAttribute("data-hidden")).toBe(false);
});

test("bajando con el índice pegado arriba se oculta, y al subir vuelve", () => {
  render(<FichaSectionsNav sections={sections} />);
  navTop = 72;
  scrollTo(900);
  expect(nav().hasAttribute("data-hidden")).toBe(true);
  scrollTo(700);
  expect(nav().hasAttribute("data-hidden")).toBe(false);
});

test("el foco con teclado lo vuelve a mostrar", () => {
  render(<FichaSectionsNav sections={sections} />);
  navTop = 72;
  scrollTo(900);
  fireEvent.focus(screen.getByRole("link", { name: "Descripción" }));
  expect(nav().hasAttribute("data-hidden")).toBe(false);
});

test("la regla: pegado (con 2 px de tolerancia), bajando y pasados 400 px", () => {
  expect(shouldHideSections({ y: 900, last: 800, navTop: 73.5, stickyTop: 72 })).toBe(true);
  expect(shouldHideSections({ y: 900, last: 800, navTop: 80, stickyTop: 72 })).toBe(false);
  expect(shouldHideSections({ y: 300, last: 200, navTop: 72, stickyTop: 72 })).toBe(false);
  expect(shouldHideSections({ y: 700, last: 800, navTop: 72, stickyTop: 72 })).toBe(false);
});
