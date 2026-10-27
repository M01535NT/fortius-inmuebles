import { afterEach, expect, test, vi } from "vitest";
import { PDFDocument, PDFArray, PDFDict, PDFName, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import sharp from "sharp";
import { propiedades } from "../fixtures/propiedades";
import { createPropertyPdf } from "@/lib/property-pdf";
import { loadPdfImage } from "@/lib/backend/pdf-images";
import { financialPdfPages } from "../helpers/financial-pdf";

afterEach(() => vi.unstubAllGlobals());

function pageContent(pdf: PDFDocument, index: number) {
  const contents = pdf.getPage(index).node.Contents();
  const values = contents instanceof PDFArray ? contents.asArray() : [contents];
  return values.map(value => {
    const stream = pdf.context.lookup(value);
    if (!(stream instanceof PDFRawStream)) throw new Error("Missing PDF content stream");
    return new TextDecoder().decode(decodePDFRawStream(stream).decode());
  }).join("\n");
}

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
  // Solo sans serif de marca (titular, 25/10/2026).
  expect(fonts.some(font => font.includes("LibreCaslonText"))).toBe(false);
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
  expect(text).not.toMatch(/No especificad|Fotografía no disponible|Casa Olivo|Crédito/);
  expect(text).not.toContain("Terreno");
});

test("the new stationery produces a three-page sheet preserving the property photographs and facts", async () => {
  const property = { ...propiedades[0], demo: false, documentos: [] };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(3);
  const text = financialPdfPages(pdf).join(" ").replace(/\s+/g, " ");
  for (const paragraph of property.descripcion) expect(text).toContain(paragraph);
  for (const amenity of property.amenidades) expect(text).toContain(amenity);
  expect(text).toContain("320 m²");
  expect(text).toContain("385 m²");
  expect(text).toContain("4.5 baños");
});

test("the printed sheet contains the public details and usable contact values, without resource teasers", async () => {
  const property = { ...propiedades[0], demo: false, videoUrl: "https://example.com/video", tour360Url: "https://example.com/tour" };
  const settings = { nombreComercial: "Fortius", telefono: "+52 664 123 4567", whatsapp: "526647654321", email: "asesor@example.com", horario: "Lunes a viernes, de 9:00 a 18:00", facebook: "https://m.me/fortius", instagram: "", videoInstitucionalUrl: "" };
  const bytes = await createPropertyPdf(property, { settings, siteUrl: "https://example.com", loadImage: async () => null });
  const text = financialPdfPages(await PDFDocument.load(bytes)).join(" ").replace(/\s+/g, " ");
  for (const paragraph of property.descripcion) expect(text).toContain(paragraph);
  for (const amenity of property.amenidades) expect(text).toContain(amenity);
  for (const place of property.puntosDeInteres) expect(text).toContain(`${place.lugar} · ${place.minutos} min`);
  for (const detail of ["385 m²", "320 m²", "4 recámaras", "4.5 baños", "2 estacionamientos", "Antigüedad: 6 años", "Disponible", "Crédito sujeto a evaluación", property.direccionAproximada]) expect(text).toContain(detail);
  expect(text).toContain("Teléfono: +52 664 123 4567");
  expect(text).toContain("WhatsApp: +526647654321");
  expect(text).toContain("Correo: asesor@example.com");
  expect(text).toContain(settings.horario);
  expect(text).not.toMatch(/Más información|Ficha técnica en PDF|documento imprimible|Ver inmueble|Recorrido de 360|Messenger/);
  expect(text).not.toContain("Superficies, distribución y amenidades en un documento imprimible.");
});

test("the printed sheet includes sourced surfaces and reviewed delivery facts", async () => {
  const property = { ...propiedades[0], informacionPublica: { fuenteTerreno: "escritura" as const, fuenteConstruccion: "plano" as const, disponibilidadRevisadaEl: "2026-10-04", ocupacionEntrega: "Entrega 30 días después del cierre" } };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: async () => null });
  const text = financialPdfPages(await PDFDocument.load(bytes)).join(" ").replace(/\s+/g, " ");
  expect(text).toContain("Terreno · Escritura");
  expect(text).toContain("Construcción · Plano");
  expect(text).toContain("Disponibilidad revisada el 4 de octubre de 2026");
  expect(text).toContain("Entrega 30 días después del cierre");
});

test("the cover photograph fills the printable width at its natural landscape aspect ratio", async () => {
  const bytes = await createPropertyPdf(propiedades[0], { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPage(0);
  const streams = pageContent(pdf, 0);
  const images = [...streams.matchAll(/([\d.]+) 0 0 ([\d.]+) 0 0 cm\n1 0 0 1 0 0 cm\n\/(Image-[^ ]+) Do/g)];
  // El membrete añade dos imágenes. Identificar la fotografía por su ancho de impresión.
  const cover=images.find(([,drawnWidth])=>Math.abs(Number(drawnWidth)-520)<0.001);
  expect(cover).toBeDefined();
  const [, drawnWidth, drawnHeight, resource] = cover!;
  expect(Number(drawnWidth)).toBeCloseTo(520, 3);
  expect(Number(drawnHeight)).toBeGreaterThan(280);
  const objects = page.node.Resources()!.lookup(PDFName.of("XObject"), PDFDict);
  const image = objects.lookup(PDFName.of(resource));
  if (!(image instanceof PDFRawStream)) throw new Error("Missing cover photograph");
  const originalWidth = Number(image.dict.get(PDFName.of("Width"))!.toString());
  const originalHeight = Number(image.dict.get(PDFName.of("Height"))!.toString());
  expect(Number(drawnWidth) / Number(drawnHeight)).toBeCloseTo(originalWidth / originalHeight, 5);
});

test("portrait covers retain their complete original in the printed gallery", async () => {
  const portrait = await sharp({ create: { width: 400, height: 800, channels: 3, background: "#8a1634" } }).jpeg().toBuffer();
  const load = vi.fn(async () => portrait);
  const property = { ...propiedades[0], galeria: [{ src: "/portrait.jpg", alt: "Vista completa de la propiedad vertical" }] };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: load });
  const pdf = await PDFDocument.load(bytes);
  const streams = pdf.getPages().map((_, index) => pageContent(pdf, index)).join("\n");
  expect(load).toHaveBeenCalledTimes(1);
  expect(streams).toContain("520 320 re\nW\nn");
  const images = [...streams.matchAll(/([\d.]+) 0 0 ([\d.]+) 0 0 cm\n1 0 0 1 0 0 cm\n\/(Image-[^ ]+) Do/g)];
  expect(images.some(([, w, h]) => Number(w) === 520 && Number(h) === 1040)).toBe(true);
  expect(images.some(([, w, h]) => Math.abs(Number(w) - 109) < .01 && Math.abs(Number(h) - 218) < .01)).toBe(true);
  expect(financialPdfPages(pdf).join(" ")).toContain(property.galeria[0].alt);
});

test("a long opening flows after the full-width cover photograph without losing any words", async () => {
  const property = { ...propiedades[0], demo: false, descripcion: ["Primer párrafo. " + "Espacios amplios con ventanas hacia el jardín y una distribución funcional. ".repeat(12) + "Final de la descripción."] };
  const bytes = await createPropertyPdf(property, { settings: null, siteUrl: "https://example.com", loadImage: loadPdfImage });
  const pages = financialPdfPages(await PDFDocument.load(bytes));
  expect(pages[1]).toContain("Primer párrafo.");
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
