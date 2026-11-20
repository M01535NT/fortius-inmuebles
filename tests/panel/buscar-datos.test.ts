import { expect, test } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead } from "@/lib/domain/records";
import { filtrarAgrupado } from "@/lib/panel/buscar";
import { entradasDeDatos } from "@/lib/panel/datos/buscar-datos";

const datos = entradasDeDatos({
  clientes: [{ id: "c1", nombre: "Ana Ruiz", tipo: "propietario", telefono: "664 123 4567" } as Cliente],
  inmuebles: [{ slug: "casa-1", codigo: "FORTIUS-000007", titulo: "Casa en Playas", zona: "Playas" } as Property],
  leads: [{ id: "l1", nombre: "Ana Pérez", estado: "nuevo", telefono: "6641112222" } as Lead],
});
const ir = [{ id: "ir", titulo: "Agenda", grupo: "Ir a" as const }];

test("Buscar o crear: con una letra solo salen secciones; con dos, también los datos", () => {
  expect(filtrarAgrupado([...datos, ...ir], "a").every((e) => e.grupo === "Ir a")).toBe(true);
  expect(filtrarAgrupado([...datos, ...ir], "ana").map((e) => e.grupo)).toEqual(["Personas", "Consultas"]);
});

test("Buscar o crear: encuentra por teléfono sin espacios y por folio, y lleva a la ficha", () => {
  expect(filtrarAgrupado(datos, "6641234567").map((e) => e.id)).toEqual(["p-c1"]);
  expect(filtrarAgrupado(datos, "fortius-000007")[0]).toMatchObject({ grupo: "Inmuebles", ruta: "/panel/inmuebles?ver=FORTIUS-000007" });
  expect(filtrarAgrupado(datos, "Ana Ruiz")[0]).toMatchObject({ ruta: "/panel/directorio?id=c1", detalle: "Propietario · 664 123 4567" });
});

test("Buscar o crear: cada grupo de datos queda junto y con un máximo", () => {
  const muchas = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, titulo: `Ana ${i}`, grupo: "Personas" as const, ruta: "/" }));
  expect(filtrarAgrupado(muchas, "ana")).toHaveLength(5);
});
