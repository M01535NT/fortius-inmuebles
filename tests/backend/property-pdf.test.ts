import { afterEach, expect, test, vi } from "vitest";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import { propiedades } from "@/data/propiedades";
import { createPropertyPdf } from "@/lib/property-pdf";
import { loadPdfImage } from "@/lib/backend/pdf-images";

afterEach(() => vi.unstubAllGlobals());

test("PDF uses real images, Spanish metadata, and paginates long public descriptions", async () => {
  const property = { ...propiedades[0], descripcion: Array.from({ length: 35 }, () => "Descripción amplia de la propiedad. Superficies y distribución verificables. ".repeat(6)), ficha: { ...propiedades[0].ficha, recamaras: 0 } };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getTitle()).toContain(property.titulo);
  expect(pdf.getAuthor()).toBe("Mint Inmuebles");
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
  expect(fonts.some(font => font.includes("IBMPlexMono"))).toBe(true);
  expect(fonts.some(font => font.includes("Helvetica"))).toBe(false);
});

test("PDF image loader rejects private storage, arbitrary hosts and paths outside public", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  for (const src of ["http://127.0.0.1/private", "https://example.com/photo.jpg", "/../.env.local", "//127.0.0.1/private"]) expect(await loadPdfImage(src)).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});
