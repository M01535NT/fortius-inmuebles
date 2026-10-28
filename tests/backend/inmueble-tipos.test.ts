import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TIPOS_INMUEBLE, TIPO_INMUEBLE_KEYS, tipoInmueble } from "@/lib/inmueble-tipos";
import { entrevistaFields } from "@/lib/formatos/entrevista";
import { interviewFields } from "@/lib/intake/interview";
import { checklistFor, levantamientoFor } from "@/lib/formatos/checklist-documentos";
import { TIPO_INMUEBLE_DESDE_ENTREVISTA, TIPOS_INMUEBLE as TIPOS_07 } from "@/lib/formatos/valor-fields";
import { TIPO_LABELS } from "@/data/propiedades";
import { LEGACY_PROPERTY_TYPES, PROPERTY_TYPES } from "@/lib/comercial/types";

/* Una sola lista de tipos de inmueble (titular, 27/10/2026): los siete de las plantillas, sin «Otro». */
describe("lista única de tipos de inmueble", () => {
  it("son los siete de las plantillas, cada uno con su levantamiento", () => {
    expect(TIPOS_INMUEBLE.map(tipo => `${tipo.label}:${tipo.levantamiento}`)).toEqual(["Terreno:04A", "Casa:04B", "Departamento:04C", "Oficina:04D", "Local comercial:04E", "Nave o bodega:04F", "Plaza o conjunto:04G"]);
    for (const tipo of TIPOS_INMUEBLE) expect(levantamientoFor(tipo.key)).toBe(tipo.levantamiento);
    // Lo guardado antes sigue funcionando.
    expect(tipoInmueble("nave")).toBe("nave-industrial");
    expect(levantamientoFor("nave")).toBe("04F");
    expect(tipoInmueble("otro")).toBeUndefined();
  });

  it("el primer contacto, la entrevista 02, la ficha, el sitio y el 07 ofrecen la misma lista", () => {
    const primerContacto = interviewFields("vender").find(field => field.key === "tipoInmueble");
    expect(primerContacto?.options).toEqual([...TIPO_INMUEBLE_KEYS, "por_definir"]);
    const entrevista = entrevistaFields.find(field => field.key === "tipoInmueble");
    expect(entrevista?.options?.map(option => option.value)).toEqual(TIPO_INMUEBLE_KEYS);
    expect(entrevista?.options?.some(option => option.value === "otro")).toBe(false);
    expect(Object.keys(TIPO_LABELS)).toEqual(TIPO_INMUEBLE_KEYS);
    // La opinión de valor conserva las palabras de su plantilla, con un equivalente para cada tipo.
    for (const key of TIPO_INMUEBLE_KEYS) expect(TIPOS_07).toContain(TIPO_INMUEBLE_DESDE_ENTREVISTA[key]);
    expect(PROPERTY_TYPES.slice(1)).toEqual(TIPOS_INMUEBLE.map(tipo => tipo.label));
    expect(LEGACY_PROPERTY_TYPES["Nave industrial"]).toBe("Nave o bodega");
  });

  it("oficina, nave y plaza piden sus licencias; departamento y plaza, el reglamento de condominio", () => {
    const codes = (tipo: string) => checklistFor({ tipoInmueble: tipo }).map(item => item.id);
    for (const tipo of ["oficina", "local", "nave-industrial", "nave", "plaza"]) expect(codes(tipo), tipo).toContain("D20");
    for (const tipo of ["departamento", "plaza"]) expect(codes(tipo), tipo).toContain("D19");
    expect(codes("casa")).not.toContain("D20");
  });

  it("la base acepta la plaza en la ficha, en el primer contacto y en el inmueble que nace de la captación", () => {
    const sql = readFileSync("supabase/migrations/20261028120000_property_type_plaza.sql", "utf8");
    expect(sql).toContain(`'nave-industrial','plaza')`);
    expect(sql).toContain(`'nave-industrial','plaza','por_definir')`);
    expect(sql).toContain(`when 'plaza' then 'Plaza o conjunto'`);
  });
});
