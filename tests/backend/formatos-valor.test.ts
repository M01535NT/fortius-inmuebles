import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { expect, it } from "vitest";
import { comparable, valorSample, completeValorSample } from "./fixtures/valor";
import { calcularComparables, calcularConstruccion, calcularValor, valorAssetIds } from "@/lib/formatos/valor";
import { valorFields, VALOR_TABLES } from "@/lib/formatos/valor-fields";
import { celdasValor, llenarHoja, valorExcel } from "@/lib/formatos/valor-excel";
import { importeEnLetra } from "@/lib/formatos/letras";
import { validateFormato } from "@/lib/formatos/catalog";
import { draftWrite } from "@/lib/formatos/schemas";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";

it("homologa moneda y factores como la plantilla; un factor vacío vale 1", () => {
  const rows = [comparable("A", 100000), { ...comparable("B", 5000), moneda: "USD", fZona: 1.1 }, { ...comparable("C", 90000), fNegociacion: undefined }];
  const result = calcularComparables(rows, { tipoCambio: 20 });
  expect(result.rows.map((row) => row.precioMxn)).toEqual([100000, 100000, 90000]);
  expect(result.rows.map((row) => row.homologado)).toEqual([1000, 1100, 900]);
  expect(result.media).toBe(1000);
});

it("calcula el valor unitario solo con tres o más comparables completos", () => {
  expect(calcularComparables([comparable("A", 1), comparable("B", 1)], {}).media).toBeNull();
  expect(calcularComparables([comparable("A", 1), comparable("B", 1), { ...comparable("C", 1), precio: undefined }], {}).media).toBeNull();
  expect(calcularComparables([comparable("A", 1), comparable("B", 1), { ...comparable("C", 1), moneda: "USD" }], {}).media).toBeNull();
});

it("reproduce Ross-Heidecke, capitalización neta, físico y conciliación de la plantilla", () => {
  const c = calcularConstruccion((valorSample.construcciones as Record<string, unknown>[])[0]);
  expect(c.ross).toBeCloseTo(0.12, 10);
  expect(c.heidecke).toBe(0.0252);
  expect(c.parcial).toBeCloseTo(1029388.8, 6);
  const result = calcularValor(valorSample);
  expect(result.mercado).toBe(2000000);
  expect(result.valorTerreno).toBe(500000);
  expect(result.ingresos).toMatchObject({ mensual: 10000, bruto: 120000, perdida: 6000, efectivo: 114000, gastos: 11400, noi: 102600, valor: 1282500 });
  expect(result.fisico?.valor).toBeCloseTo(1529388.8, 6);
  expect(result.indicador).toBeCloseTo(1702972.2, 6);
  expect(result.concluido).toBe(1703000);
  expect(result.pendientes).toEqual([]);
});

it("con base terreno, el mercado es el valor del terreno y no se usa el construido", () => {
  const result = calcularValor({ ...valorSample, baseMercado: "Terreno", pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0 });
  expect(result.mercado).toBe(500000);
  expect(result.valorConstruido).toBeNull();
  expect(result.concluido).toBe(500000);
});

it("no bloquea: con datos incompletos avisa qué falta y no calcula el concluido", () => {
  const vacio = calcularValor({});
  expect(vacio.concluido).toBeNull();
  expect(vacio.pendientes.join(" ")).toMatch(/base de mercado/);
  expect(calcularValor({ ...valorSample, pesoFisico: 30 }).pendientes.join(" ")).toMatch(/sumar 100/);
  expect(calcularValor({ ...valorSample, comparablesRenta: [] }).pendientes.join(" ")).toMatch(/ingresos/);
  // Sin redondeo, se redondea al peso.
  expect(calcularValor({ ...valorSample, redondeo: undefined }).concluido).toBe(1702972);
  // El 07 nunca impide descargar el PDF.
  expect(validateFormato("07", {})).toEqual([]);
});

it("acepta también las capturas anteriores con códigos en minúsculas", () => {
  expect(calcularValor({ ...valorSample, baseMercado: "construccion" }).concluido).toBe(1703000);
});

