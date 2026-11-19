import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test } from "vitest";
import { FichaVisor } from "@/components/sitio/ficha-visor";
import { TarjetaPropiedad } from "@/components/sitio/tarjeta-propiedad";
import { claveMunicipio, municipioDeInmueble, municipioDeZona, unirUbicacion } from "@/data/zonas";
import { aplicarFiltros, filtrosDesdeParams, paramsDesdeFiltros } from "@/lib/inventario-busqueda";
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
  BUG-C46: estando en /inventario, el menú, el pie o el buscador llevan a /inventario?op=renta. Desde la
  etapa 2 el servidor filtra con la dirección y la página se monta de cero con cada búsqueda nueva:
  la dirección se lee, filtra y se vuelve a escribir igual.
*/
test("ir a ?op=renta filtra y conserva la dirección", () => {
  const filtros = filtrosDesdeParams(new URLSearchParams("op=renta"));
  expect(aplicarFiltros([venta, renta], filtros).map((p) => p.slug)).toEqual(["r"]);
  expect(paramsDesdeFiltros(filtros)).toBe("op=renta");
});

/*
  BUG-C47: el panel pide «un enlace de YouTube o Vimeo» para el video; una página de YouTube no se
  reproduce en <video>: el visor de la ficha usa su reproductor incrustado.
*/
test("un video de YouTube se reproduce con su reproductor incrustado, no con <video>", () => {
  const { container } = render(<FichaVisor imagenes={[{ src: "/fixture.jpg", alt: "Fachada" }]} titulo="Casa de ensayo" videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
  fireEvent.click(screen.getByText("Video", { selector: "button, [role=tab]" }));
  expect(container.querySelector('video[src*="youtube.com/watch"]')).toBeNull();
  expect(container.querySelector('iframe[src*="youtube"]')).not.toBeNull();
});

/* BUG-C48: el mapa de la ficha buscaba «Ensenada, Tijuana»; la ficha toma el municipio de la zona. */
test("el mapa de un inmueble en Ensenada no lo busca en Tijuana", () => {
  expect(municipioDeZona("Ensenada")).toBe("Ensenada");
});

/* El municipio guardado manda sobre la colonia; si nada lo dice, no se supone Tijuana. */
test("el municipio del inmueble viene del dato guardado y nunca se inventa", () => {
  expect(municipioDeInmueble({ zona: "Chapultepec", municipio: "Ensenada" })).toBe("Ensenada");
  expect(municipioDeInmueble({ zona: "Chapultepec", direccionAproximada: "Chapultepec, Ensenada" })).toBe("Ensenada");
  expect(municipioDeInmueble({ zona: "Colonia de ensayo", direccionAproximada: "Colonia de ensayo" })).toBeUndefined();
  expect(claveMunicipio("Ensenada")).toBe("ensenada");
  expect(claveMunicipio("Mexicali")).toBeUndefined();
  expect(claveMunicipio(undefined)).toBeUndefined();
});

test("la ubicación se une sin vacíos ni repetidos", () => {
  expect(unirUbicacion("Playas", "Playas, Tijuana")).toBe("Playas, Tijuana");
  expect(unirUbicacion("", ", Tijuana")).toBe("Tijuana");
  expect(unirUbicacion("Zona Río", "ZONA RIO", "Tijuana")).toBe("Zona Río, Tijuana");
});

test("un tipo desconocido en ?tipo= se ignora y se muestra todo", () => {
  for (const tipo of ["mansion", "constructor", "toString"]) {
    const filtros = filtrosDesdeParams(new URLSearchParams(`tipo=${tipo}`));
    expect(filtros.tipo).toBe("todos");
    expect(aplicarFiltros([venta, renta], filtros)).toHaveLength(2);
  }
  expect(filtrosDesdeParams(new URLSearchParams("tipo=casa")).tipo).toBe("casa");
});

// BUG-C49: «1 baños» en la tarjeta del inventario.
test("la tarjeta dice «1 baño» en singular", () => {
  render(<TarjetaPropiedad property={{ ...venta, ficha: { banos: 1 } }} />);
  expect(screen.queryByText(/\b1 baños\b/)).toBeNull();
});
