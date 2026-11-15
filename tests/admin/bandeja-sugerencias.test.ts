import { expect, it } from "vitest";
import { sugerirDestinos } from "@/lib/admin/bandeja-sugerencias";

/* LV-10d: «¿Dónde se guarda?» sugiere por coincidencia con el nombre del archivo, nunca por su contenido. */
const inmuebles = [{ slug: "terreno-rosarito", titulo: "Terreno en Rosarito", codigo: "FORTIUS-000217" }, { slug: "casa-otay", titulo: "Casa en Otay", codigo: "FORTIUS-000301" }];
const personas = [{ id: "cli-1", nombre: "Carlos Vega" }, { id: "cli-2", nombre: "Ana Ruiz" }];
const operaciones = [{ id: "op-1", folio: "EXP-000342", unidad: "", cliente_id: "cli-1", propiedad_slug: "terreno-rosarito" }];
const doc = (titulo: string, nombre_original = "x.pdf") => ({ titulo, nombre_original });

it("una operación que coincide va primero y arrastra su inmueble y su persona", () => {
  const [primera, segunda] = sugerirDestinos(doc("INE Carlos Vega"), inmuebles, operaciones, personas);
  expect(primera).toMatchObject({ tipo: "operacion", label: "EXP-000342", destino: { expedienteId: "op-1", propiedadSlug: "terreno-rosarito", clienteId: "cli-1" } });
  expect(segunda).toMatchObject({ tipo: "persona", label: "Carlos Vega", destino: { expedienteId: null, propiedadSlug: null, clienteId: "cli-1" } });
});

it("reconoce acentos, mayúsculas y el número del código o del folio", () => {
  expect(sugerirDestinos(doc("Predial", "PREDIAL_rosaríto.pdf"), inmuebles, [], personas)[0]?.label).toBe("Terreno en Rosarito");
  expect(sugerirDestinos(doc("Avalúo 000301"), inmuebles, [], personas)[0]?.label).toBe("Casa en Otay");
  expect(sugerirDestinos(doc("Contrato 000342"), inmuebles, operaciones, personas)[0]?.tipo).toBe("operacion");
});

it("las palabras comunes no cuentan y sin coincidencia no sugiere nada", () => {
  expect(sugerirDestinos(doc("Escritura terreno casa", "fortius.pdf"), inmuebles, operaciones, personas)).toEqual([]);
  expect(sugerirDestinos(doc("Levantamiento topografico"), inmuebles, operaciones, personas)).toEqual([]);
});

it("un año en el nombre no coincide con los códigos que lo llevan", () => {
  const conAnio = [{ slug: "local-rio", titulo: "Local comercial en Zona Río", codigo: "INM-2026-0002" }];
  expect(sugerirDestinos(doc("Predial 2026"), conAnio, [], [])).toEqual([]);
});

it("ofrece como máximo tres destinos", () => {
  const muchos = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, nombre: `Rosarito ${i}` }));
  expect(sugerirDestinos(doc("Rosarito"), inmuebles, [], muchos)).toHaveLength(3);
});
