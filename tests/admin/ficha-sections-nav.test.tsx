import * as React from "react";
import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FichaSectionsNav } from "@/components/property/ficha-sections-nav";

/*
  Índice de secciones de la ficha: siempre visible. Decisión del titular del 13/11/2026
  («No quiero que se desaparezcan»), que reemplaza la regla I8 del 12/11 (ocultarlo al bajar).
*/
const sections = [{ id: "descripcion", label: "Descripción" }, { id: "ubicacion", label: "Ubicación" }];

afterEach(() => { cleanup(); (window as { scrollY: number }).scrollY = 0; });

function scrollTo(y: number) {
  act(() => { (window as { scrollY: number }).scrollY = y; window.dispatchEvent(new Event("scroll")); });
}
const nav = () => screen.getByRole("navigation", { name: "Secciones del inmueble" });

test("tras bajar mucho y volver a subir, el índice sigue visible y sin data-hidden", async () => {
  render(<FichaSectionsNav sections={sections} />);
  for (const y of [200, 450, 900, 2400, 4000, 3000, 1200, 300, 0]) {
    scrollTo(y);
    await act(() => new Promise(resolve => setTimeout(resolve, 20)));
    expect(nav().hasAttribute("data-hidden")).toBe(false);
  }
  expect(screen.getAllByRole("link").map(a => a.getAttribute("href"))).toEqual(["#descripcion", "#ubicacion"]);
});
