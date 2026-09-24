import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, PDFName, PDFString, type PDFFont } from "pdf-lib";
import { brandPaths } from "@/components/brand/brand-paths";
import { ESTADO_LABELS, OPERACION_LABELS, TIPO_LABELS, formatPrecio, type Property } from "@/data/propiedades";
import type { Asesor, SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

type Options = { settings: SiteSettings | null; adviser?: Asesor; siteUrl: string; loadImage: (src: string) => Promise<Uint8Array | null> };
const green = rgb(15 / 255, 107 / 255, 78 / 255);
const ink = rgb(21 / 255, 32 / 255, 27 / 255);
const muted = rgb(89 / 255, 99 / 255, 91 / 255);
const pale = rgb(244 / 255, 245 / 255, 241 / 255);

/** Explicit public fields only. No record serialization or private attachments. */
export async function createPropertyPdf(p: Property, options: Options): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold, mono] = await Promise.all(
    ["Archivo-Regular.ttf", "Archivo-SemiBold.ttf", "IBMPlexMono-Medium.ttf"].map(async name =>
      pdf.embedFont(await readFile(join(process.cwd(), "public", "fonts", name)), { subset: true })
    )
  );
  // Keep accented Spanish and omit glyphs absent from the embedded Latin subset.
  const supported = new Set(regular.getCharacterSet());
  const clean = (s: string) => Array.from(s.normalize("NFC").replace(/[\u2010-\u2015]/g, "-")).filter(c => {
    return supported.has(c.codePointAt(0)!);
  }).join("");
  const width = 595.28, height = 841.89, margin = 44, content = width - margin * 2;
  let page = pdf.addPage([width, height]);
  let y = 0;
  const header = () => {
    page.drawSvgPath(brandPaths.symbol, { x: margin, y: height - 35, scale: .48, color: green });
    page.drawSvgPath(brandPaths.initials, { x: margin + 88 * .48, y: height - 35, scale: .48, color: ink });
    for (const glyph of brandPaths.descriptor) {
      page.drawSvgPath(glyph.d, { x: margin + (88 + glyph.x) * .48, y: height - 35 - 47 * .48, scale: .48, color: ink });
    }
    page.drawText("FICHA TÉCNICA", { x: width - 145, y: height - 48, size: 10, font: mono, color: green });
    page.drawLine({ start: { x: margin, y: height - 82 }, end: { x: width - margin, y: height - 82 }, thickness: .7, color: green });
    y = height - 107;
  };
  header();
  const ensure = (space: number) => { if (y - space < 65) { page = pdf.addPage([width, height]); header(); } };
  const lines = (value: string, size: number, font: PDFFont, max = content) => {
    const result: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      let line = "";
      for (const word of clean(paragraph).split(/\s+/)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > max) { result.push(line); line = ""; }
        for (const char of (line ? " " : "") + word) {
          if (font.widthOfTextAtSize(line + char, size) > max) { result.push(line); line = ""; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  };
  const text = (value: string, size = 10, font = regular, color = ink) => {
    for (const line of lines(value, size, font)) {
      ensure(size * 1.5);
      page.drawText(line, { x: margin, y: y - size, size, font, color });
      y -= size * 1.5;
    }
    y -= 4;
  };
  const section = (title: string) => { ensure(85); y -= 8; text(title, 13, bold, green); };
  const link = (label: string, value: string) => {
    let url: URL;
    try { url = new URL(value, options.siteUrl); } catch { return; }
    if (!["https:", "http:"].includes(url.protocol)) return;
    ensure(34);
    const top = y;
    const count = lines(label, 10, regular).length;
    text(label, 10, regular, green);
    // Links retain long URLs without compromising the printed layout.
    const annotation = pdf.context.register(pdf.context.obj({ Type: "Annot", Subtype: "Link", Rect: [margin, top - count * 15, width - margin, top + 11], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(url.href) } }));
    page.node.addAnnot(annotation);
  };
  const photo = async (src: string, caption: string, hero = false) => {
    const bytes = await options.loadImage(src);
    if (!bytes) { text(`Fotografía no disponible: ${caption}`, 9, regular, muted); return; }
    const image = await pdf.embedJpg(bytes);
    const box = hero ? 225 : 165;
    ensure(box + 50);
    const scale = Math.min(content / image.width, box / image.height);
    page.drawRectangle({ x: margin, y: y - box, width: content, height: box, color: pale });
    page.drawImage(image, { x: margin + (content - image.width * scale) / 2, y: y - box + (box - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
    y -= box + 15;
    text(caption, 8, regular, muted);
  };
  pdf.setTitle(`${p.titulo} | Ficha técnica | MNT Inmuebles`);
  pdf.setAuthor("MNT Inmuebles");
  pdf.setSubject(`Información pública del inmueble ${p.codigo}`);
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("es-MX"));
  text(`${p.codigo}  /  ${TIPO_LABELS[p.tipo]}  /  ${OPERACION_LABELS[p.operacion]}  /  ${ESTADO_LABELS[p.estado]}`, 9, mono, green);
  text(p.titulo, 26, bold);
  text(`${p.zona} · ${p.direccionAproximada}`, 11, regular, muted);
  text(formatPrecio(p.precio), 20, mono, green);
  if (p.demo) text("PROPIEDAD DE DEMOSTRACIÓN. Datos y precio de ejemplo; no constituye una oferta real.", 9, bold, green);
  if (p.galeria[0]) await photo(p.galeria[0].src, p.galeria[0].alt, true);
  section("Superficies y distribución");
  const specs: [string, string | number | undefined][] = [
    ["Terreno", p.ficha.terrenoM2 == null ? undefined : `${p.ficha.terrenoM2} m²`],
    ["Construcción", p.ficha.construccionM2 == null ? undefined : `${p.ficha.construccionM2} m²`],
    ["Recámaras", p.ficha.recamaras], ["Baños", p.ficha.banos], ["Estacionamientos", p.ficha.estacionamientos], ["Antigüedad", p.ficha.antiguedad],
  ];
  for (const [label, value] of specs) {
    for (const [index, line] of lines(String(value ?? "No especificado"), 10, bold, content - 230).entries()) {
      ensure(29);
      page.drawRectangle({ x: margin, y: y - 25, width: content, height: 25, color: pale });
      page.drawText(index === 0 ? label : "", { x: margin + 10, y: y - 16, size: 10, font: regular, color: muted });
      page.drawText(line, { x: margin + 210, y: y - 16, size: 10, font: bold, color: ink });
      y -= 29;
    }
  }
  section("Descripción del inmueble");
  p.descripcion.forEach(paragraph => text(paragraph));
  section("Amenidades");
  text(p.amenidades.length ? p.amenidades.map(a => `- ${a}`).join("\n") : "No especificadas.");
  section("Ubicación y condiciones");
  text(`${p.zona}. ${p.direccionAproximada}. Ubicación aproximada; solicita los detalles al asesor.`);
  if (p.puntosDeInteres.length) text(p.puntosDeInteres.map(point => `${point.lugar}: ${point.minutos} min aproximadamente en auto.`).join("\n"));
  text(`Crédito disponible: ${p.creditoDisponible ? "Sí, sujeto a condiciones de la institución financiera." : "Consultar condiciones con el asesor."}`);
  text(`Publicación: ${p.publicadaEl.slice(0, 10)}. Disponibilidad y condiciones sujetas a confirmación.`);
  if (p.galeria.length > 1) {
    section("Galería del inmueble");
    for (const image of p.galeria.slice(1)) await photo(image.src, image.alt);
  }
  section("Atención y recursos");
  if (options.adviser) text(`${options.adviser.nombre} · ${options.adviser.cargo}`, 11, bold);
  const contact = publicContact(options.settings);
  if (contact.phoneHref) text(`Teléfono: ${contact.phone}`);
  if (contact.email) text(`Correo: ${contact.email}`);
  if (contact.whatsapp) link("Conversar por WhatsApp", contact.whatsapp);
  if (contact.messenger) link("Conversar por Messenger", contact.messenger);
  if (!contact.phoneHref && !contact.email && !contact.whatsapp && !contact.messenger) text("Contactos de la firma: por confirmar.", 10, regular, muted);
  if (options.settings?.horario) text(`Horario: ${options.settings.horario}`);
  if (p.videoUrl) link("Ver video del inmueble", p.videoUrl);
  if (p.tour360Url) link("Abrir recorrido de 360°", p.tour360Url);
  for (const document of p.documentos ?? []) { link(`${document.codigo} · ${document.nombre}`, document.url); text(document.descripcion, 9, regular, muted); }
  link("Consultar ficha vigente en el sitio web", `/inventario/${p.slug}`);
  text(new URL(`/inventario/${p.slug}`, options.siteUrl).href, 8, regular, muted);
  text("Documento informativo generado con los datos publicados. No sustituye escrituras, planos autorizados, avalúos ni la revisión documental de la operación.", 8, regular, muted);
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawLine({ start: { x: margin, y: 46 }, end: { x: width - margin, y: 46 }, thickness: .4, color: muted });
    sheet.drawText(clean(`MNT Inmuebles · ${p.codigo}${p.demo ? " · DEMOSTRACIÓN" : ""}`), { x: margin, y: 31, size: 8, font: regular, color: muted });
    sheet.drawText(`${index + 1} / ${pages.length}`, { x: width - 70, y: 31, size: 8, font: regular, color: muted });
  });
  return pdf.save();
}
