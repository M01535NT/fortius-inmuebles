import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SitioLogo } from "@/components/sitio/logo";

/*
  Logo del sitio público con el sistema de diseño (17/11/2026): solo existen su versión clara
  (azul real y rojo imperial) y su versión oscura (plata y oro); el lema sale solo cuando se pide.
*/
afterEach(cleanup);

const rellenos = (contenedor: HTMLElement) =>
  new Set([...contenedor.querySelectorAll("path")].map((trazo) => (trazo.getAttribute("fill") ?? "").toUpperCase()));

test("la versión clara usa azul real y rojo imperial", () => {
  const { container } = render(<SitioLogo tono="claro" />);
  expect(rellenos(container)).toEqual(new Set(["#012367", "#6D0809"]));
  expect(screen.getByRole("img", { name: "Fortius Inmuebles" })).toBeTruthy();
});

test("la versión oscura usa plata y oro", () => {
  const { container } = render(<SitioLogo tono="oscuro" />);
  expect(rellenos(container)).toEqual(new Set(["#F8F8FF", "#CBBA87"]));
});

test("en automático toma los colores del tema y el lema solo sale con leyenda", () => {
  const sinLema = render(<SitioLogo />).container.querySelectorAll("path").length;
  cleanup();
  const { container } = render(<SitioLogo leyenda />);
  expect(container.querySelectorAll("path").length).toBeGreaterThan(sinLema);
  // Sin color fijo: lo pone sitio.css según el tema.
  expect(rellenos(container)).toEqual(new Set([""]));
});
