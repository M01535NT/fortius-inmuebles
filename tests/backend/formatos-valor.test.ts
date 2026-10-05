import { expect, it } from "vitest";
import { comparable, valorSample, completeValorSample } from "./fixtures/valor";
import { calcularValor, calcularComparables, calcularConstruccion, validarValor, valorReviewSnapshot } from "@/lib/formatos/valor";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { createHash } from "node:crypto";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";
import { draftWrite } from "@/lib/formatos/schemas";

it("homologa moneda y factores sin promediar filas excluidas", () => {
  const rows = [comparable("A", 100000), comparable("B", 110000), comparable("C", 90000)].map((row) => ({ ...row, moneda: "USD", fZona: 1.1, fNegociacion: 0.9 }));
  const result = calcularComparables([...rows, { id: "X", seleccion: "excluir", razonSeleccion: "Sin evidencia" }], valorSample, "oferta");
  expect(result.errors).toEqual([]);
  expect(result.media).toBe(19800);
  expect(result.rows).toHaveLength(3);
});

it("bloquea la media si falta una fuente seleccionada, hay duplicados o no existe conversión", () => {
  const rows = [comparable("A", 100), comparable("B", 100), comparable("C", 100)];
  expect(calcularComparables([{ ...rows[0], fuente: "" }, ...rows.slice(1)], valorSample, "oferta").media).toBeNull();
  expect(calcularComparables([rows[0], rows[0], rows[2]], valorSample, "oferta").errors.join(" ")).toMatch(/duplicad/);
  expect(calcularComparables(rows.map((row) => ({ ...row, moneda: "USD" })), { ...valorSample, tipoCambio: "" }, "oferta").media).toBeNull();
  expect(calcularComparables(rows.map((row, i) => ({ ...row, tipoPrecio: i === 0 ? "cierre" : "oferta" })), valorSample, "oferta").media).toBeNull();
});

it("reproduce Ross-Heidecke, capitalización neta y conciliación sin agregar el terreno al mercado construido", () => {
  const c = calcularConstruccion((valorSample.construcciones as Record<string, unknown>[])[0]);
  expect(c.ross).toBe(0.12);
  expect(c.heidecke).toBe(0.0252);
  expect(c.parcial).toBeCloseTo(1029388.8, 6);
  const result = calcularValor(valorSample);
  expect(result.errors).toEqual([]);
  expect(result.mercado).toBe(2000000);
  expect(result.ingresos?.noi).toBe(97200);
  expect(result.ingresos?.valor).toBe(1620000);
  expect(result.fisico?.valor).toBeCloseTo(1534388.8, 6);
  expect(result.indicador).toBeCloseTo(1788597.2, 6);
  expect(result.concluido).toBe(1789000);
});

it("invalida revisión anterior, superficies contradictorias, fechas y pesos incompletos", () => {
  expect(validarValor(valorSample, "2026-10-04")).toEqual([]);
  for (const patch of [{ versionRevisada: 2 }, { indicadorRevisado: 100 }, { superficiesEstado: "pendiente" }, { construcciones: [{ ...(valorSample.construcciones as Record<string, unknown>[])[0], superficie: 99 }] }, { pesoMercado: 40 }, { fechaPrecio: "irrelevante", fechaValor: "2026-10-05" }, { revisarAntes: "2026-10-03" }]) {
    expect(validarValor({ ...valorSample, ...patch }, "2026-10-04")).not.toEqual([]);
  }
  expect(calcularValor({ ...valorSample, indicadorRevisado: 100 }).concluido).toBeNull();
});

it("un enfoque excluido exige razón y no exige sus parámetros vacíos", () => {
  const data = { ...valorSample, pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0, indicadorRevisado: 2000000, comparablesRenta: [], comparablesTerreno: [], construcciones: [], obras: [], vacanciaPct: "", gastosPct: "", tasaCapPct: "", factorTerreno: "", inventarioFisico: "", metodoFisico: "" };
  Object.assign(data, { revisionDatos: valorReviewSnapshot(data) });
  expect(validarValor(data, "2026-10-04")).toEqual([]);
  expect(validarValor({ ...data, razonFisico: "" }, "2026-10-04")).toContain("Justificación del enfoque físico");
});

