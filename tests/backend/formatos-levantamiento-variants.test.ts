import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import { LEVANTAMIENTO_TITLES, levantamientoFields, OPCIONES, USO_SUELO, type LevantamientoId } from "@/lib/formatos/levantamiento";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";

const PHOTO = "51000000-0000-4000-8000-000000000021", MAP = "51000000-0000-4000-8000-000000000022";
const IDS: LevantamientoId[] = ["04A", "04B", "04C", "04D", "04E", "04F", "04G"];

/** Lo mínimo que un asesor captura en la visita: lo obligatorio con un dato de prueba; lo opcional, vacío. */
export function variantSample(id: LevantamientoId): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of levantamientoFields(id)) {
    if (!field.required) continue;
    data[field.key] = field.type === "date" ? "2026-10-04" : field.type === "time" ? "10:00" : field.type === "number" ? 2 : field.type === "choice" ? field.options![0].value : "Dato de prueba";
  }
  return { ...data, folio: `PRUEBA-${id}`, inmueble: "Domicilio ficticio para revisión del formato", asesor: "Asesor de prueba", fotoPrincipalId: PHOTO };
}

async function assets(withMap: boolean): Promise<FormatoPdfAsset[]> {
  const photo = await sharp({ create: { width: 1000, height: 500, channels: 3, background: "#c5cfd0" } }).png().toBuffer();
  const sha256 = createHash("sha256").update(photo).digest("hex");
  const list: FormatoPdfAsset[] = [{ id: PHOTO, kind: "foto", caption: "Imagen de prueba", source: "Archivo sintético para revisión visual", observed_on: "2026-10-04", mime: "image/png", bytes: photo, sha256 }];
  if (withMap) list.push({ id: MAP, kind: "croquis", caption: "Croquis de prueba", source: "Esquema sintético", observed_on: "2026-10-04", mime: "image/png", bytes: photo, sha256 });
  return list;
}

it("los siete levantamientos siguen su Word sin base y referencia, respaldos ni discrepancias, y con uso de suelo (27/10/2026)", () => {
  for (const id of IDS) {
    const fields = levantamientoFields(id), keys = fields.map(field => field.key);
    expect(new Set(keys).size, id).toBe(keys.length);
    // Las etiquetas no se repiten: la lista «Qué falta» lleva a cada campo por su nombre.
    expect(new Set(fields.map(field => field.label)).size, id).toBe(fields.length);
    expect(keys, id).toEqual(expect.arrayContaining(["idInmueble", "folio", "usoSuelo", "fotoPrincipalId", "croquisId", "fechaVisita", "ocupacion", "alcance", "permisoFoto", "incidente", "siguienteAccion"]));
    expect(fields.find(field => field.key === "usoSuelo"), id).toMatchObject({ required: true, options: USO_SUELO });
    expect(keys.some(key => /Base$|Referencia$|Declarada$|Documental$|Medida$/.test(key) || /^(respaldo|discrepancia)/.test(key)), id).toBe(false);
    expect(JSON.stringify(fields), id).not.toMatch(/ \/ /);
    expect(fields.find(field => field.key === "ocupacion")?.options, id).toBe(OPCIONES.ocupacion);
    expect(fields.filter(field => field.required).length, id).toBeLessThanOrEqual(12);
  }
  expect(levantamientoFields("04B").filter(field => field.required).map(field => field.key)).toEqual(["folio", "inmueble", "usoSuelo", "tipoVivienda", "niveles", "fechaVisita", "asesor", "ocupacion", "alcance", "recamaras", "banos"]);
  expect(levantamientoFields("04C").map(field => field.key)).toEqual(expect.arrayContaining(["piso", "recamaras", "banos", "superficiePrivativa", "espacios", "elevador"]));
  expect(levantamientoFields("04F").map(field => field.key)).toEqual(expect.arrayContaining(["alturaLibre", "andenes", "puertasCarga", "superficieNave", "alimentacion", "origenAgua", "limitaciones"]));
  expect(levantamientoFields("04G").find(field => field.key === "tipoConjunto")?.options?.map(option => option.value)).toEqual(expect.arrayContaining(["oficinas", "departamentos", "plaza", "industrial"]));
  // Las listas con diagonales del Word son casillas con sus mismas opciones.
  expect(levantamientoFields("04B").find(field => field.key === "espaciosServicio")).toMatchObject({ type: "multi" });
  expect(levantamientoFields("04B").find(field => field.key === "espaciosServicio")?.options?.map(option => option.label)).toEqual(["Sala", "Comedor", "Lavado", "Bodega", "Patio", "Jardín", "Terraza"]);
  expect(levantamientoFields("04D").find(field => field.key === "circulacion")?.options?.map(option => option.label)).toEqual(["Rampas", "Escaleras", "Elevador"]);
});

it("exige la fotografía principal y rechaza cantidades negativas u opciones ajenas; el croquis y las superficies son opcionales", () => {
  const casa = variantSample("04B");
  expect(validateFormato("04B", casa)).toEqual([]);
  expect(validateFormato("04B", { ...casa, fotoPrincipalId: undefined })).toContain("Selecciona la fotografía principal adjunta");
  expect(validateFormato("04B", { ...casa, usoSuelo: undefined })).toContain("Uso de suelo");
  expect(validateFormato("04B", { ...casa, recamaras: -1 })).toContain("Recámaras");
  expect(validateFormato("04B", { ...casa, superficieTerreno: -5 })).toContain("Terreno en m²");
  expect(validateFormato("04B", { ...casa, horaInicio: "25:00" })).toContain("Hora de inicio");
  expect(validateFormato("04B", { ...casa, espaciosServicio: ["sala", "alberca"] })).toContain("Espacios de servicio");
  expect(validateFormato("04B", { ...casa, espaciosServicio: ["sala", "patio"], croquisId: "no-es-un-id" })).toEqual(["Selecciona el croquis adjunto"]);
  expect(validateFormato("04B", { ...casa, espaciosServicio: [], superficieTerreno: 160, croquisId: MAP })).toEqual([]);
});

it("las unidades de una plaza se revisan fila por fila", () => {
  const plaza = variantSample("04G");
  expect(validateFormato("04G", { ...plaza, unidades: [{ id: "L-01", tipo: "Local, café", area: "45", ocupacion: "Ocupado", acceso: "Medidor propio" }] })).toEqual([]);
  expect(validateFormato("04G", { ...plaza, unidades: [{ id: "", area: "45" }] })).toContain("Unidades, fila 1: ID unidad");
  expect(validateFormato("04G", { ...plaza, unidades: [{ id: "L-02", area: "muchos" }] })).toContain("Unidades, fila 1: Área m²");
});

it("produce cada variante con solo la fotografía principal, y con croquis cuando se eligió", async () => {
  for (const id of IDS) {
    const emission = await prepareFormatoEmission(id, variantSample(id), await assets(false));
    const pdf = await PDFDocument.load(emission.bytes);
    expect(pdf.getTitle()).toBe(LEVANTAMIENTO_TITLES[id]);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
  }
  const withMap = await prepareFormatoEmission("04B", { ...variantSample("04B"), croquisId: MAP }, await assets(true));
  const pdf = await PDFDocument.load(withMap.bytes);
  expect(pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/Subtype /Image")).length).toBeGreaterThanOrEqual(2);
});
