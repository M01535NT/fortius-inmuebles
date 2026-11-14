import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test } from "vitest";
import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyLocation } from "@/components/property/property-location";
import type { Property } from "@/data/propiedades";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });

const base: Omit<Property, "slug" | "titulo" | "operacion" | "publicadaEl"> = {
  codigo: "T", tipo: "casa", zona: "Centro", direccionAproximada: "Centro", precio: { modalidad: "consulta" },
  descripcion: [], ficha: {}, amenidades: [], galeria: [{ src: "/fixture.jpg", alt: "Fachada de ensayo" }], asesorId: "a", creditoDisponible: true,
  puntosDeInteres: [], destacada: false, estado: "disponible", demo: false,
};
const venta: Property = { ...base, slug: "v", titulo: "Casa de ensayo en venta", operacion: "venta", publicadaEl: "2026-01-01" };
const renta: Property = { ...base, slug: "r", titulo: "Casa de ensayo en renta", operacion: "renta", publicadaEl: "2026-02-01" };

/*
  BUG-C46: InventoryExplorer lee los filtros de la URL solo al montar y después reescribe la URL con
  su estado. Estando en /inventario, el menú, el pie o el buscador navegan a /inventario?op=renta con
  el router (misma página, no se vuelve a montar); el servidor manda otra vez la lista y el efecto
  regresa la URL a /inventario: se siguen viendo todas, también las de venta.
*/
test("estando en /inventario, ir a ?op=renta filtra y conserva la URL", async () => {
  window.history.replaceState(null, "", "/inventario");
  const view = render(<InventoryExplorer propiedades={[venta, renta]} />);
  await act(async () => {});
  window.history.pushState(null, "", "/inventario?op=renta");
  view.rerender(<InventoryExplorer propiedades={[venta, renta].map(p => ({ ...p }))} />);
  await act(async () => {});
  expect(window.location.search).toBe("?op=renta");
  expect(screen.queryByText("Casa de ensayo en venta")).toBeNull();
});

/*
  BUG-C47: el panel pide «un enlace de YouTube o Vimeo» para el video (property-form.tsx), pero la
  ficha lo pone en un <video src>, que no reproduce una página de YouTube: la pestaña «Video» sale vacía.
*/
test("un video de YouTube se reproduce con su reproductor incrustado, no con <video>", () => {
  const { container } = render(<PropertyGallery imagenes={[{ src: "/fixture.jpg", alt: "Fachada" }]} titulo="Casa de ensayo" videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
  fireEvent.click(screen.getByRole("button", { name: /Video/ }));
  expect(container.querySelector('video[src*="youtube.com/watch"]')).toBeNull();
  expect(container.querySelector('iframe[src*="youtube"]')).not.toBeNull();
});

/*
  BUG-C48: el mapa de la ficha arma la consulta con «Tijuana» fijo; un inmueble en Ensenada, Rosarito
  o Tecate busca «Ensenada, Tijuana, Baja California». Ya existe municipioDeZona (data/zonas.ts).
*/
test("el mapa de un inmueble en Ensenada no lo busca en Tijuana", () => {
  const { container } = render(<PropertyLocation property={{ ...venta, zona: "Ensenada" }} />);
  const src = decodeURIComponent(container.querySelector("iframe")!.getAttribute("src")!);
  expect(src).not.toMatch(/Ensenada, Tijuana/);
});

// BUG-C49: «1 baños» en la tarjeta del inventario (y en la baraja de destacadas, lib/destacadas.ts).
test("la tarjeta dice «1 baño» en singular", () => {
  render(<PropertyCard property={{ ...venta, ficha: { banos: 1 } }} />);
  expect(screen.queryByText(/\b1 baños\b/)).toBeNull();
});