it("captura las secciones del Excel y valida sin exigir datos de enfoques excluidos", () => {
  const fields = formatoById("07").fields;
  for (const key of ["fechaValor", "fechaEmision", "baseMercado", "superficiesEstado", "juridicaEstado", "latitud", "cimentacion", "comparablesTerreno", "comparablesConstruccion", "comparablesRenta", "construcciones", "obras", "fotografias", "indicadorRevisado", "versionRevisada"]) expect(fields.some((field) => field.key === key), key).toBe(true);
  expect(new Set(fields.map((field) => field.key)).size).toBe(fields.length);
  const data = { ...Object.fromEntries(fields.map((field) => [field.key, field.type === "choice" ? field.options?.[0].value : field.type === "date" ? "2026-10-04" : field.type === "number" || field.type === "money" ? 1 : "Dato sintético de prueba"])), ...valorSample, privativa: "", documentosEstado: "revisados", documentos: [{ documento: "Plano de prueba", fecha: "2026-09-30", referencia: "Evidencia sintética" }] };
  Object.assign(data, { revisionDatos: valorReviewSnapshot(data) });
  expect(validateFormato("07", data)).toEqual([]);
  expect(validateFormato("07", { ...data, comparablesConstruccion: [{ id: "Vacío", seleccion: "incluir" }] }).length).toBeGreaterThan(0);
});

it("exige repetir revisión si cambian fuentes aunque el indicador conserve el mismo valor", () => {
  expect(validarValor({ ...valorSample, fuenteConstruccion: "Una fuente diferente" }, "2026-10-04")).toContain("Los datos cambiaron después de la revisión");
});

it("genera el informe con imágenes, índice y cálculos; rechaza una imagen ausente", async () => {
  const data = completeValorSample();
  const bytes = await sharp({ create: { width: 1100, height: 500, channels: 3, background: "#ccd6d9" } }).png().toBuffer();
  const assets: FormatoPdfAsset[] = [
    { id: String(data.fotoPrincipalId), kind: "foto", caption: "Fotografía sintética", source: "Prueba de presentación, no visita real", observed_on: "2026-09-30", mime: "image/png", sha256: createHash("sha256").update(bytes).digest("hex"), bytes },
    { id: String(data.croquisId), kind: "croquis", caption: "Croquis sintético", source: "Prueba de presentación", observed_on: "2026-09-30", mime: "image/png", sha256: createHash("sha256").update(bytes).digest("hex"), bytes },
  ];
  const result = await prepareFormatoEmission("07", data, assets);
  const pdf = await PDFDocument.load(result.bytes);
  expect(pdf.getTitle()).toBe("Opinión de valor comercial");
  expect(pdf.getPageCount()).toBeGreaterThan(10);
  expect(pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/Subtype /Image")).length).toBeGreaterThanOrEqual(2);
  await expect(prepareFormatoEmission("07", data, assets.slice(0, 1))).rejects.toThrow(/imágenes/);
});

it("no acepta fuentes desconocidas, vidas útiles inventadas en blanco o documentos inválidos", () => {
  const rows = [comparable("A", 100), comparable("B", 100), comparable("C", 100)];
  expect(calcularComparables([{ ...rows[0], fuente: "NV" }, ...rows.slice(1)], valorSample, "oferta").media).toBeNull();
  expect(calcularConstruccion({ ...(valorSample.construcciones as Record<string, unknown>[])[0], fuenteEdadVida: "pendiente" }).parcial).toBeNull();
  expect(calcularValor({ ...valorSample, origenTerreno: "NV", fuenteTerreno: "NV" }).fisico).toBeNull();
  expect(validarValor({ ...valorSample, documentosEstado: "revisados", documentos: [{}] }, "2026-10-04")).toContain("Documentos examinados: registro incompleto");
});

it("guarda fichas con veinte columnas y una revisión extensa dentro del límite del borrador", () => {
  const data = completeValorSample();
  expect(draftWrite.safeParse({ version: 1, data }).success).toBe(true);
  expect(draftWrite.safeParse({ version: 1, data: { revisionDatos: "a".repeat(40000) } }).success).toBe(true);
  expect(draftWrite.safeParse({ version: 1, data: { otra: "a".repeat(40000) } }).success).toBe(false);
});

it("rechaza usar el croquis como fotografía del reporte", () => {
  const data = { ...valorSample, fotografias: [{ assetId: valorSample.croquisId, pie: "Vista" }] };
  expect(validarValor(data, "2026-10-04")).toContain("El croquis no puede usarse como fotografía");
});
