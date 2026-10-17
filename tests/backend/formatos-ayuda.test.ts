import { expect, it } from "vitest";
import { aplicarPlantilla, ayudaCampo, ayudaSeccion, plantillasCampo } from "@/lib/formatos/ayuda";
import { valorFields } from "@/lib/formatos/valor-fields";

it("cada sección del 07 tiene su nota y cada campo de antecedentes su explicación", () => {
  for (const section of new Set(valorFields.map(field => field.section))) expect(ayudaSeccion("07", section), section).toBeTruthy();
  for (const field of valorFields.filter(item => item.section === "02 / Antecedentes")) expect(ayudaCampo("07", field.key), field.key).toBeTruthy();
});

it("las plantillas usan campos que existen y dejan «____» donde falta el dato", () => {
  const keys = new Set(valorFields.map(field => field.key));
  for (const field of valorFields) for (const plantilla of plantillasCampo("07", field.key))
    for (const [, key] of plantilla.text.matchAll(/\{(\w+)\}/g)) expect(keys.has(key), `${field.key}: {${key}}`).toBe(true);
  expect(aplicarPlantilla("Inmueble en {inmueble} de {propietario}.", { inmueble: " Calle Uno 10 " })).toBe("Inmueble en Calle Uno 10 de ____.");
  expect(plantillasCampo("07", "noExiste")).toEqual([]);
});

it("el uso de suelo ofrece las zonas del reglamento de Tijuana", () => {
  expect(plantillasCampo("07", "usoActual").map(p => p.text)).toEqual(["Habitacional", "Comercio y servicios", "Mixto", "Industrial", "Equipamiento urbano", "Turístico", "Agropecuario", "Especial de conservación"]);
});
