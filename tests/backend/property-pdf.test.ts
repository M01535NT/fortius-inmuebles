import { afterEach, expect, test, vi } from "vitest";
import { PDFDocument, PDFArray, PDFDict, PDFName, PDFString } from "pdf-lib";
import { propiedades } from "@/data/propiedades";
import { createPropertyPdf } from "@/lib/property-pdf";
import { loadPdfImage } from "@/lib/backend/pdf-images";
import { financialPdfPages } from "../helpers/financial-pdf";

afterEach(() => vi.unstubAllGlobals());

test("PDF uses real images, Spanish metadata, and paginates long public descriptions", async () => {
  const property = { ...propiedades[0], descripcion: Array.from({ length: 35 }, () => "Descripción amplia de la propiedad. Superficies y distribución verificables. ".repeat(6)), ficha: { ...propiedades[0].ficha, recamaras: 0 } };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getTitle()).toContain(property.titulo);
  expect(pdf.getAuthor()).toBe("Fortius Inmuebles");
  expect(pdf.getPageCount()).toBeGreaterThan(3);
  expect(bytes.length).toBeGreaterThan(10000);
});

test("unavailable photographs still produce a valid PDF", async () => {
  const bytes = await createPropertyPdf({ ...propiedades[0], precio: { modalidad: "consulta" } }, { settings: null, siteUrl: "https://example.com", loadImage: async () => null });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
});

test("downloaded property sheets embed the brand fonts for portable rendering", async () => {
  const bytes = await createPropertyPdf(propiedades[0], { settings: null, siteUrl: "https://example.com", loadImage: async () => null });
  const pdf = await PDFDocument.load(bytes);
  const fonts = pdf.getPages().flatMap(page => {
    const resources = page.node.Resources()!.lookup(PDFName.of("Font"), PDFDict);
    return resources.values().map(ref => pdf.context.lookup(ref, PDFDict).get(PDFName.of("BaseFont"))!.toString());
  });
  expect(fonts.some(font => font.includes("Archivo"))).toBe(true);
  expect(fonts.some(font => font.includes("LibreCaslonText"))).toBe(true);
  expect(fonts.some(font => font.includes("Helvetica"))).toBe(false);
});

test("editorial sheets omit empty fields and filler without losing public facts", async () => {
  const property = { ...propiedades[1], demo: false, ficha: { construccionM2: 96.5, recamaras: 0, banos: 1.5 } };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: async () => null });
  const pdf = await PDFDocument.load(bytes);
  const text = financialPdfPages(pdf).join(" ").replace(/\s+/g, " ");
  for (const paragraph of property.descripcion) expect(text).toContain(paragraph);
  expect(text).toContain("96.5 m²");
  expect(text).toContain("0 recámaras");
  expect(text).toContain("1.5 baños");
  expect(text).toMatch(/\/\s*mes/);
  expect(text).toContain("Apartada");
  expect(text).not.toMatch(/No especificad|por confirmar|Fotografía no disponible|Casa Olivo|Crédito/);
  expect(text).not.toContain("Terreno");
});

test("the reference template produces a compact two-page sheet with the property photographs", async () => {
  const property = { ...propiedades[0], demo: false, documentos: [] };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(2);
  const text = financialPdfPages(pdf).join(" ").replace(/\s+/g, " ");
  for (const paragraph of property.descripcion) expect(text).toContain(paragraph);
  for (const amenity of property.amenidades) expect(text).toContain(amenity);
  expect(text).toContain("320 m²");
  expect(text).toContain("385 m²");
  expect(text).toContain("4.5 baños");
});

test("long public resources retain clickable links on each page and reject active protocols", async () => {
  const property = {
    ...propiedades[0], galeria: [], descripcion: [], amenidades: [], puntosDeInteres: [],
    videoUrl: "javascript:alert(1)", tour360Url: "https://example.com/tour",
    documentos: [
      { codigo: "PUBLIC", nombre: "Documento público con información de la propiedad. ".repeat(120), descripcion: "FINAL DEL DOCUMENTO", url: "/documentos/publico.pdf" },
      { codigo: "INVALID", nombre: "No debe aparecer", descripcion: "No debe aparecer", url: "file:///private" },
    ],
  };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: async () => null });
  const pdf = await PDFDocument.load(bytes);
  const text = financialPdfPages(pdf).join(" ");
  expect(text).toContain("FINAL DEL DOCUMENTO");
  expect(text).not.toContain("No debe aparecer");
  const targets: string[] = [];
  let pagesWithDocument = 0;
  for (const page of pdf.getPages()) {
    let hasDocument = false;
    for (const ref of page.node.Annots()?.asArray() ?? []) {
      const annotation = pdf.context.lookup(ref, PDFDict);
      const target = annotation.lookup(PDFName.of("A"), PDFDict).lookup(PDFName.of("URI"), PDFString).decodeText();
      targets.push(target);
      if (target.endsWith("/documentos/publico.pdf")) hasDocument = true;
      const bounds = annotation.lookup(PDFName.of("Rect"), PDFArray).asArray().map(value => Number(value.toString()));
      expect(bounds[0]).toBeGreaterThanOrEqual(46);
      expect(bounds[1]).toBeGreaterThanOrEqual(60);
      expect(bounds[2]).toBeLessThanOrEqual(566);
      expect(bounds[3]).toBeLessThanOrEqual(703);
    }
    if (hasDocument) pagesWithDocument++;
  }
  expect(targets).toContain("https://example.com/tour");
  expect(targets).toContain(`https://example.com/inventario/${property.slug}`);
  expect(targets.every(url => url.startsWith("https://example.com/"))).toBe(true);
  expect(pagesWithDocument).toBeGreaterThan(1);
});

test("a long opening begins on the cover and continues without losing any words", async () => {
  const property = { ...propiedades[0], demo: false, descripcion: ["Primer párrafo. " + "Espacios amplios con ventanas hacia el jardín y una distribución funcional. ".repeat(12) + "Final de la descripción."] };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pages = financialPdfPages(await PDFDocument.load(bytes));
  expect(pages[0]).toContain("Primer párrafo.");
  const text = pages.join(" ").replace(/\s+/g, " ");
  expect(text).toContain("Final de la descripción.");
  expect(text.match(/ventanas/g)).toHaveLength(12);
  expect(text.match(/jardín/g)).toHaveLength(12);
});

test("PDF image loader rejects private storage, arbitrary hosts and paths outside public", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  for (const src of ["http://127.0.0.1/private", "https://example.com/photo.jpg", "/../.env.local", "//127.0.0.1/private"]) expect(await loadPdfImage(src)).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});
