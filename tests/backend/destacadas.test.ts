import { expect, test } from "vitest";
import { propiedades } from "../fixtures/propiedades";
import type { Property } from "@/data/propiedades";
import { barajasDestacadas, datosDestacada, marcaDestacada } from "@/lib/destacadas";

const [casa, depaRenta, nave] = propiedades as Property[];
const copia = (base: Property, extra: Partial<Property>): Property => ({ ...base, ...extra });

test("una sola clase de destacadas forma una baraja sin botones", () => {
  const barajas = barajasDestacadas([casa, copia(casa, { slug: "casa-2" })]);
  expect(barajas.map((b) => b.key)).toEqual(["todas"]);
  expect(barajas[0].properties).toHaveLength(2);
});

test("varios tipos dan «Todas», cada tipo en venta en su orden y la renta al final", () => {
  const terreno = copia(nave, { slug: "terreno-1", tipo: "terreno" });
  const barajas = barajasDestacadas([nave, depaRenta, casa, terreno]);
  expect(barajas.map((b) => b.label)).toEqual(["Todas", "Terrenos", "Casas", "Naves y bodegas", "En renta"]);
  expect(barajas.find((b) => b.key === "venta-casa")?.inventario).toEqual({ href: "/inventario?op=venta&tipo=casa", label: "Ver casas en venta" });
  expect(barajas.find((b) => b.key === "renta")?.properties.map((p) => p.slug)).toEqual([depaRenta.slug]);
  expect(barajas[0].inventario).toBeUndefined();
});

test("cada baraja lleva cinco cartas como máximo", () => {
  const casas = Array.from({ length: 8 }, (_, i) => copia(casa, { slug: `casa-${i}` }));
  const barajas = barajasDestacadas([...casas, depaRenta]);
  expect(barajas.find((b) => b.key === "todas")?.properties).toHaveLength(5);
  expect(barajas.find((b) => b.key === "venta-casa")?.properties).toHaveLength(5);
});

test("la marca y los datos siguen a la tarjeta del inventario", () => {
  expect(marcaDestacada(depaRenta)).toBe("Apartada de ejemplo");
  expect(marcaDestacada(copia(casa, { demo: false }))).toBe("Venta");
  expect(datosDestacada(copia(nave, { ficha: { terrenoM2: 900 } }))).toEqual(["900 m² terreno"]);
});