it("captura solo las celdas que imprime la plantilla, sin campos de control ni de revisión jurídica", () => {
  const keys = valorFields.map((field) => field.key);
  expect(new Set(keys).size).toBe(keys.length);
  for (const key of ["juridicaEstado", "condicionesJuridicas", "referencia04", "referenciaJuridica", "estadoOperacion", "versionInforme", "revisionEstado", "superficiesEstado"]) expect(keys).not.toContain(key);
  expect(valorFields.every((field) => !field.required)).toBe(true);
  expect(VALOR_TABLES.comparablesTerreno.columns.map((column) => column.key)).toEqual(["ubicacion", "superficie", "precio", "moneda", "fZona", "fUbicacion", "fSuperficie", "fNegociacion", "fuente", "fechaPrecio"]);
  expect(valorFields.find((field) => field.key === "tipoInmueble")?.options?.map((option) => option.value)).toEqual(["Terreno", "Casa", "Departamento", "Oficina", "Local", "Nave o bodega", "Plaza o conjunto"]);
});

it("escribe el importe en letra como la plantilla", () => {
  expect(importeEnLetra(1703000)).toBe("UN MILLÓN SETECIENTOS TRES MIL PESOS 00/100 M.N.");
  expect(importeEnLetra(5000000)).toBe("CINCO MILLONES DE PESOS 00/100 M.N.");
  expect(importeEnLetra(21000.5)).toBe("VEINTIÚN MIL PESOS 50/100 M.N.");
});

it("llena la plantilla de Excel conservando el estilo de cada celda", async () => {
  const xml = '<sheetData><row r="10"><c r="E10" s="74"/><c r="Q10" s="76"/></row><row r="11"><c r="Q11" s="5" t="s"><v>3</v></c></row></sheetData>';
  const filled = llenarHoja(xml, { E10: "Ana & <Co>", Q10: 46309, Q11: null, F10: "nueva" });
  expect(filled).toContain('<c r="E10" s="74" t="inlineStr"><is><t xml:space="preserve">Ana &amp; &lt;Co&gt;</t></is></c><c r="F10" t="inlineStr">');
  expect(filled).toContain('<c r="Q10" s="76"><v>46309</v></c>');
  expect(filled).toContain('<c r="Q11" s="5"/>');
  const cells = celdasValor(valorSample);
  expect(cells[4]).toMatchObject({ Q9: "QA-07", Q11: "Venta", Q13: "Construcción", E13: "Casa", Q10: 46299 });
  expect(cells[11]).toMatchObject({ D11: 0.5, D12: 0.25, D13: 0.25, Q9: 1000 });
  expect(cells[9]).toMatchObject({ H24: 0.05, H27: 0.1, H32: 0.08, B12: "Ubicación ficticia R1", Q18: 10000, Q13: "https://ejemplo.test/R1" });
  const book = await JSZip.loadAsync(await valorExcel(valorSample, readFileSync("public/plantillas/07_OpinionValor.xlsx")));
  const antecedentes = await book.file("xl/worksheets/sheet4.xml")!.async("string");
  expect(antecedentes).toMatch(/<c r="E10" s="\d+" t="inlineStr"><is><t xml:space="preserve">Persona sintética<\/t>/);
  expect(await book.file("xl/workbook.xml")!.async("string")).toContain('fullCalcOnLoad="1"');
});

it("genera el PDF con imágenes y también sin ningún dato", async () => {
  const data = completeValorSample();
  const bytes = await sharp({ create: { width: 1100, height: 500, channels: 3, background: "#ccd6d9" } }).png().toBuffer();
  const asset = (id: unknown, kind: "foto" | "croquis"): FormatoPdfAsset => ({ id: String(id), kind, caption: "Imagen sintética", source: "Prueba", observed_on: "2026-09-30", mime: "image/png", sha256: createHash("sha256").update(bytes).digest("hex"), bytes });
  const pdf = await PDFDocument.load((await prepareFormatoEmission("07", data, [asset(data.fotoPrincipalId, "foto"), asset(data.croquisId, "croquis")])).bytes);
  expect(pdf.getTitle()).toBe("Opinión de valor comercial");
  expect(pdf.getPageCount()).toBeGreaterThan(10);
  expect(pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/Subtype /Image")).length).toBeGreaterThanOrEqual(2);
  expect((await prepareFormatoEmission("07", { folio: "QA-07" })).bytes.length).toBeGreaterThan(1000);
});

it("usa solo las imágenes elegidas y válidas; el borrador completo cabe en el límite", () => {
  expect(valorAssetIds({ fotoPrincipalId: "x", croquisId: valorSample.croquisId, fotografias: [{ assetId: valorSample.fotoPrincipalId }] })).toEqual([valorSample.croquisId, valorSample.fotoPrincipalId]);
  expect(draftWrite.safeParse({ version: 1, data: completeValorSample() }).success).toBe(true);
});
