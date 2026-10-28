import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { terrenoFields } from "@/lib/formatos/levantamiento";
import { validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";

const photoId = "51000000-0000-4000-8000-000000000021";
const mapId = "51000000-0000-4000-8000-000000000022";
/** Un terreno como lo anota el asesor en la visita; medidas y colindancias quedan para la escritura. */
export const terrenoSample: Record<string, unknown> = {
  folio: "EXP-04A-001", idInmueble: "INM-TER-001", inmueble: "Predio de prueba, acceso por calle principal", colonia: "Zona de prueba", municipioEstado: "Tijuana, Baja California",
  usoSuelo: "habitacional", usoActual: "Terreno sin construcción", formaPendiente: "Irregular, con pendiente hacia el sur", accesoFisico: "Por vialidad pavimentada",
  fotoPrincipalId: photoId, croquisId: mapId,
  fechaVisita: "2026-10-04", asesor: "Ana, asesora responsable", ocupacion: "vacio", alcance: "completa",
  frente: 20, fondo: 25, cercas: "Malla en el acceso", superficieTerreno: 500, usoDocumento: "pendiente",
  aguaEstado: "Toma en la banqueta", electricidadEstado: "Poste frente al predio", vialidadEstado: "Calle pavimentada",
  ruta: "Por calle principal", referencias: "Frente a la escuela", siguienteAccion: "Pedir el plano para confirmar medidas y colindancias",
};

async function assets(): Promise<FormatoPdfAsset[]> {
  const photo = await sharp({ create: { width: 1200, height: 600, channels: 3, background: "#b8c4a7" } }).jpeg().toBuffer();
  const map = await sharp({ create: { width: 600, height: 1000, channels: 3, background: "#e0e6eb" } }).png().toBuffer();
  return [
    { id: photoId, kind: "foto", caption: "Vista principal de prueba", source: "Asesora durante la visita", observed_on: "2026-10-04", mime: "image/jpeg", sha256: createHash("sha256").update(photo).digest("hex"), bytes: photo },
    { id: mapId, kind: "croquis", caption: "Croquis esquemático de prueba", source: "Asesora", observed_on: "2026-10-04", mime: "image/png", sha256: createHash("sha256").update(map).digest("hex"), bytes: map },
  ];
}

it("el terreno pide lo que el asesor ve en la visita y deja medidas y colindancias para la escritura", () => {
  expect(terrenoFields.filter(field => field.required).map(field => field.key)).toEqual(["folio", "inmueble", "usoSuelo", "usoActual", "fechaVisita", "asesor", "ocupacion", "alcance"]);
  expect(validateFormato("04A", terrenoSample)).toEqual([]);
  expect(validateFormato("04A", { ...terrenoSample, frente: -2 })).toContain("Frente en m");
  expect(validateFormato("04A", { ...terrenoSample, superficieTerreno: undefined, croquisId: undefined })).toEqual([]);
});

it("exige la fotografía principal y genera el levantamiento con sus imágenes", async () => {
  await expect(prepareFormatoEmission("04A", terrenoSample)).rejects.toThrow(/fotografía principal/);
  const emission = await prepareFormatoEmission("04A", terrenoSample, await assets());
  const pdf = await PDFDocument.load(emission.bytes);
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
  expect(pdf.getTitle()).toMatch(/Levantamiento de terreno/);
  expect(pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/Subtype /Image")).length).toBeGreaterThanOrEqual(2);
});
