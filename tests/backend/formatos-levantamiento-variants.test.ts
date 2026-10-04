import { expect, it } from "vitest";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import { LEVANTAMIENTO_TITLES, type LevantamientoId } from "@/lib/formatos/levantamiento";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";

export function variantSample(id: LevantamientoId): Record<string, unknown> {
  const data = Object.fromEntries(formatoById(id).fields.filter((field) => field.type !== "levantamientoRows").map((field) => [field.key,
    field.type === "date" ? "2026-10-04" : field.type === "time" ? "10:00" : field.type === "choice" ? field.options?.find((option) => option.value === "NV")?.value ?? field.options?.[0].value : "NV",
  ]));
  const sample: Record<string, unknown> = { ...data, folio: `PRUEBA-${id}`, idInmueble: `INM-${id}`, inmueble: "Domicilio ficticio para revisión del formato", asesor: "Asesor de prueba", horaTermino: "11:30", permisoFoto: "autorizado", permisoMedicion: "NV", referenciaPermiso: "Dato de prueba para autorización", respaldosEstado: "sin_respaldo", discrepanciasEstado: "ninguna", fotoPrincipalId: "51000000-0000-4000-8000-000000000021", croquisId: "51000000-0000-4000-8000-000000000022", siguienteAccion: "Solicitar documentación", elaboro: "Capturista de prueba", reviso: "Revisor de prueba" };
  if (id === "04G") Object.assign(sample, { numeroUnidades: "2", numeroUnidadesBase: "D", numeroUnidadesReferencia: "Declaración sintética de prueba", unidadesEstado: "completo", unidades: ["L-01", "L-02"].map((unit) => ({ id: unit, tipo: "Local", uso: "Comercio declarado", area: "100", base: "D: declaración sintética del propietario", ocupacion: "Declarada vacía; revisión pendiente", accesoMedidor: "Medidor y acceso individuales, sin prueba funcional" })) });
  if (id === "04F") Object.assign(sample, { transformadorKva: "1000", transformadorKvaBase: "C", transformadorKvaReferencia: "Documento sintético de prueba del transformador", demandaKw: "200", demandaKwBase: "D", demandaKwReferencia: "Declaración sintética del ocupante", limitacionesInformes: "La visita se limita a observación visual de zonas autorizadas. No se confirma carga admisible de piso, capacidad disponible, suficiencia contra incendio ni seguridad eléctrica. Se requiere revisar los documentos e informes técnicos antes de definir la aptitud para el uso pretendido." });
  return sample;
}

it("incluye distribución, componentes y servicios propios de cada original", () => {
  const requirements = {
    "04B": ["recamaras", "mediosBanos", "cajonesTechados", "ampliaciones", "climaSituacion"],
    "04C": ["privativaDeclarada", "bodegaDeclarada", "indiviso", "areasComunes", "medidoresSituacion"],
    "04D": ["rentableDocumental", "privados", "alturaLibre", "aforo", "datosSituacion"],
    "04E": ["localDeclarada", "frente", "escaparate", "usoAutorizado", "aguaSituacion"],
    "04F": ["naveMedida", "patioDeclarada", "alturaLibre", "andenes", "transformadorKva", "demandaKw", "capacidadDisponible", "descargaProceso", "contraIncendioSituacion"],
    "04G": ["comunesDeclarada", "unidades", "ocupacion", "accesoPublico", "electricidadSituacion"],
  };
  for (const [id, keys] of Object.entries(requirements)) for (const key of keys) expect(formatoById(id).fields.some((field) => field.key === key), `${id}: ${key}`).toBe(true);
});

it("rechaza superficies negativas y medición sin permiso en cada variante", () => {
  for (const id of ["04B", "04C", "04D", "04E", "04F", "04G"]) {
    const measured = formatoById(id).fields.find((field) => field.key.endsWith("Medida"))!;
    const errors = validateFormato(id, { [measured.key]: "-2", permisoMedicion: "no_autorizado" });
    expect(errors.some((error) => /superficie.*valor no negativo/.test(error))).toBe(true);
    expect(errors.some((error) => /medición sin autorización/.test(error))).toBe(true);
  }
});

it("exige la identificación y la base del área de cada unidad de una plaza", () => {
  const errors = validateFormato("04G", { unidadesEstado: "completo", unidades: [{ id: "L-01", area: "100", tipo: "Local", uso: "NV", ocupacion: "NV", accesoMedidor: "NV" }] });
  expect(errors).toContain("unidades, fila 1: Base y referencia del área");
});

it("no confunde kVA con kW ni acepta datos comprobados sin referencia", () => {
  const data = { ...variantSample("04F"), transformadorKva: "1000", transformadorKvaBase: "C", transformadorKvaReferencia: "Placa y documento de prueba", demandaKw: "200", demandaKwBase: "D", demandaKwReferencia: "Declaración de prueba" };
  expect(validateFormato("04F", data)).toEqual([]);
  expect(validateFormato("04F", { ...data, transformadorKvaReferencia: "NV" })).toContain("transformadorKva: identifica la evidencia o método que respalda la base");
  expect(validateFormato("04F", { ...data, demandaKw: "-10" })).toContain("demandaKw: valor numérico no negativo, NV o NA");
});

it("rechaza IDs repetidos y un registro completo que contradice la cantidad de unidades", () => {
  const row = { id: "L-01", tipo: "Local", uso: "NV", area: "NV", base: "NV", ocupacion: "NV", accesoMedidor: "NV" };
  const data = { ...variantSample("04G"), numeroUnidades: "2", numeroUnidadesBase: "D", numeroUnidadesReferencia: "Declaración de prueba", unidadesEstado: "completo", unidades: [row, { ...row, id: "L-02" }] };
  expect(validateFormato("04G", data)).toEqual([]);
  expect(validateFormato("04G", { ...data, unidades: [row] })).toContain("El número de unidades no coincide con el registro completo");
  expect(validateFormato("04G", { ...data, unidades: [row, row] })).toContain("unidades: ID duplicado");
});

it("produce cada variante con sus dos imágenes y sin campos duplicados", async () => {
  const bytes = await sharp({ create: { width: 1000, height: 500, channels: 3, background: "#c5cfd0" } }).png().toBuffer();
  for (const id of ["04B", "04C", "04D", "04E", "04F", "04G"] as const) {
    const data = variantSample(id);
    expect(validateFormato(id, data)).toEqual([]);
    const keys = formatoById(id).fields.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    const assets: FormatoPdfAsset[] = [{ id: String(data.fotoPrincipalId), kind: "foto", caption: "Imagen de prueba", source: "Archivo sintético para revisión visual", observed_on: "2026-10-04", mime: "image/png", bytes, sha256: createHash("sha256").update(bytes).digest("hex") }, { id: String(data.croquisId), kind: "croquis", caption: "Croquis de prueba", source: "Archivo sintético para revisión visual", observed_on: "2026-10-04", mime: "image/png", bytes, sha256: createHash("sha256").update(bytes).digest("hex") }];
    const emission = await prepareFormatoEmission(id, data, assets);
    const pdf = await PDFDocument.load(emission.bytes);
    expect(pdf.getTitle()).toBe(LEVANTAMIENTO_TITLES[id]);
    expect(pdf.getPageCount()).toBeGreaterThan(2);
  }
});
